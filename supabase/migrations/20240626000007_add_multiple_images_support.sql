-- Add multiple images support to products table
-- This migration adds support for multiple product images

-- First, add a new column for storing multiple image URLs as JSON
ALTER TABLE products ADD COLUMN images JSONB DEFAULT '[]'::jsonb;

-- Migrate existing image_url data to the new images array
UPDATE products
SET images = CASE
  WHEN image_url IS NOT NULL AND image_url != ''
  THEN jsonb_build_array(image_url)
  ELSE '[]'::jsonb
END;

-- Add an index on the images column for better query performance
CREATE INDEX idx_products_images ON products USING GIN (images);

-- Add a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_products_updated_at();

-- Add a function to get product images in a formatted way
CREATE OR REPLACE FUNCTION get_product_images(product_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT images INTO result
  FROM products
  WHERE id = product_id;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Add a function to add an image to a product
CREATE OR REPLACE FUNCTION add_product_image(
  product_id UUID,
  image_url TEXT,
  image_order INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  current_images JSONB;
  new_images JSONB;
BEGIN
  -- Get current images
  SELECT images INTO current_images
  FROM products
  WHERE id = product_id;

  IF current_images IS NULL THEN
    current_images := '[]'::jsonb;
  END IF;

  -- Add new image URL to the array
  new_images := current_images || jsonb_build_array(image_url);

  -- Update the product
  UPDATE products
  SET images = new_images,
      updated_at = NOW()
  WHERE id = product_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Add a function to remove an image from a product
CREATE OR REPLACE FUNCTION remove_product_image(
  product_id UUID,
  image_url TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  current_images JSONB;
  new_images JSONB;
BEGIN
  -- Get current images
  SELECT images INTO current_images
  FROM products
  WHERE id = product_id;

  IF current_images IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Remove the specified image URL from the array
  new_images := (
    SELECT jsonb_agg(value)
    FROM jsonb_array_elements(current_images) AS value
    WHERE value::text != ('"' || image_url || '"')::jsonb::text
  );

  -- Update the product
  UPDATE products
  SET images = COALESCE(new_images, '[]'::jsonb),
      updated_at = NOW()
  WHERE id = product_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Add a function to reorder product images
CREATE OR REPLACE FUNCTION reorder_product_images(
  product_id UUID,
  image_urls TEXT[]
)
RETURNS BOOLEAN AS $$
DECLARE
  new_images JSONB;
BEGIN
  -- Convert text array to JSONB array
  SELECT jsonb_agg(value) INTO new_images
  FROM unnest(image_urls) AS value;

  -- Update the product
  UPDATE products
  SET images = COALESCE(new_images, '[]'::jsonb),
      updated_at = NOW()
  WHERE id = product_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create a view for easier querying of products with image counts
CREATE OR REPLACE VIEW products_with_image_count AS
SELECT
  p.*,
  jsonb_array_length(p.images) as image_count,
  CASE
    WHEN jsonb_array_length(p.images) > 0
    THEN p.images->0
    ELSE NULL
  END as primary_image
FROM products p;

-- Grant permissions
GRANT SELECT ON products_with_image_count TO authenticated;
GRANT ALL ON products TO authenticated;
GRANT EXECUTE ON FUNCTION get_product_images(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION add_product_image(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_product_image(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reorder_product_images(UUID, TEXT[]) TO authenticated;
