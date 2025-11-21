import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ArrowLeft, Star, Heart, Share2, ShoppingBag, Plus, Minus, Truck, Shield, RotateCcw, Copy, MessageCircle, ChevronRight, Home } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '../App';
import { BottomSpacer } from './ui/bottom-spacer';
import TrustpilotWidget from './ui/TrustpilotWidget';
import { openProductReviewForm } from '../utils/trustpilot';
import { useProducts } from '../contexts/ProductContext';
import { ProductImage } from './ui/responsive-image';

interface ProductDetailProps {
  product: Product;
  onAddToCart: (product: Product, size: string, color: string, quantity: number) => void;
  onBack: () => void;
  onViewProduct: (product: Product) => void;
}

export function ProductDetail({ product, onAddToCart, onBack, onViewProduct }: ProductDetailProps) {
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  const { products } = useProducts();

  // Filter related products (same category, exclude current)
  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  // Scroll to top when product changes
  useEffect(() => {
    window.scrollTo(0, 0);
    setSelectedImageIndex(0);
    setQuantity(1);
    setSelectedSize('');
    setSelectedColor('');
  }, [product.id]);

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
    <div className="container mx-auto px-4 py-6 pb-32 max-w-7xl">
      {/* Breadcrumbs */}
      <nav className="flex items-center text-sm text-muted-foreground mb-6 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
        <button onClick={onBack} className="hover:text-primary transition-colors flex items-center">
          <Home className="h-4 w-4 mr-1" />
          Home
        </button>
        <ChevronRight className="h-4 w-4 mx-2 flex-shrink-0" />
        <button onClick={onBack} className="hover:text-primary transition-colors">
          {product.category}
        </button>
        <ChevronRight className="h-4 w-4 mx-2 flex-shrink-0" />
        <span className="font-medium text-foreground truncate">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-12">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="relative group">
            {/* Main Image Display */}
            <div className="aspect-square overflow-hidden rounded-xl bg-secondary/10 border border-border/50">
              <img
                src={product.images[selectedImageIndex] || product.images[0]}
                alt={`${product.name} - Image ${selectedImageIndex + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="eager"
              />
            </div>
            {product.originalPrice && (
              <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground z-10 shadow-lg text-sm px-3 py-1">
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
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${selectedImageIndex === index
                      ? 'border-primary shadow-md ring-2 ring-primary/20'
                      : 'border-transparent hover:border-gray-300'
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
        <div className="space-y-8">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Badge variant="secondary" className="text-xs font-normal uppercase tracking-wider">
                {product.category}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium text-foreground">{product.rating}</span>
                <span>({product.reviews.length} reviews)</span>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">{product.name}</h1>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold">R{product.price}</span>
              {product.originalPrice && (
                <span className="text-xl text-muted-foreground line-through">
                  R{product.originalPrice}
                </span>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2 mb-6">
              {product.inStock ? (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm font-medium">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  In Stock & Ready to Ship
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1 rounded-full text-sm font-medium">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  Out of Stock
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Selections */}
          <div className="space-y-6">
            {/* Size Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Select Size</h3>
                <Button variant="link" className="text-sm p-0 h-auto text-muted-foreground hover:text-primary">
                  Size Guide
                </Button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {product.sizes.map((size) => (
                  <Button
                    key={size}
                    variant={selectedSize === size ? "default" : "outline"}
                    className={`h-12 ${selectedSize === size ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </Button>
                ))}
              </div>
              {selectedSize && sizeGuide[selectedSize as keyof typeof sizeGuide] && (
                <p className="text-sm text-muted-foreground mt-2 animate-in fade-in slide-in-from-top-1">
                  Fit: {sizeGuide[selectedSize as keyof typeof sizeGuide]}
                </p>
              )}
            </div>

            {/* Color Selection */}
            <div>
              <h3 className="font-medium mb-3">Select Color: <span className="text-muted-foreground font-normal">{selectedColor}</span></h3>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`relative flex items-center gap-2 px-4 py-2 border rounded-full transition-all ${selectedColor === color
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border hover:border-gray-400'
                      }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border shadow-sm ${color.toLowerCase() === 'black' ? 'bg-black' :
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
                    <span className="text-sm font-medium">{color}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <h3 className="font-medium mb-3">Quantity</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center border rounded-lg bg-background">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="h-10 w-10 rounded-none rounded-l-lg"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className="w-12 text-center font-medium">{quantity}</div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={quantity >= 10}
                    className="h-10 w-10 rounded-none rounded-r-lg"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  Total: <span className="font-bold text-foreground">R{(product.price * quantity).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden lg:flex gap-4 pt-4">
            <Button
              className="flex-1 h-12 text-lg shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
              size="lg"
              onClick={handleAddToCart}
              disabled={!product.inStock}
            >
              <ShoppingBag className="h-5 w-5 mr-2" />
              Add to Cart
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="h-12 px-6"
              onClick={() => setIsLiked(!isLiked)}
            >
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>

            <div className="relative" ref={shareMenuRef}>
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-6"
                onClick={handleShare}
              >
                <Share2 className="h-5 w-5" />
              </Button>

              {/* Custom Share Menu */}
              {showShareMenu && (
                <div className="absolute top-full mt-2 right-0 w-56 bg-popover border rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-2 space-y-1">
                    <button
                      onClick={copyToClipboard}
                      className="w-full px-3 py-2 text-left hover:bg-accent rounded-md flex items-center gap-3 transition-colors text-sm"
                    >
                      <Copy className="h-4 w-4" />
                      Copy Link
                    </button>
                    <button
                      onClick={shareToWhatsApp}
                      className="w-full px-3 py-2 text-left hover:bg-accent rounded-md flex items-center gap-3 transition-colors text-sm"
                    >
                      <MessageCircle className="h-4 w-4 text-green-600" />
                      WhatsApp
                    </button>
                    <button
                      onClick={shareToTwitter}
                      className="w-full px-3 py-2 text-left hover:bg-accent rounded-md flex items-center gap-3 transition-colors text-sm"
                    >
                      <div className="h-4 w-4 bg-black text-white rounded-sm flex items-center justify-center text-[10px] font-bold">X</div>
                      X (Twitter)
                    </button>
                    <button
                      onClick={shareToFacebook}
                      className="w-full px-3 py-2 text-left hover:bg-accent rounded-md flex items-center gap-3 transition-colors text-sm"
                    >
                      <div className="h-4 w-4 bg-blue-600 text-white rounded-sm flex items-center justify-center text-[10px] font-bold">f</div>
                      Facebook
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="flex items-center gap-3 p-4 bg-secondary/20 rounded-xl border border-border/50">
              <div className="p-2 bg-background rounded-full shadow-sm">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Free Shipping</p>
                <p className="text-xs text-muted-foreground">On orders R3500+</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-secondary/20 rounded-xl border border-border/50">
              <div className="p-2 bg-background rounded-full shadow-sm">
                <RotateCcw className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Easy Returns</p>
                <p className="text-xs text-muted-foreground">72hr return policy</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-secondary/20 rounded-xl border border-border/50">
              <div className="p-2 bg-background rounded-full shadow-sm">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Secure Payment</p>
                <p className="text-xs text-muted-foreground">Encrypted checkout</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description & Reviews */}
      <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="overflow-hidden border-border/50 shadow-sm">
            <CardContent className="p-6 md:p-8">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                Product Description
              </h3>
              <div className="prose prose-stone dark:prose-invert max-w-none">
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border/50 shadow-sm">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Customer Reviews</h3>
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

              <TrustpilotWidget
                widgetType="product-review"
                productSku={product.id}
                height="400px"
                className="w-full"
              />

              <div className="mt-4 text-center text-sm text-muted-foreground">
                Reviews are powered by <span className="font-medium">Trustpilot</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar for related info or ads could go here */}
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">You May Also Like</h2>
            <Button variant="link" onClick={onBack}>View All</Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map(related => (
              <div
                key={related.id}
                className="group cursor-pointer space-y-3"
                onClick={() => onViewProduct(related)}
              >
                <div className="aspect-[3/4] overflow-hidden rounded-xl bg-secondary/10 border border-border/50 relative">
                  <ProductImage
                    images={related.images}
                    name={related.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {related.originalPrice && (
                    <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs">
                      {Math.round((1 - related.price / related.originalPrice) * 100)}% OFF
                    </Badge>
                  )}
                </div>
                <div>
                  <h3 className="font-medium line-clamp-1 group-hover:text-primary transition-colors">{related.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-bold">R{related.price}</span>
                    {related.originalPrice && (
                      <span className="text-xs text-muted-foreground line-through">R{related.originalPrice}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sticky Mobile Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t p-4 lg:hidden z-50 safe-area-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="flex gap-3 max-w-7xl mx-auto">
          <div className="flex-1">
            <Button
              className="w-full h-12 text-lg shadow-lg shadow-primary/20"
              size="lg"
              onClick={handleAddToCart}
              disabled={!product.inStock}
            >
              Add to Cart - R{(product.price * quantity).toFixed(2)}
            </Button>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 flex-shrink-0"
            onClick={() => setIsLiked(!isLiked)}
          >
            <Heart className={`h-5 w-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        </div>
      </div>

      <BottomSpacer />
    </div>
  );
}
