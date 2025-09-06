import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUserCart, addToCart as addToCartSupabase, updateCartItemQuantity } from '../utils/supabase/client';
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
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        size: 'M', // Default size since not in DB schema
        color: 'Black', // Default color since not in DB schema
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
      const success = await addToCartSupabase(product.id, quantity);
      
      if (success) {
        await fetchCart(); // Refresh cart after adding item
      }
      
      return success;
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
      const success = await updateCartItemQuantity(cartItemId, 0); // Setting quantity to 0 removes the item
      
      if (success) {
        await fetchCart(); // Refresh cart after removing item
      }
      
      return success;
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
      const success = await updateCartItemQuantity(cartItemId, quantity);
      
      if (success) {
        await fetchCart(); // Refresh cart after updating quantity
      }
      
      return success;
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
    fetchCart();
  }, []);

  return (
    <CartContext.Provider value={{
      items,
      loading,
      error,
      addItem,
      removeItem,
      updateItemQuantity,
      getTotalItems,
      getTotalPrice
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