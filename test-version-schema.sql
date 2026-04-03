-- Test if track_versions table exists and is working
-- Run this in Supabase SQL Editor to verify the schema

-- Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'track_versions'
) as table_exists;

-- Check table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'track_versions' 
ORDER BY ordinal_position;

-- Test insert (this will fail if table doesn't exist)
INSERT INTO track_versions (track_id, name, changes, is_latest) 
VALUES ('00000000-0000-0000-0000-000000000000', 'V1', 'Test version', true)
ON CONFLICT DO NOTHING;

-- Check if storage bucket exists
SELECT id, name, public FROM storage.buckets WHERE id = 'audio-files';