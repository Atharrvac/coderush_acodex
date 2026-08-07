-- ============================================
-- NUCLEAR FIX - Aggressively removes all duplicates
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Drop the function with ALL possible signatures
DROP FUNCTION IF EXISTS send_chat_message(UUID, UUID, UUID, VARCHAR, TEXT, TEXT, NUMERIC, NUMERIC, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS send_chat_message(UUID, UUID, UUID, VARCHAR, TEXT, TEXT, NUMERIC, NUMERIC, TEXT) CASCADE;
DROP FUNCTION IF EXISTS send_chat_message(UUID, UUID, UUID, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS send_chat_message(UUID, UUID, UUID, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.send_chat_message CASCADE;

-- Step 2: Drop by OID (most aggressive)
DO $$ 
DECLARE
    func_oid OID;
BEGIN
    FOR func_oid IN 
        SELECT oid FROM pg_proc WHERE proname = 'send_chat_message'
    LOOP
        EXECUTE 'DROP FUNCTION ' || func_oid::regprocedure || ' CASCADE';
    END LOOP;
END $$;

-- Step 3: Verify all are gone
DO $$
DECLARE
  func_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO func_count FROM pg_proc WHERE proname = 'send_chat_message';
  
  IF func_count > 0 THEN
    RAISE EXCEPTION 'Still have % send_chat_message functions!', func_count;
  ELSE
    RAISE NOTICE 'SUCCESS: All send_chat_message functions removed';
  END IF;
END $$;

-- Step 4: Create ONE new function with explicit types
CREATE FUNCTION send_chat_message(
  p_session_id UUID,
  p_sender_id UUID,
  p_receiver_id UUID,
  p_message_type TEXT,
  p_content TEXT,
  p_image_url TEXT DEFAULT NULL,
  p_latitude NUMERIC DEFAULT NULL,
  p_longitude NUMERIC DEFAULT NULL,
  p_location_name TEXT DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_message_id UUID;
BEGIN
  INSERT INTO chat_messages (
    session_id, sender_id, receiver_id, message_type, content,
    image_url, latitude, longitude, location_name
  )
  VALUES (
    p_session_id, p_sender_id, p_receiver_id, p_message_type::VARCHAR, p_content,
    p_image_url, p_latitude, p_longitude, p_location_name
  )
  RETURNING id INTO v_message_id;
  
  UPDATE help_sessions
  SET total_messages = total_messages + 1,
      last_message_at = NOW(),
      updated_at = NOW()
  WHERE id = p_session_id;
  
  RETURN v_message_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in send_chat_message: %', SQLERRM;
    RETURN NULL;
END;
$$;

-- Step 5: Grant permissions
GRANT EXECUTE ON FUNCTION send_chat_message TO authenticated;
GRANT EXECUTE ON FUNCTION send_chat_message TO anon;
GRANT EXECUTE ON FUNCTION send_chat_message TO public;

-- Step 6: Final verification
DO $$
DECLARE
  func_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO func_count FROM pg_proc WHERE proname = 'send_chat_message';
  
  IF func_count = 0 THEN
    RAISE EXCEPTION 'Function was not created!';
  ELSIF func_count > 1 THEN
    RAISE EXCEPTION 'Multiple functions still exist! Count: %', func_count;
  ELSE
    RAISE NOTICE 'SUCCESS: Exactly ONE send_chat_message function exists';
  END IF;
END $$;

-- ============================================
-- SUCCESS! Function overloading is fixed!
-- ============================================
