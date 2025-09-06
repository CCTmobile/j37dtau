import { useState, useMemo } from 'react';
import { Home } from './components/Home';
import { ProductDetail } from './components/ProductDetail';
import { Cart } from './components/Cart';
import { Profile } from './components/Profile';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminAccountSettings } from './components/admin/AdminAccountSettings';
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
import { AuthModal } from './components/AuthModal';
import { ProductImage } from './components/ui/responsive-image';

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
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
        : "space-y-4"
      }>
        {filteredProducts.map((product) => (
          <Card 
            key={product.id} 
            className={`group cursor-pointer hover:shadow-lg transition-all duration-300 ${
              viewMode === 'list' ? 'flex' : ''
            }`}
            onClick={() => onViewProduct(product)}
          >
            <CardContent className="p-0">
              <div className={`relative overflow-hidden ${
                viewMode === 'list' ? 'w-32 flex-shrink-0' : 'rounded-t-lg'
              }`}>
                <ProductImage
                  images={product.images}
                  name={product.name}
                  className={viewMode === 'list' ? 'w-32 h-32' : 'w-full h-48'}
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
                {product.originalPrice && (
                  <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground">
                    Sale
                  </Badge>
                )}
              </div>
              
              <div className={`space-y-2 ${viewMode === 'list' ? 'p-4 flex-1' : 'p-4'}`}>
                <div className="flex items-start justify-between">
                  <h4 className="font-medium line-clamp-2">{product.name}</h4>
                  {!product.inStock && (
                    <Badge variant="secondary" className="text-xs">
                      Out of Stock
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm text-muted-foreground">
                    {product.rating} ({product.reviews.length})
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="font-semibold">R{product.price}</span>
                  {product.originalPrice && (
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
    </div>
  );
}

function AppContent() {
  const { user, isAdmin } = useAuth();
  const { products } = useProducts();
  const { items, addItem, updateItemQuantity, removeItem } = useCart();
  const [currentPage, setCurrentPage] = useState<'home' | 'catalog' | 'product' | 'cart' | 'profile' | 'rewards' | 'checkout' | 'admin'>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
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
    // Find the cart item that matches the productId, size, and color
    const cartItem = items.find(item =>
      item.productId === productId &&
      item.size === size &&
      item.color === color
    );

    if (cartItem) {
      // We need to create a unique cart item ID. For now, we'll use a combination of productId, size, and color
      // In a real implementation, this should come from the backend
      const cartItemId = `${productId}-${size}-${color}`;
      await updateItemQuantity(cartItemId, quantity);
    }
  };

  const handleRemoveItem = async (productId: string, size: string, color: string) => {
    // Find the cart item that matches the productId, size, and color
    const cartItem = items.find(item =>
      item.productId === productId &&
      item.size === size &&
      item.color === color
    );

    if (cartItem) {
      // We need to create a unique cart item ID. For now, we'll use a combination of productId, size, and color
      // In a real implementation, this should come from the backend
      const cartItemId = `${productId}-${size}-${color}`;
      await removeItem(cartItemId);
    }
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
          />
        );
      case 'checkout':
        return user ? (
          <Checkout
            user={user}
            items={items}
            onOrderComplete={() => {
              setCurrentPage('home');
              toast.success('Order placed successfully!');
            }}
            onBack={() => setCurrentPage('cart')}
          />
        ) : null;
    case 'profile':
      return user ? (
        isAdmin ? (
          <AdminAccountSettings />
        ) : (
          <Profile onLogout={() => {}} />
        )
      ) : null;
      case 'rewards':
        return user ? <Rewards /> : null;
      case 'admin':
        return isAdmin ? <AdminDashboard products={products} /> : null;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        onSearch={setSearchQuery}
        onProfileClick={handleProfileClick}
      />

      <main className="flex-1 pb-20 md:pb-4">
        {renderCurrentPage()}
      </main>

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

      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProductProvider>
        <CartProvider>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </CartProvider>
      </ProductProvider>
    </AuthProvider>
  );
}
