import { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Star,
  BarChart3,
  FileText,
  MessageSquare,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { MetricsCards } from './admin/MetricsCards';
import { SalesChart } from './admin/SalesChart';
import { CategoryChart } from './admin/CategoryChart';
import { OrdersTable } from './admin/OrdersTable';
import { ProductForm } from './admin/ProductForm';
import { ProductTabs } from './admin/ProductTabs';
import { AdminAccountSettings } from './admin/AdminAccountSettings';
import { ReviewManagement } from './admin/ReviewManagement';
import { ContentManager } from './info/admin/ContentManager';
import AdminChatDashboard from './admin/AdminChatDashboard';
import { ImageCropper } from './admin/ImageCropper';
import type { CropCompletionResult } from './admin/ImageCropper';
import type { CropImageContext, ProductFormRef } from './admin/ProductForm';
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
  const [croppingImage, setCroppingImage] = useState<CropImageContext | null>(null);
  const productFormRef = useRef<ProductFormRef>(null);
  const editProductFormRef = useRef<ProductFormRef>(null);

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

  const handleCropImage = (context: CropImageContext) => {
    const { index, src, type, form } = context;
    console.log('🎯 AdminDashboard: handleCropImage called:', { index, src: src.substring(0, 50) + '...', type, form });
    setCroppingImage(context);
  };

  const handleCropComplete = (result: CropCompletionResult) => {
    console.log('✅ AdminDashboard: handleCropComplete called:', {
      blobSize: result.blob.size,
      source: result.source,
      hasStoredRun: !!result.storedRun,
      croppingImage
    });
    if (croppingImage) {
      let targetRef: ProductFormRef | null = null;

      if (croppingImage.form === 'edit') {
        targetRef = editProductFormRef.current || null;
      } else {
        targetRef = productFormRef.current || null;
      }

      // Fallback if primary ref missing
      if (!targetRef) {
        targetRef = productFormRef.current || editProductFormRef.current;
      }

      if (targetRef) {
        console.log('🔄 Calling ProductForm.handleCropComplete via ref');
        targetRef.handleCropComplete(result, croppingImage);
        setCroppingImage(null);
      } else {
        console.error('❌ No ProductForm ref available for cropping');
      }
    } else {
      console.warn('⚠️ handleCropComplete called but no croppingImage set');
    }
  };

  return (
    <div className="container mx-auto px-6 py-6 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage your store and view analytics</p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
          <TabsList className="inline-flex h-auto p-1 bg-muted rounded-lg min-w-full lg:min-w-0">
            <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground px-4 py-2">
              <LayoutDashboard className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground px-4 py-2">
              <Package className="h-4 w-4" />
              <span>Products</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground px-4 py-2">
              <ShoppingBag className="h-4 w-4" />
              <span>Orders</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground px-4 py-2">
              <Star className="h-4 w-4" />
              <span>Reviews</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground px-4 py-2">
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground px-4 py-2">
              <FileText className="h-4 w-4" />
              <span>Content</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground px-4 py-2">
              <MessageSquare className="h-4 w-4" />
              <span>Messages</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground px-4 py-2">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>
        </div>

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

        <TabsContent value="products" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* Product Form - Sticky on large screens */}
            <div className="xl:col-span-4 space-y-6">
              <div className="xl:sticky xl:top-6">
                <ProductForm
                  ref={productFormRef}
                  onSuccess={handleCreateSuccess}
                  onCropImage={handleCropImage}
                />
              </div>
            </div>

            {/* Product List */}
            <div className="xl:col-span-8">
              <ProductTabs
                onEditProduct={handleEditProduct}
              />
            </div>
          </div>

          {/* Edit Product Dialog */}
          <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Product</DialogTitle>
                <DialogDescription>
                  Update existing product details, adjust pricing, and manage media assets.
                </DialogDescription>
              </DialogHeader>
              {editingProduct && (
                <ProductForm
                  ref={editProductFormRef}
                  mode="edit"
                  product={editingProduct}
                  onSuccess={handleCreateSuccess}
                  onCancel={handleCancelEdit}
                  onCropImage={handleCropImage}
                />
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader className="border-b bg-muted/40">
              <div className="flex items-center justify-between">
                <CardTitle>Order Management</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="active">Active Orders</TabsTrigger>
                  <TabsTrigger value="archived">Archived Orders</TabsTrigger>
                </TabsList>
                <TabsContent value="active" className="mt-0">
                  <OrdersTable showActions={true} showArchived={false} />
                </TabsContent>
                <TabsContent value="archived" className="mt-0">
                  <OrdersTable showActions={true} showArchived={true} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <ReviewManagement />
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

        <TabsContent value="messages">
          <Card className="h-[600px] lg:h-[calc(100vh-280px)] min-h-[500px] overflow-hidden">
            <CardContent className="p-0 h-full">
              <AdminChatDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <AdminAccountSettings />
        </TabsContent>
      </Tabs>
      <BottomSpacer />

      <ImageCropper
        src={croppingImage?.src || null}
        onClose={() => setCroppingImage(null)}
        onCropComplete={handleCropComplete}
        history={croppingImage?.history}
      />
    </div>
  );
}