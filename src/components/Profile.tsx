import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Edit, MapPin, CreditCard, Bell, Shield, LogOut, Package, Heart, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

interface ProfileProps {
  onLogout: () => void;
}

export function Profile({ onLogout }: ProfileProps) {
  const { user, loading, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (loading) {
    return <div className="text-center py-12">Loading profile...</div>;
  }

  if (!user) {
    return <div className="text-center py-12">Could not load user profile. Please try logging in again.</div>;
  }

  const [editForm, setEditForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || ''
  });

  const handleSave = () => {
    // Update functionality to be implemented later
    setIsEditing(false);
    toast.info('Profile update functionality is coming soon!');
  };

  const handleLogout = async () => {
    if (isLoggingOut) {
      console.log('Profile: Logout already in progress, ignoring click');
      return;
    }

    console.log('Profile: Logout button clicked');
    setIsLoggingOut(true);

    try {
      console.log('Profile: Calling signOut()');
      await signOut();
      console.log('Profile: signOut() completed');
      toast.success('Signed out successfully');
      console.log('Profile: About to reload page immediately');
      // Immediate reload to ensure clean state transition
      try {
        window.location.reload();
        console.log('Profile: window.location.reload() called successfully');
      } catch (error) {
        console.error('Profile: Error calling window.location.reload():', error);
        // Fallback: try with a small delay
        setTimeout(() => {
          console.log('Profile: Fallback reload attempt');
          window.location.reload();
        }, 100);
      }
    } catch (error) {
      console.error('Profile: Logout failed:', error);
      toast.error('Failed to log out');
      setIsLoggingOut(false); // Reset on error
    }
  };

  const menuItems = [
    { icon: Package, label: 'Order History', action: () => toast.info('Order history coming soon!') },
    { icon: Heart, label: 'Wishlist', action: () => toast.info('Wishlist coming soon!') },
    { icon: MapPin, label: 'Addresses', action: () => toast.info('Address management coming soon!') },
    { icon: CreditCard, label: 'Payment Methods', action: () => toast.info('Payment methods coming soon!') },
    { icon: Bell, label: 'Notifications', action: () => toast.info('Notification settings coming soon!') },
    { icon: Shield, label: 'Privacy & Security', action: () => toast.info('Privacy settings coming soon!') },
  ];

  return (
    <div className="container mx-auto px-6 py-6 max-w-2xl">
      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-xl">
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-semibold">{user.name}</h2>
                <Badge 
                  variant="secondary"
                  className={
                    user.membershipTier === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                    user.membershipTier === 'Silver' ? 'bg-gray-100 text-gray-800' :
                    'bg-orange-100 text-orange-800'
                  }
                >
                  {user.membershipTier} Member
                </Badge>
              </div>
              <p className="text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm">
                  ✨ {user.points} points
                </span>
                <span className="text-sm text-muted-foreground">
                  Member since 2024
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile */}
      {isEditing && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave}>Save Changes</Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Menu Items */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y">
            {menuItems.map((item, index) => (
              <li key={index} className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50" onClick={item.action}>
                <div className="flex items-center gap-4">
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                  <span>{item.label}</span>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Logout Button */}
      <Button
        variant="destructive"
        className="w-full"
        onClick={handleLogout}
        disabled={isLoggingOut}
      >
        {isLoggingOut ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Signing Out...
          </>
        ) : (
          <>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </>
        )}
      </Button>
    </div>
  );
}
