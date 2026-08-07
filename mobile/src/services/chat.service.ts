/**
 * Chat Service - In-App Real-Time Messaging
 * Handles chat messages and help session tracking
 */

import { supabase } from '../config/supabase';
import { errorHandler, retryWithBackoff } from '../utils/errorHandler';

export interface HelpSession {
  id: string;
  problem_id: string;
  helper_id: string;
  poster_id: string;
  status: 'active' | 'completed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  helper_current_latitude?: number;
  helper_current_longitude?: number;
  distance_to_problem?: number;
  estimated_arrival_time?: string;
  total_messages: number;
  last_message_at?: string;
  completion_note?: string;
  completion_image?: string;
  rating_by_poster?: number;
  rating_by_helper?: number;
  created_at: string;
  updated_at: string;
  // Joined data
  problem?: any;
  helper?: any;
  poster?: any;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  sender_id: string;
  receiver_id: string;
  message_type: 'text' | 'image' | 'location' | 'system';
  content: string;
  image_url?: string;
  latitude?: number;
  longitude?: number;
  location_name?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  sender?: any;
}

export interface SessionUpdate {
  id: string;
  session_id: string;
  update_type: string;
  title: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  created_by?: string;
  created_at: string;
}

export const chatService = {
  // =====================================================
  // HELP SESSION MANAGEMENT
  // =====================================================

  // Create help session
  createSession: async (problemId: string, helperId: string, posterId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('create_help_session', {
          p_problem_id: problemId,
          p_helper_id: helperId,
          p_poster_id: posterId,
        });

      if (error) throw error;
      return data; // Returns session_id
    } catch (error: any) {
      console.error('Create session error:', error);
      throw new Error(error.message);
    }
  },

  // Get session by ID
  getSession: async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('help_sessions')
        .select(`
          *,
          problem:problems(*),
          helper:users!help_sessions_helper_id_fkey(*),
          poster:users!help_sessions_poster_id_fkey(*)
        `)
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      return data as HelpSession;
    } catch (error: any) {
      console.error('Get session error:', error);
      throw new Error(error.message);
    }
  },

  // Get session by problem ID
  getSessionByProblem: async (problemId: string) => {
    try {
      const { data, error } = await supabase
        .from('help_sessions')
        .select(`
          *,
          problem:problems(*),
          helper:users!help_sessions_helper_id_fkey(*),
          poster:users!help_sessions_poster_id_fkey(*)
        `)
        .eq('problem_id', problemId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as HelpSession | null;
    } catch (error: any) {
      console.error('Get session by problem error:', error);
      throw new Error(error.message);
    }
  },

  // Get user's active sessions
  getActiveSessions: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('help_sessions')
        .select(`
          *,
          problem:problems(*),
          helper:users!help_sessions_helper_id_fkey(*),
          poster:users!help_sessions_poster_id_fkey(*)
        `)
        .or(`helper_id.eq.${userId},poster_id.eq.${userId}`)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as HelpSession[];
    } catch (error: any) {
      console.error('Get active sessions error:', error);
      throw new Error(error.message);
    }
  },

  // Complete session
  completeSession: async (sessionId: string, note?: string, imageUrl?: string) => {
    try {
      const { data, error } = await supabase
        .rpc('complete_help_session', {
          p_session_id: sessionId,
          p_completion_note: note,
          p_completion_image: imageUrl,
        });

      if (error) throw error;

      // Send completion message to chat
      const completionMessage = note 
        ? `✅ Help session completed! Note: ${note}`
        : '✅ Help session completed successfully!';
      
      await chatService.sendSystemMessage(sessionId, completionMessage, 'session_completed');

      return data;
    } catch (error: any) {
      console.error('Complete session error:', error);
      throw new Error(error.message);
    }
  },

  // Cancel session
  cancelSession: async (sessionId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('help_sessions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason,
        })
        .eq('id', sessionId);

      if (error) throw error;

      // Send cancellation message to chat
      await chatService.sendSystemMessage(
        sessionId, 
        `❌ Help session cancelled. Reason: ${reason}`, 
        'session_cancelled'
      );

      // Create cancellation update
      await supabase
        .from('session_updates')
        .insert({
          session_id: sessionId,
          update_type: 'session_cancelled',
          title: 'Session Cancelled',
          description: reason,
        });
    } catch (error: any) {
      console.error('Cancel session error:', error);
      throw new Error(error.message);
    }
  },

  // Update helper location
  updateHelperLocation: async (sessionId: string, latitude: number, longitude: number) => {
    try {
      const { data, error } = await supabase
        .rpc('update_helper_location', {
          p_session_id: sessionId,
          p_latitude: latitude,
          p_longitude: longitude,
        });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Update helper location error:', error);
      throw new Error(error.message);
    }
  },

  // =====================================================
  // CHAT MESSAGES
  // =====================================================

  // Send text message
  sendMessage: async (
    sessionId: string,
    senderId: string,
    receiverId: string,
    content: string
  ) => {
    return retryWithBackoff(async () => {
      try {
        const { data, error } = await supabase
          .rpc('send_chat_message', {
            p_session_id: sessionId,
            p_sender_id: senderId,
            p_receiver_id: receiverId,
            p_message_type: 'text',
            p_content: content,
          });

        if (error) throw error;
        return data;
      } catch (error: any) {
        console.error('Send message error:', error);
        throw error;
      }
    }, 2, 1000); // 2 retries with 1s delay
  },

  // Send image message
  sendImageMessage: async (
    sessionId: string,
    senderId: string,
    receiverId: string,
    imageUrl: string,
    caption?: string
  ) => {
    try {
      const { data, error } = await supabase
        .rpc('send_chat_message', {
          p_session_id: sessionId,
          p_sender_id: senderId,
          p_receiver_id: receiverId,
          p_message_type: 'image',
          p_content: caption || 'Sent an image',
          p_image_url: imageUrl,
        });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Send image message error:', error);
      throw new Error(error.message);
    }
  },

  // Send system message (for status updates)
  sendSystemMessage: async (
    sessionId: string,
    content: string,
    updateType?: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          sender_id: null, // System message
          receiver_id: null, // Broadcast to all
          message_type: 'system',
          content,
          is_read: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Also create a session update if updateType is provided
      if (updateType) {
        await supabase
          .from('session_updates')
          .insert({
            session_id: sessionId,
            update_type: updateType,
            title: 'Status Update',
            description: content,
          });
      }

      return data;
    } catch (error: any) {
      console.error('Send system message error:', error);
      throw new Error(error.message);
    }
  },

  // Send problem status update to chat
  sendProblemStatusUpdate: async (problemId: string, newStatus: string, updatedBy?: string) => {
    try {
      // Get active session for this problem
      const session = await chatService.getSessionByProblem(problemId);
      if (!session) return; // No active chat session

      let statusMessage = '';
      let updateType = '';

      switch (newStatus) {
        case 'solved':
          statusMessage = '🎉 Great news! This problem has been marked as SOLVED! Thank you for working together to fix it.';
          updateType = 'problem_solved';
          break;
        case 'being_helped':
          statusMessage = '🤝 Someone is now helping with this problem! You can coordinate through this chat.';
          updateType = 'problem_being_helped';
          break;
        case 'posted':
          statusMessage = '📢 This problem is now open for help again.';
          updateType = 'problem_reopened';
          break;
        default:
          statusMessage = `📋 Problem status updated to: ${newStatus}`;
          updateType = 'status_changed';
      }

      // Add who updated it if available
      if (updatedBy) {
        statusMessage += ` (Updated by ${updatedBy})`;
      }

      // Send system message to chat
      await chatService.sendSystemMessage(session.id, statusMessage, updateType);

      return session.id;
    } catch (error: any) {
      console.error('Send problem status update error:', error);
      // Don't throw error - this is a nice-to-have feature
    }
  },

  // Get messages for session
  getMessages: async (sessionId: string, limit: number = 50) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*, sender:users!chat_messages_sender_id_fkey(*)')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data as ChatMessage[];
    } catch (error: any) {
      console.error('Get messages error:', error);
      throw new Error(error.message);
    }
  },

  // Mark messages as read
  markAsRead: async (sessionId: string, userId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('mark_messages_read', {
          p_session_id: sessionId,
          p_user_id: userId,
        });

      if (error) throw error;
      return data; // Returns count of marked messages
    } catch (error: any) {
      console.error('Mark as read error:', error);
      throw new Error(error.message);
    }
  },

  // Get unread count
  getUnreadCount: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_unread_count', {
          p_user_id: userId,
        });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Get unread count error:', error);
      throw new Error(error.message);
    }
  },

  // =====================================================
  // SESSION UPDATES
  // =====================================================

  // Create session update
  createUpdate: async (
    sessionId: string,
    updateType: string,
    title: string,
    description?: string,
    latitude?: number,
    longitude?: number,
    createdBy?: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('session_updates')
        .insert({
          session_id: sessionId,
          update_type: updateType,
          title,
          description,
          latitude,
          longitude,
          created_by: createdBy,
        })
        .select()
        .single();

      if (error) throw error;
      return data as SessionUpdate;
    } catch (error: any) {
      console.error('Create update error:', error);
      throw new Error(error.message);
    }
  },

  // Get session updates
  getUpdates: async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('session_updates')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as SessionUpdate[];
    } catch (error: any) {
      console.error('Get updates error:', error);
      throw new Error(error.message);
    }
  },

  // =====================================================
  // REAL-TIME SUBSCRIPTIONS
  // =====================================================

  // Subscribe to new messages
  subscribeToMessages: (sessionId: string, callback: (message: ChatMessage) => void) => {
    const subscription = supabase
      .channel(`messages:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`,
        },
        async (payload) => {
          // Fetch full message with sender info
          const { data } = await supabase
            .from('chat_messages')
            .select('*, sender:users!chat_messages_sender_id_fkey(*)')
            .eq('id', payload.new.id)
            .single();

          if (data) {
            callback(data as ChatMessage);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  },

  // Subscribe to session updates
  subscribeToSession: (sessionId: string, callback: (session: HelpSession) => void) => {
    const subscription = supabase
      .channel(`session:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'help_sessions',
          filter: `id=eq.${sessionId}`,
        },
        async (payload) => {
          // Fetch full session with relations
          const { data } = await supabase
            .from('help_sessions')
            .select(`
              *,
              problem:problems(*),
              helper:users!help_sessions_helper_id_fkey(*),
              poster:users!help_sessions_poster_id_fkey(*)
            `)
            .eq('id', sessionId)
            .single();

          if (data) {
            callback(data as HelpSession);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  },

  // Subscribe to session updates
  subscribeToUpdates: (sessionId: string, callback: (update: SessionUpdate) => void) => {
    const subscription = supabase
      .channel(`updates:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'session_updates',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          callback(payload.new as SessionUpdate);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  },
};

export default chatService;
