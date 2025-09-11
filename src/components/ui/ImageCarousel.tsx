import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

interface ImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
  aspectRatio?: string; // e.g., "3/1" for height/width ratio
  showNavigation?: boolean;
  autoSlide?: boolean;
  autoSlideInterval?: number;
}

/**
 * Enhanced Image Carousel Component
 * 
 * Features:
 * - Multi-image carousel with navigation
 * - Smart background blurring for better fit
 * - Debugging console logs for troubleshooting
 * - Fallback handling for broken images
 * - Auto-slide capability
 * - Responsive design with custom aspect ratios
 */
export const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  alt,
  className = '',
  aspectRatio = '3/1', // Default 3:1 ratio as requested
  showNavigation = true,
  autoSlide = false,
  autoSlideInterval = 3000
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Debug logging for carousel state
  useEffect(() => {
    console.log('🖼️ ImageCarousel Debug:', {
      totalImages: images.length,
      currentIndex,
      imageErrors: Array.from(imageErrors),
      autoSlide,
      aspectRatio
    });
  }, [currentIndex, images.length, imageErrors, autoSlide, aspectRatio]);

  // Auto-slide functionality
  useEffect(() => {
    if (!autoSlide || images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = (prev + 1) % images.length;
        console.log('🔄 Auto-slide: Moving to image', nextIndex);
        return nextIndex;
      });
    }, autoSlideInterval);

    return () => clearInterval(interval);
  }, [autoSlide, images.length, autoSlideInterval]);

  // Navigation handlers with debugging
  const goToPrevious = () => {
    const prevIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    console.log('⬅️ Navigation: Previous clicked, moving to index', prevIndex);
    setCurrentIndex(prevIndex);
  };

  const goToNext = () => {
    const nextIndex = (currentIndex + 1) % images.length;
    console.log('➡️ Navigation: Next clicked, moving to index', nextIndex);
    setCurrentIndex(nextIndex);
  };

  // Handle image loading errors
  const handleImageError = (index: number) => {
    console.error('❌ Image Loading Error: Failed to load image at index', index, 'URL:', images[index]);
    setImageErrors(prev => new Set([...prev, index]));
  };

  // Handle successful image loading
  const handleImageLoad = (index: number) => {
    console.log('✅ Image Loaded Successfully: Index', index, 'URL:', images[index]);
    if (index === currentIndex) {
      setIsLoading(false);
    }
  };

  // Filter out broken images
  const validImages = images.filter((_, index) => !imageErrors.has(index));
  const currentImage = validImages[currentIndex] || images[0];

  // Show error state if no valid images
  if (validImages.length === 0) {
    console.warn('⚠️ ImageCarousel Warning: No valid images available');
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 w-full h-full ${className}`}
      >
        <div className="flex flex-col items-center text-gray-400">
          <AlertCircle className="h-8 w-8 mb-2" />
          <span className="text-sm">Image not available</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative overflow-hidden group w-full h-full ${className}`}
    >
      {/* Blurred Background Image - Creates smart background filling */}
      <div 
        className="absolute inset-0 bg-cover bg-center filter blur-sm scale-110 opacity-60"
        style={{ 
          backgroundImage: `url(${currentImage})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover'
        }}
      />
      
      {/* Main Image - Properly fitted without stretching */}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <img
          src={currentImage}
          alt={`${alt} - Image ${currentIndex + 1} of ${validImages.length}`}
          className="max-w-full max-h-full object-contain"
          onError={() => handleImageError(currentIndex)}
          onLoad={() => handleImageLoad(currentIndex)}
          loading="lazy"
        />
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white bg-opacity-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
        </div>
      )}

      {/* Navigation Controls - Only show if multiple images */}
      {showNavigation && validImages.length > 1 && (
        <>
          {/* Previous Button */}
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 
                     bg-black bg-opacity-50 hover:bg-opacity-70 
                     text-white rounded-full p-2 
                     opacity-0 group-hover:opacity-100 
                     transition-opacity duration-200
                     focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Next Button */}
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 
                     bg-black bg-opacity-50 hover:bg-opacity-70 
                     text-white rounded-full p-2 
                     opacity-0 group-hover:opacity-100 
                     transition-opacity duration-200
                     focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Next image"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Image Indicators */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 
                        flex space-x-2">
            {validImages.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  console.log('🎯 Indicator clicked: Moving to index', index);
                  setCurrentIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition-colors duration-200 
                          ${index === currentIndex 
                            ? 'bg-white' 
                            : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                          }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Debug Info - Only visible in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 left-2 z-30 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
          <div>Img: {currentIndex + 1}/{validImages.length}</div>
          <div>Ratio: {aspectRatio}</div>
          <div>Errors: {imageErrors.size}</div>
        </div>
      )}
    </div>
  );
};

export default ImageCarousel;
