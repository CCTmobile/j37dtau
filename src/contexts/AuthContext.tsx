import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { supabase, getCurrentUser, isAdmin as checkIsAdmin } from '../utils/supabase/client';
import type { User } from '../App';
import { Database } from '../utils/supabase/types';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, name: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const isFetchingRef = useRef(false);
  const isLoggingOutRef = useRef(false);

  const fetchUser = useCallback(async () => {
    // Prevent multiple concurrent fetchUser calls
    if (isFetchingRef.current) {
      console.log('fetchUser: Already fetching, skipping...');
      return;
    }

    console.log('fetchUser: Starting');
    isFetchingRef.current = true;

    try {
      setLoading(true);
      setError(null);

      console.log('fetchUser: Getting auth user from Supabase');
      const { data: { user: authUser } } = await supabase.auth.getUser();
      console.log('fetchUser: Checking admin status');
      const adminStatus = await checkIsAdmin();
      console.log(`fetchUser: Admin status is ${adminStatus}`);

      if (authUser) {
        console.log(`fetchUser: Auth user found with ID: ${authUser.id}`);
        // Get user profile from 'users' table
        console.log('fetchUser: Fetching user profile from "users" table');
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') { // Ignore 'no rows' error
            console.error('fetchUser: Error fetching user profile:', profileError);
            throw profileError;
        }
        console.log('fetchUser: User profile data:', userProfile);

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

        console.log('fetchUser: User state transformed and ready to be set:', transformedUser);
        setUser(transformedUser);
        setIsAdmin(adminStatus);
      } else {
        console.log('fetchUser: No auth user found. Clearing user state.');
        setUser(null);
        setIsAdmin(false);
      }
    } catch (err: any) {
      console.error('Error in fetchUser:', err);
      setError(err.message || 'Failed to load user data');
      setUser(null);
      setIsAdmin(false);
    } finally {
      console.log('fetchUser: Finished');
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  const signIn = async (email: string, password: string): Promise<boolean> => {
    console.log('signIn: Starting');
    setLoading(true);
    setError(null);
    try {
      console.log('signIn: Calling Supabase signInWithPassword');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      console.log('signIn: Supabase call returned.');
      console.log('signIn: Data:', data);
      console.log('signIn: Error:', error);

      if (error) {
        console.error('signIn: Supabase auth error:', error);
        throw error;
      }
      
      console.log('signIn: Supabase sign-in appears successful. Waiting for auth state change.');
      // The onAuthStateChange listener will automatically call fetchUser.
      return true;
    } catch (err: any) {
      console.error('Error in signIn:', err);
      setError(err.message || 'Failed to sign in');
      return false;
    } finally {
      console.log('signIn: Finished');
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name
          }
        }
      });
      
      if (error) throw error;
      
      // Note: User will need to verify email before being fully signed in
      return true;
    } catch (err: any) {
      console.error('Error signing up:', err);
      setError(err.message || 'Failed to sign up');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    console.log('signOut: Starting logout process');
    isLoggingOutRef.current = true; // Set logout flag

    try {
      setLoading(true);
      console.log('signOut: Calling supabase.auth.signOut()');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('signOut: Supabase sign out error:', error);
        throw error;
      }

      console.log('signOut: Supabase sign out successful');
      console.log('signOut: Clearing local state');
      setUser(null);
      setIsAdmin(false);
      console.log('signOut: Local state cleared');
    } catch (err) {
      console.error('signOut: Error during logout:', err);
      setError('Failed to sign out');
    } finally {
      console.log('signOut: Setting loading to false');
      setLoading(false);
      // Keep logout flag set until page reload happens
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      
      return true;
    } catch (err: any) {
      console.error('Error resetting password:', err);
      setError(err.message || 'Failed to reset password');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Reset logout flag on component mount (after page reload)
  useEffect(() => {
    console.log('AuthContext: Component mounted, resetting logout flag');
    isLoggingOutRef.current = false;
  }, []);

  // Set up auth state listener
  useEffect(() => {
    console.log('AuthContext: Setting up auth state listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthContext: Auth state changed:', event, session ? 'Session exists' : 'No session');

      // Skip fetchUser during logout to prevent interference with page reload
      if (isLoggingOutRef.current && event === 'SIGNED_OUT') {
        console.log('AuthContext: Skipping fetchUser during logout process');
        return;
      }

      await fetchUser();
    });

    // Initial fetch
    fetchUser();

    return () => {
      console.log('AuthContext: Unsubscribing from auth state listener');
      subscription.unsubscribe();
    };
  }, [fetchUser]);

  return (
    <AuthContext.Provider value={{ user, loading, error, isAdmin, signIn, signUp, signOut, resetPassword }}>
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
