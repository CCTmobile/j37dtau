import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

type SupabaseProduct = Database['public']['Tables']['products']['Row'];

// Initialize the Supabase client
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check your .env file.');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper function to check if a user is an admin
export const isAdmin = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('is_admin');
    if (error) throw error;
    return data || false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Helper function to get current user
export const getCurrentUser = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
};

// Helper function to get products
export const getProducts = async (category?: string) => {
  try {
    let query = supabase
      .from('products')
      .select('*');
    
    if (category && category !== 'All') {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

// Helper function to get a single product
export const getProduct = async (productId: string): Promise<SupabaseProduct | null> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
};

// Helper function to get user's cart
export const getUserCart = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Get the user's cart
    const { data: cart, error: cartError } = await supabase
      .from('cart')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (cartError) throw cartError;

    // Get the cart items with product details
    const { data: cartItems, error: itemsError } = await supabase
      .from('cart_items')
      .select(`
        id,
        quantity,
        products (id, name, price, image_url, category)
      `)
      .eq('cart_id', (cart as { id: string }).id);
    
    if (itemsError) throw itemsError;

    return {
      ...(cart as any),
      items: cartItems || []
    };
  } catch (error) {
    console.error('Error fetching user cart:', error);
    return null;
  }
};

// Helper function to add item to cart
export const addToCart = async (productId: string, quantity: number = 1) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get the user's cart
    const { data: cart, error: cartError } = await supabase
      .from('cart')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (cartError) throw cartError;

    // Check if item already exists in cart
    const { data: existingItem, error: checkError } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', (cart as { id: string }).id)
      .eq('product_id', productId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is the error code for no rows returned
      throw checkError;
    }

    if (existingItem) {
      // Update existing item quantity
      const { error: updateError } = await (supabase
        .from('cart_items') as any)
        .update({ quantity: (existingItem as { id: string; quantity: number }).quantity + quantity })
        .eq('id', (existingItem as { id: string; quantity: number }).id);

      if (updateError) throw updateError;
    } else {
      // Add new item to cart
      const { error: insertError } = await (supabase
        .from('cart_items') as any)
        .insert({
          cart_id: (cart as { id: string }).id,
          product_id: productId,
          quantity
        });

      if (insertError) throw insertError;
    }

    return true;
  } catch (error) {
    console.error('Error adding to cart:', error);
    return false;
  }
};

// Helper function to update cart item quantity
export const updateCartItemQuantity = async (cartItemId: string, quantity: number) => {
  try {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);
      
      if (error) throw error;
    } else {
      // Update quantity
      const { error } = await (supabase
        .from('cart_items') as any)
        .update({ quantity })
        .eq('id', cartItemId);

      if (error) throw error;
    }

    return true;
  } catch (error) {
    console.error('Error updating cart item:', error);
    return false;
  }
};

// Helper function to create an order from cart
export const createOrderFromCart = async (shippingAddress: any) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get the user's cart with items
    const cart = await getUserCart();
    if (!cart || !cart.items || cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    // Start a transaction using RPC
    const { data: orderId, error: orderError } = await (supabase.rpc as any)('create_order_from_cart', {
      p_user_id: user.id,
      p_shipping_address: shippingAddress
    });

    if (orderError) throw orderError;
    return orderId;
  } catch (error) {
    console.error('Error creating order:', error);
    return null;
  }
};

// Helper function to create order for guest users or cart items
export const createGuestOrder = async (
  cartItems: any[], 
  shippingAddress: any, 
  customerInfo: { email: string; firstName: string; lastName: string; phone: string },
  createAccount: boolean = false,
  password?: string
) => {
  try {
    let userId = null;

    // If user wants to create account, sign them up first
    if (createAccount && password) {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: customerInfo.email,
        password: password,
        options: {
          data: {
            name: `${customerInfo.firstName} ${customerInfo.lastName}`,
            phone: customerInfo.phone
          }
        }
      });

      if (authError) {
        console.warn('Account creation failed, proceeding as guest:', authError);
      } else {
        userId = authData.user?.id;
      }
    }

    // Create order directly in the orders table
    const orderData = {
      user_id: userId, // null for guest orders
      status: 'pending',
      total_amount: cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0),
      shipping_address: shippingAddress,
      customer_email: customerInfo.email,
      customer_name: `${customerInfo.firstName} ${customerInfo.lastName}`,
      customer_phone: customerInfo.phone
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData as any) // Type assertion to bypass strict typing
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = cartItems.map(item => ({
      order_id: (order as any).id,
      product_id: item.productId,
      quantity: item.quantity,
      price_at_purchase: item.product.price
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems as any); // Type assertion to bypass strict typing

    if (itemsError) throw itemsError;

    return (order as any).id;
  } catch (error) {
    console.error('Error creating guest order:', error);
    return null;
  }
};

// Helper function to get user's orders
export const getUserOrders = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        total_amount,
        shipping_address,
        created_at,
        order_items (id, product_id, quantity, price_at_purchase, products (id, name, image_url))
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return [];
  }
};

// Helper function to get user's rewards
export const getUserRewards = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user rewards:', error);
    return null;
  }
};

