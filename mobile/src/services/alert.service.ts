/**
 * Alert/Notification Service - NagrikSeva
 */

import { supabase } from '../config/supabase';
import { Alert } from '../types';

export const alertService = {
  // Get all alerts for user
  getAll: async (userId: string): Promise<Alert[]> => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('getAll alerts error:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('getAll alerts exception:', error);
      return [];
    }
  },

  // Get unread count
  getUnreadCount: async (userId: string): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('alerts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        console.error('getUnreadCount error:', error);
        return 0;
      }
      return count || 0;
    } catch (error) {
      console.error('getUnreadCount exception:', error);
      return 0;
    }
  },

  // Mark as read
  markAsRead: async (alertId: string): Promise<void> => {
    const { error } = await supabase
      .from('alerts')
      .update({ read: true })
      .eq('id', alertId);

    if (error) {
      console.error('markAsRead error:', error);
    }
  },

  // Mark all as read
  markAllAsRead: async (userId: string): Promise<void> => {
    const { error } = await supabase
      .from('alerts')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('markAllAsRead error:', error);
    }
  },

  // Delete alert
  delete: async (alertId: string): Promise<void> => {
    const { error } = await supabase
      .from('alerts')
      .delete()
      .eq('id', alertId);

    if (error) {
      console.error('delete alert error:', error);
    }
  },

  // Subscribe to real-time alerts
  subscribeToAlerts: (userId: string, callback: (alert: Alert) => void) => {
    const subscription = supabase
      .channel('alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new as Alert);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }
};

export default alertService;
