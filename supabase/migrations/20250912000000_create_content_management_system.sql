-- Create Content Management System Tables
-- Migration: 20250912000000_create_content_management_system.sql
-- Description: Creates tables for dynamic content management with JSON storage and versioning

-- Create content_pages table for storing dynamic page content
CREATE TABLE IF NOT EXISTS content_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_type VARCHAR(100) NOT NULL, -- 'about', 'privacy', 'terms', 'shipping', 'returns', 'help', 'contact'
    page_data JSONB NOT NULL, -- Flexible JSON structure for page content
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create content_versions table for tracking content history
CREATE TABLE IF NOT EXISTS content_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_page_id UUID REFERENCES content_pages(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    page_data JSONB NOT NULL,
    change_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_pages_page_type ON content_pages(page_type);
CREATE INDEX IF NOT EXISTS idx_content_pages_is_active ON content_pages(is_active);
CREATE INDEX IF NOT EXISTS idx_content_pages_updated_at ON content_pages(updated_at);
CREATE INDEX IF NOT EXISTS idx_content_versions_content_page_id ON content_versions(content_page_id);
CREATE INDEX IF NOT EXISTS idx_content_versions_version_number ON content_versions(version_number);

-- Create unique constraint to ensure one active page per type
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_pages_unique_active_type 
ON content_pages(page_type) WHERE is_active = TRUE;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER trigger_update_content_updated_at
    BEFORE UPDATE ON content_pages
    FOR EACH ROW
    EXECUTE FUNCTION update_content_updated_at();

-- Create function to automatically create version history
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
$$ LANGUAGE plpgsql;

-- Create trigger for automatic versioning
CREATE TRIGGER trigger_create_content_version
    BEFORE UPDATE ON content_pages
    FOR EACH ROW
    EXECUTE FUNCTION create_content_version();

-- Create RLS (Row Level Security) policies
ALTER TABLE content_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_versions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active content pages (for public viewing)
CREATE POLICY "Public can view active content" ON content_pages
    FOR SELECT
    USING (is_active = TRUE);

-- Policy: Only admins can modify content pages
CREATE POLICY "Admins can manage content" ON content_pages
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Policy: Admins can view all content versions
CREATE POLICY "Admins can view content versions" ON content_versions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Create function to get active content by page type
CREATE OR REPLACE FUNCTION get_active_content(page_type_param VARCHAR)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT page_data INTO result
    FROM content_pages
    WHERE page_type = page_type_param AND is_active = TRUE
    LIMIT 1;
    
    RETURN COALESCE(result, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get content with version history
CREATE OR REPLACE FUNCTION get_content_with_history(page_type_param VARCHAR)
RETURNS JSONB AS $$
DECLARE
    current_content JSONB;
    version_history JSONB;
    result JSONB;
BEGIN
    -- Get current active content
    SELECT json_build_object(
        'id', id,
        'page_type', page_type,
        'page_data', page_data,
        'version', version,
        'updated_at', updated_at,
        'updated_by', updated_by
    ) INTO current_content
    FROM content_pages
    WHERE page_type = page_type_param AND is_active = TRUE
    LIMIT 1;
    
    -- Get version history if current content exists
    IF current_content IS NOT NULL THEN
        SELECT json_agg(
            json_build_object(
                'version_number', version_number,
                'page_data', page_data,
                'change_summary', change_summary,
                'created_at', created_at,
                'created_by', created_by
            ) ORDER BY version_number DESC
        ) INTO version_history
        FROM content_versions cv
        WHERE cv.content_page_id = (current_content->>'id')::UUID;
        
        -- Combine current content with history
        result = json_build_object(
            'current', current_content,
            'history', COALESCE(version_history, '[]'::JSONB)
        );
    ELSE
        result = json_build_object(
            'current', null,
            'history', '[]'::JSONB
        );
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for the functions
GRANT EXECUTE ON FUNCTION get_active_content(VARCHAR) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_content_with_history(VARCHAR) TO authenticated;

-- Insert default content pages with South African localized content
INSERT INTO content_pages (page_type, page_data, created_by, updated_by) VALUES
(
    'about',
    '{
        "title": "About Rosémama Clothing",
        "description": "Learn about our story, values, and team",
        "sections": [
            {
                "id": "company-story",
                "title": "Our Story",
                "content": "<p>Founded in 2014 by Rosemary Oku, Rosémama began as a small boutique in Midrand, South Africa with a simple vision: to make beautiful, quality fashion accessible to every South African woman.</p><p>What started as a passion project has grown into a beloved brand that celebrates the diversity and beauty of South African style. From our headquarters in New Road, Midrand, we design and curate collections that blend international trends with local flair.</p>"
            },
            {
                "id": "mission-values",
                "title": "Our Mission & Values",
                "content": "<h4>Our Mission</h4><p>To democratize fashion by providing high-quality, sustainable clothing that empowers women to express their unique style with confidence.</p><h4>Our Values</h4><ul><li><strong>Quality:</strong> We believe every piece should be made to last</li><li><strong>Accessibility:</strong> Fashion should be available to everyone</li><li><strong>Sustainability:</strong> Responsible practices for our planet</li><li><strong>Empowerment:</strong> Clothing that makes you feel amazing</li></ul>"
            },
            {
                "id": "south-african-roots",
                "title": "Proudly South African",
                "content": "<p>We are proudly based in Midrand, South Africa, and serve customers across the rainbow nation. Our understanding of South African style, climate, and lifestyle needs makes us uniquely positioned to serve our community.</p><p>From the vibrant streets of Johannesburg to the coastal beauty of Cape Town, we design for the modern South African woman who values both style and substance.</p>"
            }
        ]
    }'::JSONB,
    (SELECT id FROM auth.users WHERE email = 'admin@rosemamaclothing.store' LIMIT 1),
    (SELECT id FROM auth.users WHERE email = 'admin@rosemamaclothing.store' LIMIT 1)
),
(
    'privacy',
    '{
        "title": "Privacy Policy",
        "description": "How we protect and use your personal information in compliance with POPIA",
        "sections": [
            {
                "id": "popia-compliance",
                "title": "POPIA Compliance",
                "content": "<p>Rosémama Clothing is committed to protecting your privacy and personal information in accordance with the Protection of Personal Information Act (POPIA), Act 4 of 2013.</p><p><strong>Responsible Party:</strong><br>Rosémama Clothing<br>New Road, Midrand, South Africa<br>Email: hello@rosemamaclothing.store<br>Phone: +27 73 551 4705</p>"
            },
            {
                "id": "information-collection",
                "title": "Information We Collect",
                "content": "<p>We collect personal information necessary to provide our services:</p><ul><li><strong>Identity Information:</strong> Name, surname, ID number (when required)</li><li><strong>Contact Information:</strong> Email address, phone number, postal address</li><li><strong>Financial Information:</strong> Payment details, billing address</li><li><strong>Account Information:</strong> Username, password, purchase history</li></ul>"
            }
        ]
    }'::JSONB,
    (SELECT id FROM auth.users WHERE email = 'admin@rosemamaclothing.store' LIMIT 1),
    (SELECT id FROM auth.users WHERE email = 'admin@rosemamaclothing.store' LIMIT 1)
),
(
    'shipping',
    '{
        "title": "Shipping Policy",
        "description": "Shipping methods, costs, and delivery information for South Africa",
        "sections": [
            {
                "id": "shipping-methods",
                "title": "Shipping Methods",
                "content": "<h4>PAXI (PEP Stores) - Store to Store</h4><ul><li><strong>Standard Delivery (7-9 business days):</strong> R59.95</li><li><strong>Express Delivery (3-5 business days):</strong> R109.95</li><li>Collect from any PEP store nationwide</li><li>Over 2,000 collection points across South Africa</li></ul><h4>PostNet Services</h4><ul><li><strong>PostNet2PostNet (2-3 business days):</strong> R99.00</li><li><strong>Door-to-Door (same/next day in major cities):</strong> R125.00 - R150.00</li></ul>"
            },
            {
                "id": "delivery-areas",
                "title": "Delivery Coverage",
                "content": "<p>We deliver nationwide across South Africa, including rural and remote areas through our extensive courier network.</p><p><strong>Major Cities:</strong> Same or next-day delivery available in Johannesburg, Cape Town, Durban, Pretoria, and Port Elizabeth.</p><p><strong>Rural Areas:</strong> Extended delivery times may apply for very remote locations.</p>"
            }
        ]
    }'::JSONB,
    (SELECT id FROM auth.users WHERE email = 'admin@rosemamaclothing.store' LIMIT 1),
    (SELECT id FROM auth.users WHERE email = 'admin@rosemamaclothing.store' LIMIT 1)
);

-- Add helpful comments
COMMENT ON TABLE content_pages IS 'Stores dynamic page content with JSON structure for flexibility';
COMMENT ON TABLE content_versions IS 'Version history for content changes and audit trail';
COMMENT ON COLUMN content_pages.page_data IS 'JSONB column storing flexible page structure with sections, titles, and content';
COMMENT ON COLUMN content_pages.version IS 'Auto-incrementing version number for content tracking';
COMMENT ON FUNCTION get_active_content(VARCHAR) IS 'Returns active content for a specific page type (public access)';
COMMENT ON FUNCTION get_content_with_history(VARCHAR) IS 'Returns content with full version history (admin access)';