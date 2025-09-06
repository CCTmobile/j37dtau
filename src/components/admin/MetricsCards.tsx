import { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { TrendingUp, ShoppingCart, Package, Users, Loader2 } from 'lucide-react';
import { getTotalRevenue, getTotalOrders, getTotalUsers, getRevenueGrowth } from '../../utils/supabase/client';
import type { Product } from '../../App';

interface MetricsCardsProps {
  products: Product[];
}

export function MetricsCards({ products }: MetricsCardsProps) {
  const [metrics, setMetrics] = useState({
    revenue: 0,
    orders: 0,
    users: 0,
    growth: { current_period_revenue: 0, previous_period_revenue: 0, growth_percentage: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const [revenue, orders, users, growth] = await Promise.all([
          getTotalRevenue(),
          getTotalOrders(),
          getTotalUsers(),
          getRevenueGrowth(30)
        ]);

        setMetrics({
          revenue: revenue || 0,
          orders: orders || 0,
          users: users || 0,
          growth: growth || { current_period_revenue: 0, previous_period_revenue: 0, growth_percentage: 0 }
        });
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-center h-20">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium">Total Revenue</span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold">{formatCurrency(metrics.revenue)}</div>
            <p className={`text-xs ${metrics.growth.growth_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {metrics.growth.growth_percentage >= 0 ? '+' : ''}{metrics.growth.growth_percentage.toFixed(1)}% from last month
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium">Total Orders</span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold">{formatNumber(metrics.orders)}</div>
            <p className="text-xs text-blue-600">All time orders</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium">Total Products</span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold">{formatNumber(products.length)}</div>
            <p className="text-xs text-purple-600">Available in store</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium">Total Users</span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold">{formatNumber(metrics.users)}</div>
            <p className="text-xs text-orange-600">Registered users</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
