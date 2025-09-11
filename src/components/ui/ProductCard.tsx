import React from 'react';
import { Star, ShoppingCart, Eye, Heart } from 'lucide-react';
import { ImageCarousel } from './ImageCarousel';
import type { Product } from '../../App';

interface ProductCardProps {
  product: Product;
  layout?: 'compact' | 'enhanced'; // New layout options
  showQuickActions?: boolean;
  onAddToCart?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
  className?: string;
}

// Enhanced currency formatting function for South African Rand
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Enhanced Product Card Component
 *
 * Features:
 * - Tall 3:1 aspect ratio with 80% image space for better product visibility
 * - Multi-image carousel support
 * - Smart layout optimization
 * - Clean pricing display with South African Rand formatting
 * - Quick action buttons
 * - Beautiful color display
 * - Responsive design with proper spacing
 */
export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  layout = 'enhanced',
  showQuickActions = true,
  onAddToCart,
  onViewDetails,
  onToggleWishlist,
  className = ''
}) => {
  // Calculate discount percentage for display - only show if there's an actual discount
  const discountPercentage = product.originalPrice &&
                            product.originalPrice > product.price &&
                            product.originalPrice !== product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  // Handle action clicks without debug logging
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart?.(product);
  };

  const handleViewDetails = () => {
    onViewDetails?.(product);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleWishlist?.(product);
  };

  // Ensure we have valid images array
  const productImages = product.images && product.images.length > 0 
    ? product.images 
    : ['/images/placeholder-product.svg']; // Fallback SVG image

  // Color mapping for beautiful color display
  const getColorClass = (color: string) => {
    const colorLower = color.toLowerCase();
    switch (colorLower) {
      case 'black': return 'bg-black border-gray-300';
      case 'white': return 'bg-white border-gray-400';
      case 'gray': case 'grey': return 'bg-gray-400 border-gray-500';
      case 'navy': return 'bg-blue-900 border-blue-800';
      case 'brown': return 'bg-amber-800 border-amber-700';
      case 'beige': return 'bg-amber-100 border-amber-200';
      case 'pink': return 'bg-pink-400 border-pink-500';
      case 'blue': return 'bg-blue-500 border-blue-600';
      case 'red': return 'bg-red-500 border-red-600';
      case 'green': return 'bg-green-500 border-green-600';
      case 'yellow': return 'bg-yellow-400 border-yellow-500';
      case 'purple': return 'bg-purple-500 border-purple-600';
      case 'orange': return 'bg-orange-500 border-orange-600';
      default: return 'bg-gradient-to-br from-purple-400 to-pink-400 border-purple-300';
    }
  };

  return (
    <div 
      className={`
        bg-background rounded-lg shadow-md hover:shadow-xl transition-all duration-300 
        cursor-pointer group overflow-hidden border border-border dark:border-border/50 
        hover:border-primary/20 dark:hover:border-primary/30
        flex flex-col
        ${className}
      `}
      onClick={handleViewDetails}
    >
      {/* Image Section - Aspect ratio controlled for consistency */}
      <div className="relative w-full aspect-[3/4] flex-shrink-0">
        {/* Image Carousel fills the container, maintaining aspect ratio */}
        <ImageCarousel
          images={productImages}
          alt={product.name}
          showNavigation={productImages.length > 1}
          className="rounded-t-lg h-full w-full object-cover"
        />

        {/* Overlay Badges */}
        <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
          {/* Discount Badge - Theme compatible */}
          {discountPercentage > 0 && (
            <span className="bg-rose-500 dark:bg-rose-600 text-white text-xs px-2.5 py-1 rounded-full font-medium shadow-md">
              -{discountPercentage}%
            </span>
          )}
        </div>

        {/* Quick Actions - Enhanced visibility and theme compatible */}
        {showQuickActions && (
          <div className="absolute top-2 right-2 z-20 flex flex-col gap-2 
                        opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handleToggleWishlist}
              className="bg-background dark:bg-card bg-opacity-90 dark:bg-opacity-90 hover:bg-opacity-100 
                       p-2 rounded-full shadow-md transition-all duration-200
                       hover:scale-110 focus:outline-none focus:ring-2 focus:ring-rose-500"
              aria-label="Add to wishlist"
            >
              <Heart className="h-4 w-4 text-foreground hover:text-rose-500" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleViewDetails();
              }}
              className="bg-background dark:bg-card bg-opacity-90 dark:bg-opacity-90 hover:bg-opacity-100 
                       p-2 rounded-full shadow-md transition-all duration-200
                       hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Quick view"
            >
              <Eye className="h-4 w-4 text-foreground hover:text-blue-500" />
            </button>
          </div>
        )}
      </div>

      {/* Content Section - Increased to 104px with better spacing and theme support */}
      <div className="p-4 flex-grow flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          {/* Product Category - Theme compatible */}
          {product.category && (
            <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              {product.category}
            </span>
          )}

          {/* Product Name - Theme compatible */}
          <h3 className="font-semibold text-foreground text-sm line-clamp-2 leading-tight">
            {product.name}
          </h3>

          {/* Rating Display - Theme compatible */}
          {product.rating && (
            <div className="flex items-center gap-1">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < Math.floor(product.rating!) 
                        ? 'text-yellow-400 fill-current' 
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                ))}
              </div>
              {product.reviews && product.reviews.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({product.reviews.length})
                </span>
              )}
            </div>
          )}

          {/* Beautiful Color Display - Theme compatible */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground mr-1">Colors:</span>
              <div className="flex gap-1">
                {product.colors.slice(0, 5).map((color, index) => (
                  <div
                    key={index}
                    className={`w-4 h-4 rounded-full border-2 ${getColorClass(color)} 
                               shadow-sm hover:scale-110 transition-transform cursor-pointer`}
                    title={color}
                  />
                ))}
                {product.colors.length > 5 && (
                  <span className="text-xs text-muted-foreground self-center ml-1">
                    +{product.colors.length - 5}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Price and Add to Cart Section - Enhanced currency formatting */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground text-lg">
              {formatCurrency(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-sm text-muted-foreground line-through">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Add to Cart Button - Enhanced and consistent with site theme */}
          <button
            onClick={handleAddToCart}
            className="bg-rose-500 hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-700 text-white 
                     p-2 rounded-full transition-colors duration-200
                     hover:scale-105 focus:outline-none focus:ring-2 focus:ring-rose-500 
                     shadow-md hover:shadow-lg"
            aria-label="Add to cart"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Debug Info - Development only - Removed fixed height */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-0 left-0 bg-black bg-opacity-75 text-white text-xs p-1 rounded-tr-md z-30">
          ID: {product.id} | Layout: {layout} | Aspect: 3/4
        </div>
      )}
    </div>
  );
};

export default ProductCard;
