import React, { useState, useMemo } from 'react';
import { Filter, SortAsc, Search, X, Grid, List } from 'lucide-react';
import { ProductCard } from './ui/ProductCard';
import { useProducts } from '../contexts/ProductContext';
import { useCart } from '../contexts/CartContext';
import { toast } from 'sonner';
import type { Product } from '../App';

interface ProductCatalogProps {
  searchQuery: string;
  selectedCategory: string;
  onViewProduct: (product: Product) => void;
  onCategoryChange: (category: string) => void;
}

const CATEGORIES = ['All', 'Dresses', 'Casual', 'Outwear', 'Party', 'Shoes', 'Accessories'];

export function ProductCatalog({
  searchQuery,
  selectedCategory,
  onViewProduct,
  onCategoryChange
}: ProductCatalogProps) {
  const { products } = useProducts();
  const { addItem } = useCart();
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const availableColors = [...new Set(products.flatMap(p => p.colors || []))];

  // Handler for quick add to cart
  const handleAddToCart = async (product: Product) => {
    try {
      const defaultSize = product.sizes?.[0] || 'M';
      const defaultColor = product.colors?.[0] || 'Default';
      const success = await addItem(product, defaultSize, defaultColor, 1);
      if (success) {
        toast.success(`Added ${product.name} to bag`);
      }
    } catch (error) {
      toast.error('Could not add to cart');
    }
  };

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(q) ||
        (product.category && product.category.toLowerCase().includes(q)) ||
        (product.description && product.description.toLowerCase().includes(q))
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
        selectedColors.some(color => product.colors?.includes(color))
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
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
        filtered.sort((a, b) => parseInt(b.id || '0') - parseInt(a.id || '0'));
        break;
      default:
        break;
    }

    return filtered;
  }, [products, searchQuery, selectedCategory, sortBy, priceRange, selectedColors]);

  const clearFilters = () => {
    setPriceRange([0, 10000]);
    setSelectedColors([]);
    onCategoryChange('All');
  };

  return (
    <div className="bg-[#f4f1eb] min-h-screen px-3 sm:px-6 py-6 pb-32">
      <div className="max-w-7xl mx-auto">
        
        {/* ── 1. Category Navigation Pills ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 scrollbar-none border-b border-neutral-300/40">
          {CATEGORIES.map((cat) => {
            const isActive = (selectedCategory || 'All') === cat;
            return (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-[#111] text-white shadow-md'
                    : 'bg-white/70 hover:bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200/60'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* ── 2. Header & Action Row ── */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight">
              {selectedCategory === 'All' ? 'All Pieces' : selectedCategory}
              <span className="font-light italic ml-2 text-neutral-500">Collection</span>
            </h1>
            <p className="text-xs font-medium text-neutral-500 mt-1 uppercase tracking-widest">
              Showing {filteredProducts.length} curated styles
            </p>
          </div>

          {/* Controls: Filter & Sort */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                showFilters || selectedColors.length > 0 || priceRange[1] < 10000
                  ? 'bg-[#111] text-white'
                  : 'bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300/80 shadow-xs'
              }`}
            >
              <Filter className="h-3 w-3" />
              <span>Filters</span>
              {(selectedColors.length > 0 || priceRange[1] < 10000) && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 ml-1" />
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white hover:bg-neutral-50 border border-neutral-300/80 text-neutral-800 text-xs font-bold uppercase tracking-wider px-3.5 py-2 pr-8 rounded-full outline-none transition-colors cursor-pointer shadow-xs"
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest Drops</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
              <SortAsc className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-neutral-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ── 3. Filters Drawer Panel ── */}
        {showFilters && (
          <div className="mb-8 p-5 sm:p-6 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-neutral-200/80 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Price Filter */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400 mb-3 block">
                  Price Range (ZAR)
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs font-bold">R</span>
                    <input
                      type="number"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                      className="w-full bg-neutral-100 border-none rounded-xl py-2 pl-7 pr-3 text-xs font-bold text-neutral-900 outline-none"
                    />
                  </div>
                  <span className="text-neutral-300 font-bold">—</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs font-bold">R</span>
                    <input
                      type="number"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                      className="w-full bg-neutral-100 border-none rounded-xl py-2 pl-7 pr-3 text-xs font-bold text-neutral-900 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Color Filter */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400 mb-3 block">
                  Color Filter
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {availableColors.slice(0, 10).map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColors(prev =>
                        prev.includes(color)
                          ? prev.filter(c => c !== color)
                          : [...prev, color]
                      )}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${
                        selectedColors.includes(color)
                          ? 'bg-[#111] text-white shadow-xs'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex justify-end items-center gap-3 mt-6 pt-4 border-t border-neutral-100">
              <button 
                onClick={clearFilters}
                className="text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-neutral-900 transition-colors"
              >
                Reset All
              </button>
              <button 
                onClick={() => setShowFilters(false)}
                className="bg-[#111] text-white text-xs font-bold uppercase tracking-wider px-5 py-2 rounded-full hover:bg-neutral-800 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        )}

        {/* ── 4. Unified Product Grid (Equal Heights) ── */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white/60 rounded-3xl border border-neutral-200/60 p-6">
            <Search className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-neutral-900 mb-1">No items found</h3>
            <p className="text-xs text-neutral-500 mb-5">
              Try modifying your search or clearing active filters.
            </p>
            <button 
              onClick={clearFilters}
              className="bg-[#111] text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-full hover:bg-neutral-800 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 items-stretch">
            {filteredProducts.map((product) => (
              <div key={product.id} className="h-full">
                <ProductCard
                  product={product}
                  showQuickActions={true}
                  onAddToCart={handleAddToCart}
                  onViewDetails={onViewProduct}
                  className="h-full"
                />
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

export default ProductCatalog;
