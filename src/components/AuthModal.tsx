import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Mail, Lock, User as UserIcon, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase/client';
import { toast } from 'sonner';

interface AuthModalProps {
  isOpen: boolean;
  mode: 'login' | 'signup';
  onClose: () => void;
  onLoginSuccess: () => void;
  onSignupSuccess: () => void;
  onSwitchMode: (mode: 'login' | 'signup') => void;
  title?: string;
  description?: string;
}

type ModalView = 'login' | 'signup' | 'forgot' | 'signup-success';

export function AuthModal({ 
  isOpen, 
  mode,
  onClose, 
  onLoginSuccess,
  onSignupSuccess,
  onSwitchMode,
  title, 
  description 
}: AuthModalProps) {
  const { signIn, signUp, resetPassword, resendVerification, pendingVerification } = useAuth();
  const [view, setView] = useState<ModalView>(mode);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });

  // Reset internal state every time the modal opens / mode changes
  useEffect(() => {
    if (isOpen) {
      setView(mode);
      setError(null);
      setNotice(null);
      setNeedsVerification(false);
      setIsLoading(false);
    }
  }, [isOpen, mode]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setIsLoading(true);
    const result = await signIn(formData.email.trim(), formData.password);
    setIsLoading(false);
    if (result.success) {
      onLoginSuccess();
    } else {
      setError(result.error || 'Login failed. Please try again.');
      setNeedsVerification(!!result.needsVerification);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    const result = await signUp(formData.email.trim(), formData.password, formData.name.trim());
    setIsLoading(false);

    if (result.success) {
      if (result.needsVerification) {
        setView('signup-success');
      } else {
        onSignupSuccess();
      }
    } else {
      setError(result.error || 'Signup failed. Please try again.');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!forgotEmail.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    const result = await resetPassword(forgotEmail.trim());
    setIsLoading(false);

    if (result.success) {
      setNotice('If an account exists for this email, a password reset link has been sent. Check your inbox.');
    } else {
      setError(result.error || 'Failed to send the reset email. Please try again.');
    }
  };

  const handleResendVerification = async () => {
    setError(null);
    setNotice(null);
    const success = await resendVerification(formData.email.trim());
    if (success) {
      setNotice('Verification email sent. Check your inbox.');
      toast.success('Verification email sent!');
    } else {
      setError('Failed to send the verification email. Please try again.');
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setError(null);
    setNotice(null);
    setIsLoading(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin }
      });
      if (oauthError) throw oauthError;
      // OAuth flow redirects the browser away; leave the modal open until navigation.
      setIsLoading(false);
    } catch (err: any) {
      setIsLoading(false);
      setError(
        err?.message ||
        `Unable to sign in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}. Is this provider enabled in your Supabase project?`
      );
    }
  };

  const switchMode = (next: 'login' | 'signup') => {
    setView(next);
    setError(null);
    setNotice(null);
    setNeedsVerification(false);
    onSwitchMode(next);
  };

  const goBackToLogin = () => {
    switchMode('login');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isLoading) onClose(); }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{view === 'forgot' ? 'Reset Password' : view === 'signup-success' ? 'Check your inbox' : (title || (mode === 'login' ? 'Sign In' : 'Create Account'))}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {view === 'forgot' && (
          <Card>
            <CardHeader>
              <CardTitle>Forgot your password?</CardTitle>
              <CardDescription>
                Enter the email you signed up with and we'll send you a link to reset your password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="m@example.com"
                      required
                      autoComplete="email"
                      className="pl-10"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                    />
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {notice && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <AlertDescription>{notice}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  disabled={isLoading}
                  onClick={goBackToLogin}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Sign In
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {view === 'signup-success' && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                <Mail className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <CardTitle>Account created!</CardTitle>
              <CardDescription>
                We've sent a verification link to <span className="font-medium text-foreground">{formData.email}</span>. Please check your inbox (and spam folder) and click the link to verify your email. You'll be able to sign in right after.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {notice && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <AlertDescription>{notice}</AlertDescription>
                </Alert>
              )}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button
                type="button"
                className="w-full"
                disabled={pendingVerification}
                onClick={handleResendVerification}
              >
                {pendingVerification ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Resend Verification Email'
                )}
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={goBackToLogin}>
                I've verified — Sign In
              </Button>
            </CardContent>
          </Card>
        )}

        {(view === 'login' || view === 'signup') && (
          <>
            <Tabs value={view} onValueChange={(value) => switchMode(value as 'login' | 'signup')} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Card>
                  <CardHeader>
                    <CardTitle>Welcome Back</CardTitle>
                    <CardDescription>Enter your credentials to access your account.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="m@example.com"
                            required
                            autoComplete="email"
                            className="pl-10"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="login-password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            autoComplete="current-password"
                            className="pl-10 pr-10"
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      {error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            {error}
                            {needsVerification && (
                              <Button
                                type="button"
                                variant="link"
                                className="h-auto p-0 text-destructive underline"
                                disabled={pendingVerification}
                                onClick={handleResendVerification}
                              >
                                {pendingVerification ? 'Sending...' : 'Resend verification email'}
                              </Button>
                            )}
                          </AlertDescription>
                        </Alert>
                      )}

                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Signing In...
                          </>
                        ) : (
                          'Sign In'
                        )}
                      </Button>
                    </form>
                    <div className="mt-4 text-center text-sm">
                      <button
                        type="button"
                        className="underline underline-offset-4"
                        disabled={isLoading}
                        onClick={() => {
                          setError(null);
                          setNotice(null);
                          setView('forgot');
                        }}
                      >
                        Forgot your password?
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="signup">
                <Card>
                  <CardHeader>
                    <CardTitle>Create an Account</CardTitle>
                    <CardDescription>Join us to get the best shopping experience.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">Full Name</Label>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-name"
                            placeholder="John Doe"
                            required
                            autoComplete="name"
                            className="pl-10"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="m@example.com"
                            required
                            autoComplete="email"
                            className="pl-10"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            autoComplete="new-password"
                            className="pl-10 pr-10"
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">At least 6 characters.</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-confirm-password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            autoComplete="new-password"
                            className="pl-10 pr-10"
                            value={formData.confirmPassword}
                            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      {error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creating Account...
                          </>
                        ) : (
                          'Create Account'
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={() => handleSocialLogin('google')} disabled={isLoading}>
                Google
              </Button>
              <Button variant="outline" onClick={() => handleSocialLogin('facebook')} disabled={isLoading}>
                Facebook
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
