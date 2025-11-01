 import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getProducts, getAllProducts, getProduct, supabase } from '../utils/supabase/client';
import type { Product } from '../App';
import type { Database } from '../utils/supabase/types';

type SupabaseProduct = Database['public']['Tables']['products']['Row'];

type ProductContextType = {
  products: Product[];
  loading: boolean;
  error: string | null;
  fetchProducts: (category?: string) => Promise<void>;
  fetchAllProducts: (category?: string) => Promise<void>; // Admin function to get all products
  fetchProduct: (id: string) => Promise<Product | null>;
};

const ProductContext = createContext<ProductContextType | undefined>(undefined);

// BANDWIDTH OPTIMIZATION: Cache image URLs to prevent regenerating on every render
const imageUrlCache = new Map<string, string>();

// Helper function to get or generate Supabase Storage URL with caching
const getCachedImageUrl = (imagePath: string): string => {
  // Return cached URL if available
  if (imageUrlCache.has(imagePath)) {
    return imageUrlCache.get(imagePath)!;
  }

  // Generate new URL and cache it
  const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
  const publicUrl = supabase.storage
    .from('product-images')
    .getPublicUrl(cleanPath).data.publicUrl;
  
  imageUrlCache.set(imagePath, publicUrl);
  return publicUrl;
};

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
          images = (p.images as any[])
            .filter(img => img && typeof img === 'string' && img.trim() !== '')
            .map(imgPath => {
              // If already a full URL, use as-is
              if (imgPath.startsWith('http')) {
                return imgPath;
              }
              // Use cached URL helper to prevent redundant URL generation
              return getCachedImageUrl(imgPath);
            });
        }
        // Fallback to old image_url format
        else if (p.image_url && typeof p.image_url === 'string' && p.image_url.trim() !== '') {
          const imgPath = p.image_url;
          
          // If it's already a full URL, use as-is
          if (imgPath.startsWith('http')) {
            images = [imgPath];
          } else {
            // Use cached URL helper to prevent redundant URL generation
            images = [getCachedImageUrl(imgPath)];
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
          originalPrice: p.original_price || undefined, // Use actual original_price from database
          images: images,
          sizes: p.sizes || ['S', 'M', 'L'], // Use database sizes or default
          colors: p.colors || ['Black', 'White'], // Use database colors or default
          description: p.description || '',
          reviews: [], // Reviews not implemented yet
          rating: 4.5, // Default rating since not in DB schema
          inStock: p.in_stock ?? true // Use database in_stock value or default to true
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

  // Admin function to fetch ALL products including inactive ones
  const fetchAllProducts = async (category?: string) => {
    try {
      setLoading(true);
      setError(null);
      const supabaseProducts = await getAllProducts(category);
      
      // Transform Supabase products to match our Product type (same logic as fetchProducts)
      const transformedProducts: Product[] = supabaseProducts.map((p: SupabaseProduct) => {
        // Handle both old image_url format and new images array format
        let images: string[] = [];

        // First check if new images array exists and has content
        if (p.images && Array.isArray(p.images) && p.images.length > 0) {
          images = (p.images as any[])
            .filter(img => img && typeof img === 'string' && img.trim() !== '')
            .map(imgPath => {
              // If already a full URL, use as-is
              if (imgPath.startsWith('http')) {
                return imgPath;
              }
              // Use cached URL helper to prevent redundant URL generation
              return getCachedImageUrl(imgPath);
            });
        }
        // Fallback to old image_url format
        else if (p.image_url && typeof p.image_url === 'string' && p.image_url.trim() !== '') {
          const imgPath = p.image_url;
          
          // If it's already a full URL, use as-is
          if (imgPath.startsWith('http')) {
            images = [imgPath];
          } else {
            // Use cached URL helper to prevent redundant URL generation
            images = [getCachedImageUrl(imgPath)];
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
          originalPrice: p.original_price || undefined, // Use actual original_price from database
          images: images,
          sizes: p.sizes || ['S', 'M', 'L'], // Use database sizes or default
          colors: p.colors || ['Black', 'White'], // Use database colors or default
          description: p.description || '',
          reviews: [], // Reviews not implemented yet
          rating: 4.5, // Default rating since not in DB schema
          inStock: p.in_stock ?? true // Use database in_stock value or default to true
        };
      });
      
      setProducts(transformedProducts);
    } catch (err) {
      console.error('Error fetching all products:', err);
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
        images = (supabaseProduct.images as any[])
          .filter(img => img && typeof img === 'string' && img.trim() !== '')
          .map(imgPath => {
            // If already a full URL, use as-is
            if (imgPath.startsWith('http')) {
              return imgPath;
            }
            // Use cached URL helper to prevent redundant URL generation
            return getCachedImageUrl(imgPath);
          });
      }
      // Fallback to old image_url format
      else if (supabaseProduct.image_url && typeof supabaseProduct.image_url === 'string' && supabaseProduct.image_url.trim() !== '') {
        const imgPath = supabaseProduct.image_url;
        
        // If it's already a full URL, use as-is
        if (imgPath.startsWith('http')) {
          images = [imgPath];
        } else {
          // Use cached URL helper to prevent redundant URL generation
          images = [getCachedImageUrl(imgPath)];
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
        sizes: supabaseProduct.sizes || ['S', 'M', 'L'], // Use database sizes or default
        colors: supabaseProduct.colors || ['Black', 'White'], // Use database colors or default
        description: supabaseProduct.description || '',
        reviews: [], // Reviews not implemented yet
        rating: 4.5, // Default rating since not in DB schema
        inStock: supabaseProduct.in_stock ?? true, // Use database in_stock value or default to true
        originalPrice: supabaseProduct.original_price || undefined // Use actual original_price from database
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
    <ProductContext.Provider value={{ products, loading, error, fetchProducts, fetchAllProducts, fetchProduct }}>
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
