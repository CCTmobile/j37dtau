export const SALES_DATA = [
  { month: 'Jan', sales: 4000, orders: 120 },
  { month: 'Feb', sales: 3000, orders: 98 },
  { month: 'Mar', sales: 5000, orders: 156 },
  { month: 'Apr', sales: 4500, orders: 142 },
  { month: 'May', sales: 6000, orders: 187 },
  { month: 'Jun', sales: 5500, orders: 165 }
];

export const CATEGORY_DATA = [
  { name: 'Casual', value: 35, color: '#8884d8' },
  { name: 'Party', value: 25, color: '#82ca9d' },
  { name: 'Shoes', value: 20, color: '#ffc658' },
  { name: 'Outwear', value: 20, color: '#ff7c7c' }
];

export const RECENT_ORDERS = [
  { id: '001', customer: 'Sarah Johnson', amount: 159.99, status: 'shipped', date: '2024-01-20' },
  { id: '002', customer: 'Mike Chen', amount: 89.50, status: 'processing', date: '2024-01-20' },
  { id: '003', customer: 'Emma Davis', amount: 249.99, status: 'delivered', date: '2024-01-19' },
  { id: '004', customer: 'John Smith', amount: 179.25, status: 'pending', date: '2024-01-19' }
];

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'delivered': return 'bg-green-100 text-green-800';
    case 'shipped': return 'bg-blue-100 text-blue-800';
    case 'processing': return 'bg-yellow-100 text-yellow-800';
    case 'pending': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};