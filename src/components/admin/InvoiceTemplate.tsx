import React, { useMemo } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Separator } from '../ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Download, Printer, X, FileText, User, Package, CreditCard, Receipt } from 'lucide-react';
import { Order, InvoiceTemplateProps } from '../../types/invoice';
import {
  formatCurrency,
  formatDate,
  formatPhoneNumber,
  formatAddress,
  calculateSubtotal,
  calculateTotal,
  statusStyles,
  getPaymentMethodInfo,
  capitalizeFirst,
  generateInvoiceNumber
} from '../../utils/invoiceUtils';

// Invoice Header Component with enhanced design
const InvoiceHeader: React.FC = () => (
  <div className="text-center mb-8">
    <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 p-6 rounded-xl shadow-lg mb-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
      <div className="relative">
        <h1 className="text-4xl font-extrabold text-white mb-2 tracking-wide">ROSÉMAMA</h1>
        <p className="text-blue-100 text-lg font-medium">Premium Fashion & Lifestyle</p>
        <div className="w-20 h-1 bg-gradient-to-r from-pink-300 to-purple-300 mx-auto mt-4 rounded-full"></div>
      </div>
    </div>
    <div className="flex justify-center items-center space-x-8 text-sm">
      <span className="flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
        <svg className="w-5 h-5 mr-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
        <span className="text-gray-700 font-medium">New Rd, Carlswald, Midrand, 1684</span>
      </span>
      <span className="flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
        <svg className="w-5 h-5 mr-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
        </svg>
        <span className="text-blue-600 font-semibold">+27 73 551 4705</span>
      </span>
      <span className="flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
        <svg className="w-5 h-5 mr-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
        </svg>
        <span className="text-gray-700 font-medium">info@rosemama.store</span>
      </span>
    </div>
  </div>
);

