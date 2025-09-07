import React from 'react';
import EnhancedOrderView from './EnhancedOrderView';
import { Order } from '../../types/invoice';

// Example usage component
const OrderViewExample: React.FC = () => {
  // Sample order data
  const sampleOrder: Order = {
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
        products: {
          name: 'Elegant Evening Dress',
          category: 'Formal Wear'
        },
        quantity: 1,
        price_at_purchase: 899.99
      },
      {
        products: {
          name: 'Designer Handbag',
          category: 'Accessories'
        },
        quantity: 1,
        price_at_purchase: 400.00
      }
    ]
  };

  const handleView = (order: Order) => {
    console.log('Viewing order:', order.order_id);
    // Add your view logic here
  };

  const handleEdit = (order: Order) => {
    console.log('Editing order:', order.order_id);
    // Add your edit logic here
  };

  const handleDelete = (order: Order) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      console.log('Deleting order:', order.order_id);
      // Add your delete logic here
    }
  };

  const handlePrint = (order: Order) => {
    console.log('Printing order:', order.order_id);
    window.print();
  };

  const handleDownload = (order: Order) => {
    console.log('Downloading PDF for order:', order.order_id);
    // Add your PDF download logic here
    // You can use libraries like jsPDF or html2pdf
  };

  const handleStatusUpdate = (order: Order, newStatus: string) => {
    console.log('Updating order', order.order_id, 'status to:', newStatus);
    // Add your status update logic here
    // This would typically involve an API call to update the order status
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Enhanced Order Management
        </h1>
        
        <EnhancedOrderView
          order={sampleOrder}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPrint={handlePrint}
          onDownload={handleDownload}
          onStatusUpdate={handleStatusUpdate}
        />
        
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            This enhanced order view provides beautiful UI with dropdown actions and print-ready design.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderViewExample;
