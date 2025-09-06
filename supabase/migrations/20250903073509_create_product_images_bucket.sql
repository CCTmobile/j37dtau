-- Check if storage extension is available
SELECT * FROM pg_extension WHERE extname = 'uuid-ossp';

-- Create the bucket (will be skipped if it already exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10000000,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage product images" ON storage.objects;

-- Create policies for the product-images bucket
CREATE POLICY "Users can upload product images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Public can view product images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Service role can manage product images" ON storage.objects
FOR ALL USING (bucket_id = 'product-images');

-- Verify the bucket was created
SELECT id, name, public FROM storage.buckets WHERE id = 'product-images';
