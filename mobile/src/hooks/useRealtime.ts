/**
 * Real-time Hooks
 * Subscribe to database changes for instant updates
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../config/supabase';

/**
 * Subscribe to announcements - updates when faculty posts new announcement
 */
export const useRealtimeAnnouncements = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('announcements-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'announcements' },
        (payload) => {
          console.log('Announcement change:', payload);
          // Invalidate and refetch announcements
          queryClient.invalidateQueries({ queryKey: ['announcements'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};

/**
 * Subscribe to assignments - updates when faculty creates/updates assignments
 */
export const useRealtimeAssignments = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('assignments-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'assignments' },
        (payload) => {
          console.log('Assignment change:', payload);
          queryClient.invalidateQueries({ queryKey: ['studentAssignments'] });
          queryClient.invalidateQueries({ queryKey: ['facultyAssignments'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};

/**
 * Subscribe to attendance - updates when faculty marks attendance
 */
export const useRealtimeAttendance = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('attendance-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance' },
        (payload) => {
          console.log('Attendance change:', payload);
          queryClient.invalidateQueries({ queryKey: ['studentAttendance'] });
          queryClient.invalidateQueries({ queryKey: ['studentDashboard'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};

/**
 * Subscribe to submissions - updates when student submits or faculty grades
 */
export const useRealtimeSubmissions = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('submissions-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'submissions' },
        (payload) => {
          console.log('Submission change:', payload);
          queryClient.invalidateQueries({ queryKey: ['studentAssignments'] });
          queryClient.invalidateQueries({ queryKey: ['facultySubmissions'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};

/**
 * Combined hook for all real-time subscriptions
 */
export const useRealtimeAll = () => {
  useRealtimeAnnouncements();
  useRealtimeAssignments();
  useRealtimeAttendance();
  useRealtimeSubmissions();
};
