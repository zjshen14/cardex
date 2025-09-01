-- ⚠️ CRITICAL SECURITY FIX: Supabase Storage RLS Configuration
-- This script fixes Issue #13 by re-enabling RLS and creating proper storage policies

-- ==================================================================
-- STEP 1: Re-enable Row Level Security (CRITICAL)
-- ==================================================================

-- Re-enable RLS on storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ==================================================================
-- STEP 2: Remove any existing policies to start fresh
-- ==================================================================

-- Drop existing policies if they exist (prevents conflicts)
DROP POLICY IF EXISTS "card-images-public-read" ON storage.objects;
DROP POLICY IF EXISTS "card-images-service-operations" ON storage.objects;
DROP POLICY IF EXISTS "card-images-upload" ON storage.objects;
DROP POLICY IF EXISTS "card-images-read" ON storage.objects;
DROP POLICY IF EXISTS "card-images-delete" ON storage.objects;

-- ==================================================================
-- STEP 3: Create secure RLS policies
-- ==================================================================

-- Policy 1: Allow public read access to card images (needed for displaying cards)
-- This enables anyone to VIEW uploaded card images on the website
CREATE POLICY "card-images-public-read" ON storage.objects
FOR SELECT USING (bucket_id = 'card-images');

-- Policy 2: Allow service role operations (uploads, deletes, updates)
-- This enables the CardEx API (with service role key) to manage images
-- The service role can perform all operations while maintaining security
CREATE POLICY "card-images-service-operations" ON storage.objects
FOR ALL USING (
  bucket_id = 'card-images' AND 
  auth.jwt()::text ~ 'service_role'
);

-- ==================================================================
-- STEP 4: Configure bucket settings
-- ==================================================================

-- Ensure the card-images bucket exists and is properly configured
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'card-images',
  'card-images', 
  true,  -- Public bucket for read access
  10485760,  -- 10MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']::text[];

-- ==================================================================
-- STEP 5: Verification queries (Optional - for testing)
-- ==================================================================

-- Verify RLS is enabled
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'storage' AND tablename = 'objects';

-- Verify policies are created
-- SELECT policyname, cmd, roles, qual, with_check
-- FROM pg_policies 
-- WHERE schemaname = 'storage' AND tablename = 'objects';

-- Verify bucket configuration
-- SELECT id, name, public, file_size_limit, allowed_mime_types
-- FROM storage.buckets 
-- WHERE id = 'card-images';

-- ==================================================================
-- 🛡️ SECURITY SUMMARY
-- ==================================================================

-- ✅ RLS is now ENABLED - prevents unauthorized access
-- ✅ Public read access - users can view card images on the website  
-- ✅ Service role operations - CardEx API can upload/delete images
-- ✅ Bucket configured with proper file limits and MIME types
-- ✅ All unauthorized operations are blocked by RLS

-- ==================================================================
-- 🚨 IMPORTANT NOTES
-- ==================================================================

-- 1. This script assumes you're using SUPABASE_SERVICE_ROLE_KEY in your CardEx API
-- 2. The CardEx application handles authentication at the NextAuth level
-- 3. Service role key should be stored securely in environment variables
-- 4. Test image upload functionality after running this script
-- 5. Monitor Supabase logs for any authentication issues

-- ==================================================================
-- ✅ EXECUTION COMPLETE
-- ==================================================================

-- After running this script:
-- 1. Add SUPABASE_SERVICE_ROLE_KEY to your environment variables
-- 2. Deploy the updated CardEx code with supabase-admin client
-- 3. Test image upload and viewing functionality
-- 4. Monitor for any security or functionality issues

COMMENT ON TABLE storage.objects IS 'RLS enabled with secure policies for CardEx marketplace - Issue #13 resolved';