-- Comprehensive fix for content management system RLS policies
-- This migration fixes ALL content management issues

-- ======================================
-- FIX CONTENT_VERSIONS TABLE POLICIES
-- ======================================

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Admins can view content versions" ON content_versions;

-- Create comprehensive policies for content_versions
-- 1. Allow admins to view all content versions
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

-- 2. Allow admins to insert content versions (needed for auto-versioning trigger)
CREATE POLICY "Admins can create content versions" ON content_versions
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL 
        AND EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- 3. Allow the trigger to create versions by making the function SECURITY DEFINER
-- The trigger runs as the function owner, bypassing RLS
CREATE OR REPLACE FUNCTION create_content_version()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create version on UPDATE, not INSERT
    IF TG_OP = 'UPDATE' THEN
        -- Insert the old version into content_versions
        INSERT INTO content_versions (
            content_page_id,
            version_number,
            page_data,
            change_summary,
            created_by
        ) VALUES (
            OLD.id,
            OLD.version,
            OLD.page_data,
            'Auto-saved version before update',
            OLD.updated_by
        );
        
        -- Increment version number for the new record
        NEW.version = OLD.version + 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ======================================
-- OPTIMIZE CONTENT_PAGES POLICY  
-- ======================================

-- The current content_pages policy might be too complex, let's optimize it
DROP POLICY IF EXISTS "Admins can manage content" ON content_pages;

-- Create separate policies for better performance
-- 1. Public read access to active content
CREATE POLICY "Public can view active content pages" ON content_pages
    FOR SELECT
    USING (is_active = TRUE);

-- 2. Admin full access to all content
CREATE POLICY "Admins have full access to content pages" ON content_pages
    FOR ALL
    USING (
        auth.uid() IS NOT NULL 
        AND EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    )
    WITH CHECK (
        auth.uid() IS NOT NULL 
        AND EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- ======================================
-- GRANT NECESSARY PERMISSIONS
-- ======================================

-- Grant usage on sequences (if any)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute permissions on content functions
GRANT EXECUTE ON FUNCTION get_active_content(VARCHAR) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_content_with_history(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION create_content_version() TO authenticated;

-- ======================================
-- VERIFY THE SETUP
-- ======================================

-- Check that the policies are created correctly
-- This will show all policies for content_pages and content_versions
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('content_pages', 'content_versions')
ORDER BY tablename, policyname;