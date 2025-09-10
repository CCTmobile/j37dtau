-- Migration to support guest orders
-- Add guest customer fields and make user_id nullable

-- Add guest customer fields to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- Make user_id nullable to support guest orders
ALTER TABLE public.orders 
ALTER COLUMN user_id DROP NOT NULL;

-- Add constraint to ensure either user_id or customer_email is provided
ALTER TABLE public.orders 
ADD CONSTRAINT orders_user_or_guest_check 
CHECK (user_id IS NOT NULL OR customer_email IS NOT NULL);

-- Update RLS policy to allow guest orders to be viewed by admin
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (
    (auth.uid() = user_id) OR 
    (user_id IS NULL AND auth.uid() IS NULL) -- Allow guests to view their own orders temporarily
  );

-- Policy for guest order creation
DROP POLICY IF EXISTS "Anyone can create guest orders" ON public.orders;
CREATE POLICY "Anyone can create guest orders" ON public.orders
  FOR INSERT WITH CHECK (
    (auth.uid() = user_id) OR 
    (user_id IS NULL AND customer_email IS NOT NULL)
  );

-- Update order_items policy to handle guest orders
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
    )
  );

-- Policy for guest order items creation
DROP POLICY IF EXISTS "Anyone can create order items for guest orders" ON public.order_items;
CREATE POLICY "Anyone can create order items for guest orders" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
    )
  );
