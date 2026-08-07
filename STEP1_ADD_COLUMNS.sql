-- Step 1: Add missing columns to users table
-- Run this first in Supabase SQL Editor

-- Check current table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Add password column
ALTER TABLE users ADD COLUMN password TEXT;

-- Add role column  
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'citizen';

-- Verify columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Success message
SELECT 'Columns added successfully! Now run STEP2_CREATE_OFFICER.sql' as message;