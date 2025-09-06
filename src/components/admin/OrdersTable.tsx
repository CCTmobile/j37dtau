import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { Loader2, Eye, Truck, CheckCircle, Package, DollarSign, User, MapPin, Calendar, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { getRecentOrders, getAllOrders, updateOrderStatus } from '../../utils/supabase/client';
import { getStatusColor } from './constants';

interface OrdersTableProps {
  showActions?: boolean;
}

interface Order {
  order_id: string;
  customer_email: string;
  customer_name: string;
  amount: number;
  status: string;
  order_date: string;
}

// Enhanced Order interface
interface EnhancedOrder {
  id: string;
  order_id: string;
  customer_email: string;
  customer_name: string;
  amount: number;
  status: string;
  order_date: string;
  shipping_address: any;
  order_items: any[];
  payment_method?: string;
}

export function OrdersTable({ showActions = false }: OrdersTableProps) {
  const [orders, setOrders] = useState<EnhancedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<EnhancedOrder | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [showActions]);

  const fetchOrders = async () => {
    try {
      const data = showActions
        ? await getAllOrders() // Get all orders for admin view
        : await getRecentOrders(10); // Get recent orders for overview

      if (showActions && Array.isArray(data)) {
        // Transform admin orders data with enhanced information
        const transformedOrders = data.map((order: any) => ({
          id: order.id,
          order_id: order.id,
          customer_email: order.users?.email || 'N/A',
          customer_name: order.users?.name || 'N/A',
          amount: order.total_amount,
          status: order.status,
          order_date: new Date(order.created_at).toLocaleDateString(),
          shipping_address: order.shipping_address,
          order_items: order.order_items || [],
          payment_method: order.shipping_address?.paymentMethod || 'N/A'
        }));
        setOrders(transformedOrders);
      } else if (!showActions && Array.isArray(data)) {
        // Transform recent orders data
        const transformedOrders = data.map((order: any) => ({
          id: order.order_id,
          order_id: order.order_id,
          customer_email: order.customer_email,
          customer_name: order.customer_name || 'N/A',
          amount: order.amount,
          status: order.status,
          order_date: new Date(order.order_date).toLocaleDateString(),
          shipping_address: null,
          order_items: [],
          payment_method: 'N/A'
        }));
        setOrders(transformedOrders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatusHandler = async (orderId: string, newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const success = await updateOrderStatus(orderId, newStatus);
      if (success) {
        // Update local state
        setOrders(prev => prev.map(order =>
          order.order_id === orderId ? { ...order, status: newStatus } : order
        ));

        // Update selected order if it's being viewed
        if (selectedOrder?.order_id === orderId) {
          setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
        }

        toast.success(`Order status updated to ${newStatus}`);
      } else {
        toast.error('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getNextStatus = (currentStatus: string) => {
    const statusFlow = {
      'pending': ['processing', 'cancelled'],
      'processing': ['shipped', 'cancelled'],
      'shipped': ['delivered'],
      'delivered': [],
      'cancelled': []
    };
    return statusFlow[currentStatus as keyof typeof statusFlow] || [];
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Package className="h-4 w-4" />;
      case 'processing': return <Loader2 className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <CreditCard className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading orders...</span>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No orders found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Date</TableHead>
            {showActions && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.order_id}>
              <TableCell className="font-medium">#{order.order_id.slice(-8)}</TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{order.customer_name}</div>
                  <div className="text-sm text-muted-foreground">{order.customer_email}</div>
                </div>
              </TableCell>
              <TableCell className="font-medium">{formatCurrency(order.amount)}</TableCell>
              <TableCell>
                <Badge className={`${getStatusColor(order.status)} flex items-center gap-1 w-fit`}>
                  {getStatusIcon(order.status)}
                  {order.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {order.payment_method === 'cash-on-delivery' && '💰 COD'}
                  {order.payment_method === 'bank-transfer' && '🏦 Bank Transfer'}
                  {order.payment_method === 'credit-card' && '💳 Card'}
                  {!order.payment_method || order.payment_method === 'N/A' ? 'N/A' : order.payment_method}
                </div>
              </TableCell>
              <TableCell>{order.order_date}</TableCell>
              {showActions && (
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          Order #{selectedOrder?.order_id.slice(-8)}
                          <Badge className={selectedOrder ? getStatusColor(selectedOrder.status) : ''}>
                            {selectedOrder?.status}
                          </Badge>
                        </DialogTitle>
                      </DialogHeader>

                      {selectedOrder && (
                        <div className="space-y-6">
                          {/* Order Header Info */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card>
                              <CardContent className="pt-4">
                                <div className="flex items-center gap-2">
                                  <User className="h-5 w-5 text-muted-foreground" />
                                  <div>
                                    <p className="text-sm font-medium">Customer</p>
                                    <p className="text-sm text-muted-foreground">{selectedOrder.customer_name}</p>
                                    <p className="text-xs text-muted-foreground">{selectedOrder.customer_email}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardContent className="pt-4">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-5 w-5 text-muted-foreground" />
                                  <div>
                                    <p className="text-sm font-medium">Order Date</p>
                                    <p className="text-sm text-muted-foreground">{selectedOrder.order_date}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardContent className="pt-4">
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                                  <div>
                                    <p className="text-sm font-medium">Total Amount</p>
                                    <p className="text-sm text-muted-foreground">{formatCurrency(selectedOrder.amount)}</p>
                                    <p className="text-xs text-muted-foreground">{selectedOrder.payment_method}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>

                          {/* Shipping Address */}
                          {selectedOrder.shipping_address && (
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <MapPin className="h-5 w-5" />
                                  Shipping Address
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="text-sm space-y-1">
                                  <p className="font-medium">{selectedOrder.shipping_address.firstName} {selectedOrder.shipping_address.lastName}</p>
                                  <p>{selectedOrder.shipping_address.address}</p>
                                  <p>{selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.zipCode}</p>
                                  <p>{selectedOrder.shipping_address.country}</p>
                                  <p className="text-muted-foreground">📞 {selectedOrder.shipping_address.phone}</p>
                                  <p className="text-muted-foreground">✉️ {selectedOrder.shipping_address.email}</p>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Order Items */}
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg">Order Items</CardTitle>
                            </CardHeader>
                            <CardContent>
                              {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
                                <div className="space-y-3">
                                  {selectedOrder.order_items.map((item: any, index: number) => (
                                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                      <div>
                                        <p className="font-medium">{item.products?.name || 'Unknown Product'}</p>
                                        <p className="text-sm text-muted-foreground">
                                          Quantity: {item.quantity} × {formatCurrency(item.price_at_purchase)}
                                        </p>
                                      </div>
                                      <p className="font-medium">{formatCurrency(item.quantity * item.price_at_purchase)}</p>
                                    </div>
                                  ))}
                                  <Separator />
                                  <div className="flex justify-between items-center text-lg font-semibold">
                                    <span>Total</span>
                                    <span>{formatCurrency(selectedOrder.amount)}</span>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-muted-foreground">No items found in this order.</p>
                              )}
                            </CardContent>
                          </Card>

                          {/* Order Status Management */}
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg">Order Status Management</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div>
                                    <p className="text-sm font-medium">Current Status</p>
                                    <Badge className={`${getStatusColor(selectedOrder.status)} flex items-center gap-1 w-fit mt-1`}>
                                      {getStatusIcon(selectedOrder.status)}
                                      {selectedOrder.status}
                                    </Badge>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-sm font-medium mb-2">Update Status</p>
                                  <Select
                                    value=""
                                    onValueChange={(newStatus: string) => updateOrderStatusHandler(selectedOrder.order_id, newStatus)}
                                    disabled={isUpdatingStatus || getNextStatus(selectedOrder.status).length === 0}
                                  >
                                    <SelectTrigger className="w-40">
                                      <SelectValue placeholder="Next action" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {getNextStatus(selectedOrder.status).map((status) => (
                                        <SelectItem key={status} value={status} className="capitalize">
                                          {status}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              {getNextStatus(selectedOrder.status).length === 0 && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  No further actions available for this order status.
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
