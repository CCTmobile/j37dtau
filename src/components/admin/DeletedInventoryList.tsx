import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { RotateCcw, Trash2, Search, Eye, Star, Archive, Palette, Ruler, AlertTriangle, Grid3X3, List, Calendar } from 'lucide-react';
import { ResponsiveImage } from '../ui/responsive-image';
import { toast } from 'sonner';
import { restoreProduct, permanentlyDeleteProduct } from '../../utils/supabase/client';
import type { Product } from '../../App';

interface DeletedInventoryListProps {
  products: Product[];
  onRefresh?: () => void;
}

export function DeletedInventoryList({ products, onRefresh }: DeletedInventoryListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleRestoreProduct = async (productId: string, productName: string) => {
    try {
      console.log('🔄 Restoring product:', { productId, productName });
      const success = await restoreProduct(productId);
      
      if (success) {
        toast.success(`Product "${productName}" restored successfully`);
        onRefresh?.();
      } else {
        toast.error('Failed to restore product');
      }
    } catch (error) {
      console.error('❌ Error restoring product:', error);
      toast.error('Failed to restore product');
    }
  };

  const handlePermanentDelete = async (productId: string, productName: string) => {
    try {
      console.log('💀 Permanently deleting product:', { productId, productName });
      const success = await permanentlyDeleteProduct(productId);
      
      if (success) {
        toast.success(`Product "${productName}" permanently deleted`);
        onRefresh?.();
      } else {
        toast.error('Failed to permanently delete product');
      }
    } catch (error) {
      console.error('❌ Error permanently deleting product:', error);
      toast.error('Failed to permanently delete product');
    }
  };

  const formatPrice = (price: number, originalPrice?: number) => {
    if (originalPrice && originalPrice > price) {
      return (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg">R{price.toFixed(2)}</span>
          <span className="text-sm text-muted-foreground line-through">R{originalPrice.toFixed(2)}</span>
          <Badge variant="destructive" className="text-xs">
            {Math.round((1 - price / originalPrice) * 100)}% OFF
          </Badge>
        </div>
      );
    }
    return <span className="font-semibold text-lg">R{price.toFixed(2)}</span>;
  };

  const formatDeletedDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="bg-neutral-900/60 backdrop-blur border-neutral-800 border-orange-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-orange-500" />
            Deleted Inventory ({filteredProducts.length})
          </CardTitle>
          <Badge variant="secondary" className="bg-orange-500/20 text-orange-300">
            Archived Products
          </Badge>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search deleted products..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              <SelectItem value="Casual">Casual</SelectItem>
              <SelectItem value="Party">Party</SelectItem>
              <SelectItem value="Shoes">Shoes</SelectItem>
              <SelectItem value="Outwear">Outwear</SelectItem>
              <SelectItem value="Dresses">Dresses</SelectItem>
              <SelectItem value="Accessories">Accessories</SelectItem>
            </SelectContent>
          </Select>
          
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="w-full">
        {viewMode === 'grid' ? (
          // Grid layout
          <div className="w-full">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 w-full">
              {filteredProducts.map((product) => (
                <DeletedProductGridItem
                  key={product.id}
                  product={product}
                  onRestore={handleRestoreProduct}
                  onPermanentDelete={handlePermanentDelete}
                  onView={(product) => setSelectedProduct(product)}
                  formatPrice={formatPrice}
                  formatDeletedDate={formatDeletedDate}
                />
              ))}
            </div>
          </div>
        ) : (
          // List layout
          <div className="w-full">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-800/70 text-neutral-300">
                  <tr className="*:[&>th]:font-medium">
                    <th className="px-3 py-2 text-left uppercase tracking-wide">Product</th>
                    <th className="px-3 py-2 text-left uppercase tracking-wide hidden md:table-cell">Category</th>
                    <th className="px-3 py-2 text-left uppercase tracking-wide">Price</th>
                    <th className="px-3 py-2 text-left uppercase tracking-wide hidden lg:table-cell">Deleted</th>
                    <th className="px-3 py-2 text-left uppercase tracking-wide hidden lg:table-cell">Details</th>
                    <th className="px-3 py-2 text-left uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {filteredProducts.map((product) => (
                    <DeletedProductListItem
                      key={product.id}
                      product={product}
                      onRestore={handleRestoreProduct}
                      onPermanentDelete={handlePermanentDelete}
                      onView={(product) => setSelectedProduct(product)}
                      formatPrice={formatPrice}
                      formatDeletedDate={formatDeletedDate}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Archive className="h-12 w-12 text-orange-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No deleted products found</h3>
            <p className="text-gray-500">
              {products.length === 0
                ? "No products have been deleted yet."
                : "Try adjusting your search or filter criteria."}
            </p>
          </div>
        )}
      </CardContent>

      {/* Product Detail Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-orange-500" />
              Deleted Product Details
            </DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <Badge variant="secondary" className="bg-orange-500/20 text-orange-300">
                Deleted on {formatDeletedDate((selectedProduct as any).deleted_at)}
              </Badge>
              {/* Use the same ProductDetailModal structure but with restore/delete actions */}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Individual deleted product list item component
interface DeletedProductListItemProps {
  product: Product;
  onRestore?: (productId: string, productName: string) => void;
  onPermanentDelete?: (productId: string, productName: string) => void;
  onView?: (product: Product) => void;
  formatPrice: (price: number, originalPrice?: number) => React.ReactElement;
  formatDeletedDate: (dateString: string) => string;
}

function DeletedProductListItem({ 
  product, 
  onRestore, 
  onPermanentDelete, 
  onView, 
  formatPrice, 
  formatDeletedDate 
}: DeletedProductListItemProps) {
  return (
    <tr className="hover:bg-neutral-800/40 transition-colors opacity-70">
      {/* Product Info */}
      <td className="px-3 py-3 align-top">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-12 w-12 rounded-md overflow-hidden bg-neutral-700 relative">
            <ResponsiveImage
              src={product.images[0] || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiByeD0iOCIgZmlsbD0iI2Y5ZmFmYiIgc3Ryb2tlPSIjYWNhYmRhIiBzdHJva2Utd2lkdGg9IjIiLz4KPHRleHQgeD0iNDAiIHk9IjQwIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzk3OTdhNyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K'}
              alt={product.name}
              className="h-12 w-12 object-cover grayscale"
              priority={true}
            />
            <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
              <Archive className="h-4 w-4 text-red-400" />
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-semibold text-neutral-300 max-w-[10rem] md:max-w-xs truncate" title={product.name}>
              {product.name}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-neutral-400">{product.rating}</span>
            </div>
          </div>
        </div>
      </td>

      {/* Category */}
      <td className="px-3 py-3 hidden md:table-cell align-top">
        <Badge variant="secondary" className="text-[10px] tracking-wide uppercase opacity-70">
          {product.category}
        </Badge>
      </td>

      {/* Price */}
      <td className="px-3 py-3 align-top">
        <div className="text-sm text-neutral-300 opacity-70">
          {formatPrice(product.price, product.originalPrice)}
        </div>
      </td>

      {/* Deleted Date */}
      <td className="px-3 py-3 hidden lg:table-cell align-top">
        <div className="text-[11px] text-neutral-400">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDeletedDate((product as any).deleted_at)}
          </div>
        </div>
      </td>

      {/* Details */}
      <td className="px-3 py-3 hidden lg:table-cell align-top text-[11px] text-neutral-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Ruler className="h-3 w-3" />
            {product.sizes.length} sizes
          </span>
          <span className="flex items-center gap-1">
            <Palette className="h-3 w-3" />
            {product.colors.length} colors
          </span>
        </div>
      </td>

      {/* Actions */}
      <td className="px-3 py-3 align-top text-right text-sm font-medium">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView?.(product)}
            className="h-8 w-8 p-0 bg-neutral-800/60 hover:bg-neutral-700 border-neutral-700"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRestore?.(product.id, product.name)}
            className="h-8 w-8 p-0 bg-green-800/60 hover:bg-green-700 border-green-700 text-green-400 hover:text-green-300"
            title="Restore product"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-red-400 hover:text-red-300 h-8 w-8 p-0 bg-red-800/60 hover:bg-red-700 border-red-700"
                title="Permanently delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Permanently Delete Product
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to permanently delete "{product.name}"? 
                  <br /><br />
                  <strong>This action cannot be undone and will:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Completely remove the product from the database</li>
                    <li>Delete all associated images</li>
                    <li>Remove all references from order history</li>
                  </ul>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onPermanentDelete?.(product.id, product.name)}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg border-red-600 focus:ring-red-500 focus:ring-2"
                >
                  Permanently Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </td>
    </tr>
  );
}

