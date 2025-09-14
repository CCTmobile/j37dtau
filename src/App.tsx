import { useState, useMemo } from 'react';
import { Home } from './components/Home';
import { ProductDetail } from './components/ProductDetail';
import { Cart } from './components/Cart';
import { Profile } from './components/Profile';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminAccountSettings } from './components/admin/AdminAccountSettings';
import { InformationCenter } from './components/info/InformationCenter';
import { Footer } from './components/Footer';
import Header from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Rewards } from './components/Rewards';
import { Checkout } from './components/Checkout';
import { Toaster } from './components/ui/sonner';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Star, Heart, Filter, Grid, List } from 'lucide-react';
import { toast } from 'sonner';
import { ThemeProvider } from './utils/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProductProvider, useProducts } from './contexts/ProductContext';
import { CartProvider, useCart } from './contexts/CartContext';
import { ContentProvider } from './contexts/ContentContext';
import { AuthModal } from './components/AuthModal';
import { ProductImage } from './components/ui/responsive-image';
import { BottomSpacer } from './components/ui/bottom-spacer';
import { ToastProvider } from './components/notifications/ToastProvider';
import { ImageDebugger } from './components/debug/ImageDebugger';
import { FloatingChatButton } from './components/ChatNotificationBell';

export type User = {
  id: string;
  email: string;
  name: string;
  phone?: string;
  membershipTier: 'Bronze' | 'Silver' | 'Gold';
  points: number;
  created_at?: string;
  last_login?: string;
  preferences: {
    sizes: string[];
    colors: string[];
    styles: string[];
  };
};

export type Product = {
  id: string;
  name: string;
  category: 'Shoes' | 'Casual' | 'Outwear' | 'Party' | 'Dresses' | 'Accessories';
  price: number;
  originalPrice?: number;
  images: string[];
  sizes: string[];
  colors: string[];
  description: string;
  reviews: Review[];
  rating: number;
  inStock: boolean;
};

export type Review = {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
};

export type CartItem = {
  productId: string;
  product: Product;
  size: string;
  color: string;
  quantity: number;
};

// Inline ProductCatalog component to bypass file corruption issue
function ProductCatalog({
  searchQuery,
  selectedCategory,
  onViewProduct,
  onCategoryChange
}: {
  searchQuery: string;
  selectedCategory: string;
  onViewProduct: (product: Product) => void;
  onCategoryChange: (category: string) => void;
}) {
  const { products, loading } = useProducts();
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set());

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory && selectedCategory !== 'All') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    switch (sortBy) {
      case 'price-low':
        filtered = filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered = filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered = filtered.sort((a, b) => b.rating - a.rating);
        break;
      default:
        break;
    }

    return filtered;
  }, [products, searchQuery, selectedCategory, sortBy]);

  const toggleLike = (productId: string) => {
    const newLiked = new Set(likedProducts);
    if (newLiked.has(productId)) {
      newLiked.delete(productId);
    } else {
      newLiked.add(productId);
    }
    setLikedProducts(newLiked);
  };

  return (
    <div className="container mx-auto px-6 py-6 pb-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">
            {selectedCategory === 'All' ? 'All Products' : selectedCategory}
          </h2>
          <p className="text-muted-foreground">
            {filteredProducts.length} products found
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>

          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      <div className={viewMode === 'grid' 
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-24" 
        : "space-y-4 pb-24"
      }>
        {filteredProducts.map((product) => (
          <Card 
            key={product.id} 
            className={`group cursor-pointer hover:shadow-lg transition-all duration-300 ${
              viewMode === 'list' ? 'flex' : 'flex flex-col h-full'
            }`}
            onClick={() => onViewProduct(product)}
          >
            <CardContent className={`p-0 ${viewMode === 'grid' ? 'flex flex-col h-full' : ''}`}>
              <div className={`relative overflow-hidden ${
                viewMode === 'list' ? 'w-32 flex-shrink-0' : 'rounded-t-lg flex-shrink-0'
              }`}>
                <ProductImage
                  images={product.images}
                  name={product.name}
                  className={viewMode === 'list' ? 'w-32 h-32' : 'w-full aspect-[4/3]'}
                  priority={true}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-background"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    toggleLike(product.id);
                  }}
                >
                  <Heart className={`h-4 w-4 ${likedProducts.has(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
                {product.originalPrice && product.originalPrice !== product.price && (
                  <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground">
                    {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                  </Badge>
                )}
              </div>
              
              <div className={`space-y-2 ${viewMode === 'list' ? 'p-4 flex-1' : 'p-4 flex-1 flex flex-col justify-between'}`}>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium line-clamp-2 flex-1 min-w-0">{product.name}</h4>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Image thumbnails as tiny circles - only show if there are multiple images */}
                    {product.images.length > 1 && (
                      <div className="flex gap-0.5 max-w-[60px] flex-wrap">
                        {product.images.slice(0, 5).map((image, index) => (
                          <div
                            key={index}
                            className="w-5 h-5 rounded-full overflow-hidden border border-gray-300 flex-shrink-0"
                            style={{ minWidth: '20px', minHeight: '20px' }}
                          >
                            <img
                              src={image}
                              alt=""
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        ))}
                        {product.images.length > 5 && (
                          <div className="w-5 h-5 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center flex-shrink-0">
                            <span className="text-[8px] text-gray-600 font-bold leading-none">
                              +
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    {!product.inStock && (
                      <Badge variant="secondary" className="text-xs ml-1">
                        Out of Stock
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm text-muted-foreground">
                    {product.rating} ({product.reviews.length})
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="font-semibold">R{product.price}</span>
                  {product.originalPrice && product.originalPrice !== product.price && (
                    <span className="text-sm text-muted-foreground line-through">
                      R{product.originalPrice}
                    </span>
                  )}
                </div>
                
                <div className="flex gap-1">
                  {product.colors.slice(0, 4).map((color) => (
                    <div
                      key={color}
                      className={`w-4 h-4 rounded-full border-2 border-gray-300 ${
                        color.toLowerCase() === 'black' ? 'bg-black' :
                        color.toLowerCase() === 'white' ? 'bg-white' :
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
                  ))}
                  {product.colors.length > 4 && (
                    <span className="text-xs text-muted-foreground">
                      +{product.colors.length - 4}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-medium mb-2">No products found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search or filter criteria
          </p>
          <Button onClick={() => onCategoryChange('All')}>
            Clear filters
          </Button>
        </div>
      )}
      
      <BottomSpacer />
    </div>
  );
}

