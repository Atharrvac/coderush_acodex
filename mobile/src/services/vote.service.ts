/**
 * Vote Service - Upvote/Downvote functionality
 */

import { supabase } from '../config/supabase';

export const voteService = {
  // Get vote counts and user's vote for a problem
  getVotes: async (problemId: string, userId: string) => {
    try {
      // Get problem vote counts
      const { data: problem, error: problemError } = await supabase
        .from('problems')
        .select('upvotes, downvotes')
        .eq('id', problemId)
        .single();

      if (problemError) throw problemError;

      // Get user's vote
      const { data: userVote, error: voteError } = await supabase
        .from('problem_votes')
        .select('vote_type')
        .eq('problem_id', problemId)
        .eq('user_id', userId)
        .maybeSingle();

      if (voteError && voteError.code !== 'PGRST116') {
        console.error('Vote fetch error:', voteError);
      }

      return {
        upvotes: problem?.upvotes || 0,
        downvotes: problem?.downvotes || 0,
        userVote: userVote?.vote_type || null,
      };
    } catch (error) {
      console.error('getVotes error:', error);
      return {
        upvotes: 0,
        downvotes: 0,
        userVote: null,
      };
    }
  },

  // Vote on a problem (upvote or downvote)
  vote: async (problemId: string, userId: string, voteType: 'upvote' | 'downvote') => {
    try {
      // Check if user already voted
      const { data: existingVote } = await supabase
        .from('problem_votes')
        .select('vote_type')
        .eq('problem_id', problemId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          // Remove vote (toggle off)
          const { error } = await supabase
            .from('problem_votes')
            .delete()
            .eq('problem_id', problemId)
            .eq('user_id', userId);

          if (error) throw error;
        } else {
          // Change vote
          const { error } = await supabase
            .from('problem_votes')
            .update({ vote_type: voteType })
            .eq('problem_id', problemId)
            .eq('user_id', userId);

          if (error) throw error;
        }
      } else {
        // New vote
        const { error } = await supabase
          .from('problem_votes')
          .insert({
            problem_id: problemId,
            user_id: userId,
            vote_type: voteType,
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('vote error:', error);
      throw error;
    }
  },

  // Get trending problems (by most upvotes)
  getTrending: async (limit: number = 5): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('problems')
        .select('*, user:users!problems_user_id_fkey(*)')
        .order('upvotes', { ascending: false, nullsFirst: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('getTrending error:', error);
      return [];
    }
  },
};

export default voteService;