// Admin helper functions

// Helper function to get all orders (admin only)
export const getAllOrders = async () => {
  try {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        users (id, email, name),
        status,
        total_amount,
        shipping_address,
        created_at,
        order_items (id, product_id, quantity, price_at_purchase, products (id, name, image_url))
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching all orders:', error);
    return [];
  }
};

// Helper function to update order status (admin only)
export const updateOrderStatus = async (orderId: string, status: string) => {
  try {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) throw new Error('Unauthorized');

    const { error } = await (supabase
      .from('orders') as any)
      .update({ status })
      .eq('id', orderId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating order status:', error);
    return false;
  }
};

// Helper function to get all users (admin only)
export const getAllUsers = async () => {
  try {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching all users:', error);
    return [];
  }
};

// Helper function to update user role (admin only)
// Note: Temporarily disabled due to TypeScript enum type issues
// TODO: Regenerate Supabase types to fix enum type resolution
/*
export const updateUserRole = async (userId: string, role: Database['public']['Enums']['user_role']) => {
  try {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) throw new Error('Unauthorized');

    const { error } = await supabase
      .from('users')
      .update({ role } as any)
      .eq('id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating user role:', error);
    return false;
  }
};
*/

// Helper function to create a product (admin only)
export const createProduct = async (product: any) => {
  try {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('products')
      .insert(product as any)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating product:', error);
    return null;
  }
};

// Helper function to get product images
export const getProductImages = async (productId: string) => {
  try {
    const { data, error } = await (supabase.rpc as any)('get_product_images', {
      product_id: productId
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching product images:', error);
    return [];
  }
};

// Helper function to add image to product
export const addProductImage = async (productId: string, imageUrl: string, order?: number) => {
  try {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) throw new Error('Unauthorized');

    const { data, error } = await (supabase.rpc as any)('add_product_image', {
      product_id: productId,
      image_url: imageUrl,
      image_order: order
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding product image:', error);
    return false;
  }
};

// Helper function to remove image from product
export const removeProductImage = async (productId: string, imageUrl: string) => {
  try {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) throw new Error('Unauthorized');

    const { data, error } = await (supabase.rpc as any)('remove_product_image', {
      product_id: productId,
      image_url: imageUrl
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error removing product image:', error);
    return false;
  }
};

// Helper function to reorder product images
export const reorderProductImages = async (productId: string, imageUrls: string[]) => {
  try {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) throw new Error('Unauthorized');

    const { data, error } = await (supabase.rpc as any)('reorder_product_images', {
      product_id: productId,
      image_urls: imageUrls
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error reordering product images:', error);
    return false;
  }
};

// Helper function to update a product (admin only)
export const updateProduct = async (productId: string, updates: any) => {
  try {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) throw new Error('Unauthorized');

    const { data, error } = await (supabase
      .from('products') as any)
      .update(updates)
      .eq('id', productId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating product:', error);
    return null;
  }
};

// Helper function to delete a product (admin only)
export const deleteProduct = async (productId: string) => {
  try {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) throw new Error('Unauthorized');

    // First get the product to access its images
    const product = await getProduct(productId) as { images?: string[] } | null;
    if (!product) throw new Error('Product not found');

    // Delete associated images from storage
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      const deletePromises = product.images.map(async (imageUrl: string) => {
        try {
          // Import the ImageUploadService dynamically to avoid circular imports
          const { default: ImageUploadService } = await import('../imageUpload');
          await ImageUploadService.deleteImage(imageUrl);
        } catch (error) {
          console.warn(`Failed to delete image ${imageUrl}:`, error);
          // Continue with other images even if one fails
        }
      });
      await Promise.all(deletePromises);
    }

    // Delete the product from database
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    return false;
  }
};

// Helper function to update user profile
export const updateUserProfile = async (userId: string, updates: { name?: string; phone?: string; email?: string }) => {
  try {
    const { data, error } = await (supabase
      .from('users') as any)
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
};

// Helper function to update user password
export const updateUserPassword = async (newPassword: string) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    } as any);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user password:', error);
    return null;
  }
};

// Helper function to get user's notification preferences
export const getUserNotificationPreferences = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user notification preferences:', error);
    return null;
  }
};

