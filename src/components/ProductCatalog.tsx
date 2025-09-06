import React, { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Star, Grid, List, Filter, SortAsc, Search, X, Heart } from 'lucide-react';
import { Input } from './ui/input';
import { ProductImage } from './ui/responsive-image';
import { useProducts } from '../contexts/ProductContext';
import { useAuth } from '../contexts/AuthContext';
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
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set());
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const availableColors = [...new Set(products.flatMap(p => p.colors))];

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
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className={`group cursor-pointer hover:shadow-lg transition-all duration-300 ${
                viewMode === 'list' ? 'flex' : ''
              } dark:bg-card dark:hover:bg-card/80`}
              onClick={() => onViewProduct(product)}
            >
              <CardContent className="p-0">
                {/* Product Image */}
                <div className={`relative overflow-hidden ${
                  viewMode === 'list' ? 'w-48 flex-shrink-0' : 'rounded-t-lg'
                }`}>
                  <ProductImage
                    images={product.images}
                    name={product.name}
                    className={
                      viewMode === 'list'
                        ? 'w-48 h-48'
                        : 'w-full h-48'
                    }
                    priority={true}
                  />

                  {/* Like Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-background dark:bg-card/80 dark:hover:bg-card"
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

                  {/* Sale Badge */}
                  {product.originalPrice && (
                    <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground">
                      Sale
                    </Badge>
                  )}

                  {/* Out of Stock Overlay */}
                  {!product.inStock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-medium">Out of Stock</span>
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className={`space-y-2 ${viewMode === 'list' ? 'p-4 flex-1' : 'p-4'}`}>
                  {/* Category & Stock */}
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {product.category}
                    </Badge>
                    {!product.inStock && (
                      <Badge variant="secondary" className="text-xs text-red-600">
                        Out of Stock
                      </Badge>
                    )}
                  </div>

                  {/* Title */}
                  <h4 className="font-medium line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                    {product.name}
                  </h4>

                  {/* Rating */}
                  <div className="flex items-center gap-1">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < Math.floor(product.rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {product.rating} ({product.reviews.length})
                    </span>
                  </div>

                  {/* Colors */}
                  <div className="flex gap-1">
                    {product.colors.slice(0, 4).map((color) => (
                      <div
                        key={color}
                        className={`w-4 h-4 rounded-full border-2 border-gray-200 ${
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
                        title={color}
                      />
                    ))}
                    {product.colors.length > 4 && (
                      <span className="text-xs text-muted-foreground self-center ml-1">
                        +{product.colors.length - 4}
                      </span>
                    )}
                  </div>

                  {/* Price */}
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
