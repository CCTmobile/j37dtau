import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUserCart, addToCart as addToCartSupabase, updateCartItemQuantity } from '../utils/supabase/client';
import { useAuth } from './AuthContext';
import type { CartItem, Product } from '../App';

type CartContextType = {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  addItem: (product: Product, size: string, color: string, quantity: number) => Promise<boolean>;
  removeItem: (cartItemId: string) => Promise<boolean>;
  updateItemQuantity: (cartItemId: string, quantity: number) => Promise<boolean>;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  isGuestCart: boolean;
  mergeGuestCartOnLogin: () => Promise<void>;
  fetchCart: () => Promise<void>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Local storage key for guest cart
  const GUEST_CART_KEY = 'rosemama_guest_cart';

  // Check if this is a guest cart (no authenticated user)
  const isGuestCart = !user;

  // Load guest cart from localStorage
  const loadGuestCart = () => {
    try {
      const savedCart = localStorage.getItem(GUEST_CART_KEY);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setItems(parsedCart);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Error loading guest cart:', error);
      setItems([]);
    }
  };

  // Save guest cart to localStorage
  const saveGuestCart = (cartItems: CartItem[]) => {
    try {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error('Error saving guest cart:', error);
    }
  };

  // Merge guest cart with user's cart when they log in
  const mergeGuestCartOnLogin = async () => {
    if (user && items.length > 0) {
      try {
        // Add each guest cart item to the user's Supabase cart
        for (const item of items) {
          await addToCartSupabase(item.productId, item.size, item.color, item.quantity);
        }
        // Clear guest cart after successful merge
        localStorage.removeItem(GUEST_CART_KEY);
        // Fetch the updated user cart
        await fetchCart();
      } catch (error) {
        console.error('Error merging guest cart:', error);
      }
    }
  };

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const userCart = await getUserCart();
      
      if (!userCart) {
        setItems([]);
        return;
      }
      
      // Transform Supabase cart items to match our CartItem type
      const transformedCartItems: CartItem[] = userCart.items.map((item: any) => ({
        productId: item.products.id,
        product: {
          id: item.products.id,
          name: item.products.name,
          category: item.products.category as Product['category'],
          price: item.products.price,
          images: item.products.image_url ? [item.products.image_url] : [],
          sizes: ['S', 'M', 'L'], // Default sizes
          colors: ['Black', 'White'], // Default colors
          description: '',
          reviews: [],
          rating: 4.5,
          inStock: true
        },
        size: item.size || 'M', // Use actual size from DB or default
        color: item.color || 'Black', // Use actual color from DB or default
        quantity: item.quantity
      }));
      
      setItems(transformedCartItems);
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (product: Product, size: string, color: string, quantity: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      if (isGuestCart) {
        // Handle guest cart - store locally
        const newItem: CartItem = {
          productId: product.id,
          product,
          size,
          color,
          quantity
        };

        const updatedItems = [...items];
        const existingItemIndex = updatedItems.findIndex(
          item => item.productId === product.id && item.size === size && item.color === color
        );

        if (existingItemIndex >= 0) {
          // Update existing item quantity
          updatedItems[existingItemIndex].quantity += quantity;
        } else {
          // Add new item
          updatedItems.push(newItem);
        }

        setItems(updatedItems);
        saveGuestCart(updatedItems);
        return true;
      } else {
        // Handle authenticated user - use Supabase
        const success = await addToCartSupabase(product.id, size, color, quantity);
        
        if (success) {
          await fetchCart(); // Refresh cart after adding item
        }
        
        return success;
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      setError('Failed to add item to cart');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (cartItemId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      if (isGuestCart) {
        // Handle guest cart - remove from local storage
        const updatedItems = items.filter(item => item.productId !== cartItemId);
        setItems(updatedItems);
        saveGuestCart(updatedItems);
        return true;
      } else {
        // Handle authenticated user - use Supabase
        const success = await updateCartItemQuantity(cartItemId, 0); // Setting quantity to 0 removes the item
        
        if (success) {
          await fetchCart(); // Refresh cart after removing item
        }
        
        return success;
      }
    } catch (err) {
      console.error('Error removing from cart:', err);
      setError('Failed to remove item from cart');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateItemQuantity = async (cartItemId: string, quantity: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      if (isGuestCart) {
        // Handle guest cart - update in local storage
        const updatedItems = items.map(item => 
          item.productId === cartItemId ? { ...item, quantity } : item
        );
        setItems(updatedItems);
        saveGuestCart(updatedItems);
        return true;
      } else {
        // Handle authenticated user - use Supabase
        const success = await updateCartItemQuantity(cartItemId, quantity);
        
        if (success) {
          await fetchCart(); // Refresh cart after updating quantity
        }
        
        return success;
      }
    } catch (err) {
      console.error('Error updating cart quantity:', err);
      setError('Failed to update cart');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getTotalItems = (): number => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = (): number => {
    return items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  // Load cart on initial mount
  useEffect(() => {
    const loadCart = async () => {
      if (user) {
        // Load authenticated user's cart from Supabase
        await fetchCart();
      } else {
        // Load guest cart from localStorage
        loadGuestCart();
        setLoading(false);
      }
    };

    loadCart();
  }, [user]);

  // Merge guest cart when user logs in
  useEffect(() => {
    if (user && items.length > 0) {
      // Only merge if we have items in a guest cart
      const hasGuestItems = localStorage.getItem(GUEST_CART_KEY);
      if (hasGuestItems) {
        mergeGuestCartOnLogin();
      }
    }
  }, [user]);

  return (
    <CartContext.Provider value={{
      items,
      loading,
      error,
      addItem,
      removeItem,
      updateItemQuantity,
      getTotalItems,
      getTotalPrice,
      isGuestCart,
      mergeGuestCartOnLogin,
      fetchCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};