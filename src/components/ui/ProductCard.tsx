import React, { useState, useEffect } from 'react';
import { Star, ShoppingCart, Eye, Heart } from 'lucide-react';
import { getTrustpilotProductRating } from '../../utils/trustpilot';
import { ProductImage } from './responsive-image';
import type { Product } from '../../App';

interface ProductCardProps {
  product: Product;
  layout?: 'compact' | 'enhanced';
  showQuickActions?: boolean;
  onAddToCart?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
  className?: string;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  layout = 'enhanced',
  showQuickActions = true,
  onAddToCart,
  onViewDetails,
  onToggleWishlist,
  className = ''
}) => {
  const [trustpilotRating, setTrustpilotRating] = useState<{
    rating: number;
    reviewCount: number;
    trustScore: number;
  } | null>(null);

  useEffect(() => {
    const loadRating = async () => {
      try {
        const rating = await getTrustpilotProductRating(product.id);
        setTrustpilotRating(rating);
      } catch (error) {
        console.error('Failed to load Trustpilot rating:', error);
      }
    };
    loadRating();
  }, [product.id]);

  const discountPercentage = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart?.(product);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleWishlist?.(product);
  };

  const getColorClass = (color: string) => {
    const colorLower = color.toLowerCase();
    switch (colorLower) {
      case 'black': return 'bg-black border-gray-300';
      case 'white': return 'bg-white border-gray-300';
      case 'gray': case 'grey': return 'bg-gray-400 border-gray-400';
      case 'navy': return 'bg-blue-900 border-blue-900';
      case 'brown': return 'bg-amber-800 border-amber-800';
      case 'beige': return 'bg-[#f5f5dc] border-[#e8e8d0]';
      case 'pink': return 'bg-pink-400 border-pink-400';
      case 'blue': return 'bg-blue-500 border-blue-500';
      case 'red': return 'bg-red-500 border-red-500';
      case 'green': return 'bg-green-500 border-green-500';
      case 'yellow': return 'bg-yellow-400 border-yellow-400';
      case 'purple': return 'bg-purple-500 border-purple-500';
      case 'orange': return 'bg-orange-500 border-orange-500';
      default: return 'bg-gradient-to-br from-purple-400 to-pink-400';
    }
  };

  return (
    <div 
      className={`relative rounded-[1.5rem] overflow-hidden cursor-pointer group bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_48px_rgba(0,0,0,0.12)] transition-all duration-400 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${className}`}
      onClick={() => onViewDetails?.(product)}
      style={{ aspectRatio: '3/4' }}
    >
      {/* Image with zoom effect */}
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#f4f1eb]">
        <ProductImage
          images={product.images}
          name={product.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-105"
        />
      </div>

      {/* Gradient overlay for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none opacity-80" />

      {/* Badges */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
        {discountPercentage > 0 && (
          <span className="bg-white/90 backdrop-blur-md text-[#111] text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shadow-sm">
            Sale
          </span>
        )}
        {!product.inStock && (
          <span className="bg-black/70 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shadow-sm">
            Sold Out
          </span>
        )}
      </div>

      {/* Quick Actions overlay */}
      {showQuickActions && (
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-x-2 group-hover:translate-x-0">
          <button
            onClick={handleToggleWishlist}
            className="bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white hover:text-rose-500 p-2 rounded-full transition-all duration-200"
            aria-label="Add to wishlist"
          >
            <Heart className="h-4 w-4" />
          </button>
          <button
            onClick={handleAddToCart}
            className="bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white hover:text-[#111] p-2 rounded-full transition-all duration-200"
            aria-label="Add to cart"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Product Info - Slides up on hover */}
      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-300 ease-out z-10">
        
        {/* Category & Rating */}
        <div className="flex items-center justify-between mb-1 opacity-80">
          <span className="text-[10px] text-white/90 uppercase tracking-[0.1em] font-semibold">
            {product.category}
          </span>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-[10px] text-white/90 font-medium">
              {trustpilotRating?.rating || product.rating}
            </span>
          </div>
        </div>

        {/* Name */}
        <h3 className="text-white text-[1.1rem] font-bold leading-[1.15] mb-2 drop-shadow-sm tracking-tight line-clamp-2">
          {product.name}
        </h3>

        {/* Price & Colors */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-white font-bold tracking-tight">
              {formatCurrency(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-white/60 text-xs line-through">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>
          
          {/* Swatches */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex -space-x-1">
              {product.colors.slice(0, 3).map((color, idx) => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full border border-white/40 ${getColorClass(color)}`}
                  title={color}
                />
              ))}
              {product.colors.length > 3 && (
                <div className="w-3.5 h-3.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 flex items-center justify-center text-[8px] font-bold text-white">
                  +
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
