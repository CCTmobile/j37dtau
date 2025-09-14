import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Star, ChevronRight, Sparkles, TrendingUp, Heart } from 'lucide-react';
import { ResponsiveImage } from './ui/responsive-image';
import { ProductCard } from './ui/ProductCard';
import { TrustpilotWidget } from './ui/TrustpilotWidget';
import type { Product, User } from '../App';
import { useProducts } from '../contexts/ProductContext';
import { useAuth } from '../contexts/AuthContext';
import { BottomSpacer } from './ui/bottom-spacer';
import { useCart } from '../contexts/CartContext';

interface HomeProps {
  onViewProduct: (product: Product) => void;
  onNavigateToCategory: (category: string) => void;
}

export function Home({ onViewProduct, onNavigateToCategory }: HomeProps) {
  const { products } = useProducts();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set());

  // Debug logging for Home component state
  console.log('🏠 Home Component Debug:', {
    totalProducts: products.length,
    featuredProductsCount: products.slice(0, 4).length,
    saleProductsCount: products.filter(p => p.originalPrice && p.price < p.originalPrice).length,
    userLoggedIn: !!user,
    likedProductsCount: likedProducts.size
  });

  const categories = [
    { name: 'Dresses', icon: '👗', color: 'bg-pink-100 dark:bg-pink-900/30' },
    { name: 'Casual', icon: '👕', color: 'bg-blue-100 dark:bg-blue-900/30' },
    { name: 'Shoes', icon: '👠', color: 'bg-purple-100 dark:bg-purple-900/30' },
    { name: 'Outwear', icon: '🧥', color: 'bg-orange-100 dark:bg-orange-900/30' },
    { name: 'Party', icon: '✨', color: 'bg-yellow-100 dark:bg-yellow-900/30' },
    { name: 'Accessories', icon: '👜', color: 'bg-green-100 dark:bg-green-900/30' }
  ];

  const featuredProducts = products.slice(0, 4);
  const saleProducts = products.filter(p => p.originalPrice).slice(0, 3);

  // Enhanced handler functions with debugging and error handling
  const handleAddToCart = async (product: Product) => {
    try {
      console.log('🛒 Home: Adding product to cart:', product.id, product.name);
      
      // Default values for quick add to cart from home page
      const defaultSize = 'M';
      const defaultColor = 'Default';
      const quantity = 1;
      
      const success = await addItem(product, defaultSize, defaultColor, quantity);
      
      if (success) {
        console.log('✅ Home: Product added to cart successfully');
        // You could add a toast notification here
      } else {
        console.error('❌ Home: Failed to add product to cart');
      }
    } catch (error) {
      console.error('❌ Home: Error adding product to cart:', error);
    }
  };

  const handleViewDetails = (product: Product) => {
    console.log('👁️ Home: Viewing product details:', product.id, product.name);
    onViewProduct(product);
  };

  const handleToggleWishlist = (product: Product) => {
    console.log('❤️ Home: Toggling wishlist for product:', product.id, product.name);
    
    setLikedProducts(prev => {
      const newLiked = new Set(prev);
      if (newLiked.has(product.id)) {
        newLiked.delete(product.id);
        console.log('💔 Home: Removed from wishlist');
      } else {
        newLiked.add(product.id);
        console.log('💖 Home: Added to wishlist');
      }
      return newLiked;
    });
  };

  const toggleLike = (productId: string) => {
    const newLiked = new Set(likedProducts);
    if (newLiked.has(productId)) {
      newLiked.delete(productId);
    } else {
      newLiked.add(productId);
    }
    setLikedProducts(newLiked);
  };

  const getPersonalizedMessage = () => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    
    if (user) {
      return `${greeting}, ${user.name.split(' ')[0]}! `;
    }
    
    return `${greeting}! Welcome to Rosemama`;
  };

  return (
    <div className="space-y-8 pb-24">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary/5 to-secondary/10 dark:from-primary/10 dark:to-secondary/20 px-6 py-16 rounded-b-3xl overflow-hidden">
        <div className="absolute inset-0 bg-dots-pattern opacity-50"></div>
        <div className="container mx-auto text-center space-y-4 relative">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            <span className="text-sm font-medium text-primary bg-primary/10 dark:bg-primary/20 px-3 py-1 rounded-full">
              {user ? 'Personalized for You' : 'Latest Collection'}
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
            {getPersonalizedMessage()}
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-lg leading-relaxed">
            {user
              ? "Your fashion journey awaits with personalized recommendations tailored just for you."
              : "Explore our curated collection of premium fashion pieces. Sign in to unlock exclusive rewards and personalized recommendations!"
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button onClick={() => onNavigateToCategory('All')} size="lg" className="group transform hover:scale-105 transition-all duration-300">
              <span className="mr-2">Shop Collection</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            {user && (
              <Button variant="outline" size="lg" onClick={() => onNavigateToCategory('Sale')} className="group transform hover:scale-105 transition-all duration-300">
                <span className="mr-2">View Offers</span>
                <TrendingUp className="h-4 w-4 group-hover:rotate-12 transition-transform" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="px-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Shop by Category</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {categories.map((category) => (
            <Button
              key={category.name}
              variant="ghost"
              className="h-auto p-4 flex-col gap-2 hover:scale-105 transition-transform dark:hover:bg-accent/50"
              onClick={() => onNavigateToCategory(category.name)}
            >
              <div className={`w-12 h-12 rounded-full ${category.color} flex items-center justify-center text-xl dark:text-foreground`}>
                {category.icon}
              </div>
              <span className="text-xs text-foreground">{category.name}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Featured Products */}
      <div className="px-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            {user ? 'Recommended for You' : 'Featured Products'}
          </h3>
        </div>
        {/* Enhanced Featured Products Grid with tall ProductCard layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {featuredProducts.map((product) => {
            // Debug featured product rendering
            console.log('🌟 Home: Rendering featured product:', {
              id: product.id,
              name: product.name,
              price: product.price,
              originalPrice: product.originalPrice,
              category: product.category,
              imageCount: product.images?.length || 0,
              rating: product.rating,
              reviewCount: product.reviews?.length || 0
            });

            return (
              <div key={product.id} className="h-[480px]"> {/* Matches tall ProductCard height */}
                <ProductCard
                  product={product}
                  layout="enhanced"
                  showQuickActions={true}
                  onAddToCart={handleAddToCart}
                  onViewDetails={handleViewDetails}
                  onToggleWishlist={handleToggleWishlist}
                  className="h-full shadow-lg hover:shadow-xl transition-shadow duration-300"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Enhanced Flash Sale with ProductCard Components */}
      {saleProducts.length > 0 && (
        <div className="px-4 md:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-destructive/10 to-orange-100 dark:from-destructive/20 dark:to-orange-900/30 rounded-2xl p-4 md:p-6 lg:p-8 mt-6 md:mt-8">
            {/* Flash Sale Header */}
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="flex items-center gap-3">
                <div className="text-2xl animate-bounce">🔥</div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold text-destructive dark:text-destructive-foreground">⚡ Flash Sale</h3>
                  <p className="text-sm text-muted-foreground">⏰ Limited time offers! Ends soon.</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('🔍 Home: View All Flash Sale clicked');
                  onNavigateToCategory('All');
                }}
                className="dark:border-border dark:hover:bg-accent"
              >
                View All
              </Button>
            </div>

            {/* Enhanced Product Cards Grid optimized for tall layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mb-6">
              {saleProducts.map((product) => {
                // Debug product rendering
                console.log('🛍️ Home: Rendering flash sale product:', {
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  originalPrice: product.originalPrice,
                  category: product.category,
                  imageCount: product.images?.length || 0,
                  rating: product.rating,
                  reviewCount: product.reviews?.length || 0
                });

                return (
                  <div key={product.id} className="h-[480px]"> {/* Matches tall ProductCard height */}
                    <ProductCard
                      product={product}
                      layout="enhanced"
                      showQuickActions={true}
                      onAddToCart={handleAddToCart}
                      onViewDetails={handleViewDetails}
                      onToggleWishlist={handleToggleWishlist}
                      className="h-full shadow-lg hover:shadow-xl transition-shadow duration-300"
                    />
                  </div>
                );
              })}
            </div>

            {/* Sale Information Footer */}
            <div className="border-t border-border/50 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 bg-destructive rounded-full animate-pulse"></div>
                  <span>Up to 70% OFF</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 bg-destructive rounded-full animate-pulse"></div>
                  <span>Limited Stock</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 bg-destructive rounded-full animate-pulse"></div>
                  <span>Sale ends in 2 days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Why Shop With Us */}
      <div className="px-4 md:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-2">Why Shop at Rosemama?</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">Discover what makes us your premier fashion destination</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center bg-secondary/30 dark:bg-secondary/10 rounded-xl p-4 md:p-6">
            <div className="text-3xl mb-3">🚚</div>
            <h4 className="font-semibold text-foreground mb-2">Free Shipping</h4>
            <p className="text-sm text-muted-foreground">Free delivery on Orders over R3500</p>
          </div>

          <div className="text-center bg-secondary/30 dark:bg-secondary/10 rounded-xl p-4 md:p-6">
            <div className="text-3xl mb-3">🔒</div>
            <h4 className="font-semibold text-foreground mb-2">Secure Payments</h4>
            <p className="text-sm text-muted-foreground">100% secure checkout protected</p>
          </div>

          <div className="text-center bg-secondary/30 dark:bg-secondary/10 rounded-xl p-4 md:p-6">
            <div className="text-3xl mb-3">🛍️</div>
            <h4 className="font-semibold text-foreground mb-2">Curated Collections</h4>
            <p className="text-sm text-muted-foreground">Exclusive fashion pieces selected just for you</p>
          </div>

          <div className="text-center bg-secondary/30 dark:bg-secondary/10 rounded-xl p-4 md:p-6">
            <div className="text-3xl mb-3">👑</div>
            <h4 className="font-semibold text-foreground mb-2">Premium Quality</h4>
            <p className="text-sm text-muted-foreground">curated fashion</p>
          </div>
        </div>
      </div>

      {/* Real Customer Reviews - Trustpilot Widget */}
      <div className="px-4 md:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10 rounded-2xl p-4 md:p-8">
          <div className="text-center mb-8">
            <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-2">What Our Customers Say</h3>
            <p className="text-muted-foreground">Real reviews from verified customers</p>
          </div>

          {/* Trustpilot Service Review Widget */}
          <div className="flex justify-center">
            <TrustpilotWidget
              widgetType="review-carousel"
              width="100%"
              height="200"
              className="max-w-4xl"
            />
          </div>

          {/* Trust Score Display */}
          <div className="text-center mt-6">
            <div className="inline-flex items-center gap-3 bg-white/70 dark:bg-card/70 px-6 py-3 rounded-full border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">T</span>
                </div>
                <span className="font-semibold text-foreground">Trustpilot</span>
              </div>
              <div className="h-4 w-px bg-border"></div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground">Be the first to review us!</span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 text-gray-300 dark:text-gray-600" />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action for Reviews */}
          <div className="text-center mt-4">
            <p className="text-sm text-muted-foreground mb-3">
              Help other fashion lovers by sharing your experience
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://www.trustpilot.com/review/rosemamaclothing.store', '_blank')}
              className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700 hover:text-green-800"
            >
              <Star className="h-4 w-4 mr-1" />
              Write a Review
            </Button>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="px-4 md:px-6 lg:px-8">
        <div className="text-center bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 rounded-2xl p-6 md:p-8">
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Join Our Fashion Community</h3>
          <p className="text-muted-foreground mb-6 text-lg">Get exclusive access to flash sales, new arrivals, and personalized recommendations</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {!user && (
              <Button size="lg" onClick={() => {}} className="group">
                <div className="flex items-center gap-2">
                  <span>Sign In to Get Started</span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Button>
            )}
            <Button variant="outline" size="lg" onClick={() => onNavigateToCategory('All')}>
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
      
      <BottomSpacer />
    </div>
  );
}
