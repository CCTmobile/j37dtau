import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Package, Trash2, RotateCcw, Archive } from 'lucide-react';
import { ProductList } from './ProductList';
import { DeletedInventoryList } from './DeletedInventoryList';
import { getAllProducts, getDeletedProducts } from '../../utils/supabase/client';
import { toast } from 'sonner';
import type { Product } from '../../App';

interface ProductTabsProps {
  onEditProduct?: (product: Product) => void;
}

export function ProductTabs({ onEditProduct }: ProductTabsProps) {
  const [activeProducts, setActiveProducts] = useState<Product[]>([]);
  const [deletedProducts, setDeletedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');

  // Load both active and deleted products
  const loadProducts = async () => {
    setLoading(true);
    try {
      console.log('📦 ProductTabs: Loading products...');
      
      // Load active products
      const activeData = await getAllProducts();
      console.log('📦 ProductTabs: Active products loaded:', activeData.length);
      setActiveProducts(activeData);

      // Load deleted products
      const deletedData = await getDeletedProducts();
      console.log('🗑️ ProductTabs: Deleted products loaded:', deletedData.length);
      setDeletedProducts(deletedData);
      
    } catch (error) {
      console.error('❌ ProductTabs: Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  // Refresh function to reload both lists
  const handleRefresh = () => {
    console.log('🔄 ProductTabs: Refreshing products...');
    loadProducts();
  };

  if (loading) {
    return (
      <Card className="bg-neutral-900/60 backdrop-blur border-neutral-800">
        <CardContent className="p-6">
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Products...</h3>
            <p className="text-gray-500">Please wait while we fetch your inventory.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-r from-green-500/10 to-emerald-600/10 border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-green-500" />
              Active Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{activeProducts.length}</div>
            <p className="text-sm text-muted-foreground">Currently visible to customers</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500/10 to-red-600/10 border-orange-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Archive className="h-5 w-5 text-orange-500" />
              Deleted Inventory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{deletedProducts.length}</div>
            <p className="text-sm text-muted-foreground">Archived products</p>
          </CardContent>
        </Card>
      </div>

      {/* Product Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-neutral-800/60 backdrop-blur">
          <TabsTrigger 
            value="active" 
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white"
          >
            <Package className="h-4 w-4" />
            Active Products
            <Badge variant="secondary" className="ml-1">
              {activeProducts.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="deleted" 
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white"
          >
            <Archive className="h-4 w-4" />
            Deleted Inventory
            <Badge variant="secondary" className="ml-1">
              {deletedProducts.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          <ProductList
            products={activeProducts}
            onEditProduct={onEditProduct}
            onRefresh={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="deleted" className="mt-6">
          <DeletedInventoryList
            products={deletedProducts}
            onRefresh={handleRefresh}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}