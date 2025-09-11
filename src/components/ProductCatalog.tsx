import React, { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Star, Grid, List, Filter, SortAsc, Search, X, Heart } from 'lucide-react';
import { Input } from './ui/input';
import { ProductImage } from './ui/responsive-image';
import { ProductCard } from './ui/ProductCard';
import { useProducts } from '../contexts/ProductContext';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import type { Product } from '../App';

interface ProductCatalogProps {
  searchQuery: string;
  selectedCategory: string;
  onViewProduct: (product: Product) => void;
  onCategoryChange: (category: string) => void;
}

export function ProductCatalog({
  searchQuery,
  selectedCategory,
  onViewProduct,
  onCategoryChange
}: ProductCatalogProps) {
  const { products } = useProducts();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set());
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const availableColors = [...new Set(products.flatMap(p => p.colors))];

  // Handler functions for ProductCard
  const handleAddToCart = async (product: Product) => {
    try {
      console.log('🛒 ProductCatalog: Adding product to cart:', product.id, product.name);
      
      // Default values for quick add to cart from catalog
      const defaultSize = 'M';
      const defaultColor = product.colors[0] || 'Default';
      const quantity = 1;
      
      const success = await addItem(product, defaultSize, defaultColor, quantity);
      
      if (success) {
        console.log('✅ ProductCatalog: Product added to cart successfully');
        // You could add a toast notification here
      } else {
        console.error('❌ ProductCatalog: Failed to add product to cart');
      }
    } catch (error) {
      console.error('❌ ProductCatalog: Error adding product to cart:', error);
    }
  };

  const handleViewDetails = (product: Product) => {
    console.log('👁️ ProductCatalog: Viewing product details:', product.id, product.name);
    onViewProduct(product);
  };

  const handleToggleWishlist = (product: Product) => {
    console.log('❤️ ProductCatalog: Toggling wishlist for product:', product.id, product.name);
    
    setLikedProducts(prev => {
      const newLiked = new Set(prev);
      if (newLiked.has(product.id)) {
        newLiked.delete(product.id);
        console.log('💔 ProductCatalog: Removed from wishlist');
      } else {
        newLiked.add(product.id);
        console.log('💖 ProductCatalog: Added to wishlist');
      }
      return newLiked;
    });
  };

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory && selectedCategory !== 'All') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Price filter
    filtered = filtered.filter(product =>
      product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    // Color filter
    if (selectedColors.length > 0) {
      filtered = filtered.filter(product =>
        selectedColors.some(color => product.colors.includes(color))
      );
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        // Assuming products with higher IDs are newer
        filtered.sort((a, b) => parseInt(b.id) - parseInt(a.id));
        break;
      default:
        break;
    }

    return filtered;
  }, [products, searchQuery, selectedCategory, sortBy, priceRange, selectedColors]);

  const toggleLike = (productId: string) => {
    const newLiked = new Set(likedProducts);
    if (newLiked.has(productId)) {
      newLiked.delete(productId);
    } else {
      newLiked.add(productId);
    }
    setLikedProducts(newLiked);
  };

  const clearFilters = () => {
    setPriceRange([0, 500]);
    setSelectedColors([]);
    onCategoryChange('All');
  };

  return (
    <div className="container mx-auto px-6 py-6 pb-24">
      {/* Header with Filters Toggle */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {selectedCategory === 'All' ? 'All Products' : selectedCategory}
          </h2>
          <p className="text-muted-foreground">
            {filteredProducts.length} products found
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* View Toggle */}
          <div className="border rounded-lg p-1">
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

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background text-sm"
          >
            <option value="featured">Featured</option>
            <option value="newest">Newest First</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-primary/10' : ''}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Price Range */}
              <div>
                <label className="font-medium mb-3 block">Price Range</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                      className="w-20"
                    />
                    <span className="self-center">-</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                      className="w-20"
                    />
                  </div>
                </div>
              </div>

              {/* Colors */}
              <div>
                <label className="font-medium mb-3 block">Colors</label>
                <div className="flex flex-wrap gap-2">
                  {availableColors.slice(0, 8).map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColors(prev =>
                        prev.includes(color)
                          ? prev.filter(c => c !== color)
                          : [...prev, color]
                      )}
                      className={`px-3 py-1 text-xs border rounded-full transition-colors ${
                        selectedColors.includes(color)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-muted border-border'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-end gap-2">
                <Button onClick={clearFilters} variant="outline">
                  <X className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
                <Button onClick={() => setShowFilters(false)}>
                  Apply
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Grid/List */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No products found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search or filter criteria
          </p>
          <Button onClick={clearFilters}>
            Clear all filters
          </Button>
        </div>
      ) : (
        <div className={`grid gap-6 ${
          viewMode === 'grid'
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            : 'grid-cols-1'
        }`}>
          {filteredProducts.map((product) => {
            // Debug product rendering in catalog
            console.log('🛍️ ProductCatalog: Rendering product:', {
              id: product.id,
              name: product.name,
              price: product.price,
              originalPrice: product.originalPrice,
              category: product.category,
              imageCount: product.images?.length || 0,
              rating: product.rating,
              colors: product.colors,
              inStock: product.inStock,
              viewMode
            });

            if (viewMode === 'list') {
              // List view - enhanced list layout with theme compatibility
              return (
                <Card
                  key={product.id}
                  className="group cursor-pointer hover:shadow-lg transition-all duration-300 flex 
                           bg-background/70 dark:bg-card/80 hover:bg-background dark:hover:bg-card/95
                           border border-border dark:border-border/50"
                  onClick={() => onViewProduct(product)}
                >
                  <CardContent className="p-0 flex">
                    {/* Product Image - List View - Made taller (64px → 72px) */}
                    <div className="relative overflow-hidden w-60 flex-shrink-0">
                      <ProductImage
                        images={product.images}
                        name={product.name}
                        className="w-60 h-60" 
                        priority={true}
                      />

                      {/* Like Button - Theme-aware */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm 
                                hover:bg-background dark:bg-card/80 dark:hover:bg-card"
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                          e.stopPropagation();
                          toggleLike(product.id);
                        }}
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            likedProducts.has(product.id) ? 'fill-red-500 text-red-500' : 'text-foreground'
                          }`}
                        />
                      </Button>

                      {/* Sale Badge - More visible in dark mode */}
                      {product.originalPrice && (
                        <Badge className="absolute top-2 left-2 bg-rose-500 text-white dark:bg-rose-600 dark:text-white">
                          Sale
                        </Badge>
                      )}

                      {/* Out of Stock Overlay - Theme-aware with better contrast */}
                      {!product.inStock && (
                        <div className="absolute inset-0 bg-black/60 dark:bg-black/70 flex items-center justify-center">
                          <span className="text-white font-medium px-3 py-1 bg-black/40 backdrop-blur-sm rounded">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Product Details - List View - Enhanced with better spacing */}
                    <div className="p-6 flex-1 space-y-3">
                      {/* Category & Stock */}
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs bg-secondary/80 text-secondary-foreground">
                          {product.category}
                        </Badge>
                        {!product.inStock && (
                          <Badge variant="outline" className="text-xs text-rose-500 dark:text-rose-400 border-rose-200 dark:border-rose-800">
                            Out of Stock
                          </Badge>
                        )}
                      </div>

                      {/* Title - Better typography */}
                      <h4 className="font-semibold text-lg line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                        {product.name}
                      </h4>

                      {/* Rating - Theme compatible */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < Math.floor(product.rating)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300 dark:text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {product.rating} ({product.reviews.length})
                        </span>
                      </div>

                      {/* Colors - Theme compatible */}
                      <div className="flex gap-1">
                        {product.colors.slice(0, 4).map((color) => (
                          <div
                            key={color}
                            className={`w-5 h-5 rounded-full border-2 ${
                              color.toLowerCase() === 'black' ? 'bg-black border-gray-300 dark:border-gray-600' :
                              color.toLowerCase() === 'white' ? 'bg-white border-gray-400' :
                              color.toLowerCase() === 'gray' ? 'bg-gray-400 border-gray-500' :
                              color.toLowerCase() === 'navy' ? 'bg-blue-900 border-blue-800' :
                              color.toLowerCase() === 'brown' ? 'bg-amber-800 border-amber-700' :
                              color.toLowerCase() === 'beige' ? 'bg-amber-100 border-amber-200' :
                              color.toLowerCase() === 'pink' ? 'bg-pink-400 border-pink-500' :
                              color.toLowerCase() === 'blue' ? 'bg-blue-500 border-blue-600' :
                              color.toLowerCase() === 'red' ? 'bg-red-500 border-red-600' :
                              'bg-green-500 border-green-600'
                            }`}
                            title={color}
                          />
                        ))}
                        {product.colors.length > 4 && (
                          <span className="text-xs text-muted-foreground self-center ml-1">
                            +{product.colors.length - 4}
                          </span>
                        )}
                      </div>

                      {/* Price - Enhanced for better visibility */}
                      <div className="flex items-center gap-2 pt-1">
                        <span className="font-bold text-lg text-foreground">R{product.price}</span>
                        {product.originalPrice && (
                          <span className="text-sm text-muted-foreground line-through">
                            R{product.originalPrice}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            } else {
              // Grid view - use the enhanced ProductCard with aspect ratio
              return (
                <div key={product.id}>
                  <ProductCard
                    product={product}
                    layout="enhanced"
                    showQuickActions={true}
                    onAddToCart={handleAddToCart}
                    onViewDetails={handleViewDetails}
                    onToggleWishlist={handleToggleWishlist}
                    className="shadow-md hover:shadow-xl transition-shadow duration-300
                               bg-background/70 dark:bg-card/80 hover:bg-background dark:hover:bg-card/95
                               border border-border dark:border-border/50"
                  />
                </div>
              );
            }
          })}
        </div>
      )}

      {/* Load More Button */}
      {filteredProducts.length > 12 && (
        <div className="text-center mt-8">
          <Button variant="outline" size="lg">
            Load More Products
          </Button>
        </div>
      )}
    </div>
  );
}
