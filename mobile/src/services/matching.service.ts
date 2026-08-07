/**
 * Matching Service - Industry-Grade Helper Matching
 * Like Uber/Swiggy matching algorithm
 */

import { supabase } from '../config/supabase';

export interface MatchedHelper {
  user_id: string;
  name: string;
  avatar_url?: string;
  distance_km: number;
  match_score: number;
  avg_rating: number;
  problems_solved: number;
  is_available: boolean;
}

export interface HelpRequest {
  id: string;
  problem_id: string;
  helper_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'timeout' | 'cancelled';
  match_score: number;
  distance_km: number;
  notified_at: string;
  responded_at?: string;
  response_time_seconds?: number;
}

export const matchingService = {
  // Find and match helpers for a problem
  findHelpers: async (problemId: string, latitude: number, longitude: number, category: string) => {
    try {
      // 1. Find nearby helpers
      const { data: helpers, error } = await supabase
        .rpc('find_nearby_helpers', {
          p_latitude: latitude,
          p_longitude: longitude,
          p_radius_km: 10, // 10km radius
          p_category: category,
        });

      if (error) throw error;

      // 2. Calculate match scores for each helper
      const matchedHelpers = await Promise.all(
        (helpers || []).map(async (helper: any) => {
          const { data: score } = await supabase
            .rpc('calculate_match_score', {
              p_helper_id: helper.user_id,
              p_problem_id: problemId,
            });

          return {
            ...helper,
            match_score: score || 0,
          };
        })
      );

      // 3. Sort by match score
      matchedHelpers.sort((a, b) => b.match_score - a.match_score);

      // 4. Take top 10
      const topHelpers = matchedHelpers.slice(0, 10);

      // 5. Create help requests
      if (topHelpers.length > 0) {
        await matchingService.createHelpRequests(problemId, topHelpers);
      }

      return topHelpers;
    } catch (error: any) {
      console.error('Find helpers error:', error);
      throw new Error(error.message);
    }
  },

  // Create help requests for matched helpers
  createHelpRequests: async (problemId: string, helpers: MatchedHelper[]) => {
    try {
      const requests = helpers.map(helper => ({
        problem_id: problemId,
        helper_id: helper.user_id,
        match_score: helper.match_score,
        distance_km: helper.distance_km,
        status: 'pending',
      }));

      const { error } = await supabase
        .from('help_requests')
        .insert(requests);

      if (error) throw error;

      // TODO: Send push notifications to helpers
      console.log(`Sent help requests to ${helpers.length} helpers`);
    } catch (error: any) {
      console.error('Create help requests error:', error);
      throw new Error(error.message);
    }
  },

  // Respond to help request
  respondToRequest: async (
    requestId: string,
    response: 'accept' | 'decline',
    declineReason?: string
  ) => {
    try {
      const respondedAt = new Date().toISOString();

      // Get request details
      const { data: request, error: fetchError } = await supabase
        .from('help_requests')
        .select('*, problem:problems(*)')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;

      if (!request) {
        throw new Error('Help request not found');
      }

      // Calculate response time
      const notifiedAt = new Date(request.notified_at);
      const responseTime = Math.floor((new Date(respondedAt).getTime() - notifiedAt.getTime()) / 1000);

      if (response === 'accept') {
        // Check if problem is still available
        if (request.problem.status !== 'posted') {
          return {
            success: false,
            message: 'This problem is already being helped by someone else',
          };
        }

        // Update help request
        const { error: updateError } = await supabase
          .from('help_requests')
          .update({
            status: 'accepted',
            responded_at: respondedAt,
            response_time_seconds: responseTime,
          })
          .eq('id', requestId);

        if (updateError) throw updateError;

        // Assign helper to problem
        const { error: assignError } = await supabase
          .from('problems')
          .update({
            status: 'being_helped',
            helper_id: request.helper_id,
            updated_at: respondedAt,
          })
          .eq('id', request.problem_id)
          .eq('status', 'posted'); // Only if still posted

        if (assignError) throw assignError;

        // Cancel other pending requests for this problem
        await supabase
          .from('help_requests')
          .update({ status: 'cancelled' })
          .eq('problem_id', request.problem_id)
          .eq('status', 'pending')
          .neq('id', requestId);

        return {
          success: true,
          message: 'You are now helping with this problem!',
          problem: request.problem,
        };
      } else {
        // Decline
        const { error: updateError } = await supabase
          .from('help_requests')
          .update({
            status: 'declined',
            responded_at: respondedAt,
            response_time_seconds: responseTime,
            decline_reason: declineReason,
          })
          .eq('id', requestId);

        if (updateError) throw updateError;

        return {
          success: true,
          message: 'Request declined',
        };
      }
    } catch (error: any) {
      console.error('Respond to request error:', error);
      throw new Error(error.message);
    }
  },

  // Get help requests for a helper
  getMyRequests: async (userId: string, status?: string) => {
    try {
      let query = supabase
        .from('help_requests')
        .select('*, problem:problems(*, user:users!problems_user_id_fkey(*))')
        .eq('helper_id', userId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Get my requests error:', error);
      throw new Error(error.message);
    }
  },

  // Get pending requests (for notifications)
  getPendingRequests: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('help_requests')
        .select('*, problem:problems(*, user:users!problems_user_id_fkey(*))')
        .eq('helper_id', userId)
        .eq('status', 'pending')
        .gte('notified_at', new Date(Date.now() - 60000).toISOString()) // Last 1 minute
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Get pending requests error:', error);
      throw new Error(error.message);
    }
  },

  // Update helper availability
  updateAvailability: async (userId: string, isAvailable: boolean, latitude?: number, longitude?: number) => {
    try {
      const updateData: any = {
        user_id: userId,
        is_available: isAvailable,
        last_active: new Date().toISOString(),
      };

      if (latitude !== undefined && longitude !== undefined) {
        updateData.current_latitude = latitude;
        updateData.current_longitude = longitude;
      }

      const { error } = await supabase
        .from('helper_availability')
        .upsert(updateData);

      if (error) throw error;
    } catch (error: any) {
      console.error('Update availability error:', error);
      throw new Error(error.message);
    }
  },

  // Get helper stats
  getHelperStats: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('helper_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || {
        total_requests_received: 0,
        total_accepted: 0,
        total_declined: 0,
        total_completed: 0,
        avg_rating: 0,
        success_rate: 0,
      };
    } catch (error: any) {
      console.error('Get helper stats error:', error);
      throw new Error(error.message);
    }
  },

  // Rate a helper
  rateHelper: async (
    problemId: string,
    fromUserId: string,
    toUserId: string,
    rating: number,
    review?: string,
    helpfulTags?: string[]
  ) => {
    try {
      const { error } = await supabase
        .from('ratings')
        .insert({
          problem_id: problemId,
          from_user_id: fromUserId,
          to_user_id: toUserId,
          rating,
          review,
          helpful_tags: helpfulTags || [],
        });

      if (error) throw error;
    } catch (error: any) {
      console.error('Rate helper error:', error);
      throw new Error(error.message);
    }
  },

  // Subscribe to help requests (real-time)
  subscribeToRequests: (userId: string, callback: (request: any) => void) => {
    const subscription = supabase
      .channel(`help-requests:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'help_requests',
          filter: `helper_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  },
};

export default matchingService;
