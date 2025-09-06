-- Verify Users Table
SELECT id, email, name, role FROM users;

-- Verify Products Table
SELECT id, name, category, price, image_url FROM products;

-- Verify Cart and Cart Items
SELECT c.id as cart_id, c.user_id, ci.product_id, ci.quantity, p.name as product_name, p.price
FROM cart c
LEFT JOIN cart_items ci ON c.id = ci.cart_id
LEFT JOIN products p ON ci.product_id = p.id;

-- Verify Rewards
SELECT id, user_id, points FROM rewards;

-- Verify Orders and Order Items
SELECT o.id as order_id, o.user_id, o.status, o.total_amount, 
       oi.product_id, oi.quantity, oi.price_at_purchase, p.name as product_name
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id;

-- Test is_admin function
SELECT is_admin();

-- Set auth.uid() to an admin user to test is_admin function
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "00000000-0000-0000-0000-000000000000"}';
SELECT is_admin();