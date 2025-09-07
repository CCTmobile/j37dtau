import React, { useState, useMemo } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { 
  Download, 
  Printer, 
  X, 
  FileText, 
  User, 
  Package, 
  CreditCard, 
  Receipt,
  ChevronDown,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Truck,
  MapPin,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Star,
  ShoppingBag
} from 'lucide-react';
import { Order, OrderItem } from '../../types/invoice';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';

interface EnhancedOrderViewProps {
  order: Order;
  onView?: (order: Order) => void;
  onEdit?: (order: Order) => void;
  onDelete?: (order: Order) => void;
  onPrint?: (order: Order) => void;
  onDownload?: (order: Order) => void;
  onStatusUpdate?: (order: Order, status: string) => void;
}

const EnhancedOrderView: React.FC<EnhancedOrderViewProps> = ({
  order,
  onView,
  onEdit,
  onDelete,
  onPrint,
  onDownload,
  onStatusUpdate
}) => {
  const [isPrintMode, setIsPrintMode] = useState(false);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    processing: 'bg-blue-100 text-blue-800 border-blue-200',
    shipped: 'bg-purple-100 text-purple-800 border-purple-200',
    delivered: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  };

  const statusIcons = {
    pending: Clock,
    processing: Package,
    shipped: Truck,
    delivered: CheckCircle,
    cancelled: X,
  };

  const StatusIcon = statusIcons[order.status as keyof typeof statusIcons] || Clock;

  return (
    <div className={`max-w-4xl mx-auto p-6 ${isPrintMode ? 'print:shadow-none' : ''}`}>
      {/* Beautiful Header with Gradient */}
      <div className="bg-gradient-to-r from-rose-400 via-pink-500 to-purple-600 rounded-t-2xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">ROSÉMAMA</h1>
              <p className="text-rose-100 text-lg">Premium Fashion & Lifestyle</p>
            </div>
            <div className="text-right">
              <p className="text-rose-100 mb-1">Invoice #</p>
              <p className="text-2xl font-bold">INV-{order.order_id}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-5 h-5" />
                <span className="font-semibold">Order Date</span>
              </div>
              <p className="text-lg">{new Date(order.order_date).toLocaleDateString()}</p>
            </div>
            
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <StatusIcon className="w-5 h-5" />
                <span className="font-semibold">Status</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status as keyof typeof statusColors]}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
            </div>
            
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="w-5 h-5" />
                <span className="font-semibold">Total</span>
              </div>
              <p className="text-2xl font-bold">R {order.amount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white border-x border-gray-200 p-4">
        <div className="flex flex-wrap gap-2 justify-between items-center">
          <div className="flex gap-2">
            <Button onClick={() => onView?.(order)} variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Actions
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onEdit?.(order)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Order
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPrint?.(order)}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print Invoice
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDownload?.(order)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete?.(order)} className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Order
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <StatusIcon className="w-4 h-4 mr-2" />
                  Update Status
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onStatusUpdate?.(order, 'pending')}>
                  <Clock className="w-4 h-4 mr-2" />
                  Pending
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusUpdate?.(order, 'processing')}>
                  <Package className="w-4 h-4 mr-2" />
                  Processing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusUpdate?.(order, 'shipped')}>
                  <Truck className="w-4 h-4 mr-2" />
                  Shipped
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusUpdate?.(order, 'delivered')}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Delivered
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onStatusUpdate?.(order, 'cancelled')} className="text-red-600">
                  <X className="w-4 h-4 mr-2" />
                  Cancel Order
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Button 
            onClick={() => setIsPrintMode(!isPrintMode)} 
            variant={isPrintMode ? "default" : "outline"} 
            size="sm"
          >
            <Receipt className="w-4 h-4 mr-2" />
            {isPrintMode ? "Exit Print View" : "Print View"}
          </Button>
        </div>
      </div>

      {/* Collapsible Sections */}
      <div className="bg-white border border-gray-200 rounded-b-2xl shadow-lg">
        <Accordion type="multiple" defaultValue={["customer", "items", "payment"]} className="w-full">
          
          {/* Customer Information */}
          <AccordionItem value="customer" className="border-b border-gray-100">
            <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 text-left">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Customer Information</h3>
                  <p className="text-sm text-gray-500">{order.customer_name}</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <User className="w-4 h-4 mr-2 text-blue-600" />
                      Contact Details
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">{order.customer_email}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">{order.shipping_address?.phone || 'Not provided'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                      Shipping Address
                    </h4>
                    <div className="text-gray-700 space-y-1">
                      {order.shipping_address ? (
                        <>
                          <p>{order.shipping_address.address}</p>
                          <p>{order.shipping_address.city}, {order.shipping_address.region}</p>
                          <p>{order.shipping_address.zipCode}</p>
                          <p>{order.shipping_address.country}</p>
                        </>
                      ) : (
                        <p className="text-gray-500 italic">No shipping address provided</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Order Items */}
          <AccordionItem value="items" className="border-b border-gray-100">
            <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 text-left">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <ShoppingBag className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Order Items</h3>
                  <p className="text-sm text-gray-500">{order.order_items?.length || 0} items</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
                <div className="space-y-4">
                  {order.order_items?.map((item: OrderItem, index: number) => (
                    <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{item.products?.name || 'Product'}</h4>
                          <p className="text-sm text-gray-600 mt-1">{item.products?.category || 'No description'}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded">
                              Qty: {item.quantity}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">R {item.price_at_purchase}</p>
                          <p className="text-sm text-gray-600">
                            Total: R {(item.price_at_purchase * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )) || <p className="text-gray-500 italic">No items found</p>}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Payment Information */}
          <AccordionItem value="payment" className="border-b-0">
            <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 text-left">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <CreditCard className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Payment & Summary</h3>
                  <p className="text-sm text-gray-500">Total: R {order.amount}</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <CreditCard className="w-4 h-4 mr-2 text-green-600" />
                      Payment Details
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Method</span>
                        <span className="font-medium">{order.payment_method || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Status</span>
                        <span className={`px-2 py-1 rounded text-sm font-medium bg-yellow-100 text-yellow-800`}>
                          {order.payment_method || 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <DollarSign className="w-4 h-4 mr-2 text-green-600" />
                      Order Summary
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span>R {((order.amount || 0) - (order.shipping_fee || 0)).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shipping</span>
                        <span>R {(order.shipping_fee || 0).toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>R {order.amount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          
          button {
            display: none !important;
          }
          
          .bg-gradient-to-r,
          .bg-gradient-to-br {
            background: linear-gradient(135deg, #ec4899, #8b5cf6) !important;
            color: white !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          .border {
            border: 1px solid #e5e7eb !important;
          }
          
          .shadow-lg,
          .shadow-2xl {
            box-shadow: none !important;
          }
          
          .rounded-2xl,
          .rounded-xl,
          .rounded-lg {
            border-radius: 8px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default EnhancedOrderView;
