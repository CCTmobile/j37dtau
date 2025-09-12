-- Verification Script: BEFORE Migration
-- Run this BEFORE applying the soft delete migration
-- Date: 2025-09-12

-- === VERIFICATION BEFORE SOFT DELETE MIGRATION ===

-- 1. Check current products table structure
SELECT 
    '1. Current products table columns:' as step,
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check existing RLS policies on products table
SELECT 
    '2. Current RLS policies on products table:' as step,
    policyname, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename = 'products'
  AND schemaname = 'public';

-- 3. Count total products
SELECT 
    '3. Total number of products:' as step,
    COUNT(*) as total_products 
FROM public.products;

-- 4. Sample products data (first 3 products)
SELECT 
    '4. Sample products (first 3):' as step,
    id, 
    name, 
    category, 
    price,
    created_at
FROM public.products 
ORDER BY created_at 
LIMIT 3;

-- 5. Check if is_active column already exists (should return 0 rows)
SELECT 
    '5. Check if is_active column exists (should be empty):' as step,
    column_name 
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND table_schema = 'public' 
  AND column_name = 'is_active';

-- 6. Check indexes on products table
SELECT 
    '6. Current indexes on products table:' as step,
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'products' 
  AND schemaname = 'public';

-- === END OF PRE-MIGRATION VERIFICATION ===