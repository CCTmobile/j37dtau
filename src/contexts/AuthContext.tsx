import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { supabase, isAdmin as checkIsAdmin } from '../utils/supabase/client';
import type { User } from '../App';
import { Database } from '../utils/supabase/types';

export type AuthResult = {
  success: boolean;
  error?: string;
  needsVerification?: boolean;
};

// Map common Supabase auth errors to user-friendly messages.
export const getAuthErrorMessage = (err: any): string => {
  const message = (err?.message || '').toLowerCase();
  const code = err?.code;

  if (message.includes('invalid login credentials')) {
    return 'Incorrect email or password. Please try again.';
  }
  if (message.includes('email not confirmed') || message.includes('email not verified')) {
    return 'Your email has not been verified yet.';
  }
  if (message.includes('already been registered') || message.includes('already registered')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (message.includes('at least 6 characters')) {
    return 'Password must be at least 6 characters long.';
  }
  if (message.includes('email address is not authorized')) {
    return 'This email address is not authorized to sign in.';
  }
  if (message.includes('rate limit') || message.includes('too many requests')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (message.includes('unable to validate email')) {
    return 'Please enter a valid email address.';
  }
  if (code === 'over_email_send_rate_limit') {
    return 'Too many emails sent. Please wait a minute before trying again.';
  }
  return err?.message || 'Something went wrong. Please try again.';
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  isEmailVerified: boolean;
  pendingVerification: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, name: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResult>;
  resendVerification: (email?: string) => Promise<boolean>;
  checkVerificationStatus: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const isFetchingRef = useRef(false);
  const isLoggingOutRef = useRef(false);

  const fetchUser = useCallback(async () => {
    // Prevent multiple concurrent fetchUser calls
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      setLoading(true);
      setError(null);

      const { data: { user: authUser } } = await supabase.auth.getUser();
      const adminStatus = await checkIsAdmin();

      if (authUser) {
        setIsEmailVerified(authUser.email_confirmed_at !== null);

        // Get user profile from 'users' table
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') { // Ignore 'no rows' error
          throw profileError;
        }

        // Transform Supabase user to match our User type
        const transformedUser: User = {
          id: authUser.id,
          email: authUser.email ?? '',
          name: (userProfile as any)?.name ?? (authUser.user_metadata as any)?.name ?? 'New User',
          phone: (userProfile as any)?.phone ?? (authUser.user_metadata as any)?.phone ?? undefined,
          membershipTier: 'Bronze', // Default tier
          points: 0, // Default points
          created_at: (userProfile as any)?.created_at,
          preferences: {
            sizes: [],
            colors: [],
            styles: []
          }
        };

        setUser(transformedUser);
        setIsAdmin(adminStatus);
        setPendingVerification(false);
      } else {
        setUser(null);
        setIsAdmin(false);
        setIsEmailVerified(false);
        setPendingVerification(false);
      }
    } catch (err: any) {
      console.error('fetchUser: Error loading user data:', err);
      setError(err.message || 'Failed to load user data');
      setUser(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        const message = getAuthErrorMessage(error);
        setError(message);
        if (message.includes('not been verified')) {
          setPendingVerification(true);
          return { success: false, error: message, needsVerification: true };
        }
        return { success: false, error: message };
      }

      return { success: true };
    } catch (err: any) {
      console.error('signIn: Unexpected error:', err);
      const message = getAuthErrorMessage(err);
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<AuthResult> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name
          }
        }
      });

      if (error) {
        const message = getAuthErrorMessage(error);
        setError(message);
        return { success: false, error: message };
      }

      // No session means email confirmation is required before the user can sign in.
      const needsVerification = !!data.user && !data.session;
      if (needsVerification) {
        setPendingVerification(true);
        setError(null);
      }

      return { success: true, needsVerification };
    } catch (err: any) {
      console.error('signUp: Unexpected error:', err);
      const message = getAuthErrorMessage(err);
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    isLoggingOutRef.current = true; // Set logout flag

    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setIsAdmin(false);
      setPendingVerification(false);
    } catch (err) {
      console.error('signOut: Error during logout:', err);
      setError('Failed to sign out');
    } finally {
      setLoading(false);
      // Keep logout flag set until page reload happens
    }
  };

  const resetPassword = async (email: string): Promise<AuthResult> => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        const message = getAuthErrorMessage(error);
        setError(message);
        return { success: false, error: message };
      }
      return { success: true };
    } catch (err: any) {
      console.error('resetPassword: Unexpected error:', err);
      const message = getAuthErrorMessage(err);
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Resend email verification. Optionally takes an email (used when the user
  // is not signed in yet, e.g. after signup with email confirmation enabled).
  const resendVerification = async (email?: string): Promise<boolean> => {
    try {
      setError(null);
      setPendingVerification(true);

      let targetEmail = email;
      if (!targetEmail) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser?.email) {
          setError('No email address available. Please sign in first.');
          return false;
        }
        targetEmail = authUser.email;
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: targetEmail
      });

      if (error) {
        setError(getAuthErrorMessage(error));
        return false;
      }
      return true;
    } catch (err: any) {
      console.error('resendVerification: Unexpected error:', err);
      setError(getAuthErrorMessage(err));
      return false;
    } finally {
      setPendingVerification(false);
    }
  };

  // Check verification status manually
  const checkVerificationStatus = async (): Promise<void> => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        setIsEmailVerified(authUser.email_confirmed_at !== null);
      }
    } catch (err) {
      console.error('Error checking verification status:', err);
    }
  };

  // Reset logout flag on component mount (after page reload)
  useEffect(() => {
    isLoggingOutRef.current = false;
  }, []);

  // Set up auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Skip fetchUser during logout to prevent interference with page reload
      if (isLoggingOutRef.current && event === 'SIGNED_OUT') return;

      await fetchUser();
    });

    // Initial fetch
    fetchUser();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUser]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      isAdmin, 
      isEmailVerified, 
      pendingVerification, 
      signIn, 
      signUp, 
      signOut, 
      resetPassword, 
      resendVerification, 
      checkVerificationStatus 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
