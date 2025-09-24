import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Loader2, Eye, Truck, CheckCircle, Package, DollarSign, User, MapPin, Calendar, CreditCard, FileText, Download, Printer, Circle, Trash2, Archive, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { getRecentOrders, getAllOrders, updateOrderStatus, softDeleteOrder, restoreOrder, permanentlyDeleteOrder, getDeletedOrders } from '../../utils/supabase/client';
import { formatCurrencyZAR } from '../../utils/currency';
import { getStatusColor } from './constants';
import { generateInvoicePDFSimple as generateInvoicePDF, printInvoice, viewInvoiceInModal } from '../../utils/pdfUtilsSimple';
import { Order as InvoiceOrder } from '../../types/invoice';

// Stable statuses constant to avoid recreating array every render (prevents effect loops)
const STATUSES = ['all','pending','processing','shipped','delivered','cancelled'] as const;

interface OrdersTableProps {
  showActions?: boolean;
  showArchived?: boolean;
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

export function OrdersTable({ showActions = false, showArchived = false }: OrdersTableProps) {
  const [orders, setOrders] = useState<EnhancedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<EnhancedOrder | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [pulseStage, setPulseStage] = useState<string | null>(null); // stage to animate after update
  const [ultraCompact, setUltraCompact] = useState(false); // extra dense list mode
  const statuses = STATUSES; // stable reference
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState<{width:number; left:number}>({ width: 0, left: 0 });

  useEffect(() => {
    fetchOrders();
  }, [showActions, showArchived]);

  // Update sliding indicator position on filter change / resize
  useEffect(() => {
    const updateIndicator = () => {
      const idx = statuses.indexOf(statusFilter as any);
      const btn = buttonsRef.current[idx];
      if (btn) {
        const width = btn.offsetWidth;
        const left = btn.offsetLeft;
        setIndicatorStyle(prev => (prev.width !== width || prev.left !== left) ? { width, left } : prev);
      }
    };
    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [statusFilter, statuses]);

  const fetchOrders = async () => {
    try {
      let data;
      
      if (showArchived) {
        // Get deleted/archived orders
        data = await getDeletedOrders();
      } else if (showActions) {
        // Get all active orders for admin view
        data = await getAllOrders();
      } else {
        // Get recent orders for overview
        data = await getRecentOrders(10);
      }

      if ((showActions || showArchived) && Array.isArray(data)) {
        // Transform admin orders data with enhanced information
        const transformedOrders = data.map((order: any) => ({
          id: order.id,
          order_id: order.id,
          customer_email: order.users?.email || order.customer_email || 'N/A',
          customer_name: order.users?.name || order.customer_name || 'N/A',
          amount: order.total_amount || order.amount,
          status: order.status,
          order_date: new Date(order.created_at || order.order_date).toLocaleDateString(),
          shipping_address: order.shipping_address,
          order_items: order.order_items || [],
          payment_method: order.shipping_address?.paymentMethod || order.payment_method || 'N/A',
          deleted_at: order.deleted_at
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

        // Trigger pulse animation for the new active stage if in main flow
        if (['pending','processing','shipped','delivered'].includes(newStatus)) {
          setPulseStage(newStatus);
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

  const handleSoftDeleteOrder = async (orderId: string) => {
    try {
      const success = await softDeleteOrder(orderId);
      if (success) {
        toast.success('Order moved to archive');
        fetchOrders(); // Refresh the list
        setSelectedOrder(null); // Close dialog if open
      } else {
        toast.error('Failed to archive order');
      }
    } catch (error) {
      console.error('Error archiving order:', error);
      toast.error('Failed to archive order');
    }
  };

  const handleRestoreOrder = async (orderId: string) => {
    try {
      const success = await restoreOrder(orderId);
      if (success) {
        toast.success('Order restored successfully');
        fetchOrders(); // Refresh the list
        setSelectedOrder(null); // Close dialog if open
      } else {
        toast.error('Failed to restore order');
      }
    } catch (error) {
      console.error('Error restoring order:', error);
      toast.error('Failed to restore order');
    }
  };

  const handlePermanentDeleteOrder = async (orderId: string) => {
    try {
      const success = await permanentlyDeleteOrder(orderId);
      if (success) {
        toast.success('Order permanently deleted');
        fetchOrders(); // Refresh the list
        setSelectedOrder(null); // Close dialog if open
      } else {
        toast.error('Failed to permanently delete order');
      }
    } catch (error) {
      console.error('Error permanently deleting order:', error);
      toast.error('Failed to permanently delete order');
    }
  };

  // Clear pulse animation after duration
  useEffect(() => {
    if (pulseStage) {
      const t = setTimeout(() => setPulseStage(null), 1200);
      return () => clearTimeout(t);
    }
  }, [pulseStage]);

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

  const formatCurrency = (amount: number) => formatCurrencyZAR(amount);

  // PDF action handlers
  const handlePrintInvoice = async (order: EnhancedOrder) => {
    try {
      // Cast to proper Order type for the function call
      const orderForPrint: InvoiceOrder = {
        ...order,
        status: order.status as InvoiceOrder['status'],
        payment_method: order.payment_method as InvoiceOrder['payment_method']
      };
      await printInvoice(orderForPrint);
      toast.success('Invoice opened for printing');
    } catch (error) {
      console.error('Error printing invoice:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to print invoice');
    }
  };

  const handleDownloadPDF = async (order: EnhancedOrder) => {
    try {
      // Cast to proper Order type for the function call
      const orderForPDF: InvoiceOrder = {
        ...order,
        status: order.status as InvoiceOrder['status'],
        payment_method: order.payment_method as InvoiceOrder['payment_method']
      };
      await generateInvoicePDF(orderForPDF);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const handleViewInvoice = async (order: EnhancedOrder) => {
    try {
      // Cast to proper Order type for the function call
      const orderForView: InvoiceOrder = {
        ...order,
        status: order.status as InvoiceOrder['status'],
        payment_method: order.payment_method as InvoiceOrder['payment_method']
      };
      await viewInvoiceInModal(orderForView);
    } catch (error) {
      console.error('Error viewing invoice:', error);
      toast.error('Failed to view invoice');
    }
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

  const displayedOrders = statusFilter === 'all'
    ? orders
    : orders.filter(o => o.status.toLowerCase() === statusFilter);

  return (
    <div className="space-y-4">
      {/* Status Filter Segmented Control */}
      <div className="w-full overflow-x-auto pb-1">
        <div className="inline-block min-w-full md:min-w-0">
          <div className="relative inline-flex rounded-lg border border-neutral-800 bg-neutral-900/60 backdrop-blur px-1 py-1">
            {/* Sliding indicator */}
            <div
              className="absolute top-1 bottom-1 rounded-md bg-gradient-to-r from-rose-500 to-pink-600 shadow-inner transition-all duration-300 ease-out"
              style={{ width: indicatorStyle.width, transform: `translateX(${indicatorStyle.left}px)` }}
            />
            <div className="flex space-x-1 relative z-10">
              {statuses.map((s, i) => {
                const active = statusFilter === s;
                return (
                  <button
                    key={s}
                    ref={el => { buttonsRef.current[i] = el; }}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium rounded-md whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${active ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'}`}
                    aria-pressed={active}
                    type="button"
                  >
                    {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Ultra compact mode toggle (admin view only) */}
      {showActions && (
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setUltraCompact(v => !v)}
            className={`text-[11px] px-2 py-1 rounded-md border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${ultraCompact ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white border-pink-600' : 'bg-neutral-900/60 border-neutral-700 hover:border-neutral-500 text-neutral-300'}`}
            aria-pressed={ultraCompact}
          >
            {ultraCompact ? 'Normal view' : 'Ultra compact'}
          </button>
        </div>
      )}
      
      <Table>
        <TableHeader>
          <TableRow>
            {ultraCompact ? (
              <>
                <TableHead className="h-7 py-0.5 text-[10px] w-[42%]">Order / Customer</TableHead>
                <TableHead className="h-7 py-0.5 text-[10px] w-[28%]">Amount / Meta</TableHead>
                <TableHead className="h-7 py-0.5 text-[10px] w-[18%]">Status</TableHead>
                {showActions && <TableHead className="h-7 py-0.5 text-[10px] w-[12%] text-right">Actions</TableHead>}
              </>
            ) : (
              <>
                <TableHead className="h-8 py-0.5 text-[11px]">Order ID</TableHead>
                <TableHead className="h-8 py-0.5 text-[11px]">Customer</TableHead>
                <TableHead className="h-8 py-0.5 text-[11px]">Amount</TableHead>
                <TableHead className="h-8 py-0.5 text-[11px]">Status</TableHead>
                <TableHead className="h-8 py-0.5 text-[11px]">Payment</TableHead>
                <TableHead className="h-8 py-0.5 text-[11px]">Date</TableHead>
                {showActions && <TableHead className="h-8 py-0.5 text-[11px]">Actions</TableHead>}
              </>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayedOrders.map((order) => (
            <TableRow key={order.order_id} className="cursor-pointer hover:bg-neutral-50" onClick={() => setSelectedOrder(order)}>
              {ultraCompact ? (
                <>
                  <TableCell className="py-1 text-[10px] leading-[12px]">
                    <div className="space-y-1">
                      <div className="font-medium">#{order.order_id.slice(-8)}</div>
                      <div className="text-neutral-600">{order.customer_name}</div>
                      <div className="text-neutral-500">{order.customer_email}</div>
                    </div>
                  </TableCell>
                  <TableCell className="py-1 text-[10px] leading-[12px]">
                    <div className="space-y-1">
                      <div className="font-medium">{formatCurrency(order.amount)}</div>
                      <div className="text-neutral-600">
                        {order.payment_method === 'cash-on-delivery' && '💰 COD'}
                        {order.payment_method === 'bank-transfer' && '🏦 Bank'}
                        {order.payment_method === 'credit-card' && '💳 Card'}
                        {!order.payment_method || order.payment_method === 'N/A' ? 'N/A' : order.payment_method}
                      </div>
                      <div className="text-neutral-500">{order.order_date}</div>
                    </div>
                  </TableCell>
                  <TableCell className="py-1">
                    <Badge className={`${getStatusColor(order.status)} flex items-center gap-1 w-fit text-[9px] px-1.5 py-0.5`}>
                      {getStatusIcon(order.status)}
                      {order.status}
                    </Badge>
                  </TableCell>
                  {showActions && (
                    <TableCell className="py-1 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0"
                          onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        {showArchived ? (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={(e) => { e.stopPropagation(); handleRestoreOrder(order.id); }}
                              title="Restore order"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={(e) => { e.stopPropagation(); handlePermanentDeleteOrder(order.id); }}
                              title="Permanently delete"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            onClick={(e) => { e.stopPropagation(); handleSoftDeleteOrder(order.id); }}
                            title="Move to archive"
                          >
                            <Archive className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </>
              ) : (
                <>
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
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}>
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        {showArchived ? (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                              onClick={(e) => { e.stopPropagation(); handleRestoreOrder(order.id); }}
                            >
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Restore
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={(e) => { e.stopPropagation(); handlePermanentDeleteOrder(order.id); }}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-orange-600 border-orange-200 hover:bg-orange-50"
                            onClick={(e) => { e.stopPropagation(); handleSoftDeleteOrder(order.id); }}
                          >
                            <Archive className="h-4 w-4 mr-1" />
                            Archive
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Order Details Dialog */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-5">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                <span className="font-semibold">Order #{selectedOrder?.order_id.slice(-8)}</span>
                <Badge className={`${selectedOrder ? getStatusColor(selectedOrder.status) : ''} text-[10px] px-2 py-0.5`}>{selectedOrder?.status}</Badge>
              </DialogTitle>
            </DialogHeader>
            {/* Sticky mini-header for quick context when scrolling */}
            {selectedOrder && (
              <div className="sticky top-0 z-20 -mx-4 sm:-mx-5 px-4 sm:px-5 py-2 bg-neutral-950/80 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/60 border-b border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium tracking-wide text-neutral-300">#{selectedOrder.order_id.slice(-8)}</span>
                  <Badge className={`${getStatusColor(selectedOrder.status)} text-[9px] px-2 py-0.5`}>{selectedOrder.status}</Badge>
                </div>
                <div className="flex items-center gap-1">
                  {['pending','processing','shipped','delivered'].map((stage, idx) => {
                    const currentIndex = ['pending','processing','shipped','delivered'].indexOf(selectedOrder.status);
                    const stageIndex = idx;
                    const isDone = currentIndex > stageIndex;
                    const isActive = currentIndex === stageIndex;
                    // Color map: pending(amber), processing(violet), shipped(blue), delivered(green)
                    const colorMap: Record<string, string> = {
                      pending: isActive ? 'text-amber-400' : isDone ? 'text-amber-600' : 'text-neutral-600',
                      processing: isActive ? 'text-violet-400' : isDone ? 'text-violet-600' : 'text-neutral-600',
                      shipped: isActive ? 'text-sky-400' : isDone ? 'text-sky-600' : 'text-neutral-600',
                      delivered: isActive ? 'text-emerald-400' : isDone ? 'text-emerald-600' : 'text-neutral-600'
                    };
                    return (
                      <div key={stage} className="flex items-center">
                        <div className="relative flex items-center justify-center">
                          {pulseStage === stage && isActive && (
                            <span className={`absolute inline-flex h-4 w-4 rounded-full ${colorMap[stage].replace('text-','bg-')} opacity-60 animate-ping`} />
                          )}
                          <Circle className={`h-3 w-3 ${colorMap[stage]} ${isActive ? 'drop-shadow-[0_0_4px_rgba(255,255,255,0.35)]' : ''}`} />
                        </div>
                        {stage !== 'delivered' && <span className={`mx-0.5 h-px w-3 ${currentIndex >= stageIndex ? 'bg-neutral-500' : 'bg-neutral-700'}`} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedOrder && (
              <div className="space-y-4">
                {/* Order Header Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Card className="border-neutral-800/70 bg-neutral-900/40">
                    <CardContent className="py-3 px-3">
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium leading-tight">Customer</p>
                          <p className="text-xs text-muted-foreground leading-tight">{selectedOrder.customer_name}</p>
                          <p className="text-[10px] text-muted-foreground break-all leading-tight">{selectedOrder.customer_email}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-neutral-800/70 bg-neutral-900/40">
                    <CardContent className="py-3 px-3">
                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium leading-tight">Order Date</p>
                          <p className="text-xs text-muted-foreground leading-tight">{selectedOrder.order_date}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-neutral-800/70 bg-neutral-900/40">
                    <CardContent className="py-3 px-3">
                      <div className="flex items-start gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium leading-tight">Total</p>
                          <p className="text-xs text-muted-foreground leading-tight">{formatCurrency(selectedOrder.amount)}</p>
                          <p className="text-[10px] text-muted-foreground leading-tight">{selectedOrder.payment_method}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Shipping Address */}
                {selectedOrder.shipping_address && (
                  <Card className="border-neutral-800/70 bg-neutral-900/40">
                    <CardHeader className="pb-2 px-3 pt-3">
                      <CardTitle className="text-sm flex items-center gap-2 font-semibold tracking-wide">
                        <MapPin className="h-4 w-4" />
                        Shipping
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 pt-0">
                      <div className="text-[11px] space-y-0.5 leading-tight">
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
                <Card className="border-neutral-800/70 bg-neutral-900/40">
                  <CardHeader className="pb-2 px-3 pt-3">
                    <CardTitle className="text-sm font-semibold tracking-wide">Items</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3 pt-0">
                    {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
                      <div className="space-y-2">
                        {selectedOrder.order_items.map((item: any, index: number) => (
                          <div key={index} className="flex items-center justify-between px-2 py-2 rounded-md bg-neutral-800/40">
                            <div className="space-y-0.5">
                              <p className="text-xs font-medium leading-tight">{item.products?.name || 'Unknown Product'}</p>
                              <p className="text-[10px] text-muted-foreground leading-tight">
                                {item.quantity} × {formatCurrency(item.price_at_purchase)}
                              </p>
                            </div>
                            <p className="text-xs font-medium leading-tight">{formatCurrency(item.quantity * item.price_at_purchase)}</p>
                          </div>
                        ))}
                        <Separator className="my-1" />
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span>Total</span>
                          <span>{formatCurrency(selectedOrder.amount)}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">No items found in this order.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Order Status Management */}
                <Card className="border-neutral-800/70 bg-neutral-900/40">
                  <CardHeader className="pb-2 px-3 pt-3">
                    <CardTitle className="text-sm font-semibold tracking-wide">Status</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3 pt-0">
                    <div className="space-y-4">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                        <div>
                          <p className="text-xs font-medium mb-1">Current</p>
                          <Badge className={`${getStatusColor(selectedOrder.status)} flex items-center gap-1 w-fit mt-1 text-[10px] px-2 py-0.5`}> 
                            {getStatusIcon(selectedOrder.status)}
                            {selectedOrder.status}
                          </Badge>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium mb-1 flex items-center gap-2">Next
                            {isUpdatingStatus && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {getNextStatus(selectedOrder.status).map(next => (
                              <button
                                key={next}
                                type="button"
                                disabled={isUpdatingStatus}
                                onClick={() => updateOrderStatusHandler(selectedOrder.order_id, next)}
                                className={`relative group overflow-hidden px-3 py-1 rounded-full text-[10px] font-medium tracking-wide transition shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 disabled:opacity-50 ${
                                  next === 'cancelled' ? 'bg-rose-600/20 text-rose-300 hover:bg-rose-600/30' :
                                  next === 'delivered' ? 'bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30' :
                                  next === 'shipped' ? 'bg-blue-600/20 text-blue-300 hover:bg-blue-600/30' :
                                  next === 'processing' ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30' :
                                  'bg-neutral-700/40 text-neutral-200 hover:bg-neutral-600/50'
                                }`}
                              >
                                <span className="flex items-center gap-1.5">
                                  {getStatusIcon(next)}
                                  {next}
                                </span>
                              </button>
                            ))}
                            {getNextStatus(selectedOrder.status).length === 0 && (
                              <span className="text-[10px] text-muted-foreground italic">No transitions</span>
                            )}
                          </div>
                          {/* Fallback select for manual choice if needed later */}
                          {getNextStatus(selectedOrder.status).length > 0 && (
                            <div className="mt-2">
                              <Select
                                value=""
                                onValueChange={(newStatus: string) => updateOrderStatusHandler(selectedOrder.order_id, newStatus)}
                                disabled={isUpdatingStatus}
                              >
                                <SelectTrigger className="w-44 text-[10px] h-7 px-2"> 
                                  <SelectValue placeholder="Alt action" />
                                </SelectTrigger>
                                <SelectContent>
                                  {getNextStatus(selectedOrder.status).map((status) => (
                                    <SelectItem key={status} value={status} className="capitalize">
                                      {status}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <p className="text-[9px] text-muted-foreground mt-1">Pills are primary transitions; dropdown is backup.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Invoice Actions */}
                <Card className="border-neutral-800/70 bg-neutral-900/40">
                  <CardHeader className="pb-2 px-3 pt-3">
                    <CardTitle className="text-sm flex items-center gap-2 font-semibold tracking-wide">
                      <FileText className="h-4 w-4" />
                      Invoices
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3 pt-0">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => handleViewInvoice(selectedOrder)} className="flex items-center gap-1.5 h-8 px-3 text-xs">
                        <FileText className="h-3.5 w-3.5" /> View
                      </Button>
                      <Button variant="outline" onClick={() => handleDownloadPDF(selectedOrder)} className="flex items-center gap-1.5 h-8 px-3 text-xs">
                        <Download className="h-3.5 w-3.5" /> PDF
                      </Button>
                      <Button variant="outline" onClick={() => handlePrintInvoice(selectedOrder)} className="flex items-center gap-1.5 h-8 px-3 text-xs">
                        <Printer className="h-3.5 w-3.5" /> Print
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2 leading-tight">Quick invoice actions.</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
