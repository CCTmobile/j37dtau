-- Test Script: Soft Delete Functionality
-- Run this AFTER migration to test the soft delete functionality
-- Date: 2025-09-12
-- WARNING: This script will modify data - use on test data only!

-- === TESTING SOFT DELETE FUNCTIONALITY ===

-- 1. Create a test product for testing (if needed)
INSERT INTO public.products (
    name, 
    description, 
    price, 
    category,
    is_active
) VALUES (
    'TEST PRODUCT - Soft Delete Test',
    'This is a test product for verifying soft delete functionality',
    29.99,
    'Casual',
    true
) 
ON CONFLICT DO NOTHING
RETURNING id, name, is_active;

-- 2. Get the test product ID for further testing
SELECT 
    '2. Finding test product:' as step,
    id, 
    name, 
    is_active,
    created_at
FROM public.products 
WHERE name LIKE '%TEST PRODUCT%'
LIMIT 1;

-- 3. Count active products before soft delete
SELECT 
    '3. Count active products before soft delete:' as step,
    COUNT(*) as active_products 
FROM public.products 
WHERE is_active = true;

-- 4. Perform soft delete on test product
UPDATE public.products 
SET is_active = false 
WHERE name LIKE '%TEST PRODUCT%'
RETURNING id, name, is_active;

-- 5. Count active products after soft delete
SELECT 
    '5. Count active products after soft delete:' as step,
    COUNT(*) as active_products 
FROM public.products 
WHERE is_active = true;

-- 6. Verify admin can still see soft deleted product
SELECT 
    '6. Admin view - should see soft deleted product:' as step,
    id,
    name, 
    is_active 
FROM public.products 
WHERE name LIKE '%TEST PRODUCT%';

-- 7. Test restoration (un-delete)
UPDATE public.products 
SET is_active = true 
WHERE name LIKE '%TEST PRODUCT%'
RETURNING id, name, is_active;

-- 8. Verify restored product counts
SELECT 
    '8. Count after restoration:' as step,
    COUNT(*) as active_products 
FROM public.products 
WHERE is_active = true;

-- 9. Clean up test product
DELETE FROM public.products 
WHERE name LIKE '%TEST PRODUCT%'
RETURNING id, name;

-- === SOFT DELETE FUNCTIONALITY TEST COMPLETE ===
-- Expected Results:
-- - Step 4: Should set is_active = false
-- - Step 5: Active count should decrease by 1
-- - Step 6: Admin should see test product with is_active = false
-- - Step 8: Active count should return to original after restoration