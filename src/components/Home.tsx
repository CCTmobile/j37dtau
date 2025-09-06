import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Star, ChevronRight, Sparkles, TrendingUp, Heart } from 'lucide-react';
import { ResponsiveImage } from './ui/responsive-image';
import type { Product, User } from '../App';
import { useProducts } from '../contexts/ProductContext';
import { useAuth } from '../contexts/AuthContext';

interface HomeProps {
  onViewProduct: (product: Product) => void;
  onNavigateToCategory: (category: string) => void;
}

export function Home({ onViewProduct, onNavigateToCategory }: HomeProps) {
  const { products } = useProducts();
  const { user } = useAuth();
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set());

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <Card key={product.id} className="group cursor-pointer hover:shadow-lg transition-all duration-300 dark:bg-card dark:hover:bg-card/80">
              <CardContent className="p-0">
                <div className="relative overflow-hidden rounded-t-lg">
                  <ResponsiveImage
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    priority={true}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-background dark:bg-card/80 dark:hover:bg-card"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      toggleLike(product.id);
                    }}
                  >
                    <Heart className={`h-4 w-4 ${likedProducts.has(product.id) ? 'fill-red-500 text-red-500' : 'text-foreground'}`} />
                  </Button>
                  {product.originalPrice && (
                    <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground">
                      Sale
                    </Badge>
                  )}
                </div>
                <div className="p-4 space-y-2" onClick={() => onViewProduct(product)}>
                  <h4 className="font-medium line-clamp-1 text-foreground">{product.name}</h4>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm text-muted-foreground">{product.rating}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">R{product.price}</span>
                    {product.originalPrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        R{product.originalPrice}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Flash Sale */}
      {saleProducts.length > 0 && (
        <div className="px-4 md:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-destructive/10 to-orange-100 dark:from-destructive/20 dark:to-orange-900/30 rounded-2xl p-4 md:p-6 lg:p-8 mt-6 md:mt-8">
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
                onClick={() => onNavigateToCategory('All')}
                className="dark:border-border dark:hover:bg-accent"
              >
                View All
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {saleProducts.map((product) => (
                <Card
                  key={product.id}
                  className="cursor-pointer hover:shadow-md transition-all duration-300 hover:scale-105 dark:bg-card dark:hover:bg-card/80"
                  onClick={() => onViewProduct(product)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <ResponsiveImage
                      src={product.images[0]}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                      priority={true}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium line-clamp-1 text-foreground">{product.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-semibold text-destructive dark:text-destructive-foreground">R{product.price}</span>
                        <span className="text-sm text-muted-foreground line-through">
                          R{product.originalPrice}
                        </span>
                        {product.originalPrice && (
                          <Badge variant="destructive" className="text-xs px-2 py-0.5">
                            -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Sale Information */}
            <div className="border-t border-border/50 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 bg-destructive rounded-full animate-pulse"></div>
                  <span>Up to 70% OFF</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 bg-destructiv rounded-full animate-pulse"></div>
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
            <p className="text-sm text-muted-foreground">Free delivery on orders over R500</p>
          </div>

          <div className="text-center bg-secondary/30 dark:bg-secondary/10 rounded-xl p-4 md:p-6">
            <div className="text-3xl mb-3">🔒</div>
            <h4 className="font-semibold text-foreground mb-2">Secure Payments</h4>
            <p className="text-sm text-muted-foreground">100% secure checkout protected</p>
          </div>

          <div className="text-center bg-secondary/30 dark:bg-secondary/10 rounded-xl p-4 md:p-6">
            <div className="text-3xl mb-3">↩️</div>
            <h4 className="font-semibold text-foreground mb-2">Easy Returns</h4>
            <p className="text-sm text-muted-foreground">30-day hassle-free returns</p>
          </div>

          <div className="text-center bg-secondary/30 dark:bg-secondary/10 rounded-xl p-4 md:p-6">
            <div className="text-3xl mb-3">👑</div>
            <h4 className="font-semibold text-foreground mb-2">Premium Quality</h4>
            <p className="text-sm text-muted-foreground">Carefully curated fashion items</p>
          </div>
        </div>
      </div>

      {/* Customer Reviews */}
      <div className="px-4 md:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10 rounded-2xl p-4 md:p-8">
          <div className="text-center mb-8">
            <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-2">What Our Customers Say</h3>
            <p className="text-muted-foreground">Real reviews from satisfied fashion lovers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-white/50 dark:bg-card/50 rounded-xl">
              <div className="flex justify-center mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground italic mb-3">"Amazing quality and fast delivery! My favorite online fashion store."</p>
              <p className="font-semibold text-foreground">- Sarah M.</p>
            </div>

            <div className="text-center p-4 bg-white/50 dark:bg-card/50 rounded-xl">
              <div className="flex justify-center mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground italic mb-3">"Great variety and the flash sales are incredible value!"</p>
              <p className="font-semibold text-foreground">- John D.</p>
            </div>

            <div className="text-center p-4 bg-white/50 dark:bg-card/50 rounded-xl">
              <div className="flex justify-center mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground italic mb-3">"Love the personalized recommendations and easy returns."</p>
              <p className="font-semibold text-foreground">- Lisa K.</p>
            </div>
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
    </div>
  );
}
