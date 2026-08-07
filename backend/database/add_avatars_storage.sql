-- NagrikSeva - Add Avatars Storage Bucket
-- Run this in Supabase SQL Editor
-- This makes profile photos visible to everyone

-- ============================================
-- STEP 1: DROP ALL EXISTING POLICIES FIRST
-- ============================================
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

-- ============================================
-- STEP 2: CREATE/UPDATE AVATARS BUCKET
-- ============================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ============================================
-- STEP 3: CREATE NEW POLICIES
-- ============================================

-- Anyone can view all avatars (PUBLIC)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Authenticated users can upload their avatar
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- STEP 4: Make problem-images bucket public too
-- ============================================
UPDATE storage.buckets SET public = true WHERE id = 'problem-images';

-- DONE! Profile photos are now visible to everyone.
