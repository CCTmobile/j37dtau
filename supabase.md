# Supabase Connection Details

This file contains the connection details for the Supabase PostgreSQL database.

## Connection Information

- **Server Name**: `db.xsgumgcioyaehccvklbr.supabase.co`
- **User Name**: `postgres`
- **Database Name**: `postgres`
- **Port**: `5432`

## Connection String

```
postgresql://postgres:[YOUR-PASSWORD]@db.xsgumgcioyaehccvklbr.supabase.co:5432/postgres
```

## Supabase info

- **API URL**: `https://db.xsgumgcioyaehccvklbr.supabase.co/rest/v1`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzZ3VtZ2Npb3lhZWhjY3ZrbGJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MDM2MTIsImV4cCI6MjA3MTM3OTYxMn0.WdjuHdpQglzzCvuEUWOdLl8Z94bK2FQhtJgS2Dlfs5Q`
- **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzZ3VtZ2Npb3lhZWhjY3ZrbGJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgwMzYxMiwiZXhwIjoyMDcxMzc5NjEyfQ.sySQzU71fS-GUjGCRmAPH1eTmZijuNjyHhUIuWU5moA`
- **Database Dev Password**: `6vhxadG6GusVg9pp`

## Tables

This schema consists of the following tables:

- **users**: Stores user information.
  - `id` (UUID, Primary Key)
  - `email` (TEXT, Unique, Not Null)
  - `name` (TEXT)
  - `phone` (TEXT)
  - `created_at` (TIMESTAMP WITH TIME ZONE)
  - `updated_at` (TIMESTAMP WITH TIME ZONE)
  - `role` (TEXT, Default: 'customer')

- **products**: Stores product information.
  - `id` (UUID, Primary Key)
  - `name` (TEXT, Not Null)
  - `description` (TEXT)
  - `price` (DECIMAL(10, 2), Not Null)
  - `category` (TEXT, Not Null)
  - `image_url` (TEXT)
  - `created_at` (TIMESTAMP WITH TIME ZONE)
  - `updated_at` (TIMESTAMP WITH TIME ZONE)

- **orders**: Stores customer orders.
  - `id` (UUID, Primary Key)
  - `user_id` (UUID, Foreign Key to `users.id`)
  - `status` (TEXT, Not Null)
  - `total_amount` (DECIMAL(10, 2), Not Null)
  - `shipping_address` (JSONB, Not Null)
  - `created_at` (TIMESTAMP WITH TIME ZONE)
  - `updated_at` (TIMESTAMP WITH TIME ZONE)

- **order_items**: Stores items within an order.
  - `id` (UUID, Primary Key)
  - `order_id` (UUID, Foreign Key to `orders.id`)
  - `product_id` (UUID, Foreign Key to `products.id`)
  - `quantity` (INTEGER, Not Null)
  - `price_at_purchase` (DECIMAL(10, 2), Not Null)
  - `created_at` (TIMESTAMP WITH TIME ZONE)

- **cart**: Represents a user's shopping cart.
  - `id` (UUID, Primary Key)
  - `user_id` (UUID, Foreign Key to `users.id`)
  - `created_at` (TIMESTAMP WITH TIME ZONE)
  - `updated_at` (TIMESTAMP WITH TIME ZONE)

- **cart_items**: Stores items within a shopping cart.
  - `id` (UUID, Primary Key)
  - `cart_id` (UUID, Foreign Key to `cart.id`)
  - `product_id` (UUID, Foreign Key to `products.id`)
  - `quantity` (INTEGER, Not Null)
  - `created_at` (TIMESTAMP WITH TIME ZONE)
  - `updated_at` (TIMESTAMP WITH TIME ZONE)

- **rewards**: Stores user reward points.
  - `id` (UUID, Primary Key)
  - `user_id` (UUID, Foreign Key to `users.id`)
  - `points` (INTEGER, Default: 0)
  - `created_at` (TIMESTAMP WITH TIME ZONE)
  - `updated_at` (TIMESTAMP WITH TIME ZONE)

