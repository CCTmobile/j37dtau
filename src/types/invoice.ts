export interface Product {
  name: string;
  category: string;
}

export interface OrderItem {
  products?: Product;
  quantity: number;
  price_at_purchase: number;
}

export interface ShippingAddress {
  firstName?: string;
  lastName?: string;
  address: string;
  city: string;
  region?: string;
  state?: string;
  zipCode: string;
  postalCode?: string;
  country: string;
  phone: string;
  email?: string;
}

export interface Order {
  id: string;
  order_id: string;
  customer_name: string;
  customer_email: string;
  amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  order_date: string;
  shipping_address?: ShippingAddress;
  order_items?: OrderItem[];
  payment_method?: 'cash-on-delivery' | 'bank-transfer' | 'credit-card' | 'N/A';
  shipping_fee?: number;
}

export interface InvoiceTemplateProps {
  order: Order;
  onClose?: () => void;
  onPrint?: () => void;
  onDownload?: () => void;
  showActions?: boolean;
}

export type StatusStyles = Record<Order['status'], string>;
