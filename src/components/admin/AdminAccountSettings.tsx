import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  User,
  Shield,
  Bell,
  Settings,
  Key,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  Activity,
  Globe,
  Moon,
  Sun,
  Monitor,
  LogOut
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../utils/ThemeContext';
import { updateUserProfile, updateUserPassword } from '../../utils/supabase/client';

// Types for preferences
interface NotificationPreference {
  key: keyof UserPreferences;
  label: string;
  description: string;
}

interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SelectPreference {
  key: keyof UserPreferences;
  label: string;
  options: SelectOption[];
}

interface UserPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  systemAlerts: boolean;
  orderAlerts: boolean;
  securityAlerts: boolean;
  language: string;
  timezone: string;
  theme: string;
  dashboardLayout: string;
  itemsPerPage: string;
}

// Configuration for notification preferences
const NOTIFICATION_PREFERENCES: NotificationPreference[] = [
  {
    key: 'emailNotifications',
    label: 'Email Notifications',
    description: 'Receive notifications via email'
  },
  {
    key: 'pushNotifications',
    label: 'Push Notifications',
    description: 'Receive push notifications in browser'
  },
  {
    key: 'systemAlerts',
    label: 'System Alerts',
    description: 'Important system notifications'
  },
  {
    key: 'orderAlerts',
    label: 'Order Alerts',
    description: 'Notifications for new orders'
  },
  {
    key: 'securityAlerts',
    label: 'Security Alerts',
    description: 'Security-related notifications'
  }
];

