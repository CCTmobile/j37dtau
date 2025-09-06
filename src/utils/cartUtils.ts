import { useState } from 'react';
import type { CartItem, Product } from '../App';

export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (product: Product, size: string, color: string, quantity: number) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => 
        item.productId === product.id && item.size === size && item.color === color
      );

      if (existingItem) {
        return prevCart.map(item => 
          item.productId === product.id && item.size === size && item.color === color
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prevCart, { productId: product.id, product, size, color, quantity }];
      }
    });
  };

  const removeFromCart = (productId: string, size: string, color: string) => {
    setCart(prevCart => 
      prevCart.filter(item => 
        !(item.productId === productId && item.size === size && item.color === color)
      )
    );
  };

  const updateCartQuantity = (productId: string, size: string, color: string, quantity: number) => {
    setCart(prevCart => {
      if (quantity <= 0) {
        return prevCart.filter(item => 
          !(item.productId === productId && item.size === size && item.color === color)
        );
      } else {
        return prevCart.map(item => 
          item.productId === productId && item.size === size && item.color === color
            ? { ...item, quantity }
            : item
        );
      }
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotalItems = () => cart.reduce((total, item) => total + item.quantity, 0);
  const getTotalPrice = () => cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);

  return {
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice
  };
};

export const addToCart = (
  cart: CartItem[],
  product: Product,
  size: string,
  color: string,
  quantity: number
): CartItem[] => {
  const existingItem = cart.find(item => 
    item.productId === product.id && item.size === size && item.color === color
  );

  if (existingItem) {
    return cart.map(item => 
      item.productId === product.id && item.size === size && item.color === color
        ? { ...item, quantity: item.quantity + quantity }
        : item
    );
  } else {
    return [...cart, { productId: product.id, product, size, color, quantity }];
  }
};

export const removeFromCart = (
  cart: CartItem[],
  productId: string,
  size: string,
  color: string
): CartItem[] => {
  return cart.filter(item => 
    !(item.productId === productId && item.size === size && item.color === color)
  );
};

export const updateCartQuantity = (
  cart: CartItem[],
  productId: string,
  size: string,
  color: string,
  quantity: number
): CartItem[] => {
  if (quantity <= 0) {
    return removeFromCart(cart, productId, size, color);
  } else {
    return cart.map(item => 
      item.productId === productId && item.size === size && item.color === color
        ? { ...item, quantity }
        : item
    );
  }
};

export const getTotalItems = (cart: CartItem[]): number => {
  return cart.reduce((total, item) => total + item.quantity, 0);
};

export const getTotalPrice = (cart: CartItem[]): number => {
  return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
};