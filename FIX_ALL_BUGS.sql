-- COMPREHENSIVE BUG FIX FOR CHAT SYSTEM
-- Run this in Supabase SQL Editor to fix all RLS issues

-- 1. Fix help_sessions RLS policies
DROP POLICY IF EXISTS "Users can insert sessions" ON help_sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON help_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON help_sessions;

-- Create comprehensive policies for help_sessions
CREATE POLICY "Users can insert sessions" ON help_sessions
    FOR INSERT WITH CHECK (
        auth.uid() = helper_id OR auth.uid() = poster_id
    );

CREATE POLICY "Users can view their own sessions" ON help_sessions
    FOR SELECT USING (
        auth.uid() = helper_id OR auth.uid() = poster_id
    );

CREATE POLICY "Users can update their own sessions" ON help_sessions
    FOR UPDATE USING (
        auth.uid() = helper_id OR auth.uid() = poster_id
    );

-- 2. Fix chat_messages RLS policies
DROP POLICY IF EXISTS "Users can view their own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can update their received messages" ON chat_messages;

CREATE POLICY "Users can view their own messages" ON chat_messages
    FOR SELECT USING (
        auth.uid() = sender_id OR auth.uid() = receiver_id
    );

CREATE POLICY "Users can send messages" ON chat_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id
    );

CREATE POLICY "Users can update their received messages" ON chat_messages
    FOR UPDATE USING (
        auth.uid() = receiver_id
    );

-- 3. Fix session_updates RLS policies
DROP POLICY IF EXISTS "Users can view session updates" ON session_updates;
DROP POLICY IF EXISTS "Users can create session updates" ON session_updates;

CREATE POLICY "Users can view session updates" ON session_updates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM help_sessions
            WHERE id = session_updates.session_id
            AND (helper_id = auth.uid() OR poster_id = auth.uid())
        )
    );

CREATE POLICY "Users can create session updates" ON session_updates
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM help_sessions
            WHERE id = session_updates.session_id
            AND (helper_id = auth.uid() OR poster_id = auth.uid())
        )
    );

-- 4. Ensure all tables have proper RLS enabled
ALTER TABLE help_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_updates ENABLE ROW LEVEL SECURITY;

-- SUCCESS: All RLS policies fixed!