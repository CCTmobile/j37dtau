import React, { useState, useEffect } from 'react';
import { Star, ShoppingBag, Heart } from 'lucide-react';
import { getTrustpilotProductRating } from '../../utils/trustpilot';
import type { Product } from '../../App';

interface ProductCardProps {
  product: Product;
  layout?: string;
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
  showQuickActions = true,
  onAddToCart,
  onViewDetails,
  onToggleWishlist,
  className = ''
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [trustpilotRating, setTrustpilotRating] = useState<{
    rating: number;
    reviewCount: number;
    trustScore: number;
  } | null>(null);
  const [isLiked, setIsLiked] = useState(false);

  // Sync selected index if product changes
  useEffect(() => {
    setSelectedImageIndex(0);
  }, [product.id]);

  useEffect(() => {
    let isMounted = true;
    const loadRating = async () => {
      try {
        const rating = await getTrustpilotProductRating(product.id);
        if (isMounted) setTrustpilotRating(rating);
      } catch (error) {
        // Fallback silently
      }
    };
    loadRating();
    return () => { isMounted = false; };
  }, [product.id]);

  const imagesList = (product.images && product.images.length > 0)
    ? product.images
    : ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800'];

  const currentImage = imagesList[selectedImageIndex] || imagesList[0];

  const discountPercentage = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart?.(product);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    onToggleWishlist?.(product);
  };

  const handleVariantClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setSelectedImageIndex(index);
  };

  return (
    <div 
      className={`group relative flex flex-col h-full bg-white dark:bg-[#18181b] rounded-2xl overflow-hidden border border-neutral-200/90 dark:border-neutral-800 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.1)] transition-all duration-300 cursor-pointer ${className}`}
      onClick={() => onViewDetails?.(product)}
    >
      {/* ── 1. Image Container (STRICT 3:4 Aspect Ratio Canvas) ── */}
      <div className="relative w-full aspect-[3/4] overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex-shrink-0">
        <img
          src={currentImage}
          alt={product.name}
          className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />

        {/* Soft Vignette Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10 pointer-events-none">
          {discountPercentage > 0 && (
            <span className="bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md">
              -{discountPercentage}%
            </span>
          )}
          {!product.inStock && (
            <span className="bg-neutral-900/85 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
              Sold Out
            </span>
          )}
        </div>

        {/* Quick Action Floating Buttons */}
        {showQuickActions && (
          <div className="absolute top-2.5 right-2.5 flex flex-col gap-2 z-20">
            <button
              onClick={handleToggleWishlist}
              className={`w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110 ${
                isLiked 
                  ? 'bg-rose-50 text-rose-600 border border-rose-200' 
                  : 'bg-white/90 text-neutral-700 hover:text-rose-600 border border-neutral-200/50 dark:bg-white/10 dark:text-neutral-200 dark:border-neutral-700 dark:hover:text-rose-400'
              }`}
              aria-label="Wishlist"
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-rose-600 text-rose-600' : ''}`} />
            </button>
            <button
              onClick={handleAddToCart}
              className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md text-neutral-800 hover:text-black hover:bg-white hover:scale-110 flex items-center justify-center shadow-md transition-all duration-200 border border-neutral-200/50 dark:bg-white/10 dark:text-neutral-200 dark:hover:text-white dark:hover:bg-white/20 dark:border-neutral-700"
              aria-label="Quick Add"
            >
              <ShoppingBag className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* ── 2. Card Content & Live Variant Image Thumbnails ── */}
      <div className="p-3.5 flex-1 flex flex-col justify-between gap-2.5 bg-white dark:bg-transparent">
        
        {/* Category, Rating, Title */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400 truncate">
              {product.category || 'Collection'}
            </span>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                {trustpilotRating?.rating || product.rating || 4.5}
              </span>
            </div>
          </div>

          <h3 className="font-bold text-sm text-neutral-900 dark:text-white leading-snug line-clamp-1 group-hover:text-neutral-600 dark:group-hover:text-neutral-400 transition-colors">
            {product.name}
          </h3>
        </div>

        {/* Price & Variant Thumbnail Circles */}
        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2">
          
          {/* Price */}
          <div className="flex items-baseline gap-1.5 flex-shrink-0">
            <span className="font-black text-sm sm:text-base text-neutral-900 dark:text-white">
              {formatCurrency(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-neutral-400 dark:text-neutral-500 line-through">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Interactive Variant Circles (Image Swapping on Hover/Click) */}
          {imagesList.length > 1 && (
            <div className="flex items-center -space-x-1.5 overflow-hidden">
              {imagesList.slice(0, 4).map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={(e) => handleVariantClick(e, idx)}
                  onMouseEnter={() => setSelectedImageIndex(idx)}
                  className={`relative w-5 h-5 sm:w-6 sm:h-6 rounded-full overflow-hidden border-2 transition-all duration-200 flex-shrink-0 ${
                    selectedImageIndex === idx
                      ? 'border-[#111] dark:border-white scale-110 z-10 shadow-xs'
                      : 'border-white hover:border-neutral-400 hover:scale-105 opacity-80 hover:opacity-100 dark:border-neutral-600 dark:hover:border-neutral-400'
                  }`}
                  aria-label={`View angle ${idx + 1}`}
                >
                  <img
                    src={imgUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
              {imagesList.length > 4 && (
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-[8px] font-bold text-neutral-600 dark:text-neutral-300 flex-shrink-0">
                  +{imagesList.length - 4}
                </span>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ProductCard;
