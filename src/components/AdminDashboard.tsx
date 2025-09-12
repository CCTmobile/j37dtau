import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { MetricsCards } from './admin/MetricsCards';
import { SalesChart } from './admin/SalesChart';
import { CategoryChart } from './admin/CategoryChart';
import { OrdersTable } from './admin/OrdersTable';
import { ProductForm } from './admin/ProductForm';
import { ProductList } from './admin/ProductList';
import { AdminAccountSettings } from './admin/AdminAccountSettings';
import { ContentManager } from './info/admin/ContentManager';
import { useProducts } from '../contexts/ProductContext';
import type { Product } from '../App';
import { BottomSpacer } from './ui/bottom-spacer';

interface AdminDashboardProps {
  defaultTab?: string;
}

export function AdminDashboard({ defaultTab = "overview" }: AdminDashboardProps) {
  const { products, fetchAllProducts } = useProducts();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  // Fetch all products (including inactive ones) for admin on mount
  useEffect(() => {
    fetchAllProducts();
  }, [fetchAllProducts]);

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowEditForm(true);
  };

  const handleCreateSuccess = () => {
    // Refresh products list for admin
    fetchAllProducts();
    setEditingProduct(null);
    setShowEditForm(false);
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setShowEditForm(false);
  };

  const handleRefreshProducts = () => {
    fetchAllProducts();
  };

  return (
    <div className="container mx-auto px-6 py-6 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage your store and view analytics</p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 h-auto p-1 bg-muted rounded-lg">
          <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Overview</TabsTrigger>
          <TabsTrigger value="products" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Products</TabsTrigger>
          <TabsTrigger value="orders" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Orders</TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Analytics</TabsTrigger>
          <TabsTrigger value="content" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Content</TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <MetricsCards products={products} />
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <OrdersTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ProductForm onSuccess={handleCreateSuccess} />
            <div className="lg:col-span-2">
              <ProductList
                products={products}
                onEditProduct={handleEditProduct}
                onRefresh={handleRefreshProducts}
              />
            </div>
          </div>

          {/* Edit Product Dialog */}
          <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Product</DialogTitle>
              </DialogHeader>
              {editingProduct && (
                <ProductForm
                  mode="edit"
                  product={editingProduct}
                  onSuccess={handleCreateSuccess}
                  onCancel={handleCancelEdit}
                />
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>All Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <OrdersTable showActions />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SalesChart />
            <CategoryChart />
          </div>
        </TabsContent>

        <TabsContent value="content">
          <ContentManager />
        </TabsContent>

        <TabsContent value="settings">
          <AdminAccountSettings />
        </TabsContent>
      </Tabs>
      <BottomSpacer />
    </div>
  );
}