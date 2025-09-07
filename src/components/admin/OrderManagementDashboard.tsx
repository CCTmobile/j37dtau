import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import EnhancedOrderView from './EnhancedOrderView';
import { Order } from '../../types/invoice';
import { generateStyledPDF, printElement } from '../../utils/pdfGenerator';
import {
  Package,
  TrendingUp,
  Users,
  DollarSign,
  Search,
  Filter,
  Download,
  Calendar,
  Grid3X3,
  List,
  Eye
} from 'lucide-react';

const OrderManagementDashboard: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Sample orders data
  const sampleOrders: Order[] = [
    {
      id: '1',
      order_id: 'ORD-2024-001',
      customer_name: 'Sarah Johnson',
      customer_email: 'sarah.johnson@email.com',
      amount: 1299.99,
      status: 'processing',
      order_date: '2024-09-07T10:30:00Z',
      payment_method: 'credit-card',
      shipping_fee: 150,
      shipping_address: {
        address: '123 Fashion Street, Apartment 4B',
        city: 'Johannesburg',
        region: 'Gauteng',
        zipCode: '2001',
        country: 'South Africa',
        phone: '+27 11 123 4567'
      },
      order_items: [
        {
          products: { name: 'Elegant Evening Dress', category: 'Formal Wear' },
          quantity: 1,
          price_at_purchase: 899.99
        },
        {
          products: { name: 'Designer Handbag', category: 'Accessories' },
          quantity: 1,
          price_at_purchase: 400.00
        }
      ]
    },
    {
      id: '2',
      order_id: 'ORD-2024-002',
      customer_name: 'Michael Chen',
      customer_email: 'michael.chen@email.com',
      amount: 799.50,
      status: 'shipped',
      order_date: '2024-09-06T15:45:00Z',
      payment_method: 'bank-transfer',
      shipping_fee: 150,
      shipping_address: {
        address: '456 Style Avenue',
        city: 'Cape Town',
        region: 'Western Cape',
        zipCode: '8001',
        country: 'South Africa',
        phone: '+27 21 987 6543'
      },
      order_items: [
        {
          products: { name: 'Premium Leather Jacket', category: 'Outerwear' },
          quantity: 1,
          price_at_purchase: 649.50
        }
      ]
    },
    {
      id: '3',
      order_id: 'ORD-2024-003',
      customer_name: 'Emma Williams',
      customer_email: 'emma.williams@email.com',
      amount: 450.00,
      status: 'delivered',
      order_date: '2024-09-05T09:15:00Z',
      payment_method: 'cash-on-delivery',
      shipping_fee: 150,
      shipping_address: {
        address: '789 Trendy Lane',
        city: 'Durban',
        region: 'KwaZulu-Natal',
        zipCode: '4001',
        country: 'South Africa',
        phone: '+27 31 555 4321'
      },
      order_items: [
        {
          products: { name: 'Summer Floral Dress', category: 'Casual Wear' },
          quantity: 2,
          price_at_purchase: 150.00
        }
      ]
    }
  ];

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
  };

  const handlePrintOrder = async (order: Order) => {
    if (selectedOrder?.id === order.id) {
      printElement('enhanced-order-view');
    } else {
      setSelectedOrder(order);
      setTimeout(() => printElement('enhanced-order-view'), 100);
    }
  };

  const handleDownloadPDF = async (order: Order) => {
    try {
      if (selectedOrder?.id === order.id) {
        await generateStyledPDF('enhanced-order-view', undefined, {
          title: `Invoice - ${order.order_id}`,
          customerName: order.customer_name,
          orderNumber: order.order_id
        });
      } else {
        setSelectedOrder(order);
        setTimeout(async () => {
          await generateStyledPDF('enhanced-order-view', undefined, {
            title: `Invoice - ${order.order_id}`,
            customerName: order.customer_name,
            orderNumber: order.order_id
          });
        }, 100);
      }
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handleStatusUpdate = (order: Order, newStatus: string) => {
    console.log(`Updating order ${order.order_id} status to ${newStatus}`);
    // Here you would typically make an API call to update the status
    alert(`Order ${order.order_id} status updated to ${newStatus}`);
  };

  const filteredOrders = sampleOrders.filter(order => {
    const matchesSearch = order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.order_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = sampleOrders.reduce((sum, order) => sum + order.amount, 0);
  const totalOrders = sampleOrders.length;
  const pendingOrders = sampleOrders.filter(order => order.status === 'pending').length;
  const processingOrders = sampleOrders.filter(order => order.status === 'processing').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
              <p className="text-gray-600 mt-1">Manage and track all customer orders</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => window.print()}>
                <Download className="w-4 h-4 mr-2" />
                Export All
              </Button>
              <Button>
                <Package className="w-4 h-4 mr-2" />
                New Order
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">R {totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Processing</p>
                  <p className="text-2xl font-bold text-gray-900">{processingOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col md:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search orders or customers..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

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
          </CardContent>
        </Card>

        {/* Orders Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{order.order_id}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{order.customer_name}</p>
                    </div>
                    <Badge className={statusColors[order.status as keyof typeof statusColors]}>
                      {order.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Amount:</span>
                      <span className="font-semibold">R {order.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Date:</span>
                      <span className="text-sm">{new Date(order.order_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Items:</span>
                      <span className="text-sm">{order.order_items?.length || 0} items</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" onClick={() => handleViewOrder(order)} className="flex-1">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDownloadPDF(order)}>
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.order_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{order.customer_name}</div>
                            <div className="text-sm text-gray-500">{order.customer_email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          R {order.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={statusColors[order.status as keyof typeof statusColors]}>
                            {order.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.order_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Button size="sm" onClick={() => handleViewOrder(order)}>
                              View
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDownloadPDF(order)}>
                              PDF
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Order View */}
        {selectedOrder && (
          <div className="mt-8">
            <div id="enhanced-order-view">
              <EnhancedOrderView
                order={selectedOrder}
                onView={handleViewOrder}
                onPrint={handlePrintOrder}
                onDownload={handleDownloadPDF}
                onStatusUpdate={handleStatusUpdate}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderManagementDashboard;
