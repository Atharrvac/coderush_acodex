-- Check current database schema
-- Run this in Supabase SQL Editor to see what tables exist

-- Check if users table exists and its structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Check what tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if problems table exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'problems' 
ORDER BY ordinal_position;