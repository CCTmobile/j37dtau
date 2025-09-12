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
      const success = await deleteProduct(productId);
      if (success) {
        toast.success(`Product "${productName}" deleted successfully`);
        onRefresh?.();
      } else {
        toast.error('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
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
    <Card>
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

      <CardContent className="w-full overflow-hidden">
        {viewMode === 'grid' ? (
          // Grid layout with proper containment
          <div className="w-full overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 w-full">
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
          // List layout with proper containment
          <div className="w-full overflow-hidden">
            <div className="space-y-4 w-full">
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
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4 w-full min-w-0">
        {/* Product Image */}
        <div className="w-full sm:w-12 h-24 sm:h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
          <ResponsiveImage
            src={product.images[0] || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiByeD0iOCIgZmlsbD0iI2Y5ZmFmYiIgc3Ryb2tlPSIjYWNhYmRhIiBzdHJva2Utd2lkdGg9IjIiLz4KPHRleHQgeD0iNDAiIHk9IjQwIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzk3OTdhNyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K'}
            alt={product.name}
            className="w-full h-full object-cover"
            priority={true}
          />
        </div>

        {/* Basic Product Info */}
        <div className="flex-1 min-w-0 w-full">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 w-full min-w-0">
            <div className="mb-2 sm:mb-0 min-w-0 flex-1">
              <h3 className="font-semibold text-lg truncate w-full" title={product.name}>
                {product.name}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="secondary">{product.category}</Badge>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm text-muted-foreground">
                    {product.rating} ({product.reviews.length} reviews)
                  </span>
                </div>
              </div>
            </div>
            <div className="text-left sm:text-right flex-shrink-0 sm:ml-4">
              {formatPrice(product.price, product.originalPrice)}
              <p className="text-sm text-muted-foreground mt-1">
                {product.images.length} image{product.images.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Sizes and Colors */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-2 w-full">
            <div className="flex items-center gap-1">
              <Ruler className="h-4 w-4" />
              <span>{product.sizes.length} sizes</span>
            </div>
            <div className="flex items-center gap-1">
              <Palette className="h-4 w-4" />
              <span>{product.colors.length} colors</span>
            </div>
            <div className="flex items-center gap-1">
              <Package className="h-4 w-4" />
              <span className={product.inStock ? 'text-green-600' : 'text-red-600'}>
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
          </div>

          {/* Description Preview */}
          <p className="text-sm text-muted-foreground line-clamp-2 w-full min-w-0">
            {product.description || 'No description available'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-row sm:flex-col gap-2 justify-center sm:items-center flex-shrink-0 sm:ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView?.(product)}
            className="flex-1 sm:flex-none"
          >
            <Eye className="h-4 w-4 mr-1 sm:mr-0" />
            <span className="sm:hidden">View</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit?.(product)}
            className="flex-1 sm:flex-none"
          >
            <Edit className="h-4 w-4 mr-1 sm:mr-0" />
            <span className="sm:hidden">Edit</span>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 flex-1 sm:flex-none">
                <Trash2 className="h-4 w-4 mr-1 sm:mr-0" />
                <span className="sm:hidden">Delete</span>
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
                  className="bg-red-600 hover:bg-red-700"
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
    <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-black text-white w-full min-w-0">
      {/* Product Image */}
      <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden">
        <ResponsiveImage
          src={product.images[0] || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiByeD0iOCIgZmlsbD0iI2Y5ZmFmYiIgc3Ryb2tlPSIjYWNhYmRhIiBzdHJva2Utd2lkdGg9IjIiLz4KPHRleHQgeD0iNDAiIHk9IjQwIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzk3OTdhNyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K'}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          priority={true}
        />
      </div>

      {/* Product Details */}
      <div className="p-3 space-y-2 w-full min-w-0">
        {/* Product Name and Price */}
        <div className="w-full min-w-0">
          <h3 className="font-semibold text-sm truncate w-full" title={product.name}>
            {product.name}
          </h3>
          <div className="flex items-center justify-between mt-1 w-full">
            <Badge variant="secondary" className="text-xs flex-shrink-0">
              {product.category}
            </Badge>
            <div className="text-right flex-shrink-0 ml-2">
              <div className="text-sm font-semibold">
                R{product.price.toFixed(2)}
              </div>
              {product.originalPrice && product.originalPrice > product.price && (
                <div className="text-xs text-muted-foreground line-through">
                  R{product.originalPrice.toFixed(2)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground w-full">
          <div className="flex items-center gap-1 flex-shrink-0">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span>{product.rating}</span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Package className="h-3 w-3" />
            <span className={product.inStock ? 'text-green-600' : 'text-red-600'}>
              {product.inStock ? 'Stock' : 'Out'}
            </span>
          </div>
        </div>

        {/* Attributes Row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground w-full">
          <div className="flex items-center gap-1 flex-shrink-0">
            <Ruler className="h-3 w-3" />
            <span>{product.sizes.length} sizes</span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Palette className="h-3 w-3" />
            <span>{product.colors.length} colors</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-1 pt-2 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView?.(product)}
            className="text-xs h-7 px-2"
          >
            <Eye className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit?.(product)}
            className="text-xs h-7 px-2"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 text-xs h-7 px-2">
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
                  className="bg-red-600 hover:bg-red-700"
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
