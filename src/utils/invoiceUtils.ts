import { Order, OrderItem, ShippingAddress, StatusStyles } from '../types/invoice';

/** Format ZAR currency */
export const formatCurrency = (a: number): string => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(a);

/** Format date South African locale */
export const formatDate = (d: string): string => new Date(d).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });

/** Clean/format SA phone numbers */
export const formatPhoneNumber = (p: string): string => {
  if (!p) return '';
  const c = p.replace(/[^0-9+\s]/g, '');
  return c.startsWith('0') && c.length === 10 ? `+27 ${c.slice(1, 3)} ${c.slice(3, 6)} ${c.slice(6)}` : c.startsWith('27') && c.length === 11 ? `+27 ${c.slice(2, 4)} ${c.slice(4, 7)} ${c.slice(7)}` : c;
};

/** Clean/format shipping address */
export const formatAddress = (sa: ShippingAddress | undefined): ShippingAddress | null => {
  if (!sa) return null;
  const { address, city, state, zipCode, country } = sa;
  const nc = country === 'ZA' ? 'South Africa' : country;
  return { ...sa, address: address || '', city: city || '', region: state || '', postalCode: zipCode || '', country: nc || 'South Africa' };
};

/** Calculate subtotal from items */
export const calculateSubtotal = (o: Order): number => o.order_items?.length ? o.order_items.reduce((t, i: OrderItem) => t + i.quantity * i.price_at_purchase, 0) : o.amount;

/** Calculate total with shipping */
export const calculateTotal = (o: Order): number => calculateSubtotal(o) + (o.shipping_fee ?? 150);

/** Status badge styles */
export const statusStyles: StatusStyles = {
  delivered: 'bg-green-100 text-green-800 border-green-200',
  shipped: 'bg-blue-100 text-blue-800 border-blue-200',
  processing: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  pending: 'bg-gray-100 text-gray-800 border-gray-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

/** Get payment method info */
export const getPaymentMethodInfo = (pm?: string) => {
  switch (pm) {
    case 'cash-on-delivery': return { emoji: '💰', title: 'Cash on Delivery', description: 'Pay when you receive your order' };
    case 'bank-transfer': return { emoji: '🏦', title: 'Bank Transfer', description: 'Direct bank transfer' };
    case 'credit-card': return { emoji: '💳', title: 'Credit Card', description: 'Secure credit card payment' };
    default: return { emoji: '❓', title: 'Payment Method Not Specified', description: 'Payment method will be confirmed' };
  }
};

/** Capitalize first letter */
export const capitalizeFirst = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** Generate invoice number */
export const generateInvoiceNumber = (id: string): string => `INV-${id.slice(-8).toUpperCase()}`;
