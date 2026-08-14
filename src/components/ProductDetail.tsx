import React, { useState, useEffect, useRef } from 'react';
import { Star, Heart, Share2, ShoppingBag, Plus, Minus, Truck, Shield, RotateCcw, Copy, MessageCircle, ChevronRight, Home, ArrowRight, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { toast } from 'sonner';
import type { Product } from '../App';
import { BottomSpacer } from './ui/bottom-spacer';
import TrustpilotWidget from './ui/TrustpilotWidget';
import { openProductReviewForm } from '../utils/trustpilot';
import { useProducts } from '../contexts/ProductContext';
import { ProductCard } from './ui/ProductCard';

interface ProductDetailProps {
  product: Product;
  onAddToCart: (product: Product, size: string, color: string, quantity: number) => void;
  onBack: () => void;
  onViewProduct: (product: Product) => void;
  onGoToCart?: () => void;
  onGoToCheckout?: () => void;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export function ProductDetail({ 
  product, 
  onAddToCart, 
  onBack, 
  onViewProduct,
  onGoToCart,
  onGoToCheckout
}: ProductDetailProps) {
  const imagesList = (product.images && product.images.length > 0)
    ? product.images
    : ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800'];

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes?.[0] || 'M');
  const [selectedColor, setSelectedColor] = useState<string>(product.colors?.[0] || 'Standard');
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  const { products } = useProducts();

  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveImageIndex(0);
    setQuantity(1);
    setSelectedSize(product.sizes?.[0] || 'M');
    setSelectedColor(product.colors?.[0] || 'Standard');
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
      text: `Check out ${product.name} at Rosemama - ${formatCurrency(product.price)}`,
      url: window.location.href
    };
    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast.success('Product shared!');
      } else {
        setShowShareMenu(!showShareMenu);
      }
    } catch {
      setShowShareMenu(!showShareMenu);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
      setShowShareMenu(false);
    } catch {
      toast.error('Unable to copy link.');
    }
  };

  const shareToWhatsApp = () => {
    const message = encodeURIComponent(`Check out this ${product.name} on Rosemama: ${formatCurrency(product.price)} ${window.location.href}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
    setShowShareMenu(false);
  };

  const handleAddToCart = () => {
    const sizeToUse = selectedSize || product.sizes?.[0] || 'M';
    const colorToUse = selectedColor || product.colors?.[0] || 'Standard';
    onAddToCart(product, sizeToUse, colorToUse, quantity);
    toast.success(`Added ${product.name} (${sizeToUse}) to bag`, {
      action: onGoToCart ? {
        label: 'View Bag',
        onClick: () => onGoToCart()
      } : undefined
    });
  };

  const handleBuyNow = () => {
    const sizeToUse = selectedSize || product.sizes?.[0] || 'M';
    const colorToUse = selectedColor || product.colors?.[0] || 'Standard';
    onAddToCart(product, sizeToUse, colorToUse, quantity);
    if (onGoToCheckout) {
      onGoToCheckout();
    } else if (onGoToCart) {
      onGoToCart();
    }
  };

  const sizeGuide: Record<string, string> = {
    '30': 'Size 30 (XS) - Bust 80-84cm, Waist 60-64cm',
    '32': 'Size 32 (S) - Bust 84-88cm, Waist 64-68cm',
    '34': 'Size 34 (M) - Bust 88-92cm, Waist 68-72cm',
    '36': 'Size 36 (L) - Bust 92-96cm, Waist 72-76cm',
    '38': 'Size 38 (XL) - Bust 96-102cm, Waist 76-82cm',
    '40': 'Size 40 (2XL) - Bust 102-108cm, Waist 82-88cm',
    '42': 'Size 42 (3XL) - Bust 108-114cm, Waist 88-94cm',
    '44': 'Size 44 (4XL) - Bust 114-120cm, Waist 94-100cm'
  };

  const getColorClass = (color: string) => {
    const colorLower = color.toLowerCase();
    switch (colorLower) {
      case 'black': return 'bg-black border-neutral-400';
      case 'white': return 'bg-white border-neutral-300';
      case 'gray': case 'grey': return 'bg-neutral-500 border-neutral-400';
      case 'navy': return 'bg-blue-950 border-blue-900';
      case 'brown': return 'bg-amber-950 border-amber-900';
      case 'beige': return 'bg-[#f5f5dc] border-neutral-300';
      case 'pink': return 'bg-pink-400 border-pink-400';
      case 'blue': return 'bg-blue-600 border-blue-600';
      case 'red': return 'bg-rose-600 border-rose-600';
      case 'green': return 'bg-emerald-600 border-emerald-600';
      case 'yellow': return 'bg-amber-400 border-amber-400';
      case 'purple': return 'bg-purple-600 border-purple-600';
      default: return 'bg-neutral-800 border-neutral-400';
    }
  };

  const currentImage = imagesList[activeImageIndex] || imagesList[0];

  const discountPercentage = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="bg-[#f4f1eb] min-h-screen pb-36 text-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        
        {/* ── 1. Breadcrumbs Navigation ── */}
        <nav className="flex items-center text-xs font-bold uppercase tracking-widest text-neutral-500 mb-6 overflow-x-auto whitespace-nowrap pb-2 scrollbar-none">
          <button onClick={onBack} className="hover:text-black transition-colors flex items-center gap-1">
            <Home className="h-3.5 w-3.5" />
            <span>Store</span>
          </button>
          <ChevronRight className="h-3.5 w-3.5 mx-1.5 opacity-40 flex-shrink-0" />
          <button onClick={onBack} className="hover:text-black transition-colors">
            {product.category || 'Collection'}
          </button>
          <ChevronRight className="h-3.5 w-3.5 mx-1.5 opacity-40 flex-shrink-0" />
          <span className="text-black font-extrabold truncate max-w-[200px] sm:max-w-none">
            {product.name}
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* ── 2. Left Column: Image Gallery ── */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Main Stage Image (Strict 3:4 Aspect Ratio) */}
            <div className="relative w-full aspect-[3/4] rounded-3xl overflow-hidden bg-neutral-200 border border-neutral-300/80 shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
              <img
                src={currentImage}
                alt={product.name}
                className="w-full h-full object-cover object-center transition-all duration-500"
              />

              {/* Floating Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                {discountPercentage > 0 && (
                  <span className="bg-rose-600 text-white text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-md">
                    -{discountPercentage}% OFF
                  </span>
                )}
                {!product.inStock && (
                  <span className="bg-black/85 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-md">
                    Sold Out
                  </span>
                )}
              </div>

              {/* Wishlist Button on Image */}
              <button
                onClick={() => setIsLiked(!isLiked)}
                className={`absolute top-4 right-4 w-11 h-11 rounded-full backdrop-blur-md flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 z-10 ${
                  isLiked 
                    ? 'bg-rose-50 text-rose-600 border border-rose-200' 
                    : 'bg-white/90 text-neutral-800 border border-neutral-200/60'
                }`}
                aria-label="Wishlist"
              >
                <Heart className={`h-5 w-5 ${isLiked ? 'fill-rose-600 text-rose-600' : ''}`} />
              </button>
            </div>

            {/* Thumbnail Strip (Multi-Angle Gallery) */}
            {imagesList.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                {imagesList.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 h-24 rounded-2xl overflow-hidden border-2 flex-shrink-0 transition-all duration-200 ${
                      activeImageIndex === idx
                        ? 'border-black scale-105 shadow-md ring-2 ring-black/20'
                        : 'border-neutral-200 hover:border-neutral-400 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Angle ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── 3. Right Column: Product Info & Purchase Controls ── */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.04)] space-y-6">
            
            {/* Category & Rating */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.2em]">
                  {product.category || 'Collection'}
                </span>
                <div className="flex items-center gap-1 bg-neutral-100 px-2.5 py-1 rounded-full">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-black text-neutral-900">{product.rating || 4.8}</span>
                  <span className="text-xs text-neutral-400">({product.reviews?.length || 18})</span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 leading-tight tracking-tight mb-3">
                {product.name}
              </h1>

              {/* Price Banner */}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-neutral-900 tracking-tight">
                  {formatCurrency(product.price)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-base font-semibold text-neutral-400 line-through">
                    {formatCurrency(product.originalPrice)}
                  </span>
                )}
              </div>
            </div>

            <hr className="border-neutral-100" />

            {/* ── SELECT COLOR ── */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-500">
                    Color: <span className="text-neutral-900 font-black">{selectedColor}</span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {product.colors.map((color) => {
                    const isSelected = selectedColor === color;
                    return (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`group flex items-center gap-2 px-3.5 py-2 rounded-full border-2 transition-all duration-200 ${
                          isSelected
                            ? 'border-neutral-900 bg-neutral-900 text-white shadow-md'
                            : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full border ${getColorClass(color)} flex-shrink-0`} />
                        <span className="text-xs font-bold capitalize">{color}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── SELECT SIZE ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-500">
                  Size: <span className="text-neutral-900 font-black">{selectedSize}</span>
                </span>

                {/* Size Guide Trigger */}
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-black underline underline-offset-4 decoration-neutral-300">
                      Size Guide ↗
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-white border border-neutral-200 rounded-3xl shadow-2xl p-6">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black text-neutral-900">South African Size Guide</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 mt-4">
                      {Object.entries(sizeGuide).map(([key, val]) => (
                        <div key={key} className="flex justify-between py-2 border-b border-neutral-100 text-xs">
                          <span className="font-bold text-neutral-900">Size {key}</span>
                          <span className="text-neutral-600">{val}</span>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* High-Contrast Size Pills */}
              <div className="flex flex-wrap gap-2">
                {(product.sizes && product.sizes.length > 0 ? product.sizes : ['30', '32', '34', '36', '38', '40', '42']).map((size) => {
                  const isSelected = selectedSize === size;
                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`h-11 min-w-[3rem] px-4 rounded-xl text-xs font-black transition-all duration-200 border-2 ${
                        isSelected
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-md scale-105'
                          : 'bg-white text-neutral-900 border-neutral-200 hover:border-neutral-800'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── QUANTITY SELECTOR ── */}
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-500 mb-2 block">
                Quantity
              </span>
              <div className="flex items-center justify-between bg-neutral-100 p-1.5 rounded-2xl border border-neutral-200/60">
                <div className="flex items-center">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-neutral-900 font-bold shadow-xs hover:bg-neutral-50 disabled:opacity-30 transition-all"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center font-black text-sm text-neutral-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={quantity >= 10}
                    className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-neutral-900 font-bold shadow-xs hover:bg-neutral-50 disabled:opacity-30 transition-all"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="pr-3 text-right">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Total</span>
                  <span className="text-sm font-black text-neutral-900">
                    {formatCurrency(product.price * quantity)}
                  </span>
                </div>
              </div>
            </div>

            {/* ── BUY NOW & ADD TO BAG BUTTONS (Desktop/Tablet) ── */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleBuyNow}
                disabled={!product.inStock}
                className="w-full bg-[#111] hover:bg-black text-white h-13 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-wider text-xs sm:text-sm transition-all shadow-lg shadow-black/15 disabled:opacity-50"
              >
                <span>Buy Now — {formatCurrency(product.price * quantity)}</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className="flex-1 bg-white hover:bg-neutral-50 text-neutral-900 border-2 border-neutral-900 h-12 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-wider text-xs transition-all shadow-xs disabled:opacity-50"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>Add to Bag</span>
                </button>

                <div className="relative" ref={shareMenuRef}>
                  <button
                    onClick={handleShare}
                    className="w-12 h-12 bg-white border border-neutral-200 rounded-2xl flex items-center justify-center hover:bg-neutral-50 transition-colors shadow-xs"
                    aria-label="Share"
                  >
                    <Share2 className="h-4 w-4 text-neutral-700" />
                  </button>

                  {showShareMenu && (
                    <div className="absolute bottom-full mb-2 right-0 w-52 bg-white border border-neutral-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      <div className="p-1.5 space-y-1">
                        <button onClick={copyToClipboard} className="w-full px-3 py-2 text-left hover:bg-neutral-100 rounded-xl flex items-center gap-2.5 transition-colors text-xs font-bold text-neutral-900">
                          <Copy className="h-3.5 w-3.5 text-neutral-400" /> Copy Link
                        </button>
                        <button onClick={shareToWhatsApp} className="w-full px-3 py-2 text-left hover:bg-neutral-100 rounded-xl flex items-center gap-2.5 transition-colors text-xs font-bold text-neutral-900">
                          <MessageCircle className="h-3.5 w-3.5 text-green-600" /> WhatsApp
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── High-Contrast Trust Badges (No ghost text) ── */}
            <div className="grid grid-cols-3 gap-2.5 pt-4 border-t border-neutral-100">
              <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200/80 text-center">
                <Truck className="h-4 w-4 text-neutral-800 mx-auto mb-1" />
                <p className="text-[11px] font-black text-neutral-900 leading-tight">Free Delivery</p>
                <p className="text-[9px] font-bold text-neutral-500">Orders R3500+</p>
              </div>

              <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200/80 text-center">
                <RotateCcw className="h-4 w-4 text-neutral-800 mx-auto mb-1" />
                <p className="text-[11px] font-black text-neutral-900 leading-tight">72hr Returns</p>
                <p className="text-[9px] font-bold text-neutral-500">Easy exchange</p>
              </div>

              <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200/80 text-center">
                <Shield className="h-4 w-4 text-neutral-800 mx-auto mb-1" />
                <p className="text-[11px] font-black text-neutral-900 leading-tight">Secure Pay</p>
                <p className="text-[9px] font-bold text-neutral-500">100% Encrypted</p>
              </div>
            </div>

          </div>
        </div>

        {/* ── 4. Product Description & Trustpilot Reviews ── */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            
            {/* Description Card */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200/90 shadow-sm">
              <h3 className="text-xl font-black text-neutral-900 mb-4">Product Details & Fabric</h3>
              <p className="text-sm font-medium text-neutral-700 leading-relaxed whitespace-pre-line">
                {product.description || 'Expertly tailored from premium fabric for effortless elegance and timeless style. Designed to flatter with exquisite craftsmanship.'}
              </p>
            </div>

            {/* Customer Reviews Card */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200/90 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-black text-neutral-900">Verified Customer Reviews</h3>
                  <p className="text-xs text-neutral-500 font-medium">Ratings & feedback from real buyers</p>
                </div>
                <button
                  onClick={() => openProductReviewForm(product.id, product.name)}
                  className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white bg-black hover:bg-neutral-800 px-4 py-2 rounded-full transition-colors"
                >
                  <Star className="h-3 w-3 fill-white" />
                  <span>Write Review</span>
                </button>
              </div>

              <TrustpilotWidget
                widgetType="product-review"
                productSku={product.id}
                height="400px"
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* ── 5. Related Products ── */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-6 border-b border-neutral-200 pb-3">
              <h2 className="text-2xl font-black text-neutral-900 tracking-tight">Complete the Look</h2>
              <button onClick={onBack} className="text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-black transition-colors">
                View All
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map(related => (
                <ProductCard
                  key={related.id}
                  product={related}
                  onViewDetails={onViewProduct}
                  onAddToCart={(p) => onAddToCart(p, 'M', p.colors?.[0] || 'Standard', 1)}
                  showQuickActions={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── 6. Mobile Sticky Buy Bar ── */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-neutral-200 p-3 lg:hidden z-50 safe-area-bottom shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-2 max-w-lg mx-auto">
            
            {/* Quick Price/Size indicator */}
            <div className="px-2">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">Size {selectedSize}</span>
              <span className="text-sm font-black text-neutral-900">
                {formatCurrency(product.price * quantity)}
              </span>
            </div>

            {/* Add to Bag */}
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className="flex-1 bg-white hover:bg-neutral-50 text-neutral-900 border-2 border-neutral-900 h-11 rounded-xl font-black uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Bag</span>
            </button>

            {/* Buy Now (Direct Checkout) */}
            <button
              onClick={handleBuyNow}
              disabled={!product.inStock}
              className="flex-[1.5] bg-[#111] hover:bg-black text-white h-11 rounded-xl font-black uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-1.5 shadow-md"
            >
              <span>Buy Now</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>

            {/* View Bag icon button */}
            {onGoToCart && (
              <button
                onClick={onGoToCart}
                className="w-11 h-11 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                aria-label="View Cart"
              >
                <ShoppingBag className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        
        <BottomSpacer />
      </div>
    </div>
  );
}

export default ProductDetail;
