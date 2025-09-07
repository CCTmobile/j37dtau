import { Order, OrderItem, ShippingAddress, StatusStyles } from '../types/invoice';

/**
 * Format currency with consistent ZAR display
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR'
  }).format(amount);
};

/**
 * Format date using South African locale
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Clean and format phone number for South African numbers
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  // Remove any non-numeric characters except + and spaces
  const cleaned = phone.replace(/[^0-9+\s]/g, '');
  // Format South African numbers
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `+27 ${cleaned.slice(1, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  if (cleaned.startsWith('27') && cleaned.length === 11) {
    return `+27 ${cleaned.slice(2, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return cleaned;
};

/**
 * Clean and format shipping address data
 */
export const formatAddress = (shipping_address: ShippingAddress | undefined): ShippingAddress | null => {
  if (!shipping_address) return null;

  const { address, city, state, zipCode, country } = shipping_address;

  // Ensure consistent country handling
  const normalizedCountry = country === 'ZA' ? 'South Africa' : country;

  return {
    ...shipping_address,
    address: address || '',
    city: city || '',
    region: state || '',
    postalCode: zipCode || '',
    country: normalizedCountry || 'South Africa'
  };
};

/**
 * Calculate subtotal from order items
 */
export const calculateSubtotal = (order: Order): number => {
  if (!order.order_items || order.order_items.length === 0) {
    return order.amount;
  }
  return order.order_items.reduce((total: number, item: OrderItem) =>
    total + (item.quantity * item.price_at_purchase), 0
  );
};

/**
 * Calculate total amount including shipping
 */
export const calculateTotal = (order: Order): number => {
  const subtotal = calculateSubtotal(order);
  const shippingFee = order.shipping_fee ?? 150; // Default to 150 if undefined
  return subtotal + shippingFee;
};

/**
 * Status badge styles for consistency across components
 */
export const statusStyles: StatusStyles = {
  delivered: 'bg-green-100 text-green-800 border-green-200',
  shipped: 'bg-blue-100 text-blue-800 border-blue-200',
  processing: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  pending: 'bg-gray-100 text-gray-800 border-gray-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

/**
 * Get payment method display information
 */
export const getPaymentMethodInfo = (paymentMethod?: string) => {
  switch (paymentMethod) {
    case 'cash-on-delivery':
      return {
        emoji: '💰',
        title: 'Cash on Delivery',
        description: 'Pay when you receive your order'
      };
    case 'bank-transfer':
      return {
        emoji: '🏦',
        title: 'Bank Transfer',
        description: 'Direct bank transfer'
      };
    case 'credit-card':
      return {
        emoji: '💳',
        title: 'Credit Card',
        description: 'Secure credit card payment'
      };
    default:
      return {
        emoji: '❓',
        title: 'Payment Method Not Specified',
        description: 'Payment method will be confirmed'
      };
  }
};

/**
 * Capitalize first letter of a string
 */
export const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Generate invoice number from order ID
 */
export const generateInvoiceNumber = (orderId: string): string => {
  return `INV-${orderId.slice(-8).toUpperCase()}`;
};
