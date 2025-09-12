import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Edit, Trash2, Search, Eye, Star, Package, Palette, Ruler, AlertTriangle, Grid3X3, List } from 'lucide-react';
import { ResponsiveImage } from '../ui/responsive-image';
import { toast } from 'sonner';
import { deleteProduct } from '../../utils/supabase/client';
import type { Product } from '../../App';

interface ProductListProps {
  products: Product[];
  onEditProduct?: (product: Product) => void;
  onRefresh?: () => void;
}

export function ProductList({ products, onEditProduct, onRefresh }: ProductListProps) {
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

  const handleDeleteProduct = async (productId: string, productName: string) => {
    try {
      console.log('🗑️ Attempting to delete product:', { productId, productName });
      const success = await deleteProduct(productId);
      console.log('🗑️ Delete result:', success);
      
      if (success) {
        toast.success(`Product "${productName}" deleted successfully`);
        console.log('🔄 Calling onRefresh...');
        onRefresh?.();
      } else {
        toast.error('Failed to delete product');
        console.error('❌ Delete function returned false');
      }
    } catch (error) {
      console.error('❌ Error deleting product:', error);
      toast.error('Failed to delete product');
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

  return (
    <Card className="bg-neutral-900/60 backdrop-blur border-neutral-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Product Inventory ({filteredProducts.length})</CardTitle>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search products..."
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
          // Grid layout with compact cards
          <div className="w-full">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 w-full">
              {filteredProducts.map((product) => (
                <ProductGridItem
                  key={product.id}
                  product={product}
                  onEdit={onEditProduct}
                  onDelete={handleDeleteProduct}
                  onView={(product) => setSelectedProduct(product)}
                  formatPrice={formatPrice}
                />
              ))}
            </div>
          </div>
        ) : (
          // List layout - proper table format
          <div className="w-full">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-800/70 text-neutral-300">
                  <tr className="*:[&>th]:font-medium">
                    <th className="px-3 py-2 text-left uppercase tracking-wide">Product</th>
                    <th className="px-3 py-2 text-left uppercase tracking-wide hidden md:table-cell">Category</th>
                    <th className="px-3 py-2 text-left uppercase tracking-wide">Price</th>
                    <th className="px-3 py-2 text-left uppercase tracking-wide hidden sm:table-cell">Stock</th>
                    <th className="px-3 py-2 text-left uppercase tracking-wide hidden lg:table-cell">Details</th>
                    <th className="px-3 py-2 text-left uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {filteredProducts.map((product) => (
                    <ProductListItem
                      key={product.id}
                      product={product}
                      onEdit={onEditProduct}
                      onDelete={handleDeleteProduct}
                      onView={(product) => setSelectedProduct(product)}
                      formatPrice={formatPrice}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">
              {products.length === 0
                ? "No products in inventory yet. Add your first product to get started."
                : "Try adjusting your search or filter criteria."}
            </p>
          </div>
        )}
      </CardContent>

      {/* Product Detail Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {selectedProduct && <ProductDetailModal product={selectedProduct} />}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Individual product list item component
interface ProductListItemProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string, productName: string) => void;
  onView?: (product: Product) => void;
  formatPrice: (price: number, originalPrice?: number) => React.ReactElement;
}

function ProductListItem({ product, onEdit, onDelete, onView, formatPrice }: ProductListItemProps) {
  return (
    <tr className="hover:bg-neutral-800/40 transition-colors">
      {/* Product Info */}
      <td className="px-3 py-3 align-top">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-12 w-12 rounded-md overflow-hidden bg-neutral-700">
            <ResponsiveImage
              src={product.images[0] || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiByeD0iOCIgZmlsbD0iI2Y5ZmFmYiIgc3Ryb2tlPSIjYWNhYmRhIiBzdHJva2Utd2lkdGg9IjIiLz4KPHRleHQgeD0iNDAiIHk9IjQwIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzk3OTdhNyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K'}
              alt={product.name}
              className="h-12 w-12 object-cover"
              priority={true}
            />
          </div>
          <div className="ml-4">
            <div className="text-sm font-semibold text-neutral-200 max-w-[10rem] md:max-w-xs truncate" title={product.name}>
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
        <Badge variant="secondary" className="text-[10px] tracking-wide uppercase">
          {product.category}
        </Badge>
      </td>

      {/* Price */}
      <td className="px-3 py-3 align-top">
        <div className="text-sm text-neutral-200">
          {formatPrice(product.price, product.originalPrice)}
        </div>
      </td>

      {/* Stock */}
      <td className="px-3 py-3 hidden sm:table-cell align-top">
        <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
          product.inStock ? 'bg-green-500/15 text-green-300' : 'bg-red-500/15 text-red-300'
        }`}>
          {product.inStock ? 'In Stock' : 'Out'}
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
          <span className="hidden xl:inline">{product.images.length} img</span>
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
            onClick={() => onEdit?.(product)}
            className="h-8 w-8 p-0 bg-neutral-800/60 hover:bg-neutral-700 border-neutral-700"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-red-400 hover:text-red-300 h-8 w-8 p-0 bg-neutral-800/60 hover:bg-neutral-700 border-neutral-700">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Product</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{product.name}"? This action cannot be undone and will also delete all associated images.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete?.(product.id, product.name)}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg border-red-600 focus:ring-red-500 focus:ring-2 relative z-10"
                >
                  Delete Product
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </td>
    </tr>
  );
}

// Individual product grid item component for responsive mobile layout
interface ProductGridItemProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string, productName: string) => void;
  onView?: (product: Product) => void;
  formatPrice: (price: number, originalPrice?: number) => React.ReactElement;
}

function ProductGridItem({ product, onEdit, onDelete, onView, formatPrice }: ProductGridItemProps) {
  return (
    <div className="border border-neutral-800 rounded-lg overflow-hidden hover:shadow-lg hover:shadow-black/30 transition-shadow bg-neutral-900/70 backdrop-blur w-full min-w-0">
      {/* Product Image */}
      <div className="relative w-full aspect-square bg-neutral-800 overflow-hidden">
        <ResponsiveImage
          src={product.images[0] || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiByeD0iOCIgZmlsbD0iI2Y5ZmFmYiIgc3Ryb2tlPSIjYWNhYmRhIiBzdHJva2Utd2lkdGg9IjIiLz4KPHRleHQgeD0iNDAiIHk9IjQwIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzk3OTdhNyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K'}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          priority={true}
        />
        
        {/* Stock Badge */}
        <div className="absolute top-2 right-2">
          <div className={`px-2 py-1 rounded text-[10px] font-medium backdrop-blur-md ${
            product.inStock ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
          }`}>
            {product.inStock ? 'Stock' : 'Out'}
          </div>
        </div>
      </div>

      {/* Product Details */}
      <div className="p-3 space-y-2 w-full min-w-0">
        {/* Product Name and Category */}
        <div className="w-full min-w-0">
          <h3 className="font-medium text-sm truncate w-full text-neutral-200" title={product.name}>
            {product.name}
          </h3>
          <Badge variant="secondary" className="text-[10px] mt-1 uppercase tracking-wide">
            {product.category}
          </Badge>
        </div>

        {/* Price */}
        <div className="text-sm font-semibold text-neutral-100">
          R{product.price.toFixed(2)}
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-xs text-neutral-500 line-through ml-2">
              R{product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-[11px] text-neutral-400 w-full">
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span>{product.rating}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Ruler className="h-3 w-3" />
              {product.sizes.length}
            </span>
            <span className="flex items-center gap-1">
              <Palette className="h-3 w-3" />
              {product.colors.length}
            </span>
          </div>
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
            onClick={() => onEdit?.(product)}
            className="text-[11px] h-7 px-2 bg-neutral-800/60 hover:bg-neutral-700 border-neutral-700"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-red-400 hover:text-red-300 text-[11px] h-7 px-2 bg-neutral-800/60 hover:bg-neutral-700 border-neutral-700">
                <Trash2 className="h-3 w-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Product</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{product.name}"? This action cannot be undone and will also delete all associated images.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete?.(product.id, product.name)}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg border-red-600 focus:ring-red-500 focus:ring-2 relative z-10"
                >
                  Delete Product
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

// Product detail modal component
interface ProductDetailModalProps {
  product: Product;
}

function ProductDetailModal({ product }: ProductDetailModalProps) {
  return (
    <div className="space-y-6">
      {/* Main Product Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <ResponsiveImage
            src={product.images[0] || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiByeD0iOCIgZmlsbD0iI2Y5ZmFmYiIgc3Ryb2tlPSIjYWNhYmRhIiBzdHJva2Utd2lkdGg9IjIiLz4KPHRleHQgeD0iMjAwIiB5PSIxNTAiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjIwIiBmaWxsPSIjOTc5N2E3IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+Cjwvc3ZnPgo='}
            alt={product.name}
            className="w-full h-64 object-cover rounded-lg"
            priority={true}
          />
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2 mt-4">
              {product.images.slice(1, 5).map((image: string, index: number) => (
                <ResponsiveImage
                  key={index}
                  src={image}
                  alt={`${product.name} ${index + 2}`}
                  className="w-full h-16 object-cover rounded"
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">{product.name}</h2>
            <p className="text-muted-foreground">{product.category}</p>
          </div>

          <div>
            <p className="text-sm font-medium mb-1">Price</p>
            {product.originalPrice && product.originalPrice > product.price ? (
              <div>
                <span className="text-2xl font-bold text-green-600">R{product.price.toFixed(2)}</span>
                <span className="text-lg text-muted-foreground line-through ml-2">R{product.originalPrice.toFixed(2)}</span>
                <Badge className="ml-2" variant="destructive">
                  {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                </Badge>
              </div>
            ) : (
              <span className="text-2xl font-bold">R{product.price.toFixed(2)}</span>
            )}
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Stock Status</p>
            <Badge variant={product.inStock ? "default" : "destructive"}>
              {product.inStock ? "In Stock" : "Out of Stock"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Additional Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h3 className="font-medium mb-2">Available Sizes</h3>
          <div className="flex flex-wrap gap-1">
            {product.sizes.map((size: string) => (
              <Badge key={size} variant="outline">{size}</Badge>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2">Available Colors</h3>
          <div className="flex flex-wrap gap-1">
            {product.colors.map((color: string) => (
              <Badge key={color} variant="outline">{color}</Badge>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2">Rating & Reviews</h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm">{product.rating} ({product.reviews.length} reviews)</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <h3 className="font-medium mb-2">Description</h3>
        <p className="text-muted-foreground">{product.description || 'No description available'}</p>
      </div>
    </div>
  );
}