function AppContent() {
  const { user, isAdmin } = useAuth();
  const { products } = useProducts();
  const { items, addItem, updateItemQuantity, removeItem, fetchCart } = useCart();
  const [currentPage, setCurrentPage] = useState<'home' | 'catalog' | 'product' | 'cart' | 'profile' | 'rewards' | 'checkout' | 'admin' | 'info' | 'debug'>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [infoPage, setInfoPage] = useState<string>('about');
  const [authModalConfig, setAuthModalConfig] = useState({
    mode: 'login' as 'login' | 'signup',
    title: 'Sign In Required',
    description: 'Please sign in to continue'
  });

  const requireAuth = (action: () => void, title?: string, description?: string) => {
    if (user) {
      action();
    } else {
      setAuthModalConfig({
        mode: 'login',
        title: title || 'Sign In Required',
        description: description || 'Please sign in to continue'
      });
      setShowAuthModal(true);
    }
  };

  const viewProduct = (product: Product) => {
    setSelectedProduct(product);
    setCurrentPage('product');
  };

  const navigateToCategory = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage('catalog');
  };

  const handleProceedToCheckout = () => {
    requireAuth(() => setCurrentPage('checkout'), 'Checkout', 'Please sign in to proceed with your order.');
  };

  const handleProfileClick = () => {
    requireAuth(() => setCurrentPage('profile'), 'My Account', 'Please sign in to view your profile.');
  };

  const handleRewardsClick = () => {
    requireAuth(() => setCurrentPage('rewards'), 'My Rewards', 'Please sign in to view your rewards.');
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    toast.success(`Welcome back!`);
    if (authModalConfig.title.includes('Checkout')) {
      setCurrentPage('checkout');
    } else if (authModalConfig.title.includes('Profile')) {
      setCurrentPage('profile');
    } else if (authModalConfig.title.includes('Rewards')) {
      setCurrentPage('rewards');
    }
  };

  const handlePageChange = (page: string) => {
    const targetPage = page as typeof currentPage;
    if (['profile', 'rewards', 'admin'].includes(targetPage)) {
      if (targetPage === 'profile') handleProfileClick();
      if (targetPage === 'rewards') handleRewardsClick();
      if (targetPage === 'admin' && isAdmin) setCurrentPage('admin');
    } else {
      setCurrentPage(targetPage);
    }
  };

  // Wrapper functions to adapt CartContext functions to Cart component expectations
  const handleUpdateQuantity = async (productId: string, size: string, color: string, quantity: number) => {
    console.log('handleUpdateQuantity called:', { productId, size, color, quantity });
    
    // Find the cart item that matches the productId, size, and color
    const cartItem = items.find(item => 
      item.productId === productId && 
      item.size === size && 
      item.color === color
    );
    
    if (cartItem) {
      // Use | as separator since UUIDs contain hyphens
      const identifier = `${productId}|${size}|${color}`;
      console.log('Updating item with identifier:', identifier, 'to quantity:', quantity);
      const success = await updateItemQuantity(identifier, quantity);
      console.log('Update result:', success);
      if (!success) {
        toast.error('Failed to update item quantity');
      }
    } else {
      console.log('Item not found in cart for quantity update');
      toast.error('Item not found in cart');
    }
  };

  const handleRemoveItem = async (productId: string, size: string, color: string) => {
    console.log('handleRemoveItem called:', { productId, size, color });
    
    // Find the cart item that matches the productId, size, and color
    const cartItem = items.find(item => 
      item.productId === productId && 
      item.size === size && 
      item.color === color
    );
    
    console.log('Found cart item:', cartItem);
    console.log('Current items:', items);
    
    if (cartItem) {
      // For guest carts, we can use productId as identifier since guest cart items don't have database IDs
      // For authenticated users, we need to use a composite identifier or update CartContext to handle criteria
      // Use | as separator since UUIDs contain hyphens
      const identifier = `${productId}|${size}|${color}`;
      console.log('Removing item with identifier:', identifier);
      const success = await removeItem(identifier);
      console.log('Remove result:', success);
      if (!success) {
        toast.error('Failed to remove item from cart');
      }
    } else {
      console.log('Item not found in cart');
      toast.error('Item not found in cart');
    }
  };

  const handleNavigateToInfo = (page: string) => {
    setInfoPage(page);
    setCurrentPage('info');
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <Home
            onViewProduct={viewProduct}
            onNavigateToCategory={navigateToCategory}
          />
        );
      case 'catalog':
        return (
          <ProductCatalog
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            onViewProduct={viewProduct}
            onCategoryChange={setSelectedCategory}
          />
        );
      case 'product':
        return selectedProduct ? (
          <ProductDetail
            product={selectedProduct}
            onBack={() => setCurrentPage('catalog')}
            onAddToCart={addItem}
          />
        ) : null;
      case 'cart':
        return (
          <Cart
            items={items}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onProceedToCheckout={handleProceedToCheckout}
            onContinueShopping={() => setCurrentPage('catalog')}
          />
        );
      case 'checkout':
        return (
          <Checkout
            user={user} // Can be null for guest checkout
            items={items}
            onOrderComplete={() => {
              setCurrentPage('home');
              toast.success('Order placed successfully!');
            }}
            onBack={() => setCurrentPage('cart')}
          />
        );
    case 'profile':
      return user ? (
        isAdmin ? (
          <AdminAccountSettings />
        ) : (
          <Profile 
            onLogout={() => {}} 
            onNavigateToInfo={handleNavigateToInfo}
          />
        )
      ) : null;
      case 'rewards':
        return user ? <Rewards /> : null;
      case 'admin':
        return isAdmin ? <AdminDashboard /> : null;
      case 'info':
        return <InformationCenter onBack={() => setCurrentPage('home')} initialPage={infoPage} />;
      case 'debug':
        return <ImageDebugger />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        onSearch={setSearchQuery}
        onProfileClick={handleProfileClick}
        onInfoClick={() => {
          setInfoPage('about');
          setCurrentPage('info');
        }}
      />

      <main className="flex-1 pb-28 md:pb-4">
        {renderCurrentPage()}
      </main>

      <Footer onInfoClick={(page) => {
        setInfoPage(page);
        setCurrentPage('info');
      }} />

      <BottomNav
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />

      <AuthModal
        isOpen={showAuthModal}
        mode={authModalConfig.mode}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={handleAuthSuccess}
        onSignupSuccess={handleAuthSuccess}
        title={authModalConfig.title}
        description={authModalConfig.description}
        onSwitchMode={(newMode) => setAuthModalConfig(prev => ({ ...prev, mode: newMode }))}
      />

      {/* Floating Chat Button - Available on all pages for quick access */}
      <FloatingChatButton />

      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProductProvider>
        <CartProvider>
          <ContentProvider>
            <ThemeProvider>
              <ToastProvider position="top-right" maxToasts={5}>
                <AppContent />
              </ToastProvider>
            </ThemeProvider>
          </ContentProvider>
        </CartProvider>
      </ProductProvider>
    </AuthProvider>
  );
}
