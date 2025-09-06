-- Verify users table
SELECT * FROM public.users;

-- Verify products table
SELECT * FROM public.products;

-- Verify cart table
SELECT c.*, ci.product_id, ci.quantity, p.name as product_name
FROM public.cart c
LEFT JOIN public.cart_items ci ON c.id = ci.cart_id
LEFT JOIN public.products p ON ci.product_id = p.id;

-- Verify rewards table
SELECT * FROM public.rewards;

-- Verify orders table
SELECT o.*, oi.product_id, oi.quantity, oi.price_at_purchase, p.name as product_name
FROM public.orders o
LEFT JOIN public.order_items oi ON o.id = oi.order_id
LEFT JOIN public.products p ON oi.product_id = p.id;

-- Verify admin function
SELECT public.is_admin();