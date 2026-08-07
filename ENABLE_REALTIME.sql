-- ============================================
-- ENABLE REALTIME FOR CHAT
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Enable Realtime for chat_messages table
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Step 2: Enable Realtime for help_sessions table
ALTER PUBLICATION supabase_realtime ADD TABLE help_sessions;

-- Step 3: Enable Realtime for session_updates table
ALTER PUBLICATION supabase_realtime ADD TABLE session_updates;

-- Step 4: Verify Realtime is enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- ============================================
-- SUCCESS! Realtime is now enabled!
-- Messages will appear instantly without reload
-- ============================================
