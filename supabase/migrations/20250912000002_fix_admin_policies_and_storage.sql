-- Fix admin policies and storage access issues
-- This migration addresses content update permissions and storage access

-- First, let's make sure the admin policy has proper WITH CHECK clause for updates
DROP POLICY IF EXISTS "Admins can manage content" ON content_pages;

-- Create a more specific admin policy with proper permissions for both SELECT and modifications
CREATE POLICY "Admins can manage content" ON content_pages
    FOR ALL
    USING (
        -- For SELECT operations, allow if active content OR if user is admin
        (is_active = TRUE) OR 
        (auth.uid() IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        ))
    )
    WITH CHECK (
        -- For INSERT/UPDATE/DELETE operations, require admin role
        auth.uid() IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Ensure storage.objects policies are properly set for the product-images bucket
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage product images" ON storage.objects;

-- Create comprehensive storage policies
CREATE POLICY "Public can view product images" ON storage.objects
    FOR SELECT 
    USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images" ON storage.objects
    FOR INSERT 
    WITH CHECK (
        bucket_id = 'product-images' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Admins can manage product images" ON storage.objects
    FOR ALL 
    USING (
        bucket_id = 'product-images' 
        AND auth.uid() IS NOT NULL 
        AND EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Ensure the bucket is properly configured
UPDATE storage.buckets 
SET 
    public = true,
    file_size_limit = 10000000,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'product-images';