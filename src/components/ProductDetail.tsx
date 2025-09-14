import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ArrowLeft, Star, Heart, Share2, ShoppingBag, Plus, Minus, Truck, Shield, RotateCcw, Copy, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '../App';
import { BottomSpacer } from './ui/bottom-spacer';
import TrustpilotWidget from './ui/TrustpilotWidget';
import { openProductReviewForm } from '../utils/trustpilot';

interface ProductDetailProps {
  product: Product;
  onAddToCart: (product: Product, size: string, color: string, quantity: number) => void;
  onBack: () => void;
}

export function ProductDetail({ product, onAddToCart, onBack }: ProductDetailProps) {
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShowShareMenu(false);
      }
    };

    if (showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showShareMenu]);

  const handleShare = async () => {
    const shareData = {
      title: product.name,
      text: `Check out this ${product.category.toLowerCase()}: ${product.name} - R${product.price}`,
      url: window.location.href
    };

    try {
      // Check if Web Share API is supported (mainly on mobile)
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast.success('Product shared successfully!');
      } else {
        // Show custom share menu for desktop
        setShowShareMenu(!showShareMenu);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      setShowShareMenu(!showShareMenu);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Product link copied to clipboard!');
      setShowShareMenu(false);
    } catch (error) {
      console.error('Clipboard error:', error);
      toast.error('Unable to copy link. Please copy the URL manually.');
    }
  };

  const shareToWhatsApp = () => {
    const message = encodeURIComponent(`Check out this ${product.category.toLowerCase()}: ${product.name} - R${product.price} ${window.location.href}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
    setShowShareMenu(false);
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(`Check out this ${product.category.toLowerCase()}: ${product.name} - R${product.price}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(window.location.href)}`, '_blank');
    setShowShareMenu(false);
  };

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
    setShowShareMenu(false);
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }
    if (!selectedColor) {
      toast.error('Please select a color');
      return;
    }

    onAddToCart(product, selectedSize, selectedColor, quantity);
    toast.success('Added to cart successfully!');
  };

  const sizeGuide = {
    'XS': 'Extra Small (0-2)',
    'S': 'Small (4-6)',
    'M': 'Medium (8-10)',
    'L': 'Large (12-14)',
    'XL': 'Extra Large (16-18)',
    'XXL': 'XXL (20-22)'
  };

  return (
    <div className="container mx-auto px-6 py-6 pb-24 max-w-6xl">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-6 hover:bg-secondary"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Products
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="relative">
            {/* Main Image Display */}
            <div className="aspect-square overflow-hidden rounded-lg">
              <img
                src={product.images[selectedImageIndex] || product.images[0]}
                alt={`${product.name} - Image ${selectedImageIndex + 1}`}
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
            {product.originalPrice && (
              <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground z-10 shadow-lg">
                {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
              </Badge>
            )}
            {!product.inStock && (
              <Badge className="absolute top-4 right-4 bg-gray-500 text-white z-10 shadow-lg">
                Out of Stock
              </Badge>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => {
                    console.log('🖼️ ProductDetail: Thumbnail clicked, moving from index', selectedImageIndex, 'to index', index);
                    setSelectedImageIndex(index);
                  }}
                  className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                    selectedImageIndex === index
                      ? 'border-primary shadow-md ring-2 ring-primary/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          <div>
            <Badge variant="secondary" className="mb-2">
              {product.category}
            </Badge>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            
            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(product.rating) 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {product.rating} ({product.reviews.length} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold">R{product.price}</span>
              {product.originalPrice && (
                <>
                  <span className="text-xl text-muted-foreground line-through">
                    R{product.originalPrice}
                  </span>
                  <Badge variant="destructive">
                    {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                  </Badge>
                </>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2 mb-6">
              {product.inStock ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm text-green-600">In Stock</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <span className="text-sm text-red-600">Out of Stock</span>
                </>
              )}
            </div>
          </div>

          <Separator />

          {/* Size Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Size</h3>
              <Button variant="link" className="text-sm p-0 h-auto">
                Size Guide
              </Button>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {product.sizes.map((size) => (
                <Button
                  key={size}
                  variant={selectedSize === size ? "default" : "outline"}
                  className="aspect-square"
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </Button>
              ))}
            </div>
            {selectedSize && sizeGuide[selectedSize as keyof typeof sizeGuide] && (
              <p className="text-sm text-muted-foreground mt-2">
                {sizeGuide[selectedSize as keyof typeof sizeGuide]}
              </p>
            )}
          </div>

          {/* Color Selection */}
          <div>
            <h3 className="font-medium mb-3">Color: {selectedColor}</h3>
            <div className="flex flex-wrap gap-3">
              {product.colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`relative flex items-center gap-2 px-3 py-2 border rounded-lg transition-all ${
                    selectedColor === color
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border ${
                      color.toLowerCase() === 'black' ? 'bg-black' :
                      color.toLowerCase() === 'white' ? 'bg-white border-gray-300' :
                      color.toLowerCase() === 'gray' ? 'bg-gray-400' :
                      color.toLowerCase() === 'navy' ? 'bg-blue-900' :
                      color.toLowerCase() === 'brown' ? 'bg-amber-800' :
                      color.toLowerCase() === 'beige' ? 'bg-amber-100' :
                      color.toLowerCase() === 'pink' ? 'bg-pink-400' :
                      color.toLowerCase() === 'blue' ? 'bg-blue-500' :
                      color.toLowerCase() === 'red' ? 'bg-red-500' :
                      'bg-green-500'
                    }`}
                  />
                  <span className="text-sm">{color}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <h3 className="font-medium mb-3">Quantity</h3>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
                disabled={quantity >= 10}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              className="w-full"
              size="lg"
              onClick={handleAddToCart}
              disabled={!product.inStock}
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Add to Cart - R{(product.price * quantity).toFixed(2)}
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsLiked(!isLiked)}
              >
                <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                {isLiked ? 'Saved' : 'Save'}
              </Button>
              
              <div className="relative flex-1" ref={shareMenuRef}>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                
                {/* Custom Share Menu for Desktop */}
                {showShareMenu && (
                  <div className="absolute top-full mt-2 left-0 right-0 bg-white border rounded-lg shadow-lg z-10 overflow-hidden">
                    <button
                      onClick={copyToClipboard}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                      <span className="text-sm">Copy Link</span>
                    </button>
                    
                    <button
                      onClick={shareToWhatsApp}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    >
                      <MessageCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Share on WhatsApp</span>
                    </button>
                    
                    <button
                      onClick={shareToTwitter}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    >
                      <div className="h-4 w-4 bg-blue-400 rounded-sm flex items-center justify-center">
                        <span className="text-white text-xs font-bold">𝕏</span>
                      </div>
                      <span className="text-sm">Share on X (Twitter)</span>
                    </button>
                    
                    <button
                      onClick={shareToFacebook}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    >
                      <div className="h-4 w-4 bg-blue-600 rounded-sm flex items-center justify-center">
                        <span className="text-white text-xs font-bold">f</span>
                      </div>
                      <span className="text-sm">Share on Facebook</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg">
              <Truck className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Free Shipping</p>
                <p className="text-xs text-muted-foreground">Orders over R3500</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg">
              <RotateCcw className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Collections</p>
                <p className="text-xs text-muted-foreground">Curated fashion</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Secure Payment</p>
                <p className="text-xs text-muted-foreground">SSL protected</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Description & Reviews */}
      <div className="mt-12 space-y-8">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4">Product Description</h3>
            <p className="text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          </CardContent>
        </Card>

        {/* Customer Reviews - Trustpilot */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Customer Reviews</h3>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => openProductReviewForm(product.id, product.name)}
                  className="flex items-center gap-2"
                >
                  <Star className="h-4 w-4" />
                  Write a Review
                </Button>
              </div>
            </div>
            
            {/* Trustpilot Product Review Widget */}
            <TrustpilotWidget
              widgetType="product-review"
              productSku={product.id}
              height="400px"
              className="w-full"
            />
            
            {/* Fallback message */}
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Reviews are powered by <span className="font-medium">Trustpilot</span>
            </div>
          </CardContent>
        </Card>
      </div>
      <BottomSpacer />
    </div>
  );
}
