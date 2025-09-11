-- Add size and color columns to cart_items and order_items tables
-- This migration adds support for product variants in the cart and orders

-- Add size and color columns to cart_items
ALTER TABLE public.cart_items 
ADD COLUMN IF NOT EXISTS size TEXT,
ADD COLUMN IF NOT EXISTS color TEXT;

-- Add size and color columns to order_items
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS size TEXT,
ADD COLUMN IF NOT EXISTS color TEXT;

-- Update the existing cart items policy to handle the new columns
-- No changes needed to RLS policies as they only check cart ownership

-- Create a unique constraint to prevent duplicate items with same product, size, and color in same cart
DROP INDEX IF EXISTS cart_items_unique_variant;
CREATE UNIQUE INDEX cart_items_unique_variant 
ON public.cart_items (cart_id, product_id, size, color);

-- Update the create_order_from_cart function to handle size and color
CREATE OR REPLACE FUNCTION public.create_order_from_cart(
  p_user_id UUID,
  p_shipping_address JSONB
)
RETURNS UUID AS $$
DECLARE
  v_cart_id UUID;
  v_order_id UUID;
  v_cart_item RECORD;
  v_product RECORD;
BEGIN
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Get user's cart
  SELECT id INTO v_cart_id FROM public.cart WHERE user_id = p_user_id;
  IF v_cart_id IS NULL THEN
    RAISE EXCEPTION 'Cart not found';
  END IF;
  
  -- Check if cart has items
  IF NOT EXISTS (SELECT 1 FROM public.cart_items WHERE cart_id = v_cart_id) THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;
  
  -- Create new order
  INSERT INTO public.orders (user_id, status, total_amount, shipping_address)
  VALUES (p_user_id, 'pending', 0, p_shipping_address)
  RETURNING id INTO v_order_id;
  
  -- Copy cart items to order items (including size and color)
  FOR v_cart_item IN 
    SELECT ci.product_id, ci.quantity, ci.size, ci.color, p.price 
    FROM public.cart_items ci
    JOIN public.products p ON ci.product_id = p.id
    WHERE ci.cart_id = v_cart_id
  LOOP
    INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase, size, color)
    VALUES (v_order_id, v_cart_item.product_id, v_cart_item.quantity, v_cart_item.price, v_cart_item.size, v_cart_item.color);
  END LOOP;
  
  -- Clear the cart
  DELETE FROM public.cart_items WHERE cart_id = v_cart_id;
  
  -- The order total will be automatically calculated by the update_order_total trigger
  
  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
