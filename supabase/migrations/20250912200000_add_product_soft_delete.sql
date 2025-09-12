-- Add soft delete capability to products table
-- Migration: 20250912200000_add_product_soft_delete.sql
-- Description: Adds is_active column to products table for soft delete functionality

-- Add is_active column to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create index for better performance when filtering active products
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);

-- Update the existing policy to only show active products to public
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (is_active = true);

-- Create separate policy for admins to see all products (including inactive)
CREATE POLICY "Admins can view all products" ON public.products
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- Admin management policy remains the same
-- (Existing "Admins can manage products" policy covers INSERT, UPDATE, DELETE)

-- Add helpful comment
COMMENT ON COLUMN public.products.is_active IS 'Boolean flag for soft delete - false means product is deleted but preserved for order history';