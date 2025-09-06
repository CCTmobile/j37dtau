import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Gift, Star, Crown, Trophy, ShoppingBag, Truck, Percent } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../App';

export function Rewards() {
  const { user, loading } = useAuth();
  const [selectedReward, setSelectedReward] = useState<string | null>(null);

  if (loading) {
    return <div className="text-center py-12">Loading rewards...</div>;
  }

  if (!user) {
    return <div className="text-center py-12">Please sign in to view your rewards.</div>;
  }
  
  const onUpdateUser = (updatedUser: User) => {
    // This would ideally be handled by a context update function
    console.log('User update requested:', updatedUser);
    toast.info('User data is managed globally now.');
  };

  const tierBenefits = {
    Bronze: { minPoints: 0, color: 'bg-orange-600', benefits: ['5% cashback', 'Birthday discount'] },
    Silver: { minPoints: 500, color: 'bg-gray-400', benefits: ['7% cashback', 'Free shipping', 'Early access'] },
    Gold: { minPoints: 1000, color: 'bg-yellow-500', benefits: ['10% cashback', 'Free express shipping', 'VIP support', 'Exclusive events'] }
  };

  const nextTier = user.membershipTier === 'Bronze' ? 'Silver' : user.membershipTier === 'Silver' ? 'Gold' : null;
  const pointsToNext = nextTier ? tierBenefits[nextTier].minPoints - user.points : 0;
  const progressPercentage = nextTier ? (user.points / tierBenefits[nextTier].minPoints) * 100 : 100;

  const availableRewards = [
    { id: '1', name: '$5 Off Next Purchase', cost: 100, type: 'discount', icon: Percent },
    { id: '2', name: '$10 Off Next Purchase', cost: 200, type: 'discount', icon: Percent },
    { id: '3', name: 'Free Standard Shipping', cost: 50, type: 'shipping', icon: Truck },
    { id: '4', name: 'Free Express Shipping', cost: 150, type: 'shipping', icon: Truck },
    { id: '5', name: '$25 Off Next Purchase', cost: 500, type: 'discount', icon: Percent },
    { id: '6', name: 'Exclusive Access Item', cost: 750, type: 'access', icon: Crown }
  ];

  const recentActivity = [
    { date: '2024-01-15', type: 'earned', points: 50, description: 'Purchase at Rosemama' },
    { date: '2024-01-10', type: 'earned', points: 25, description: 'Product Review' },
    { date: '2024-01-05', type: 'redeemed', points: -100, description: '$5 Off Discount Used' },
    { date: '2024-01-01', type: 'earned', points: 100, description: 'New Year Bonus' }
  ];

  const redeemReward = (reward: any) => {
    if (user.points >= reward.cost) {
      onUpdateUser({
        ...user,
        points: user.points - reward.cost
      });
      toast.success(`${reward.name} redeemed successfully!`);
    } else {
      toast.error('Insufficient points to redeem this reward');
    }
  };

  return (
    <div className="container mx-auto px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Rewards & Membership</h1>
        <p className="text-muted-foreground">
          Earn points with every purchase and unlock exclusive benefits
        </p>
      </div>

      {/* Current Status */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${tierBenefits[user.membershipTier].color}`} />
              <h3 className="text-xl font-semibold">{user.membershipTier} Member</h3>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{user.points}</div>
              <div className="text-sm text-muted-foreground">points</div>
            </div>
          </div>

          {nextTier && (
            <>
              <div className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress to {nextTier}</span>
                  <span>{pointsToNext} points to go</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {tierBenefits[user.membershipTier].benefits.map((benefit, index) => (
              <div key={index} className="text-center p-3 bg-secondary/30 rounded-lg">
                <div className="text-sm font-medium">{benefit}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Available Rewards */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Available Rewards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableRewards.map((reward) => (
              <Card 
                key={reward.id} 
                className={`cursor-pointer transition-all ${
                  user.points >= reward.cost 
                    ? 'hover:shadow-md hover:scale-105' 
                    : 'opacity-60'
                }`}
                onClick={() => user.points >= reward.cost && redeemReward(reward)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${
                      reward.type === 'discount' ? 'bg-green-100' :
                      reward.type === 'shipping' ? 'bg-blue-100' :
                      'bg-purple-100'
                    }`}>
                      <reward.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{reward.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-medium">{reward.cost} pts</span>
                        {user.points >= reward.cost ? (
                          <Badge variant="secondary" className="text-xs">
                            Available
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Need {reward.cost - user.points} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    size="sm"
                    disabled={user.points < reward.cost}
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation();
                      redeemReward(reward);
                    }}
                  >
                    {user.points >= reward.cost ? 'Redeem' : 'Insufficient Points'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* How to Earn Points */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                How to Earn Points
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Every $1 spent</span>
                <span className="text-sm font-medium">1 point</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm">Product review</span>
                <span className="text-sm font-medium">25 points</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm">Birthday bonus</span>
                <span className="text-sm font-medium">100 points</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm">Referral bonus</span>
                <span className="text-sm font-medium">200 points</span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{activity.description}</div>
                    <div className="text-xs text-muted-foreground">{activity.date}</div>
                  </div>
                  <div className={`text-sm font-medium ${
                    activity.type === 'earned' ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {activity.type === 'earned' ? '+' : ''}{activity.points}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}