// Individual deleted product grid item component
interface DeletedProductGridItemProps {
  product: Product;
  onRestore?: (productId: string, productName: string) => void;
  onPermanentDelete?: (productId: string, productName: string) => void;
  onView?: (product: Product) => void;
  formatPrice: (price: number, originalPrice?: number) => React.ReactElement;
  formatDeletedDate: (dateString: string) => string;
}

function DeletedProductGridItem({ 
  product, 
  onRestore, 
  onPermanentDelete, 
  onView, 
  formatPrice, 
  formatDeletedDate 
}: DeletedProductGridItemProps) {
  return (
    <div className="border border-orange-800/40 rounded-lg overflow-hidden hover:shadow-lg hover:shadow-orange-900/30 transition-shadow bg-neutral-900/70 backdrop-blur w-full min-w-0 opacity-70">
      {/* Product Image */}
      <div className="relative w-full aspect-square bg-neutral-800 overflow-hidden">
        <ResponsiveImage
          src={product.images[0] || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiByeD0iOCIgZmlsbD0iI2Y5ZmFmYiIgc3Ryb2tlPSIjYWNhYmRhIiBzdHJva2Utd2lkdGg9IjIiLz4KPHRleHQgeD0iNDAiIHk9IjQwIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzk3OTdhNyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K'}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover grayscale"
          priority={true}
        />
        
        {/* Deleted Badge */}
        <div className="absolute top-2 right-2">
          <div className="px-2 py-1 rounded text-[10px] font-medium backdrop-blur-md bg-orange-500/20 text-orange-300">
            Deleted
          </div>
        </div>

        {/* Archive Icon Overlay */}
        <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <Archive className="h-8 w-8 text-red-400" />
        </div>
      </div>

      {/* Product Details */}
      <div className="p-3 space-y-2 w-full min-w-0">
        {/* Product Name and Category */}
        <div className="w-full min-w-0">
          <h3 className="font-medium text-sm truncate w-full text-neutral-300" title={product.name}>
            {product.name}
          </h3>
          <Badge variant="secondary" className="text-[10px] mt-1 uppercase tracking-wide opacity-70">
            {product.category}
          </Badge>
        </div>

        {/* Price */}
        <div className="text-sm font-semibold text-neutral-300 opacity-70">
          R{product.price.toFixed(2)}
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-xs text-neutral-500 line-through ml-2">
              R{product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Deleted Date */}
        <div className="text-[10px] text-orange-400">
          Deleted: {formatDeletedDate((product as any).deleted_at)}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-1 pt-1 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView?.(product)}
            className="text-[11px] h-7 px-2 bg-neutral-800/60 hover:bg-neutral-700 border-neutral-700"
          >
            <Eye className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRestore?.(product.id, product.name)}
            className="text-[11px] h-7 px-2 bg-green-800/60 hover:bg-green-700 border-green-700 text-green-400 hover:text-green-300"
            title="Restore"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-red-400 hover:text-red-300 text-[11px] h-7 px-2 bg-red-800/60 hover:bg-red-700 border-red-700"
                title="Permanently delete"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Permanently Delete Product
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to permanently delete "{product.name}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onPermanentDelete?.(product.id, product.name)}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg border-red-600 focus:ring-red-500 focus:ring-2"
                >
                  Permanently Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}