import React, { useState, useEffect, useRef } from 'react';
import { Star, Heart, Share2, ShoppingBag, Plus, Minus, Truck, Shield, RotateCcw, Copy, MessageCircle, ChevronRight, Home } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { toast } from 'sonner';
import type { Product } from '../App';
import { BottomSpacer } from './ui/bottom-spacer';
import TrustpilotWidget from './ui/TrustpilotWidget';
import { openProductReviewForm } from '../utils/trustpilot';
import { useProducts } from '../contexts/ProductContext';
import { ProductImage } from './ui/responsive-image';
import { ProductCard } from './ui/ProductCard';

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
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  const { products } = useProducts();

  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  useEffect(() => {
    window.scrollTo(0, 0);
    setQuantity(1);
    setSelectedSize('');
    setSelectedColor('');
  }, [product.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShowShareMenu(false);
      }
    };
    if (showShareMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showShareMenu]);

  const handleShare = async () => {
    const shareData = {
      title: product.name,
      text: `Check out this ${product.category.toLowerCase()}: ${product.name} - R${product.price}`,
      url: window.location.href
    };
    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast.success('Product shared successfully!');
      } else {
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
      toast.error('Unable to copy link.');
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
    <div className="bg-[#f4f1eb] min-h-screen pb-32">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Breadcrumbs */}
        <nav className="flex items-center text-xs font-semibold text-[#111]/40 uppercase tracking-widest mb-8 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
          <button onClick={onBack} className="hover:text-[#111] transition-colors flex items-center">
            <Home className="h-3 w-3 mr-1" />
            Home
          </button>
          <ChevronRight className="h-3 w-3 mx-2 flex-shrink-0 opacity-50" />
          <button onClick={onBack} className="hover:text-[#111] transition-colors">
            {product.category}
          </button>
          <ChevronRight className="h-3 w-3 mx-2 flex-shrink-0 opacity-50" />
          <span className="text-[#111] truncate">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16">
          
          {/* Main Image View */}
          <div className="relative w-full aspect-[3/4] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
            <ProductImage
              images={product.images}
              name={product.name}
              className="w-full h-full object-cover"
              priority={true}
            />
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-[#111] text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm z-10">
                {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
              </span>
            )}
            {!product.inStock && (
              <span className="absolute top-4 right-4 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm z-10">
                Out of Stock
              </span>
            )}
          </div>

          {/* Product Details Sidebar */}
          <div className="space-y-8 lg:sticky lg:top-24 lg:self-start lg:pb-12">
            
            {/* Header section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-[#111]/50 uppercase tracking-[0.2em]">
                  {product.category}
                </span>
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-bold text-[#111]">{product.rating}</span>
                  <span className="text-xs font-medium text-[#111]/40">({product.reviews.length})</span>
                </div>
              </div>

              <h1 className="text-3xl md:text-5xl font-black text-[#111] leading-[1.1] tracking-tight mb-4">
                {product.name}
              </h1>

              <div className="flex items-end gap-3 mb-6">
                <span className="text-3xl font-bold text-[#111]">R{product.price}</span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-lg font-semibold text-[#111]/40 line-through mb-1">
                    R{product.originalPrice}
                  </span>
                )}
              </div>
            </div>

            <hr className="border-[#111]/10" />

            {/* Selectors */}
            <div className="space-y-6">
              
              {/* Colors */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#111]/60">Select Color</span>
                  <span className="text-xs font-bold text-[#111]">{selectedColor}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`relative w-8 h-8 rounded-full border-2 transition-all ${
                        selectedColor === color 
                          ? 'border-[#111] scale-110 shadow-md' 
                          : 'border-transparent hover:scale-105 hover:border-[#111]/20 shadow-sm'
                      }`}
                      aria-label={`Select color ${color}`}
                    >
                      <div className={`absolute inset-[2px] rounded-full border border-black/10 ${getColorClass(color)}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Sizes */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#111]/60">Select Size</span>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="text-[10px] font-bold uppercase tracking-wider text-[#111]/50 hover:text-[#111] underline underline-offset-4 decoration-[#111]/20 hover:decoration-[#111]">
                        Size Guide
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-white border-none rounded-2xl shadow-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-[#111]">Size Guide</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-y-4 gap-x-6 mt-4">
                        <div className="font-bold text-xs uppercase tracking-wider text-[#111]/50 border-b border-[#111]/10 pb-2">Size</div>
                        <div className="font-bold text-xs uppercase tracking-wider text-[#111]/50 border-b border-[#111]/10 pb-2">Fit Description</div>
                        {Object.entries(sizeGuide).map(([key, val]) => (
                          <React.Fragment key={key}>
                            <div className="text-sm font-bold text-[#111] border-b border-[#111]/5 pb-2">{key}</div>
                            <div className="text-sm text-[#111]/60 border-b border-[#111]/5 pb-2">{val}</div>
                          </React.Fragment>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`h-12 px-6 rounded-full text-sm font-bold transition-all ${
                        selectedSize === size
                          ? 'bg-[#111] text-white shadow-md'
                          : 'bg-white text-[#111] hover:bg-white/60 border border-[#111]/10'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#111]/60 mb-3 block">Quantity</span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-white border border-[#111]/10 rounded-full h-12 p-1">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f4f1eb] text-[#111] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center font-bold text-[#111]">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      disabled={quantity >= 10}
                      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f4f1eb] text-[#111] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="text-sm font-semibold text-[#111]/50 flex-1 text-right">
                    Total: <span className="text-lg font-bold text-[#111]">R{(product.price * quantity).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden lg:flex gap-3 pt-4">
              <button
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className="flex-1 bg-[#111] hover:bg-black text-white h-14 rounded-full flex items-center justify-center gap-2 font-bold uppercase tracking-wider text-sm transition-all shadow-lg shadow-black/20 disabled:opacity-50 disabled:shadow-none"
              >
                <ShoppingBag className="h-5 w-5" />
                {product.inStock ? 'Add to Cart' : 'Sold Out'}
              </button>

              <button
                onClick={() => setIsLiked(!isLiked)}
                className="w-14 h-14 bg-white border border-[#111]/10 rounded-full flex items-center justify-center hover:bg-white/60 transition-colors"
              >
                <Heart className={`h-5 w-5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-[#111]'}`} />
              </button>

              <div className="relative" ref={shareMenuRef}>
                <button
                  onClick={handleShare}
                  className="w-14 h-14 bg-white border border-[#111]/10 rounded-full flex items-center justify-center hover:bg-white/60 transition-colors"
                >
                  <Share2 className="h-5 w-5 text-[#111]" />
                </button>

                {showShareMenu && (
                  <div className="absolute top-full mt-2 right-0 w-56 bg-white border border-[#111]/10 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-2 space-y-1">
                      <button onClick={copyToClipboard} className="w-full px-4 py-2.5 text-left hover:bg-[#f4f1eb] rounded-xl flex items-center gap-3 transition-colors text-sm font-semibold text-[#111]">
                        <Copy className="h-4 w-4 text-[#111]/50" /> Copy Link
                      </button>
                      <button onClick={shareToWhatsApp} className="w-full px-4 py-2.5 text-left hover:bg-[#f4f1eb] rounded-xl flex items-center gap-3 transition-colors text-sm font-semibold text-[#111]">
                        <MessageCircle className="h-4 w-4 text-green-600" /> WhatsApp
                      </button>
                      <button onClick={shareToTwitter} className="w-full px-4 py-2.5 text-left hover:bg-[#f4f1eb] rounded-xl flex items-center gap-3 transition-colors text-sm font-semibold text-[#111]">
                        <div className="h-4 w-4 bg-black text-white rounded-sm flex items-center justify-center text-[10px] font-bold">X</div> X (Twitter)
                      </button>
                      <button onClick={shareToFacebook} className="w-full px-4 py-2.5 text-left hover:bg-[#f4f1eb] rounded-xl flex items-center gap-3 transition-colors text-sm font-semibold text-[#111]">
                        <div className="h-4 w-4 bg-blue-600 text-white rounded-sm flex items-center justify-center text-[10px] font-bold">f</div> Facebook
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Trust & Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6">
              <div className="flex flex-col gap-2 p-4 bg-white rounded-2xl border border-[#111]/5">
                <Truck className="h-5 w-5 text-[#111]/40" />
                <div>
                  <p className="text-xs font-bold text-[#111]">Free Shipping</p>
                  <p className="text-[10px] font-semibold text-[#111]/40">On orders R3500+</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 p-4 bg-white rounded-2xl border border-[#111]/5">
                <RotateCcw className="h-5 w-5 text-[#111]/40" />
                <div>
                  <p className="text-xs font-bold text-[#111]">Easy Returns</p>
                  <p className="text-[10px] font-semibold text-[#111]/40">72hr return policy</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 p-4 bg-white rounded-2xl border border-[#111]/5">
                <Shield className="h-5 w-5 text-[#111]/40" />
                <div>
                  <p className="text-xs font-bold text-[#111]">Secure Payment</p>
                  <p className="text-[10px] font-semibold text-[#111]/40">Encrypted checkout</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description & Reviews */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-6 md:p-10 rounded-3xl border border-[#111]/5 shadow-sm">
              <h3 className="text-2xl font-black text-[#111] mb-6">Product Description</h3>
              <p className="text-sm font-medium text-[#111]/70 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            <div className="bg-white p-6 md:p-10 rounded-3xl border border-[#111]/5 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-[#111]">Customer Reviews</h3>
                <button
                  onClick={() => openProductReviewForm(product.id, product.name)}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#111] bg-[#f4f1eb] hover:bg-[#e8e4db] px-4 py-2 rounded-full transition-colors"
                >
                  <Star className="h-3 w-3" />
                  Write a Review
                </button>
              </div>

              <TrustpilotWidget
                widgetType="product-review"
                productSku={product.id}
                height="400px"
                className="w-full"
              />
              <div className="mt-6 text-center text-xs font-semibold text-[#111]/40 uppercase tracking-widest">
                Reviews powered by Trustpilot
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-24">
            <div className="flex items-center justify-between mb-8 border-b border-[#111]/10 pb-4">
              <h2 className="text-3xl font-black text-[#111] tracking-tight">You May Also Like</h2>
              <button onClick={onBack} className="text-xs font-bold uppercase tracking-wider text-[#111]/50 hover:text-[#111] transition-colors">
                View All
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map(related => (
                <ProductCard
                  key={related.id}
                  product={related}
                  onViewDetails={onViewProduct}
                  onAddToCart={(p) => onAddToCart(p, 'M', p.colors[0], 1)}
                  showQuickActions={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Sticky Mobile Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-[#111]/10 p-4 lg:hidden z-50 safe-area-bottom pb-[env(safe-area-inset-bottom,1rem)+4rem]">
          <div className="flex gap-3 max-w-7xl mx-auto">
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className="flex-1 bg-[#111] text-white h-12 rounded-full font-bold uppercase tracking-wider text-xs shadow-lg shadow-black/10 disabled:opacity-50"
            >
              Add to Cart - R{(product.price * quantity).toFixed(2)}
            </button>
            <button
              onClick={() => setIsLiked(!isLiked)}
              className="h-12 w-12 flex-shrink-0 bg-white border border-[#111]/10 rounded-full flex items-center justify-center shadow-sm"
            >
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-[#111]'}`} />
            </button>
          </div>
        </div>
        
        <BottomSpacer />
      </div>
    </div>
  );
}
