-- Check if track_versions table exists and show its structure
SELECT table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'track_versions' 
ORDER BY ordinal_position;

-- Check if any data exists in track_versions
SELECT COUNT(*) as version_count FROM track_versions;

-- Check storage buckets
SELECT id, name, public FROM storage.buckets WHERE id = 'audio-files';