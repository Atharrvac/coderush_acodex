/**
 * Achievement Service - Gamification System
 */

import { supabase } from '../config/supabase';

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  criteria: any;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  achievement: Achievement;
}

export const achievementService = {
  // Get all available achievements
  getAll: async (): Promise<Achievement[]> => {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('points', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Get achievements error:', error);
      throw new Error(error.message);
    }
  },

  // Get user's earned achievements
  getUserAchievements: async (userId: string): Promise<UserAchievement[]> => {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*, achievement:achievements(*)')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Get user achievements error:', error);
      throw new Error(error.message);
    }
  },

  // Award achievement to user
  award: async (userId: string, achievementCode: string): Promise<void> => {
    try {
      // Get achievement by code
      const { data: achievement } = await supabase
        .from('achievements')
        .select('id')
        .eq('code', achievementCode)
        .single();

      if (!achievement) {
        throw new Error('Achievement not found');
      }

      // Check if already earned
      const { data: existing } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', userId)
        .eq('achievement_id', achievement.id)
        .single();

      if (existing) {
        return; // Already earned
      }

      // Award achievement
      await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: achievement.id,
        });
    } catch (error: any) {
      console.error('Award achievement error:', error);
      throw new Error(error.message);
    }
  },

  // Get leaderboard
  getLeaderboard: async (limit: number = 100) => {
    try {
      const { data, error } = await supabase
        .from('leaderboard_view')
        .select('*')
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Get leaderboard error:', error);
      throw new Error(error.message);
    }
  },

  // Get user rank
  getUserRank: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('leaderboard_view')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Get user rank error:', error);
      return null;
    }
  },
};

export default achievementService;
