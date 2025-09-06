# Admin Role Management

## Overview

This document details how admin roles are managed in the Rosemama Clothing Fashion E-Commerce App. Admin users have elevated privileges that allow them to manage products, orders, and other users.

## Role Structure

The application uses a simple role-based access control system with two primary roles:

1. **Customer** - Regular users who can browse products, place orders, and manage their own account
2. **Admin** - Users with elevated privileges who can manage all aspects of the store

## Database Implementation

Roles are implemented in the database through the `role` column in the `users` table:

```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin'))
);
```

## Row Level Security (RLS) Policies

Access control is enforced through Supabase Row Level Security (RLS) policies. These policies determine what data each user can access based on their role:

### Products Table

```sql
-- Anyone can view products
CREATE POLICY "Anyone can view products" ON public.products
  FOR SELECT USING (true);

-- Only admins can manage products
CREATE POLICY "Admins can manage products" ON public.products
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));
```

### Orders Table

```sql
-- Users can view their own orders
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all orders
CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- Admins can manage all orders
CREATE POLICY "Admins can manage orders" ON public.orders
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));
```

## Admin Role Assignment

### Initial Admin Creation

The initial admin user is created through the migration scripts:

```sql
-- Insert admin user
INSERT INTO public.users (email, name, role) VALUES
('admin@rosemama.com', 'Admin User', 'admin');
```

### Promoting Users to Admin

Existing users can be promoted to admin through the Admin Dashboard. This is implemented in the `AdminUserManagement.tsx` component:

```typescript
const promoteToAdmin = async (userId: string) => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('id', userId);
      
    if (error) throw error;
    // Update UI or show success message
  } catch (error) {
    console.error('Error promoting user:', error);
    // Show error message
  }
};
```

### Demoting Admins

Admins can also be demoted to regular users:

```typescript
const demoteToCustomer = async (userId: string) => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ role: 'customer' })
      .eq('id', userId);
      
    if (error) throw error;
    // Update UI or show success message
  } catch (error) {
    console.error('Error demoting user:', error);
    // Show error message
  }
};
```

## Role Checking in Frontend

The application checks for admin privileges in the frontend using a custom hook:

```typescript
export const useIsAdmin = () => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();
  const supabase = useSupabaseClient();

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setIsAdmin(data.role === 'admin');
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, supabase]);

  return { isAdmin, loading };
};
```

## Protected Routes

Admin routes are protected using a higher-order component:

```typescript
export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, loading } = useIsAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, loading, router]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return isAdmin ? <>{children}</> : null;
};
```

## Best Practices

1. **Least Privilege Principle**: Only grant admin access to users who absolutely need it
2. **Regular Audits**: Periodically review the list of admin users
3. **Secure Admin Credentials**: Ensure admin users use strong passwords and enable two-factor authentication if available
4. **Action Logging**: Log all admin actions for audit purposes
5. **Role Separation**: Consider implementing more granular roles if needed (e.g., product manager, order manager)

## Security Considerations

1. **Server-Side Validation**: Always validate admin status on the server side, never trust client-side checks alone
2. **API Security**: Ensure all admin API endpoints are properly secured
3. **Session Management**: Implement proper session management and timeout for admin sessions
4. **Error Handling**: Be careful not to leak sensitive information in error messages