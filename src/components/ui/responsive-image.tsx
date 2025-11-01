import { useState, useRef, useEffect } from 'react';
import { cn } from './utils';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function ResponsiveImage({
  src,
  alt,
  className,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  priority = false,
  placeholder,
  onLoad,
  onError
}: ResponsiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (priority || !imgRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Generate responsive image sources
  const generateSrcSet = (baseSrc: string) => {
    // BANDWIDTH OPTIMIZATION: Removed width parameter variations to reduce bandwidth by 75%
    // Previously generated 4 versions (?width=400, 800, 1200, 1600) which multiplied bandwidth
    // Now just return the base URL and let browser handle sizing
    return baseSrc;
  };

  if (hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gray-100 text-gray-400',
          className
        )}
      >
        <div className="text-center">
          <div className="text-2xl mb-2">📷</div>
          <p className="text-sm">Image unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Placeholder/Loading state */}
      {(!isLoaded || !isInView) && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
          {placeholder ? (
            <img
              src={placeholder}
              alt=""
              className="w-full h-full object-cover opacity-50"
            />
          ) : (
            <div className="text-gray-400">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs">Loading...</p>
            </div>
          )}
        </div>
      )}

      {/* Main image */}
      {isInView && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          sizes={sizes}
          srcSet={generateSrcSet(src)}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}

      {/* Progressive enhancement for modern formats (only for external URLs) */}
      {isInView && src && !src.startsWith('data:') && (
        <picture>
          {/* WebP format for modern browsers */}
          <source
            srcSet={`${src}?format=webp`}
            type="image/webp"
          />
          {/* AVIF format for cutting-edge browsers */}
          <source
            srcSet={`${src}?format=avif`}
            type="image/avif"
          />
          {/* Fallback to original format */}
          <img
            src={src}
            alt={alt}
            className="hidden"
            aria-hidden="true"
          />
        </picture>
      )}
    </div>
  );
}

// Image gallery component for multiple product images
interface ImageGalleryProps {
  images: string[];
  alt: string;
  className?: string;
  maxImages?: number;
  priority?: boolean;
}

export function ImageGallery({
  images,
  alt,
  className,
  maxImages = 4,
  priority = false
}: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const displayImages = images.slice(0, maxImages);
  const hasMore = images.length > maxImages;

  // Debug logging for ImageGallery
  console.log('🖼️ ImageGallery Debug:', {
    totalImages: images.length,
    selectedImage,
    displayImages: displayImages.length,
    hasMore,
    images: images
  });

  if (images.length === 0) {
    return (
      <div className={cn('bg-gray-100 flex items-center justify-center', className)}>
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-2">📷</div>
          <p className="text-sm">No images available</p>
        </div>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <ResponsiveImage
        src={images[0]}
        alt={alt}
        className={className}
        priority={priority}
      />
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Main image */}
      <div className="aspect-square overflow-hidden rounded-lg">
        <ResponsiveImage
          src={images[selectedImage]}
          alt={`${alt} - Image ${selectedImage + 1}`}
          className="w-full h-full"
          priority={priority}
        />
      </div>

      {/* Thumbnail gallery */}
      <div className="flex gap-2 overflow-x-auto">
        {displayImages.map((image, index) => (
          <button
            key={index}
            onClick={() => {
              console.log('🖼️ ImageGallery: Thumbnail clicked, moving from index', selectedImage, 'to index', index);
              setSelectedImage(index);
            }}
            className={cn(
              'flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all',
              selectedImage === index
                ? 'border-primary ring-2 ring-primary/20'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <ResponsiveImage
              src={image}
              alt={`${alt} thumbnail ${index + 1}`}
              className="w-full h-full"
            />
          </button>
        ))}

        {hasMore && (
          <div className="flex-shrink-0 w-16 h-16 rounded-md bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
            <span className="text-xs text-gray-500 font-medium">
              +{images.length - maxImages}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Optimized product image component
interface ProductImageProps {
  images: string[];
  name: string;
  className?: string;
  priority?: boolean;
}

export function ProductImage({
  images,
  name,
  className,
  priority = false
}: ProductImageProps) {
  const primaryImage = images?.[0];

  if (!primaryImage) {
    return (
      <div className={cn('bg-gray-100 flex items-center justify-center aspect-square rounded-lg', className)}>
        <div className="text-center text-gray-400">
          <div className="text-2xl mb-1">👕</div>
          <p className="text-xs">No image</p>
        </div>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <ResponsiveImage
        src={primaryImage}
        alt={name}
        className={cn('object-cover rounded-lg', className)}
        priority={priority}
      />
    );
  }

  return (
    <div className={cn('relative group', className)}>
      <ResponsiveImage
        src={primaryImage}
        alt={name}
        className="w-full h-full object-cover rounded-lg"
        priority={priority}
      />
    </div>
  );
}

