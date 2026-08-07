-- Fix RLS policies for help_sessions table
-- Add INSERT policy so users can create sessions

DROP POLICY IF EXISTS "Users can insert sessions" ON help_sessions;

CREATE POLICY "Users can insert sessions"
    ON help_sessions FOR INSERT
    WITH CHECK (auth.uid() = helper_id OR auth.uid() = poster_id);
