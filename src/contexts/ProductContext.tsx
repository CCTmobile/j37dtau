 import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getProducts, getProduct } from '../utils/supabase/client';
import type { Product } from '../App';
import type { Database } from '../utils/supabase/types';

type SupabaseProduct = Database['public']['Tables']['products']['Row'];

type ProductContextType = {
  products: Product[];
  loading: boolean;
  error: string | null;
  fetchProducts: (category?: string) => Promise<void>;
  fetchProduct: (id: string) => Promise<Product | null>;
};

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async (category?: string) => {
    try {
      setLoading(true);
      setError(null);
      const supabaseProducts = await getProducts(category);
      
      // Transform Supabase products to match our Product type
      const transformedProducts: Product[] = supabaseProducts.map((p: SupabaseProduct) => {
        // Handle both old image_url format and new images array format
        let images: string[] = [];

        // First check if new images array exists and has content
        if (p.images && Array.isArray(p.images) && p.images.length > 0) {
          images = (p.images as any[]).filter(img => img && typeof img === 'string' && img.trim() !== '');
        }
        // Fallback to old image_url format
        else if (p.image_url && typeof p.image_url === 'string' && p.image_url.trim() !== '') {
          // If it's a local path, convert to full Supabase Storage URL
          if (p.image_url.startsWith('/images/')) {
            images = [`https://xsgumgcioyaehccvklbr.supabase.co/storage/v1/object/public/product-images${p.image_url}`];
          } else if (p.image_url.startsWith('http')) {
            images = [p.image_url];
          } else {
            // If it's a storage path, construct full URL
            images = [`https://xsgumgcioyaehccvklbr.supabase.co/storage/v1/object/public/product-images/${p.image_url}`];
          }
        }
        // Use placeholder if no images
        else {
          images = ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiByeD0iOCIgZmlsbD0iI2Y5ZmFmYiIgc3Ryb2tlPSIjYWNhYmRhIiBzdHJva2Utd2lkdGg9IjIiLz4KPHRleHQgeD0iMjAwIiB5PSIxNTAiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjIwIiBmaWxsPSIjOTc5N2E3IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+Cjwvc3ZnPgo='];
        }

        return {
          id: p.id,
          name: p.name,
          category: p.category as Product['category'],
          price: p.price,
          images: images,
          sizes: ['S', 'M', 'L'], // Default sizes since not in DB schema
          colors: ['Black', 'White'], // Default colors since not in DB schema
          description: p.description || '',
          reviews: [], // Reviews not implemented yet
          rating: 4.5, // Default rating since not in DB schema
          inStock: true, // Default in stock since not in DB schema
          originalPrice: p.price * 1.2 // Adding a default original price for sale items
        };
      });
      
      setProducts(transformedProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchProduct = async (id: string): Promise<Product | null> => {
    try {
      setLoading(true);
      setError(null);
      const supabaseProduct = await getProduct(id);

      if (!supabaseProduct) return null;

      // Transform Supabase product to match our Product type
      let images: string[] = [];

      // Handle both old image_url format and new images array format
      if (supabaseProduct.images && Array.isArray(supabaseProduct.images) && supabaseProduct.images.length > 0) {
        images = (supabaseProduct.images as any[]).filter(img => img && typeof img === 'string' && img.trim() !== '');
      }
      // Fallback to old image_url format
      else if (supabaseProduct.image_url && typeof supabaseProduct.image_url === 'string' && supabaseProduct.image_url.trim() !== '') {
        // If it's a local path, convert to full Supabase Storage URL
        if (supabaseProduct.image_url.startsWith('/images/')) {
          images = [`https://xsgumgcioyaehccvklbr.supabase.co/storage/v1/object/public/product-images${supabaseProduct.image_url}`];
        } else if (supabaseProduct.image_url.startsWith('http')) {
          images = [supabaseProduct.image_url];
        } else {
          // If it's a storage path, construct full URL
          images = [`https://xsgumgcioyaehccvklbr.supabase.co/storage/v1/object/public/product-images/${supabaseProduct.image_url}`];
        }
      }
      // Use placeholder if no images
      else {
        images = ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiByeD0iOCIgZmlsbD0iI2Y5ZmFmYiIgc3Ryb2tlPSIjYWNhYmRhIiBzdHJva2Utd2lkdGg9IjIiLz4KPHRleHQgeD0iMjAwIiB5PSIxNTAiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjIwIiBmaWxsPSIjOTc5N2E3IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+Cjwvc3ZnPgo='];
      }

      const transformedProduct: Product = {
        id: supabaseProduct.id,
        name: supabaseProduct.name,
        category: supabaseProduct.category as Product['category'],
        price: supabaseProduct.price,
        images: images,
        sizes: ['S', 'M', 'L'], // Default sizes since not in DB schema
        colors: ['Black', 'White'], // Default colors since not in DB schema
        description: supabaseProduct.description || '',
        reviews: [], // Reviews not implemented yet
        rating: 4.5, // Default rating since not in DB schema
        inStock: true, // Default in stock since not in DB schema
        originalPrice: supabaseProduct.price * 1.2 // Adding a default original price for sale items
      };

      return transformedProduct;
    } catch (err) {
      console.error('Error fetching product:', err);
      setError('Failed to load product');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Load products on initial mount
  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <ProductContext.Provider value={{ products, loading, error, fetchProducts, fetchProduct }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};
