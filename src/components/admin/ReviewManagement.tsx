import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { ReviewAnalytics } from './ReviewAnalytics';
import { 
  Star, 
  MessageSquare, 
  TrendingUp, 
  Filter, 
  Search, 
  ExternalLink, 
  BarChart3,
  Users,
  ThumbsUp,
  ThumbsDown,
  Reply,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface Review {
  id: string;
  customerName: string;
  customerEmail: string;
  productId: string;
  productName: string;
  rating: number;
  title: string;
  content: string;
  createdAt: string;
  verified: boolean;
  helpful: number;
  unhelpful: number;
  response?: {
    content: string;
    createdAt: string;
    author: string;
  };
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  recentReviews: number;
  responseRate: number;
}

export function ReviewManagement() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRating, setFilterRating] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [responseText, setResponseText] = useState('');

  // Mock data for demonstration
  useEffect(() => {
    const mockReviews: Review[] = [
      {
        id: '1',
        customerName: 'Sarah Johnson',
        customerEmail: 'sarah@example.com',
        productId: 'sku_1',
        productName: 'Summer Floral Dress',
        rating: 5,
        title: 'Beautiful dress, perfect fit!',
        content: 'I absolutely love this dress! The fabric is high quality and the fit is perfect. The floral pattern is gorgeous and I\'ve received so many compliments. Will definitely order more from this store.',
        createdAt: '2024-09-10T10:30:00Z',
        verified: true,
        helpful: 12,
        unhelpful: 0,
      },
      {
        id: '2',
        customerName: 'Emma Davis',
        customerEmail: 'emma@example.com',
        productId: 'sku_2',
        productName: 'Evening Gown',
        rating: 4,
        title: 'Great for special occasions',
        content: 'This gown is stunning and perfect for formal events. The only reason I\'m giving 4 stars instead of 5 is that it runs slightly small. I recommend ordering a size up.',
        createdAt: '2024-09-08T15:45:00Z',
        verified: true,
        helpful: 8,
        unhelpful: 1,
        response: {
          content: 'Thank you for your review! We appreciate your feedback about sizing and will update our size guide. We\'re so glad you love the gown for special occasions!',
          createdAt: '2024-09-09T09:15:00Z',
          author: 'Rosémama Team'
        }
      },
      {
        id: '3',
        customerName: 'Lisa Brown',
        customerEmail: 'lisa@example.com',
        productId: 'sku_3',
        productName: 'Ankle Boots',
        rating: 3,
        title: 'Good quality but uncomfortable',
        content: 'The boots are well-made and look great, but they\'re quite uncomfortable for long periods. The sizing is accurate though.',
        createdAt: '2024-09-05T12:20:00Z',
        verified: true,
        helpful: 3,
        unhelpful: 2,
      }
    ];

    const mockStats: ReviewStats = {
      totalReviews: 47,
      averageRating: 4.3,
      ratingDistribution: { 5: 23, 4: 15, 3: 6, 2: 2, 1: 1 },
      recentReviews: 8,
      responseRate: 85
    };

    setTimeout(() => {
      setReviews(mockReviews);
      setStats(mockStats);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter reviews based on search and filters
  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         review.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         review.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRating = filterRating === 'all' || review.rating.toString() === filterRating;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'responded' && review.response) ||
                         (filterStatus === 'pending' && !review.response);
    
    return matchesSearch && matchesRating && matchesStatus;
  });

  const handleResponseSubmit = async (reviewId: string) => {
    if (!responseText.trim()) {
      toast.error('Please enter a response');
      return;
    }

    try {
      // In a real app, this would make an API call
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? {
              ...review,
              response: {
                content: responseText,
                createdAt: new Date().toISOString(),
                author: 'Rosémama Team'
              }
            }
          : review
      ));
      
      setResponseText('');
      setSelectedReview(null);
      toast.success('Response sent successfully!');
    } catch (error) {
      toast.error('Failed to send response');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card className="bg-neutral-900/60 backdrop-blur border-neutral-800">
        <CardContent className="p-6">
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Reviews...</h3>
            <p className="text-gray-500">Please wait while we fetch review data.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Review Management</h2>
          <p className="text-gray-600">Monitor and respond to customer reviews</p>
        </div>
        <Button
          onClick={() => window.open('https://businessapp.b2b.trustpilot.com/', '_blank')}
          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Trustpilot Dashboard
        </Button>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="reviews" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="reviews">Review Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics & Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="space-y-6">

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Reviews</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.totalReviews}</p>
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
                    <p className="text-2xl font-bold text-yellow-900">{stats.averageRating}</p>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(stats.averageRating) 
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
                  <p className="text-2xl font-bold text-green-900">{stats.responseRate}%</p>
                </div>
                <Reply className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Recent Reviews</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.recentReviews}</p>
                  <p className="text-xs text-purple-600">Last 7 days</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search reviews, products, or customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterRating} onValueChange={setFilterRating}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reviews</SelectItem>
                <SelectItem value="pending">Pending Response</SelectItem>
                <SelectItem value="responded">Responded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.map((review) => (
          <Card key={review.id} className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {review.customerName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{review.customerName}</h4>
                    <p className="text-sm text-gray-500">{review.productName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {review.verified && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Verified Purchase
                    </Badge>
                  )}
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h5 className="font-semibold text-gray-900 mb-2">{review.title}</h5>
                <p className="text-gray-700 leading-relaxed">{review.content}</p>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-4">
                  <span>{formatDate(review.createdAt)}</span>
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="h-3 w-3" />
                    <span>{review.helpful}</span>
                    <ThumbsDown className="h-3 w-3 ml-2" />
                    <span>{review.unhelpful}</span>
                  </div>
                </div>
              </div>

              {/* Response Section */}
              {review.response ? (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      R
                    </div>
                    <span className="font-semibold text-blue-900">{review.response.author}</span>
                    <span className="text-sm text-blue-600">responded on {formatDate(review.response.createdAt)}</span>
                  </div>
                  <p className="text-blue-800">{review.response.content}</p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedReview(review)}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Reply className="h-4 w-4 mr-1" />
                        Respond
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Respond to Review</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">{review.customerName}</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < review.rating 
                                      ? 'text-yellow-400 fill-current' 
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-700">{review.content}</p>
                        </div>
                        <textarea
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          placeholder="Write your response..."
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows={4}
                        />
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setSelectedReview(null);
                              setResponseText('');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={() => handleResponseSubmit(review.id)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Send Response
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Badge variant="outline" className="text-orange-600 border-orange-200">
                    Pending Response
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredReviews.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
            <p className="text-gray-500">
              {searchQuery || filterRating !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your filters to see more reviews.'
                : 'Reviews will appear here once customers start leaving feedback.'}
            </p>
          </CardContent>
        </Card>
      )}
        </TabsContent>

        <TabsContent value="analytics">
          <ReviewAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}