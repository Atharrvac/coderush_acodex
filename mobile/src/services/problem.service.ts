/**
 * NagrikSeva - Problem Service
 * Citizen-to-Citizen Help Platform
 */

import { supabase } from '../config/supabase';
import { Problem, ProblemStatus } from '../types';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { errorHandler, retryWithBackoff, safeAsync } from '../utils/errorHandler';

export interface CreateProblemData {
  category: string;
  title: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  images: string[];
  language_code?: string;
  priority_level?: string;
}

export const problemService = {
  // Create new problem (Post a Problem)
  create: async (data: CreateProblemData, userId: string): Promise<Problem> => {
    try {
      // First create the problem
      const { data: problem, error } = await supabase
        .from('problems')
        .insert({
          user_id: userId,
          category: data.category,
          title: data.title,
          description: data.description,
          complaint_text_original: data.description,
          complaint_text_translated: data.description,
          language_code: data.language_code || 'en',
          priority_level: data.priority_level || 'medium',
          address: data.address,
          latitude: data.latitude,
          longitude: data.longitude,
          images: data.images,
          status: 'posted',
          complaint_status: 'submitted',
        })
        .select('*')
        .single();

      if (error) {
        console.error('create error:', error);
        throw error;
      }
      
      if (!problem) throw new Error('Failed to create problem');

      // If images exist, analyze cost
      if (data.images && data.images.length > 0) {
        try {
          await problemService.analyzeCostForProblem(problem.id, data.images[0], data.category, data.description, data.address);
        } catch (costError) {
          console.error('Cost analysis error:', costError);
          // Don't fail the whole operation if cost analysis fails
        }
      }
      
      return problem;
    } catch (error: any) {
      errorHandler.handle(error);
      throw error;
    }
  },

  // Analyze cost for a problem
  analyzeCostForProblem: async (problemId: string, imageUrl: string, category: string, description: string, location: string) => {
    try {
      // Call cost analysis API
      const response = await fetch('http://localhost:3000/api/v1/cost-analysis/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          category,
          description,
          location
        })
      });

      if (response.ok) {
        const result = await response.json();
        const analysis = result.analysis;

        // Update problem with cost analysis
        await supabase
          .from('problems')
          .update({
            estimated_cost_min: analysis.estimatedCost.min,
            estimated_cost_max: analysis.estimatedCost.max,
            cost_analysis: analysis,
            severity_level: analysis.severity,
            estimated_completion_time: analysis.timeToComplete,
            updated_at: new Date().toISOString()
          })
          .eq('id', problemId);

        console.log('Cost analysis completed for problem:', problemId);
      }
    } catch (error) {
      console.error('Cost analysis failed:', error);
    }
  },

  // Get all problems (Live Feed) - Production Ready with Pagination
  getAll: async (filters?: {
    category?: string;
    status?: ProblemStatus;
    sortBy?: 'newest' | 'nearest';
    userLat?: number;
    userLng?: number;
    excludeUserId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Problem[]> => {
    try {
      const limit = filters?.limit || 50;
      const offset = filters?.offset || 0;
      
      let query = supabase
        .from('problems')
        .select('*, user:users!problems_user_id_fkey(*)', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (filters?.excludeUserId) {
        query = query.neq('user_id', filters.excludeUserId);
      }

      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;
      
      if (error) {
        console.error('getAll error:', error);
        throw error;
      }

      let problems = data || [];

      if (filters?.userLat && filters?.userLng) {
        problems = problems.map((p) => ({
          ...p,
          distance: calculateDistance(
            filters.userLat!,
            filters.userLng!,
            p.latitude,
            p.longitude
          ),
        }));

        if (filters.sortBy === 'nearest') {
          problems.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        }
      }

      console.log(`Fetched ${problems.length} problems (total: ${count})`);
      return problems;
    } catch (error: any) {
      errorHandler.handle(error, false);
      return []; // Return empty array on error
    }
  },

  // Get nearby problems
  getNearby: async (
    latitude: number,
    longitude: number,
    radiusKm: number = 10
  ): Promise<Problem[]> => {
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos((latitude * Math.PI) / 180));

    const { data, error } = await supabase
      .from('problems')
      .select('*, user:users!problems_user_id_fkey(*)')
      .gte('latitude', latitude - latDelta)
      .lte('latitude', latitude + latDelta)
      .gte('longitude', longitude - lngDelta)
      .lte('longitude', longitude + lngDelta)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('getNearby error:', error);
      throw new Error(error.message);
    }

    return (data || []).map((p) => ({
      ...p,
      distance: calculateDistance(latitude, longitude, p.latitude, p.longitude),
    }));
  },

  // Get single problem
  getById: async (id: string): Promise<Problem | null> => {
    const { data, error } = await supabase
      .from('problems')
      .select('*, user:users!problems_user_id_fkey(*)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('getById error:', error);
      throw new Error(error.message);
    }

    // Fetch helper info separately if exists
    if (data?.helper_id) {
      const { data: helperData } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.helper_id)
        .single();

      if (helperData) {
        data.helper = helperData;
      }
    }

    return data;
  },

  // Get user's posted problems
  getMyProblems: async (userId: string, status?: ProblemStatus): Promise<Problem[]> => {
    let query = supabase
      .from('problems')
      .select('*, user:users!problems_user_id_fkey(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) {
      console.error('getMyProblems error:', error);
      throw new Error(error.message);
    }
    return data || [];
  },

  // Get problems user is helping with
  getHelpingProblems: async (userId: string): Promise<Problem[]> => {
    const { data, error } = await supabase
      .from('problems')
      .select('*, user:users!problems_user_id_fkey(*)')
      .eq('helper_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('getHelpingProblems error:', error);
      throw new Error(error.message);
    }
    return data || [];
  },

  // "I Can Help" - Offer to help
  offerHelp: async (problemId: string, helperId: string): Promise<void> => {
    // First get helper name
    const { data: helperData } = await supabase
      .from('users')
      .select('name')
      .eq('id', helperId)
      .single();

    const { error } = await supabase
      .from('problems')
      .update({
        status: 'being_helped',
        helper_id: helperId,
        helper_name: helperData?.name || 'Someone',
        updated_at: new Date().toISOString(),
      })
      .eq('id', problemId)
      .eq('status', 'posted'); // Only if still posted

    if (error) {
      console.error('offerHelp error:', error);
      throw new Error(error.message);
    }

    // Send chat notification about help being offered
    try {
      const { chatService } = await import('./chat.service');
      await chatService.sendProblemStatusUpdate(problemId, 'being_helped', helperData?.name);
    } catch (chatError) {
      console.error('Chat notification error:', chatError);
      // Don't fail the main operation if chat fails
    }
  },

  // Mark as Solved
  markSolved: async (
    problemId: string,
    solvedImage?: string,
    solvedNote?: string
  ): Promise<void> => {
    const { error } = await supabase
      .from('problems')
      .update({
        status: 'solved',
        solved_image: solvedImage || null,
        solved_note: solvedNote || null,
        solved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', problemId);

    if (error) {
      console.error('markSolved error:', error);
      throw new Error(error.message);
    }

    // Send chat notification about problem being solved
    try {
      const { chatService } = await import('./chat.service');
      await chatService.sendProblemStatusUpdate(problemId, 'solved');
    } catch (chatError) {
      console.error('Chat notification error:', chatError);
      // Don't fail the main operation if chat fails
    }
  },

  // Cancel help (revert to posted)
  cancelHelp: async (problemId: string): Promise<void> => {
    const { error } = await supabase
      .from('problems')
      .update({
        status: 'posted',
        helper_id: null,
        helper_name: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', problemId);

    if (error) {
      console.error('cancelHelp error:', error);
      throw new Error(error.message);
    }

    // Send chat notification about help being cancelled
    try {
      const { chatService } = await import('./chat.service');
      await chatService.sendProblemStatusUpdate(problemId, 'posted');
    } catch (chatError) {
      console.error('Chat notification error:', chatError);
      // Don't fail the main operation if chat fails
    }
  },

  // Delete problem (only owner can delete)
  delete: async (problemId: string): Promise<void> => {
    const { error } = await supabase
      .from('problems')
      .delete()
      .eq('id', problemId);

    if (error) {
      console.error('delete error:', error);
      throw new Error(error.message);
    }
  },

  // Upload image using expo-file-system for React Native
  uploadImage: async (uri: string, userId: string): Promise<string> => {
    return retryWithBackoff(async () => {
      try {
        console.log('Starting image upload for URI:', uri);
        const fileName = `${userId}/${Date.now()}.jpg`;

        console.log('Reading file as base64...');
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        console.log('Base64 length:', base64.length);

        const arrayBuffer = decode(base64);
        console.log('ArrayBuffer size:', arrayBuffer.byteLength);

        console.log('Uploading to Supabase Storage...');
        const { data, error } = await supabase.storage
          .from('problem-images')
          .upload(fileName, arrayBuffer, {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (error) {
          console.error('Storage upload error:', error);
          throw error;
        }

        console.log('Upload successful:', data);
        const { data: urlData } = supabase.storage
          .from('problem-images')
          .getPublicUrl(fileName);

        console.log('Public URL:', urlData.publicUrl);
        return urlData.publicUrl;
      } catch (error: any) {
        console.error('Upload image error:', error);
        throw error;
      }
    }, 3, 2000); // 3 retries with 2s base delay
  },

  // Subscribe to real-time updates
  subscribeToProblems: (callback: (problem: Problem) => void) => {
    const subscription = supabase
      .channel('problems-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'problems' },
        (payload) => {
          callback(payload.new as Problem);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  },
};

// Helper function to calculate distance
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default problemService;