// Enhanced Order Details Cards
const InvoiceDetailsCard: React.FC<{ order: Order }> = ({ order }) => (
  <div className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 rounded-xl shadow-xl border border-blue-200/50 overflow-hidden backdrop-blur-sm">
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 shadow-lg">
      <h2 className="text-xl font-bold text-white flex items-center">
        <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        Invoice Details
      </h2>
    </div>
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex justify-between items-center py-3 px-4 bg-white/60 rounded-lg border border-gray-200">
          <span className="text-gray-700 font-semibold">Invoice Number</span>
          <span className="font-bold text-gray-900 text-lg">{generateInvoiceNumber(order.order_id)}</span>
        </div>
        <div className="flex justify-between items-center py-3 px-4 bg-white/60 rounded-lg border border-gray-200">
          <span className="text-gray-700 font-semibold">Order ID</span>
          <span className="font-semibold text-gray-800">{order.order_id}</span>
        </div>
        <div className="flex justify-between items-center py-3 px-4 bg-white/60 rounded-lg border border-gray-200">
          <span className="text-gray-700 font-semibold">Invoice Date</span>
          <span className="text-gray-800 font-medium">{formatDate(order.order_date)}</span>
        </div>
        <div className="flex justify-between items-center py-3 px-4 bg-white/60 rounded-lg border border-gray-200">
          <span className="text-gray-700 font-semibold">Status</span>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold border shadow-sm ${statusStyles[order.status]} transition-colors`}>
            {capitalizeFirst(order.status)}
          </span>
        </div>
      </div>
    </div>
  </div>
);

// Customer Details Card
const CustomerDetailsCard: React.FC<{ order: Order; formattedAddress?: ReturnType<typeof formatAddress> }> = ({ order, formattedAddress }) => (
  <div className="bg-gradient-to-br from-white via-gray-50/30 to-blue-50/30 rounded-xl shadow-xl border border-gray-200/50 overflow-hidden backdrop-blur-sm">
    <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4 shadow-lg">
      <h2 className="text-xl font-bold text-white flex items-center">
        <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
        Bill To
      </h2>
    </div>
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-1">{order.customer_name}</h3>
        <p className="text-gray-600 font-medium">{order.customer_email}</p>
      </div>
      {formattedAddress ? (
        <div className="space-y-3 text-sm">
          <div className="flex items-start">
            <svg className="w-5 h-5 mr-3 text-gray-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-700 font-medium">{formattedAddress.address}</span>
          </div>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-3 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-700 font-medium">
              {formattedAddress.city}{formattedAddress.region ? `, ${formattedAddress.region}` : ''}{formattedAddress.postalCode ? ` ${formattedAddress.postalCode}` : ''}
            </span>
          </div>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-3 text-pink-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-700 font-medium">{formattedAddress.country}</span>
          </div>
          {formattedAddress.phone && (
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-3 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              <span className="text-blue-600 font-semibold">{formatPhoneNumber(formattedAddress.phone)}</span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-500 italic">No address information available</p>
      )}
    </div>
  </div>
);

// Order Items Component
const OrderItemsComponent: React.FC<{ order: Order }> = ({ order }) => {
  const subtotal = useMemo(() => calculateSubtotal(order), [order]);
  const shippingFee = order.shipping_fee ?? 150;
  const total = useMemo(() => calculateTotal(order), [order]);

  return (
    <div className="bg-gradient-to-br from-white via-gray-50/30 to-blue-50/30 rounded-xl shadow-xl border border-gray-200/50 overflow-hidden backdrop-blur-sm mb-8">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-4 shadow-lg">
        <h3 className="text-xl font-bold text-white flex items-center">
          <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
          </svg>
          Order Items
        </h3>
      </div>
      <div className="overflow-hidden">
        <div className="bg-gradient-to-r from-gray-100 to-gray-50 p-4 border-b border-gray-200">
          <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-700">
            <div className="col-span-6">Item Description</div>
            <div className="col-span-2 text-center">Qty</div>
            <div className="col-span-2 text-right">Price</div>
            <div className="col-span-2 text-right">Total</div>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {order.order_items && order.order_items.length > 0 ? (
            order.order_items.map((item, index) => (
              <div key={index} className="p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 ease-in-out">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-6">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{item.products?.name || 'Unknown Product'}</p>
                      {item.products?.category && item.products.category !== 'N/A' && (
                        <p className="text-xs text-purple-600 uppercase tracking-wide font-medium">{item.products.category}</p>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-3 py-2 rounded-full text-xs font-semibold text-center w-10 h-10 flex items-center justify-center shadow-sm">
                      {item.quantity}
                    </div>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="font-medium text-gray-900">{formatCurrency(item.price_at_purchase)}</span>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="font-bold text-gray-900 text-lg">{formatCurrency(item.quantity * item.price_at_purchase)}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p className="text-lg font-medium">No items found in this order</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Payment and Summary Components
const PaymentMethodCard: React.FC<{ order: Order }> = ({ order }) => {
  const paymentInfo = getPaymentMethodInfo(order.payment_method);

  return (
    <div className="bg-gradient-to-br from-white via-gray-50/30 to-green-50/30 rounded-xl shadow-xl border border-gray-200/50 overflow-hidden backdrop-blur-sm">
      <div className="bg-gradient-to-r from-green-600 to-green-700 p-4 shadow-lg">
        <h3 className="text-xl font-bold text-white flex items-center">
          <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
          </svg>
          Payment Method
        </h3>
      </div>
      <div className="p-6">
        <div className="flex items-center space-x-4">
          <div className="text-3xl">{paymentInfo.emoji}</div>
          <div>
            <p className="font-bold text-gray-900 text-lg">{paymentInfo.title}</p>
            <p className="text-sm text-gray-600">{paymentInfo.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const OrderSummaryCard: React.FC<{ order: Order }> = ({ order }) => {
  const subtotal = useMemo(() => calculateSubtotal(order), [order]);
  const shippingFee = order.shipping_fee ?? 150;
  const total = useMemo(() => calculateTotal(order), [order]);

  return (
    <div className="bg-gradient-to-br from-white via-gray-50/30 to-blue-50/30 rounded-xl shadow-xl border border-gray-200/50 overflow-hidden backdrop-blur-sm">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 shadow-lg">
        <h3 className="text-xl font-bold text-white flex items-center">
          <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm2 2a1 1 0 000 2h8a1 1 0 100-2H5z" clipRule="evenodd" />
          </svg>
          Order Summary
        </h3>
      </div>
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center py-3 px-4 bg-white/60 rounded-lg border border-gray-200">
          <span className="text-gray-700 font-semibold">Subtotal</span>
          <span className="font-semibold text-gray-900 text-lg">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between items-center py-3 px-4 bg-white/60 rounded-lg border border-gray-200">
          <span className="text-gray-700 font-semibold">Shipping</span>
          <span className="font-semibold text-gray-900 text-lg">{formatCurrency(shippingFee)}</span>
        </div>
        <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 p-6 rounded-xl border-2 border-gradient-to-r from-blue-200 to-purple-200 shadow-lg">
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-gray-900">Total Amount</span>
            <span className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Footer Component
const InvoiceFooter: React.FC = () => (
  <div className="bg-gradient-to-r from-gray-100 via-blue-50 to-purple-50 rounded-xl p-6 text-center mt-8 mb-12" style={{marginBottom: '96px'}}>
    <h4 className="text-2xl font-bold text-gray-900 mb-2">Thank you for your business!</h4>
    <p className="text-gray-700 mb-4 text-lg">
      We're delighted to have served you at <span className="text-transparent bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text font-semibold">Rosemama</span>
    </p>
    <div className="mt-6 pt-4 border-t-2 border-gradient-to-r from-blue-200 to-purple-200">
      <p className="text-sm text-gray-600 mb-3">
        Questions? We're here to help!
      </p>
      <div className="flex justify-center items-center space-x-6 text-sm">
        <span className="flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm">
          <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
          </svg>
          <span className="text-blue-600 font-semibold">+27 73 551 4705</span>
        </span>
        <span className="flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm">
          <svg className="w-4 h-4 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
          <span className="text-purple-600 font-semibold">info@rosemama.store</span>
        </span>
      </div>
    </div>
    <div className="mt-4 pt-4 border-t border-gray-300">
      <p className="text-xs text-gray-500">Invoice generated on {formatDate(new Date().toISOString())}</p>
    </div>
  </div>
);

// Main Invoice Template Component
export function InvoiceTemplate({
  order,
  onClose,
  onPrint,
  onDownload,
  showActions = true
}: InvoiceTemplateProps) {
  const formattedAddress = useMemo(() => formatAddress(order.shipping_address), [order.shipping_address]);

  return (
    <div className="max-w-5xl mx-auto p-8 bg-gradient-to-br from-white via-blue-50/20 to-purple-50/20 shadow-2xl rounded-2xl border border-blue-200/30" id="invoice-template">
      {/* Enhanced Header */}
      <InvoiceHeader />

      {/* Collapsible Invoice Sections */}
      <Accordion type="multiple" defaultValue={["invoice-details", "customer-details", "order-items", "payment-method", "order-summary"]} className="space-y-6">
        {/* Invoice Details Section */}
        <AccordionItem value="invoice-details" className="border border-gray-200 rounded-xl overflow-hidden shadow-lg bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30">
          <AccordionTrigger className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:no-underline hover:bg-gradient-to-r hover:from-blue-700 hover:to-blue-800">
            <div className="flex items-center">
              <FileText className="w-6 h-6 mr-3" />
              <span className="text-xl font-bold">Invoice Details</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between items-center py-3 px-4 bg-white/60 rounded-lg border border-gray-200">
                  <span className="text-gray-700 font-semibold">Invoice Number</span>
                  <span className="font-bold text-gray-900 text-lg">{generateInvoiceNumber(order.order_id)}</span>
                </div>
                <div className="flex justify-between items-center py-3 px-4 bg-white/60 rounded-lg border border-gray-200">
                  <span className="text-gray-700 font-semibold">Order ID</span>
                  <span className="font-semibold text-gray-800">{order.order_id}</span>
                </div>
                <div className="flex justify-between items-center py-3 px-4 bg-white/60 rounded-lg border border-gray-200">
                  <span className="text-gray-700 font-semibold">Invoice Date</span>
                  <span className="text-gray-800 font-medium">{formatDate(order.order_date)}</span>
                </div>
                <div className="flex justify-between items-center py-3 px-4 bg-white/60 rounded-lg border border-gray-200">
                  <span className="text-gray-700 font-semibold">Status</span>
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold border shadow-sm ${statusStyles[order.status]} transition-colors`}>
                    {capitalizeFirst(order.status)}
                  </span>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Customer Details Section */}
        <AccordionItem value="customer-details" className="border border-gray-200 rounded-xl overflow-hidden shadow-lg bg-gradient-to-br from-white via-gray-50/30 to-blue-50/30">
          <AccordionTrigger className="px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:no-underline hover:bg-gradient-to-r hover:from-purple-700 hover:to-purple-800">
            <div className="flex items-center">
              <User className="w-6 h-6 mr-3" />
              <span className="text-xl font-bold">Bill To</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <div className="pt-4">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-1">{order.customer_name}</h3>
                <p className="text-gray-600 font-medium">{order.customer_email}</p>
              </div>
              {formattedAddress ? (
                <div className="space-y-3 text-sm">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 mr-3 text-gray-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700 font-medium">{formattedAddress.address}</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-3 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700 font-medium">
                      {formattedAddress.city}{formattedAddress.region ? `, ${formattedAddress.region}` : ''}{formattedAddress.postalCode ? ` ${formattedAddress.postalCode}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-3 text-pink-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700 font-medium">{formattedAddress.country}</span>
                  </div>
                  {formattedAddress.phone && (
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-3 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                      <span className="text-blue-600 font-semibold">{formatPhoneNumber(formattedAddress.phone)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 italic">No address information available</p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Order Items Section */}
        <AccordionItem value="order-items" className="border border-gray-200 rounded-xl overflow-hidden shadow-lg bg-gradient-to-br from-white via-gray-50/30 to-blue-50/30">
          <AccordionTrigger className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:no-underline hover:bg-gradient-to-r hover:from-indigo-700 hover:to-indigo-800">
            <div className="flex items-center">
              <Package className="w-6 h-6 mr-3" />
              <span className="text-xl font-bold">Order Items</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <OrderItemsComponent order={order} />
          </AccordionContent>
        </AccordionItem>

        {/* Payment Method Section */}
        <AccordionItem value="payment-method" className="border border-gray-200 rounded-xl overflow-hidden shadow-lg bg-gradient-to-br from-white via-gray-50/30 to-green-50/30">
          <AccordionTrigger className="px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white hover:no-underline hover:bg-gradient-to-r hover:from-green-700 hover:to-green-800">
            <div className="flex items-center">
              <CreditCard className="w-6 h-6 mr-3" />
              <span className="text-xl font-bold">Payment Method</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <PaymentMethodCard order={order} />
          </AccordionContent>
        </AccordionItem>

        {/* Order Summary Section */}
        <AccordionItem value="order-summary" className="border border-gray-200 rounded-xl overflow-hidden shadow-lg bg-gradient-to-br from-white via-gray-50/30 to-blue-50/30">
          <AccordionTrigger className="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:no-underline hover:bg-gradient-to-r hover:from-blue-700 hover:to-purple-700">
            <div className="flex items-center">
              <Receipt className="w-6 h-6 mr-3" />
              <span className="text-xl font-bold">Order Summary</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <OrderSummaryCard order={order} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Enhanced Footer */}
      <InvoiceFooter />

      {/* Action Buttons */}
      {showActions && (
        <div className="flex justify-center gap-6 mt-8 mb-8">
          <Button onClick={onPrint} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 px-6 py-3">
            <Printer className="h-5 w-5" />
            Print Invoice
          </Button>
          <Button onClick={onDownload} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 px-6 py-3">
            <Download className="h-5 w-5" />
            Download PDF
          </Button>
          {onClose && (
            <Button onClick={onClose} variant="outline" className="border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 px-6 py-3">
              <X className="h-5 w-5" />
              Close
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
