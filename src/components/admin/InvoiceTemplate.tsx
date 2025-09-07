import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Separator } from '../ui/separator';
import { Download, Printer, X } from 'lucide-react';

interface InvoiceTemplateProps {
  order: {
    id: string;
    order_id: string;
    customer_name: string;
    customer_email: string;
    amount: number;
    status: string;
    order_date: string;
    shipping_address?: any;
    order_items?: any[];
    payment_method?: string;
  };
  onClose?: () => void;
  onPrint?: () => void;
  onDownload?: () => void;
  showActions?: boolean;
}

export function InvoiceTemplate({
  order,
  onClose,
  onPrint,
  onDownload,
  showActions = true
}: InvoiceTemplateProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateSubtotal = () => {
    if (!order.order_items) return order.amount;
    return order.order_items.reduce((total: number, item: any) =>
      total + (item.quantity * item.price_at_purchase), 0
    );
  };

  const subtotal = calculateSubtotal();
  const shippingFee = 150; // Standard shipping fee
  const total = order.amount;

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-xl rounded-lg border border-blue-200" id="invoice-template">
      {/* Modern Header */}
      <div className="text-center mb-8">
        <div className="bg-blue-600 p-6 rounded-xl shadow-lg mb-6">
          <h1 className="text-3xl font-extrabold text-white mb-2">Rosemama CLOTHING STORE</h1>
          <p className="text-blue-100 text-sm">Premium Clothing & Fashion</p>
          <div className="w-16 h-1 bg-blue-300 mx-auto mt-3 rounded-full"></div>
        </div>
        <div className="flex justify-center items-center space-x-6 text-sm text-gray-600">
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            New Rd, Carlswald, Midrand, 1684
          </span>
          <span className="flex items-center text-blue-600">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
            +27 63 470 8046
          </span>
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            info@rosemama.store
          </span>
        </div>
      </div>

      {/* Invoice Header - Modern Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {/* Invoice Details Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-blue-600 p-4">
            <h2 className="text-lg font-bold text-white flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Invoice Details
            </h2>
          </div>
          <div className="p-6 space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Invoice Number</span>
              <span className="font-bold text-gray-900">INV-{order.order_id.slice(-8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Order ID</span>
              <span className="font-semibold text-gray-800">{order.order_id}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Invoice Date</span>
              <span className="text-gray-800">{formatDate(order.order_date)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Status</span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                order.status === 'delivered' ? 'bg-green-100 text-green-800 border border-green-200' :
                order.status === 'shipped' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                order.status === 'processing' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                'bg-gray-100 text-gray-800 border border-gray-200'
              }`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Customer Details Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-blue-600 p-4">
            <h2 className="text-lg font-bold text-white flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              Bill To
            </h2>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900">{order.customer_name}</h3>
              <p className="text-gray-600">{order.customer_email}</p>
            </div>
            {order.shipping_address && (
              <div className="space-y-1 text-sm">
                <p className="flex items-center text-gray-700">
                  <svg className="w-4 h-4 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  {order.shipping_address.address}
                </p>
                <p className="flex items-center text-gray-700">
                  <svg className="w-4 h-4 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zipCode}
                </p>
                <p className="flex items-center text-gray-700">
                  <svg className="w-4 h-4 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  {order.shipping_address.country}
                </p>
                <p className="flex items-center text-gray-700">
                  <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  {order.shipping_address.phone}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Items - Modern Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mb-8">
          <div className="bg-blue-600 p-4">
          <h3 className="text-lg font-bold text-white flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
            </svg>
            Order Items
          </h3>
        </div>
        <div className="overflow-hidden">
          <div className="bg-gray-100 p-4 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-700">
              <div className="col-span-6">Item Description</div>
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-2 text-right">Total</div>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {order.order_items && order.order_items.length > 0 ? (
              order.order_items.map((item: any, index: number) => (
                <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-6">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{item.products?.name || 'Unknown Product'}</p>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">{item.products?.category || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold text-center w-8 h-8 flex items-center justify-center">
                        {item.quantity}
                      </div>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="font-medium text-gray-900">{formatCurrency(item.price_at_purchase)}</span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="font-bold text-gray-900">{formatCurrency(item.quantity * item.price_at_purchase)}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p>No items found in this order</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Method and Totals - Modern Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Payment Method Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-blue-600 p-4">
            <h3 className="text-lg font-bold text-white flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
              Payment Method
            </h3>
          </div>
          <div className="p-6">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">
                {order.payment_method === 'cash-on-delivery' && '💰'}
                {order.payment_method === 'bank-transfer' && '🏦'}
                {order.payment_method === 'credit-card' && '💳'}
                {(!order.payment_method || order.payment_method === 'N/A') && '❓'}
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {order.payment_method === 'cash-on-delivery' && 'Cash on Delivery'}
                  {order.payment_method === 'bank-transfer' && 'Bank Transfer'}
                  {order.payment_method === 'credit-card' && 'Credit Card'}
                  {(!order.payment_method || order.payment_method === 'N/A') && 'Payment Method Not Specified'}
                </p>
                <p className="text-sm text-gray-600">
                  {order.payment_method === 'cash-on-delivery' && 'Pay when you receive your order'}
                  {order.payment_method === 'bank-transfer' && 'Direct bank transfer'}
                  {order.payment_method === 'credit-card' && 'Secure credit card payment'}
                  {(!order.payment_method || order.payment_method === 'N/A') && 'Payment method will be confirmed'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-blue-600 p-4">
            <h3 className="text-lg font-bold text-white flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm2 2a1 1 0 000 2h8a1 1 0 100-2H5z" clipRule="evenodd" />
              </svg>
              Order Summary
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Shipping</span>
              <span className="font-medium text-gray-900">{formatCurrency(shippingFee)}</span>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total Amount</span>
                <span className="text-2xl font-bold text-blue-600">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Footer */}
      <div className="bg-gray-100 rounded-xl p-6 text-center">
        <h4 className="text-lg font-bold text-gray-900 mb-2">Thank you</h4>
        <p className="text-gray-700 mb-2">
          For any enquiries, please contact us at <span className="text-blue-600 font-medium">info@rosemama.store</span> or call <span className="text-blue-600 font-medium">+27 63 470 8046</span>.
        </p>
        <div className="mt-4 pt-4 border-t border-gray-300">
          <p className="text-xs text-gray-500">Invoice generated on {formatDate(new Date().toISOString())}</p>
        </div>
      </div>

      {/* Action Buttons - Only show if showActions is true */}
      {showActions && (
        <div className="flex justify-center gap-4 mt-6">
          <Button onClick={onPrint} variant="outline" className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Print Invoice
          </Button>
          <Button onClick={onDownload} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
          {onClose && (
            <Button onClick={onClose} variant="outline" className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Close
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
