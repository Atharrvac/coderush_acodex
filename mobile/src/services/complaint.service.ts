/**
 * Complaint Service - Real Supabase Integration
 */

import { supabase } from '../config/supabase';
import { Complaint } from '../types';

export interface CreateComplaintData {
  category: string;
  issue_type: string;
  title: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  images: string[];
  priority: string;
}

export const complaintService = {
  // Create new complaint
  create: async (data: CreateComplaintData, userId: string): Promise<Complaint> => {
    const { data: complaint, error } = await supabase
      .from('complaints')
      .insert({
        user_id: userId,
        category: data.category,
        issue_type: data.issue_type,
        title: data.title,
        description: data.description,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        images: data.images,
        priority: data.priority,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return complaint;
  },

  // Get user's complaints
  getMyComplaints: async (userId: string, status?: string): Promise<Complaint[]> => {
    let query = supabase
      .from('complaints')
      .select('*, complaint_timeline(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  },

  // Get single complaint with timeline
  getById: async (id: string): Promise<Complaint | null> => {
    const { data, error } = await supabase
      .from('complaints')
      .select(`
        *,
        complaint_timeline(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Get nearby complaints
  getNearby: async (latitude: number, longitude: number, radiusKm: number = 5): Promise<Complaint[]> => {
    // Simple bounding box query (for production, use PostGIS)
    const latDelta = radiusKm / 111; // ~111km per degree latitude
    const lngDelta = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));

    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .gte('latitude', latitude - latDelta)
      .lte('latitude', latitude + latDelta)
      .gte('longitude', longitude - lngDelta)
      .lte('longitude', longitude + lngDelta)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);
    return data || [];
  },

  // Get all complaints (for map/list view)
  getAll: async (filters?: { category?: string; status?: string; priority?: string }): Promise<Complaint[]> => {
    let query = supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.category) query = query.eq('category', filters.category);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.priority) query = query.eq('priority', filters.priority);

    const { data, error } = await query.limit(100);
    if (error) throw new Error(error.message);
    return data || [];
  },

  // Upvote complaint
  upvote: async (complaintId: string, userId: string): Promise<boolean> => {
    // Check if already upvoted
    const { data: existing } = await supabase
      .from('complaint_upvotes')
      .select('id')
      .eq('complaint_id', complaintId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Remove upvote
      await supabase
        .from('complaint_upvotes')
        .delete()
        .eq('complaint_id', complaintId)
        .eq('user_id', userId);

      // Decrement count
      await supabase.rpc('decrement_upvotes', { complaint_id: complaintId });
      return false;
    } else {
      // Add upvote
      await supabase
        .from('complaint_upvotes')
        .insert({ complaint_id: complaintId, user_id: userId });

      // Increment count
      await supabase.rpc('increment_upvotes', { complaint_id: complaintId });
      return true;
    }
  },

  // Check if user upvoted
  hasUpvoted: async (complaintId: string, userId: string): Promise<boolean> => {
    const { data } = await supabase
      .from('complaint_upvotes')
      .select('id')
      .eq('complaint_id', complaintId)
      .eq('user_id', userId)
      .single();

    return !!data;
  },

  // Add comment
  addComment: async (complaintId: string, userId: string, content: string): Promise<void> => {
    const { error } = await supabase
      .from('complaint_comments')
      .insert({
        complaint_id: complaintId,
        user_id: userId,
        content
      });

    if (error) throw new Error(error.message);
  },

  // Get comments
  getComments: async (complaintId: string): Promise<any[]> => {
    const { data, error } = await supabase
      .from('complaint_comments')
      .select('*, users(name, avatar_url)')
      .eq('complaint_id', complaintId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  },

  // Search complaints
  search: async (query: string): Promise<Complaint[]> => {
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,request_id.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw new Error(error.message);
    return data || [];
  },

  // Upload image to Supabase Storage
  uploadImage: async (uri: string, userId: string): Promise<string> => {
    const fileName = `${userId}/${Date.now()}.jpg`;
    
    // Convert URI to blob
    const response = await fetch(uri);
    const blob = await response.blob();

    const { error } = await supabase.storage
      .from('complaint-images')
      .upload(fileName, blob, {
        contentType: 'image/jpeg'
      });

    if (error) throw new Error(error.message);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('complaint-images')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  }
};

export default complaintService;
