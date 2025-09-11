-- Configure CORS for product-images bucket to allow cross-origin canvas operations
-- This migration adds CORS configuration to allow the frontend to crop images properly

-- Update bucket configuration with CORS settings
UPDATE storage.buckets 
SET 
  public = true,
  file_size_limit = 10000000,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
WHERE id = 'product-images';

-- Note: Supabase handles CORS at the API Gateway level
-- The main fix is in the frontend to convert images to data URLs 
-- before processing them in canvas to avoid CORS taint issues

-- Verify the bucket configuration
SELECT 
  id, 
  name, 
  public, 
  file_size_limit, 
  allowed_mime_types,
  created_at,
  updated_at
FROM storage.buckets 
WHERE id = 'product-images';
