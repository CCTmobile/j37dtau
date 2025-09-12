-- Verification Script: AFTER Migration
-- Run this AFTER applying the soft delete migration
-- Date: 2025-09-12

-- === VERIFICATION AFTER SOFT DELETE MIGRATION ===

-- 1. Verify is_active column was added successfully
SELECT 
    '1. Verify is_active column exists:' as step,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND table_schema = 'public' 
  AND column_name = 'is_active';

-- 2. Check all products have is_active = true (default value)
SELECT 
    '2. Verify all products have is_active = true:' as step,
    COUNT(*) as total_products,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_products,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_products,
    COUNT(CASE WHEN is_active IS NULL THEN 1 END) as null_values
FROM public.products;

-- 3. Sample products with is_active column
SELECT 
    '3. Sample products showing is_active column:' as step,
    id, 
    name, 
    category, 
    is_active,
    created_at
FROM public.products 
ORDER BY created_at 
LIMIT 5;

-- 4. Verify new index was created
SELECT 
    '4. Verify is_active index was created:' as step,
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'products' 
  AND schemaname = 'public'
  AND indexname = 'idx_products_is_active';

-- 5. Check updated RLS policies
SELECT 
    '5. Updated RLS policies on products table:' as step,
    policyname, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename = 'products'
  AND schemaname = 'public'
ORDER BY policyname;

-- 6. Verify comment was added to column
SELECT 
    '6. Verify column comment:' as step,
    col_description(c.oid, a.attnum) as column_comment
FROM pg_class c
JOIN pg_attribute a ON a.attrelid = c.oid
WHERE c.relname = 'products'
  AND a.attname = 'is_active'
  AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- === END OF POST-MIGRATION VERIFICATION ===