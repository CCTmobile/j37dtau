-- Function to calculate order total from order items
CREATE OR REPLACE FUNCTION public.calculate_order_total(order_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  total DECIMAL(10, 2);
BEGIN
  SELECT COALESCE(SUM(price_at_purchase * quantity), 0) INTO total
  FROM public.order_items
  WHERE order_items.order_id = calculate_order_total.order_id;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update order total when order items change
CREATE OR REPLACE FUNCTION public.update_order_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.orders
  SET total_amount = public.calculate_order_total(orders.id)
  WHERE orders.id = COALESCE(NEW.order_id, OLD.order_id);
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update order total when order items are added, updated, or deleted
DROP TRIGGER IF EXISTS update_order_total_on_item_change ON public.order_items;
CREATE TRIGGER update_order_total_on_item_change
  AFTER INSERT OR UPDATE OR DELETE ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_order_total();

-- Function to add reward points after order completion
CREATE OR REPLACE FUNCTION public.add_reward_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Only add points when order status changes to 'delivered'
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    -- Add 1 point for every $10 spent, rounded down
    UPDATE public.rewards
    SET points = points + FLOOR(NEW.total_amount / 10)
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to add reward points when order is delivered
DROP TRIGGER IF EXISTS add_reward_points_on_delivery ON public.orders;
CREATE TRIGGER add_reward_points_on_delivery
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.add_reward_points();

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ) OR auth.jwt()->>'email' = 'tynoedev@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;