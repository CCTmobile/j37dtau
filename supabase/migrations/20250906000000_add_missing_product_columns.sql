-- Add missing columns to products table
-- This migration adds the columns needed for the enhanced product management system
-- Note: images column already exists as JSONB from previous migration

-- Add sizes column (array of strings)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS sizes TEXT[] DEFAULT ARRAY['S', 'M', 'L'];

-- Add colors column (array of strings)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS colors TEXT[] DEFAULT ARRAY['Black', 'White'];

-- Add in_stock column (boolean, default true)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT true;

-- Add original_price column (for sales/discounts)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2);

-- The images column already exists as JSONB from previous migration
-- Ensure all products have a valid images array (JSONB format)
UPDATE public.products
SET images = CASE
    WHEN images IS NULL THEN '[]'::jsonb
    WHEN jsonb_typeof(images) != 'array' THEN jsonb_build_array(images)
    ELSE images
END
WHERE images IS NULL OR jsonb_typeof(images) != 'array';

-- Create index for better query performance (existing images index is already created)
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON public.products(in_stock);
CREATE INDEX IF NOT EXISTS idx_products_sizes ON public.products USING GIN(sizes);
CREATE INDEX IF NOT EXISTS idx_products_colors ON public.products USING GIN(colors);

-- Update updated_at timestamp function for the new columns
-- The existing trigger should handle this automatically

-- Verify the changes (for debugging)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;
