import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Star, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MessageSquare, 
  ThumbsUp, 
  Target,
  Award,
  BarChart3,
  PieChart,
  Calendar,
  Filter
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell, Pie } from 'recharts';

interface ReviewAnalytics {
  overview: {
    totalReviews: number;
    averageRating: number;
    ratingTrend: number; // percentage change
    responseRate: number;
    trustScore: number;
  };
  ratingDistribution: {
    rating: number;
    count: number;
    percentage: number;
  }[];
  timeseriesData: {
    date: string;
    reviews: number;
    averageRating: number;
    responses: number;
  }[];
  productPerformance: {
    productId: string;
    productName: string;
    totalReviews: number;
    averageRating: number;
    recentReviews: number;
    category: string;
  }[];
  sentimentAnalysis: {
    positive: number;
    neutral: number;
    negative: number;
  };
  responseMetrics: {
    averageResponseTime: number; // in hours
    responseRate: number;
    totalResponses: number;
  };
}

export function ReviewAnalytics() {
  const [analytics, setAnalytics] = useState<ReviewAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedTab, setSelectedTab] = useState('overview');

  // Mock data for demonstration
  useEffect(() => {
    const mockAnalytics: ReviewAnalytics = {
      overview: {
        totalReviews: 247,
        averageRating: 4.3,
        ratingTrend: 8.5, // 8.5% increase
        responseRate: 87,
        trustScore: 4.4
      },
      ratingDistribution: [
        { rating: 5, count: 142, percentage: 57.5 },
        { rating: 4, count: 68, percentage: 27.5 },
        { rating: 3, count: 23, percentage: 9.3 },
        { rating: 2, count: 8, percentage: 3.2 },
        { rating: 1, count: 6, percentage: 2.4 }
      ],
      timeseriesData: [
        { date: '2024-08-15', reviews: 12, averageRating: 4.2, responses: 10 },
        { date: '2024-08-22', reviews: 18, averageRating: 4.1, responses: 15 },
        { date: '2024-08-29', reviews: 15, averageRating: 4.4, responses: 13 },
        { date: '2024-09-05', reviews: 22, averageRating: 4.3, responses: 19 },
        { date: '2024-09-12', reviews: 19, averageRating: 4.5, responses: 17 },
        { date: '2024-09-19', reviews: 16, averageRating: 4.2, responses: 14 }
      ],
      productPerformance: [
        { productId: 'sku_1', productName: 'Summer Floral Dress', totalReviews: 45, averageRating: 4.6, recentReviews: 8, category: 'Dresses' },
        { productId: 'sku_2', productName: 'Evening Gown', totalReviews: 32, averageRating: 4.4, recentReviews: 5, category: 'Dresses' },
        { productId: 'sku_3', productName: 'Ankle Boots', totalReviews: 28, averageRating: 4.1, recentReviews: 3, category: 'Shoes' },
        { productId: 'sku_4', productName: 'Denim Jacket', totalReviews: 35, averageRating: 4.3, recentReviews: 6, category: 'Outwear' },
        { productId: 'sku_5', productName: 'Casual Blazer', totalReviews: 21, averageRating: 4.0, recentReviews: 2, category: 'Casual' }
      ],
      sentimentAnalysis: {
        positive: 78.5,
        neutral: 16.2,
        negative: 5.3
      },
      responseMetrics: {
        averageResponseTime: 4.2,
        responseRate: 87,
        totalResponses: 215
      }
    };

    setTimeout(() => {
      setAnalytics(mockAnalytics);
      setLoading(false);
    }, 1000);
  }, [timeRange]);

  const COLORS = ['#10B981', '#F59E0B', '#EF4444'];

  const formatRating = (rating: number) => rating.toFixed(1);

  if (loading) {
    return (
      <Card className="bg-neutral-900/60 backdrop-blur border-neutral-800">
        <CardContent className="p-6">
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Analytics...</h3>
            <p className="text-gray-500">Please wait while we process review data.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Review Analytics</h2>
          <p className="text-gray-600">Track customer satisfaction and review performance</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Reviews</p>
                <p className="text-2xl font-bold text-blue-900">{analytics.overview.totalReviews}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-600">+{analytics.overview.ratingTrend}%</span>
                </div>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Average Rating</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-yellow-900">{formatRating(analytics.overview.averageRating)}</p>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(analytics.overview.averageRating) 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Response Rate</p>
                <p className="text-2xl font-bold text-green-900">{analytics.overview.responseRate}%</p>
                <Progress value={analytics.overview.responseRate} className="mt-2" />
              </div>
              <ThumbsUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Trust Score</p>
                <p className="text-2xl font-bold text-purple-900">{formatRating(analytics.overview.trustScore)}</p>
                <Badge variant="outline" className="mt-1 bg-purple-100 text-purple-700 border-purple-300">
                  Excellent
                </Badge>
              </div>
              <Award className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-rose-600">Avg Response Time</p>
                <p className="text-2xl font-bold text-rose-900">{analytics.responseMetrics.averageResponseTime}h</p>
                <p className="text-xs text-rose-600 mt-1">Industry standard: 24h</p>
              </div>
              <Calendar className="h-8 w-8 text-rose-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Rating Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Rating Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.ratingDistribution.map((item) => (
                  <div key={item.rating} className="flex items-center gap-4">
                    <div className="flex items-center gap-1 w-16">
                      <span className="text-sm font-medium">{item.rating}</span>
                      <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    </div>
                    <div className="flex-1">
                      <Progress value={item.percentage} className="h-2" />
                    </div>
                    <div className="flex items-center gap-2 w-20">
                      <span className="text-sm text-gray-600">{item.count}</span>
                      <span className="text-xs text-gray-400">({item.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {/* Review Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Review Trends Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.timeseriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="reviews" fill="#3B82F6" name="Reviews" />
                  <Line yAxisId="right" type="monotone" dataKey="averageRating" stroke="#F59E0B" strokeWidth={3} name="Avg Rating" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          {/* Product Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Product Review Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.productPerformance.map((product) => (
                  <div key={product.productId} className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold">{product.productName}</h4>
                        <Badge variant="outline">{product.category}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          <span>{formatRating(product.averageRating)}</span>
                        </div>
                        <span>•</span>
                        <span>{product.totalReviews} total reviews</span>
                        <span>•</span>
                        <span>{product.recentReviews} recent</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Progress value={(product.averageRating / 5) * 100} className="w-24 h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sentiment" className="space-y-6">
          {/* Sentiment Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Sentiment Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPieChart>
                    <Pie
                      dataKey="value"
                      data={[
                        { name: 'Positive', value: analytics.sentimentAnalysis.positive },
                        { name: 'Neutral', value: analytics.sentimentAnalysis.neutral },
                        { name: 'Negative', value: analytics.sentimentAnalysis.negative }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      label
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sentiment Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-green-800">Positive</span>
                  </div>
                  <span className="text-2xl font-bold text-green-900">{analytics.sentimentAnalysis.positive}%</span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="font-medium text-yellow-800">Neutral</span>
                  </div>
                  <span className="text-2xl font-bold text-yellow-900">{analytics.sentimentAnalysis.neutral}%</span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-50">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="font-medium text-red-800">Negative</span>
                  </div>
                  <span className="text-2xl font-bold text-red-900">{analytics.sentimentAnalysis.negative}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}