-- Fix RLS policy for content_pages to allow anonymous read access
-- This migration fixes the permission denied error for public content viewing

-- First, drop the existing policies for content_pages
DROP POLICY IF EXISTS "Public can view active content" ON content_pages;
DROP POLICY IF EXISTS "Admins can manage content" ON content_pages;

-- Drop the existing policy for content_versions that also has the same issue
DROP POLICY IF EXISTS "Admins can view content versions" ON content_versions;

-- Create new policy for public read access that works with anonymous users
CREATE POLICY "Public can view active content" ON content_pages
    FOR SELECT
    USING (is_active = TRUE);

-- Create policy for authenticated admin access using the public.users table
-- This avoids the permission denied error with auth.users for anonymous requests
CREATE POLICY "Admins can manage content" ON content_pages
    FOR ALL
    USING (
        auth.uid() IS NOT NULL 
        AND EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Fix the content_versions policy to use public.users instead of auth.users
CREATE POLICY "Admins can view content versions" ON content_versions
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL 
        AND EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );