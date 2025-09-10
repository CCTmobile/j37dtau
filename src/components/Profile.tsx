import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Edit, MapPin, CreditCard, Bell, Shield, LogOut, Package, Heart, RefreshCw, Download, Printer, Eye, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { getUserOrders } from '../utils/supabase/client';
import { generateInvoicePDFSimple as generateInvoicePDF, printInvoice, viewInvoiceInModal } from '../utils/pdfUtilsSimple';
import { VerificationBanner } from './VerificationBanner';

interface ProfileProps {
  onLogout: () => void;
}

export function Profile({ onLogout }: ProfileProps) {
  const { user, loading, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [showOrderHistory, setShowOrderHistory] = useState(false);

  useEffect(() => {
    if (showOrderHistory && user) {
      fetchUserOrders();
    }
  }, [showOrderHistory, user]);

  const fetchUserOrders = async () => {
    setOrdersLoading(true);
    try {
      const userOrders = await getUserOrders();
      setOrders(userOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load order history');
    } finally {
      setOrdersLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading profile...</div>;
  }

  if (!user) {
    return <div className="text-center py-12">Could not load user profile. Please try logging in again.</div>;
  }

  const [editForm, setEditForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || ''
  });

  const handleSave = () => {
    // Update functionality to be implemented later
    setIsEditing(false);
    toast.info('Profile update functionality is coming soon!');
  };

  const handleLogout = async () => {
    if (isLoggingOut) {
      console.log('Profile: Logout already in progress, ignoring click');
      return;
    }

    console.log('Profile: Logout button clicked');
    setIsLoggingOut(true);

    try {
      console.log('Profile: Calling signOut()');
      await signOut();
      console.log('Profile: signOut() completed');
      toast.success('Signed out successfully');
      console.log('Profile: About to reload page immediately');
      // Immediate reload to ensure clean state transition
      try {
        window.location.reload();
        console.log('Profile: window.location.reload() called successfully');
      } catch (error) {
        console.error('Profile: Error calling window.location.reload():', error);
        // Fallback: try with a small delay
        setTimeout(() => {
          console.log('Profile: Fallback reload attempt');
          window.location.reload();
        }, 100);
      }
    } catch (error) {
      console.error('Profile: Logout failed:', error);
      toast.error('Failed to log out');
      setIsLoggingOut(false); // Reset on error
    }
  };

  // PDF action handlers
  const handlePrintInvoice = async (order: any) => {
    const orderData = {
      id: order.id,
      order_id: order.id,
      customer_name: user.name,
      customer_email: user.email,
      amount: order.total_amount,
      status: order.status,
      order_date: new Date(order.created_at).toLocaleDateString(),
      shipping_address: order.shipping_address,
      order_items: order.order_items,
      payment_method: order.shipping_address?.paymentMethod || 'N/A'
    };

    try {
      await printInvoice(orderData);
      toast.success('Invoice opened for printing');
    } catch (error) {
      console.error('Error printing invoice:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to print invoice');
    }
  };

  const handleDownloadPDF = async (order: any) => {
    const orderData = {
      id: order.id,
      order_id: order.id,
      customer_name: user.name,
      customer_email: user.email,
      amount: order.total_amount,
      status: order.status,
      order_date: new Date(order.created_at).toLocaleDateString(),
      shipping_address: order.shipping_address,
      order_items: order.order_items,
      payment_method: order.shipping_address?.paymentMethod || 'N/A'
    };

    try {
      await generateInvoicePDF(orderData);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const handleViewInvoice = async (order: any) => {
    const orderData = {
      id: order.id,
      order_id: order.id,
      customer_name: user.name,
      customer_email: user.email,
      amount: order.total_amount,
      status: order.status,
      order_date: new Date(order.created_at).toLocaleDateString(),
      shipping_address: order.shipping_address,
      order_items: order.order_items,
      payment_method: order.shipping_address?.paymentMethod || 'N/A'
    };

    try {
      await viewInvoiceInModal(orderData);
    } catch (error) {
      console.error('Error viewing invoice:', error);
      toast.error('Failed to view invoice');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const menuItems = [
    { icon: Package, label: 'Order History', action: () => setShowOrderHistory(true) },
    { icon: Heart, label: 'Wishlist', action: () => toast.info('Wishlist coming soon!') },
    { icon: MapPin, label: 'Addresses', action: () => toast.info('Address management coming soon!') },
    { icon: CreditCard, label: 'Payment Methods', action: () => toast.info('Payment methods coming soon!') },
    { icon: Bell, label: 'Notifications', action: () => toast.info('Notification settings coming soon!') },
    { icon: Shield, label: 'Privacy & Security', action: () => toast.info('Privacy settings coming soon!') },
  ];

  return (
    <div className="container mx-auto px-6 py-6 max-w-2xl">
      {/* Email Verification Banner */}
      <VerificationBanner variant="card" className="mb-4" showDismiss />
      
      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-xl">
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-semibold">{user.name}</h2>
                <Badge 
                  variant="secondary"
                  className={
                    user.membershipTier === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                    user.membershipTier === 'Silver' ? 'bg-gray-100 text-gray-800' :
                    'bg-orange-100 text-orange-800'
                  }
                >
                  {user.membershipTier} Member
                </Badge>
              </div>
              <p className="text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm">
                  ✨ {user.points} points
                </span>
                <span className="text-sm text-muted-foreground">
                  Member since {user.created_at
                    ? new Date(user.created_at).getFullYear()
                    : '2024'
                  }
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile */}
      {isEditing && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave}>Save Changes</Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Menu Items */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y">
            {menuItems.map((item, index) => (
              <li key={index} className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50" onClick={item.action}>
                <div className="flex items-center gap-4">
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                  <span>{item.label}</span>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Logout Button */}
      <Button
        variant="destructive"
        className="w-full"
        onClick={handleLogout}
        disabled={isLoggingOut}
      >
        {isLoggingOut ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Signing Out...
          </>
        ) : (
          <>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </>
        )}
      </Button>

      {/* Order History Dialog */}
      <Dialog open={showOrderHistory} onOpenChange={setShowOrderHistory}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Order History</DialogTitle>
          </DialogHeader>

          {ordersLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              Loading your orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No orders found. Start shopping to see your order history here.
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">
                            Order #{order.id.slice(-8)}
                          </h3>
                          <Badge
                            variant="outline"
                            className={`${
                              order.status === 'delivered' ? 'border-green-500 text-green-700' :
                              order.status === 'shipped' ? 'border-blue-500 text-blue-700' :
                              order.status === 'processing' ? 'border-yellow-500 text-yellow-700' :
                              'border-gray-500 text-gray-700'
                            }`}
                          >
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Ordered on {new Date(order.created_at).toLocaleDateString('en-ZA', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-sm font-medium">
                          Total: {formatCurrency(order.total_amount)}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Order #{order.id.slice(-8)}</DialogTitle>
                            </DialogHeader>

                            {selectedOrder && (
                              <div className="space-y-6">
                                {/* Order Header */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <Card>
                                    <CardContent className="pt-4">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">Order Date:</span>
                                        <span className="text-sm">{new Date(selectedOrder.created_at).toLocaleDateString()}</span>
                                      </div>
                                      <div className="flex items-center gap-2 mt-2">
                                        <span className="text-sm font-medium">Status:</span>
                                        <Badge
                                          variant="outline"
                                          className={`${
                                            selectedOrder.status === 'delivered' ? 'border-green-500 text-green-700' :
                                            selectedOrder.status === 'shipped' ? 'border-blue-500 text-blue-700' :
                                            selectedOrder.status === 'processing' ? 'border-yellow-500 text-yellow-700' :
                                            'border-gray-500 text-gray-700'
                                          }`}
                                        >
                                          {selectedOrder.status}
                                        </Badge>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  <Card>
                                    <CardContent className="pt-4">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">Total Amount:</span>
                                        <span className="text-sm font-semibold">{formatCurrency(selectedOrder.total_amount)}</span>
                                      </div>
                                      {selectedOrder.shipping_address?.paymentMethod && (
                                        <div className="flex items-center gap-2 mt-2">
                                          <span className="text-sm font-medium">Payment:</span>
                                          <span className="text-sm">
                                            {selectedOrder.shipping_address.paymentMethod === 'cash-on-delivery' && '💰 COD'}
                                            {selectedOrder.shipping_address.paymentMethod === 'bank-transfer' && '🏦 Bank Transfer'}
                                            {selectedOrder.shipping_address.paymentMethod === 'credit-card' && '💳 Card'}
                                          </span>
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>

                                  <Card>
                                    <CardContent className="pt-4">
                                      <div className="text-sm space-y-1">
                                        <div><strong>Shipping Address:</strong></div>
                                        {selectedOrder.shipping_address ? (
                                          <>
                                            <div>{selectedOrder.shipping_address.firstName} {selectedOrder.shipping_address.lastName}</div>
                                            <div>{selectedOrder.shipping_address.address}</div>
                                            <div>{selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state}</div>
                                            <div>{selectedOrder.shipping_address.country}</div>
                                            <div>📞 {selectedOrder.shipping_address.phone}</div>
                                          </>
                                        ) : (
                                          <div className="text-muted-foreground">Address not available</div>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>

                                {/* Order Items */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg">Order Items</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
                                      <div className="space-y-3">
                                        {selectedOrder.order_items.map((item: any, index: number) => (
                                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                              {item.products?.image_url && (
                                                <img
                                                  src={item.products.image_url}
                                                  alt={item.products.name}
                                                  className="w-12 h-12 object-cover rounded"
                                                />
                                              )}
                                              <div>
                                                <p className="font-medium">{item.products?.name || 'Unknown Product'}</p>
                                                <p className="text-sm text-muted-foreground">
                                                  Quantity: {item.quantity} × {formatCurrency(item.price_at_purchase)}
                                                </p>
                                              </div>
                                            </div>
                                            <p className="font-medium">{formatCurrency(item.quantity * item.price_at_purchase)}</p>
                                          </div>
                                        ))}
                                        <Separator />
                                        <div className="flex justify-between items-center text-lg font-semibold">
                                          <span>Total</span>
                                          <span>{formatCurrency(selectedOrder.total_amount)}</span>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-muted-foreground">No items found in this order.</p>
                                    )}
                                  </CardContent>
                                </Card>

                                {/* Invoice Actions */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                      <FileText className="h-5 w-5" />
                                      Invoice Actions
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="flex flex-wrap gap-3">
                                      <Button
                                        variant="outline"
                                        onClick={() => handleViewInvoice(selectedOrder)}
                                        className="flex items-center gap-2"
                                      >
                                        <FileText className="h-4 w-4" />
                                        View Invoice
                                      </Button>
                                      <Button
                                        variant="outline"
                                        onClick={() => handleDownloadPDF(selectedOrder)}
                                        className="flex items-center gap-2"
                                      >
                                        <Download className="h-4 w-4" />
                                        Download PDF
                                      </Button>
                                      <Button
                                        variant="outline"
                                        onClick={() => handlePrintInvoice(selectedOrder)}
                                        className="flex items-center gap-2"
                                      >
                                        <Printer className="h-4 w-4" />
                                        Print Invoice
                                      </Button>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-3">
                                      Generate and download professional invoices for your orders.
                                    </p>
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewInvoice(order)}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Invoice
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