// Helper function to create or update notification preferences
export const upsertNotificationPreferences = async (preferences: {
  email_notifications?: boolean;
  push_notifications?: boolean;
  system_alerts?: boolean;
  order_alerts?: boolean;
  security_alerts?: boolean;
}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await (supabase
      .from('notification_preferences') as any)
      .upsert({
        user_id: user.id,
        ...preferences
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error upserting notification preferences:', error);
    return null;
  }
};

// Helper function to update specific notification preference
export const updateNotificationPreference = async (
  preferenceType: 'email_notifications' | 'push_notifications' | 'system_alerts' | 'order_alerts' | 'security_alerts',
  enabled: boolean
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await (supabase
      .from('notification_preferences') as any)
      .upsert({
        user_id: user.id,
        [preferenceType]: enabled
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating notification preference:', error);
    return null;
  }
};

// Helper function to create default notification preferences for a user
export const createDefaultNotificationPreferences = async (userId: string) => {
  try {
    const { data, error } = await (supabase
      .from('notification_preferences') as any)
      .insert({
        user_id: userId,
        email_notifications: true,
        push_notifications: true,
        system_alerts: true,
        order_alerts: true,
        security_alerts: true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating default notification preferences:', error);
    return null;
  }
};

// Analytics Functions for Admin Dashboard

// Helper function to get total revenue
export const getTotalRevenue = async () => {
  try {
    // Temporary workaround: use direct query instead of RPC
    const { data, error } = await supabase
      .from('orders')
      .select('total_amount');

    if (error) throw error;

    const total = (data as any)?.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0) || 0;
    return total;
  } catch (error) {
    console.error('Error fetching total revenue:', error);
    return 0;
  }
};

// Helper function to get total orders count
export const getTotalOrders = async () => {
  try {
    // Temporary workaround: use direct query instead of RPC
    const { count, error } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error fetching total orders:', error);
    return 0;
  }
};

// Helper function to get total users count
export const getTotalUsers = async () => {
  try {
    // Temporary workaround: use direct query instead of RPC
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error fetching total users:', error);
    return 0;
  }
};

// Helper function to get sales data by date range
export const getSalesData = async (startDate: string, endDate: string) => {
  try {
    // Use direct query instead of RPC to avoid type issues
    const { data, error } = await supabase
      .from('orders')
      .select(`
        created_at,
        total_amount
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (error) throw error;

    // Aggregate data by month
    const monthlyData: Record<string, { sales: number; orders: number }> = {};
    (data || []).forEach((order: any) => {
      const month = new Date(order.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short'
      });

      if (!monthlyData[month]) {
        monthlyData[month] = { sales: 0, orders: 0 };
      }

      monthlyData[month].sales += order.total_amount;
      monthlyData[month].orders += 1;
    });

    // Convert to array format
    const result = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      sales: data.sales,
      orders_count: data.orders
    }));

    return result;
  } catch (error) {
    console.error('Error fetching sales data:', error);
    return [];
  }
};

// Helper function to get category distribution
export const getCategoryDistribution = async () => {
  try {
    // Use direct query instead of RPC to avoid type issues
    const { data, error } = await supabase
      .from('products')
      .select('category');

    if (error) throw error;

    // Count products by category
    const categoryCounts: Record<string, number> = {};
    (data || []).forEach((product: any) => {
      const category = product.category || 'Uncategorized';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    // Calculate total products
    const totalProducts = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);

    // Convert to array format with percentages
    const result = Object.entries(categoryCounts).map(([category, count]) => ({
      category_name: category,
      product_count: count,
      percentage: Math.round((count / totalProducts) * 100 * 100) / 100
    }));

    return result;
  } catch (error) {
    console.error('Error fetching category distribution:', error);
    return [];
  }
};

// Helper function to get recent orders
export const getRecentOrders = async (limit: number = 10) => {
  try {
    // Temporary workaround: use direct query instead of RPC
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        total_amount,
        status,
        created_at,
        users!inner (
          email,
          name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Transform data to match expected format
    const transformedData = (data as any)?.map((order: any) => ({
      order_id: order.id,
      customer_email: order.users?.email || 'N/A',
      customer_name: order.users?.name || 'N/A',
      amount: order.total_amount,
      status: order.status,
      order_date: order.created_at
    })) || [];

    return transformedData;
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    return [];
  }
};

// Helper function to get order status distribution
export const getOrderStatusDistribution = async () => {
  try {
    const { data, error } = await supabase.rpc('get_order_status_distribution');
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching order status distribution:', error);
    return [];
  }
};

// Helper function to get revenue growth
export const getRevenueGrowth = async (daysBack: number = 30) => {
  try {
    // Temporary workaround: calculate growth using direct queries
    const now = new Date();
    const currentPeriodStart = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
    const previousPeriodStart = new Date(now.getTime() - (daysBack * 2 * 24 * 60 * 60 * 1000));
    const previousPeriodEnd = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

    // Current period revenue
    const { data: currentData, error: currentError } = await supabase
      .from('orders')
      .select('total_amount')
      .gte('created_at', currentPeriodStart.toISOString());

    if (currentError) throw currentError;

    const currentRevenue = (currentData as any)?.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0) || 0;

    // Previous period revenue
    const { data: previousData, error: previousError } = await supabase
      .from('orders')
      .select('total_amount')
      .gte('created_at', previousPeriodStart.toISOString())
      .lt('created_at', previousPeriodEnd.toISOString());

    if (previousError) throw previousError;

    const previousRevenue = (previousData as any)?.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0) || 0;

    // Calculate growth percentage
    const growthPercentage = previousRevenue === 0
      ? (currentRevenue > 0 ? 100 : 0)
      : Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100 * 100) / 100;

    return {
      current_period_revenue: currentRevenue,
      previous_period_revenue: previousRevenue,
      growth_percentage: growthPercentage
    };
  } catch (error) {
    console.error('Error fetching revenue growth:', error);
    return { current_period_revenue: 0, previous_period_revenue: 0, growth_percentage: 0 };
  }
};
