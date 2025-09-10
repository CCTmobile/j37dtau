import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Mail, X, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface VerificationBannerProps {
  variant?: 'banner' | 'card' | 'inline';
  showDismiss?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function VerificationBanner({ 
  variant = 'banner', 
  showDismiss = false, 
  onDismiss,
  className = ''
}: VerificationBannerProps) {
  const { user, isEmailVerified, pendingVerification, resendVerification } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if user is not logged in or already verified
  if (!user || isEmailVerified || isDismissed) {
    return null;
  }

  const handleResend = async () => {
    const success = await resendVerification();
    if (success) {
      toast.success('Verification email sent! Check your inbox.');
    } else {
      toast.error('Failed to send verification email. Please try again.');
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const content = (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <Mail className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">
            Verify your email address
          </p>
          <p className="text-xs text-gray-600">
            Check your inbox and click the verification link to access order tracking and earn rewards.
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleResend}
          disabled={pendingVerification}
          className="text-xs"
        >
          {pendingVerification ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Sending...
            </>
          ) : (
            'Resend Email'
          )}
        </Button>
        
        {showDismiss && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleDismiss}
            className="p-1 h-auto"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );

  if (variant === 'card') {
    return (
      <Card className={`border-blue-200 bg-blue-50 ${className}`}>
        <CardContent className="p-4">
          {content}
        </CardContent>
      </Card>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`rounded-md bg-blue-50 border border-blue-200 p-3 ${className}`}>
        {content}
      </div>
    );
  }

  // Default banner variant
  return (
    <div className={`bg-blue-50 border-b border-blue-200 px-4 py-3 ${className}`}>
      {content}
    </div>
  );
}

// Simplified version for headers/small spaces
export function VerificationBadge({ className = '' }: { className?: string }) {
  const { user, isEmailVerified, resendVerification } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user || isEmailVerified) return null;

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
      >
        <Mail className="h-3 w-3 mr-1" />
        Verify Email
      </Button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border p-3 z-50">
          <div className="text-xs">
            <p className="font-medium mb-1">Email verification needed</p>
            <p className="text-gray-600 mb-2">
              Verify your email to track orders and earn rewards.
            </p>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={async () => {
                  await resendVerification();
                  setIsOpen(false);
                  toast.success('Verification email sent!');
                }}
                className="text-xs"
              >
                Resend
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsOpen(false)}
                className="text-xs"
              >
                Later
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
