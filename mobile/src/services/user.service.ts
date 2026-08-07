/**
 * NagrikSeva - User Service
 * Profile management and avatar upload
 */

import { supabase } from '../config/supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar_url?: string;
  problems_posted: number;
  problems_solved: number;
  created_at: string;
}

export const userService = {
  // Get user profile
  getProfile: async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('getProfile error:', error);
      return null;
    }
    return data;
  },

  // Update user profile
  updateProfile: async (
    userId: string,
    updates: { name?: string; phone?: string; avatar_url?: string }
  ): Promise<UserProfile | null> => {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('updateProfile error:', error);
      throw new Error(error.message);
    }
    return data;
  },

  // Upload avatar image
  uploadAvatar: async (uri: string, userId: string): Promise<string> => {
    try {
      console.log('Starting avatar upload for user:', userId);
      const fileName = `${userId}/avatar_${Date.now()}.jpg`;

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to ArrayBuffer
      const arrayBuffer = decode(base64);

      // Upload to Supabase Storage (avatars bucket)
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) {
        console.error('Avatar upload error:', error);
        throw new Error(error.message);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const avatarUrl = urlData.publicUrl;
      console.log('Avatar uploaded:', avatarUrl);

      // Update user profile with new avatar URL
      await userService.updateProfile(userId, { avatar_url: avatarUrl });

      return avatarUrl;
    } catch (error: any) {
      console.error('uploadAvatar error:', error);
      throw new Error(error.message || 'Failed to upload avatar');
    }
  },

  // Delete old avatar
  deleteAvatar: async (userId: string, avatarUrl: string): Promise<void> => {
    try {
      // Extract file path from URL
      const urlParts = avatarUrl.split('/avatars/');
      if (urlParts.length < 2) return;

      const filePath = urlParts[1];
      
      const { error } = await supabase.storage
        .from('avatars')
        .remove([filePath]);

      if (error) {
        console.error('deleteAvatar error:', error);
      }
    } catch (error) {
      console.error('deleteAvatar exception:', error);
    }
  },

  // Get user stats
  getStats: async (userId: string): Promise<{ posted: number; helped: number; solved: number }> => {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('problems_posted, problems_solved')
        .eq('id', userId)
        .single();

      const { count: helpingCount } = await supabase
        .from('problems')
        .select('*', { count: 'exact', head: true })
        .eq('helper_id', userId);

      return {
        posted: profile?.problems_posted || 0,
        helped: helpingCount || 0,
        solved: profile?.problems_solved || 0,
      };
    } catch (error) {
      console.error('getStats error:', error);
      return { posted: 0, helped: 0, solved: 0 };
    }
  },
};

export default userService;
