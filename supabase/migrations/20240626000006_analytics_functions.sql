-- Analytics Functions for Admin Dashboard
-- These functions provide efficient server-side calculations for dashboard metrics

-- Function to get total revenue from all orders
CREATE OR REPLACE FUNCTION get_total_revenue()
RETURNS DECIMAL(10,2) AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(total_amount) FROM orders),
    0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get total number of orders
CREATE OR REPLACE FUNCTION get_total_orders()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM orders);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get total number of registered users
CREATE OR REPLACE FUNCTION get_total_users()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM users);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get sales data aggregated by month within a date range
CREATE OR REPLACE FUNCTION get_sales_by_period(start_date DATE, end_date DATE)
RETURNS TABLE(month TEXT, sales DECIMAL(10,2), orders_count INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(DATE_TRUNC('month', o.created_at), 'Mon YYYY') as month,
    COALESCE(SUM(o.total_amount), 0) as sales,
    COUNT(o.id) as orders_count
  FROM orders o
  WHERE DATE(o.created_at) >= start_date
    AND DATE(o.created_at) <= end_date
  GROUP BY DATE_TRUNC('month', o.created_at)
  ORDER BY DATE_TRUNC('month', o.created_at);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get category distribution of products
CREATE OR REPLACE FUNCTION get_category_distribution()
RETURNS TABLE(category_name TEXT, product_count INTEGER, percentage DECIMAL(5,2)) AS $$
DECLARE
  total_products INTEGER;
BEGIN
  -- Get total product count
  SELECT COUNT(*) INTO total_products FROM products;

  RETURN QUERY
  SELECT
    p.category as category_name,
    COUNT(p.id) as product_count,
    ROUND((COUNT(p.id)::DECIMAL / NULLIF(total_products, 0) * 100), 2) as percentage
  FROM products p
  GROUP BY p.category
  ORDER BY product_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recent orders with user details
CREATE OR REPLACE FUNCTION get_recent_orders(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  order_id UUID,
  customer_email TEXT,
  customer_name TEXT,
  amount DECIMAL(10,2),
  status TEXT,
  order_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id as order_id,
    u.email as customer_email,
    u.name as customer_name,
    o.total_amount as amount,
    o.status,
    o.created_at as order_date
  FROM orders o
  JOIN users u ON o.user_id = u.id
  ORDER BY o.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get order status distribution
CREATE OR REPLACE FUNCTION get_order_status_distribution()
RETURNS TABLE(status_name TEXT, count INTEGER, percentage DECIMAL(5,2)) AS $$
DECLARE
  total_orders INTEGER;
BEGIN
  -- Get total order count
  SELECT COUNT(*) INTO total_orders FROM orders;

  RETURN QUERY
  SELECT
    o.status as status_name,
    COUNT(o.id) as count,
    ROUND((COUNT(o.id)::DECIMAL / NULLIF(total_orders, 0) * 100), 2) as percentage
  FROM orders o
  GROUP BY o.status
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get revenue growth comparison (current vs previous period)
CREATE OR REPLACE FUNCTION get_revenue_growth(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
  current_period_revenue DECIMAL(10,2),
  previous_period_revenue DECIMAL(10,2),
  growth_percentage DECIMAL(5,2)
) AS $$
DECLARE
  current_revenue DECIMAL(10,2);
  previous_revenue DECIMAL(10,2);
BEGIN
  -- Current period revenue
  SELECT COALESCE(SUM(total_amount), 0) INTO current_revenue
  FROM orders
  WHERE created_at >= NOW() - INTERVAL '1 day' * days_back;

  -- Previous period revenue
  SELECT COALESCE(SUM(total_amount), 0) INTO previous_revenue
  FROM orders
  WHERE created_at >= NOW() - INTERVAL '1 day' * (days_back * 2)
    AND created_at < NOW() - INTERVAL '1 day' * days_back;

  RETURN QUERY
  SELECT
    current_revenue,
    previous_revenue,
    CASE
      WHEN previous_revenue = 0 THEN
        CASE WHEN current_revenue > 0 THEN 100.0 ELSE 0.0 END
      ELSE
        ROUND(((current_revenue - previous_revenue) / previous_revenue * 100), 2)
    END as growth_percentage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