// Configuration for select preferences
const SELECT_PREFERENCES: SelectPreference[] = [
  {
    key: 'theme',
    label: 'Theme',
    options: [
      { value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
      { value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
      { value: 'system', label: 'System', icon: <Monitor className="h-4 w-4" /> }
    ]
  },
  {
    key: 'language',
    label: 'Language',
    options: [
      { value: 'en', label: 'English' },
      { value: 'af', label: 'Afrikaans' },
      { value: 'zu', label: 'isiZulu' },
      { value: 'xh', label: 'isiXhosa' },
      { value: 'tn', label: 'Setswana' },
      { value: 'st', label: 'Sesotho' },
      { value: 've', label: 'Tshivenda' },
      { value: 'ts', label: 'Xitsonga' }
    ]
  },
  {
    key: 'timezone',
    label: 'Timezone',
    options: [
      { value: 'UTC+3', label: 'UTC+3 (Nairobi, Kenya)' },
      { value: 'UTC+2', label: 'UTC+2 (Johannesburg, South Africa)' },
      { value: 'UTC+1', label: 'UTC+1 (Lagos, Nigeria)' },
      { value: 'UTC+0', label: 'UTC+0 (Dakar, Senegal)' },
      { value: 'UTC-1', label: 'UTC-1 (Cape Verde)' }
    ]
  },
  {
    key: 'itemsPerPage',
    label: 'Items Per Page',
    options: [
      { value: '10', label: '10' },
      { value: '20', label: '20' },
      { value: '50', label: '50' },
      { value: '100', label: '100' }
    ]
  }
];

// Default preferences
const DEFAULT_PREFERENCES: UserPreferences = {
  emailNotifications: true,
  pushNotifications: false,
  systemAlerts: true,
  orderAlerts: true,
  securityAlerts: true,
  language: 'en',
  timezone: 'UTC+2',
  theme: 'system',
  dashboardLayout: 'default',
  itemsPerPage: '20'
};

// Local storage key
const PREFERENCES_STORAGE_KEY = 'admin_preferences';

export function AdminAccountSettings() {
  const { user, isAdmin, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isPreferenceLoading, setIsPreferenceLoading] = useState(false);

  // Load preferences from localStorage on component mount
  useEffect(() => {
    const loadPreferences = () => {
      try {
        const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
        if (stored) {
          const parsedPreferences = JSON.parse(stored);
          // Merge with defaults to ensure all keys exist
          const mergedPreferences = { ...DEFAULT_PREFERENCES, ...parsedPreferences };
          setPreferences(mergedPreferences);
        }
      } catch (error) {
        console.error('Error loading preferences from localStorage:', error);
        // Fall back to defaults
        setPreferences(DEFAULT_PREFERENCES);
      }
    };

    loadPreferences();
  }, []);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    const savePreferences = () => {
      try {
        localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
      } catch (error) {
        console.error('Error saving preferences to localStorage:', error);
      }
    };

    // Only save if preferences have been loaded (not the initial empty state)
    if (Object.keys(preferences).length > 0) {
      savePreferences();
    }
  }, [preferences]);

  const handleProfileSave = async () => {
    if (!user) {
      toast.error('User not found');
      return;
    }

    setIsLoading(true);
    try {
      console.log('AdminAccountSettings: Updating user profile:', profileForm);

      // Prepare updates object - only include fields that have changed
      const updates: { name?: string; phone?: string; email?: string } = {};

      if (profileForm.name !== (user.name || '')) {
        updates.name = profileForm.name;
      }
      if (profileForm.phone !== (user.phone || '')) {
        updates.phone = profileForm.phone;
      }
      if (profileForm.email !== (user.email || '')) {
        updates.email = profileForm.email;
      }

      // Only update if there are changes
      if (Object.keys(updates).length === 0) {
        toast.info('No changes to save');
        setIsEditing(false);
        setIsLoading(false);
        return;
      }

      console.log('AdminAccountSettings: Updates to save:', updates);

      // Call the actual database update function
      const result = await updateUserProfile(user.id, updates);

      if (result) {
        console.log('AdminAccountSettings: Profile updated successfully:', result);
        toast.success('Profile updated successfully!');

        // Update local form state to reflect the saved changes
        setProfileForm({
          name: (result as any)?.name || profileForm.name,
          email: (result as any)?.email || profileForm.email,
          phone: (result as any)?.phone || profileForm.phone
        });

        setIsEditing(false);
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('AdminAccountSettings: Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      console.log('AdminAccountSettings: Changing user password');

      // Call the actual password update function
      const result = await updateUserPassword(passwordForm.newPassword);

      if (result) {
        console.log('AdminAccountSettings: Password changed successfully');
        toast.success('Password changed successfully!');

        // Clear the form
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        throw new Error('Failed to update password');
      }
    } catch (error: any) {
      console.error('AdminAccountSettings: Error changing password:', error);

      // Handle specific Supabase auth errors
      if (error.message?.includes('session_not_found') || error.message?.includes('refresh_token_not_found')) {
        toast.error('Session expired. Please log in again to change your password.');
      } else if (error.message?.includes('same_password')) {
        toast.error('New password must be different from current password');
      } else {
        toast.error('Failed to change password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferenceChange = useCallback(async (key: keyof UserPreferences, value: string | boolean) => {
    if (isPreferenceLoading) return;

    setIsPreferenceLoading(true);
    try {
      setPreferences(prev => ({ ...prev, [key]: value }));

      // Simulate async operation for better UX
      await new Promise(resolve => setTimeout(resolve, 300));

      toast.success('Preference updated');
    } catch (error) {
      console.error('Error updating preference:', error);
      toast.error('Failed to update preference');
    } finally {
      setIsPreferenceLoading(false);
    }
  }, [isPreferenceLoading]);

  const handleLogout = async () => {
    if (isLoggingOut) {
      console.log('AdminAccountSettings: Logout already in progress, ignoring click');
      return;
    }

    console.log('AdminAccountSettings: Logout button clicked');
    setIsLoggingOut(true);

    try {
      console.log('AdminAccountSettings: Calling signOut()');
      await signOut();
      console.log('AdminAccountSettings: signOut() completed');
      toast.success('Logged out successfully');
      console.log('AdminAccountSettings: About to reload page immediately');
      // Immediate reload to ensure clean state transition
      try {
        window.location.reload();
        console.log('AdminAccountSettings: window.location.reload() called successfully');
      } catch (error) {
        console.error('AdminAccountSettings: Error calling window.location.reload():', error);
        // Fallback: try with a small delay
        setTimeout(() => {
          console.log('AdminAccountSettings: Fallback reload attempt');
          window.location.reload();
        }, 100);
      }
    } catch (error) {
      console.error('AdminAccountSettings: Logout failed:', error);
      toast.error('Failed to log out');
      setIsLoggingOut(false); // Reset on error
    }
  };

  if (!user || !isAdmin) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">Access Denied</h3>
        <p className="text-muted-foreground">You need admin privileges to access this page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Admin Account Settings</h1>
        <p className="text-muted-foreground">Manage your admin account and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Admin Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="text-xl">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold">{user.name}</h3>
                    <Badge variant="secondary" className="bg-red-100 text-red-800">
                      <Shield className="h-3 w-3 mr-1" />
                      Administrator
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{user.email}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm">Member since {user.created_at
                      ? new Date(user.created_at).getFullYear()
                      : '2024'
                    }</span>
                    <span className="text-sm text-muted-foreground">Last login: Today</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
              </div>

              {/* Edit Profile Form */}
              {isEditing && (
                <div className="space-y-4 border-t pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleProfileSave} disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <div className="space-y-6">
            {/* Password Change */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Change Password
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPassword ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  />
                </div>

                <Button onClick={handlePasswordChange} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Two-Factor Authentication</h4>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Enable 2FA
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Active Sessions</h4>
                    <p className="text-sm text-muted-foreground">Manage your active login sessions</p>
                  </div>
                  <Button variant="outline" size="sm">
                    View Sessions
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Login History</h4>
                    <p className="text-sm text-muted-foreground">View your recent login activity</p>
                  </div>
                  <Button variant="outline" size="sm">
                    View History
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <div className="space-y-6">
            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {NOTIFICATION_PREFERENCES.map((notification) => (
                  <div key={notification.key} className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{notification.label}</h4>
                      <p className="text-sm text-muted-foreground">{notification.description}</p>
                    </div>
                    <Switch
                      checked={preferences[notification.key] as boolean}
                      onCheckedChange={(checked: boolean) => handlePreferenceChange(notification.key, checked)}
                      disabled={isPreferenceLoading}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Display Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Display Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {SELECT_PREFERENCES.map((selectPref) => (
                    <div key={selectPref.key}>
                      <Label>{selectPref.label}</Label>
                      <Select
                        value={preferences[selectPref.key] as string}
                        onValueChange={(value: string) => handlePreferenceChange(selectPref.key, value)}
                        disabled={isPreferenceLoading}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {selectPref.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                {option.icon}
                                {option.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system">
          <div className="space-y-6">
            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">99.9%</div>
                    <div className="text-sm text-muted-foreground">Uptime</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">1.2s</div>
                    <div className="text-sm text-muted-foreground">Avg Response</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">24/7</div>
                    <div className="text-sm text-muted-foreground">Monitoring</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Admin Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Admin Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Export System Data</h4>
                    <p className="text-sm text-muted-foreground">Download system data for backup</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Export Data
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Clear System Cache</h4>
                    <p className="text-sm text-muted-foreground">Clear cached data to improve performance</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Clear Cache
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">View Admin Logs</h4>
                    <p className="text-sm text-muted-foreground">Access system and admin activity logs</p>
                  </div>
                  <Button variant="outline" size="sm">
                    View Logs
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* API Keys */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API Keys
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Generate New API Key</h4>
                    <p className="text-sm text-muted-foreground">Create API keys for integrations</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Generate Key
                  </Button>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Active API Keys</h4>
                  <div className="text-sm text-muted-foreground">
                    No active API keys. Generate one to get started.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Logout Button */}
      <div className="mt-8">
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
    </div>
  );
}
