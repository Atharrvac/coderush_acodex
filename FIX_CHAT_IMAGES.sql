-- ============================================
-- FIX CHAT IMAGE SENDING
-- Fixes function overloading issue
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Drop ALL existing send_chat_message functions
DROP FUNCTION IF EXISTS send_chat_message(UUID, UUID, UUID, VARCHAR, TEXT, TEXT, NUMERIC, NUMERIC, VARCHAR);
DROP FUNCTION IF EXISTS send_chat_message(UUID, UUID, UUID, VARCHAR, TEXT, TEXT, NUMERIC, NUMERIC, TEXT);
DROP FUNCTION IF EXISTS public.send_chat_message CASCADE;

-- Step 2: Create ONE clean send_chat_message function
CREATE OR REPLACE FUNCTION send_chat_message(
  p_session_id UUID,
  p_sender_id UUID,
  p_receiver_id UUID,
  p_message_type VARCHAR,
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
  -- Insert message
  INSERT INTO chat_messages (
    session_id, 
    sender_id, 
    receiver_id, 
    message_type, 
    content,
    image_url, 
    latitude, 
    longitude, 
    location_name
  )
  VALUES (
    p_session_id, 
    p_sender_id, 
    p_receiver_id, 
    p_message_type, 
    p_content,
    p_image_url, 
    p_latitude, 
    p_longitude, 
    p_location_name
  )
  RETURNING id INTO v_message_id;
  
  -- Update session
  UPDATE help_sessions
  SET 
    total_messages = total_messages + 1,
    last_message_at = NOW(),
    updated_at = NOW()
  WHERE id = p_session_id;
  
  RETURN v_message_id;
END;
$$;

-- Step 3: Grant execute permission
GRANT EXECUTE ON FUNCTION send_chat_message TO authenticated;

-- ============================================
-- SUCCESS! Chat image sending should work now!
-- ============================================
