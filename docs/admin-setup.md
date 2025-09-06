# Rosemama Clothing Admin Setup Guide

## Overview

This document provides instructions for setting up and managing the admin functionality for the Rosemama Clothing Fashion E-Commerce App. The admin system allows authorized users to manage products, view and process orders, and manage user accounts.

## Admin User Creation

Admin users have special privileges in the system and can be created in two ways:

### Method 1: Using Migration Scripts

The initial admin user is created through the migration scripts. This user has the email `admin@rosemama.com` and is assigned the 'admin' role automatically.

### Method 2: Promoting Existing Users

To promote an existing user to admin:

1. Log in with an existing admin account
2. Navigate to the Admin Dashboard
3. Go to the "User Management" section
4. Find the user you want to promote
5. Click the "Promote to Admin" button

## Admin Dashboard Access

The Admin Dashboard is accessible only to users with the 'admin' role:

1. Log in with an admin account
2. Navigate to `/admin` or click on the "Admin" link in the user dropdown menu
3. The dashboard provides access to all admin functionality

## Admin Features

### Product Management

Admins can manage products through the Admin Dashboard:

- **View Products**: See a list of all products with filtering and sorting options
- **Add Products**: Create new products with details like name, description, price, category, and images
- **Edit Products**: Modify existing product information
- **Delete Products**: Remove products from the catalog

### Order Management

Admins can view and process customer orders:

- **View Orders**: See all orders with filtering by status, date, and customer
- **Process Orders**: Update order status (pending, processing, shipped, delivered, cancelled)
- **Order Details**: View detailed information about each order, including items, quantities, and customer information

### User Management

Admins can manage user accounts:

- **View Users**: See a list of all registered users
- **User Details**: View detailed information about each user, including order history and rewards
- **Role Management**: Promote users to admin or demote admins to regular users

## Security Considerations

- Admin access is controlled through Supabase Row Level Security (RLS) policies
- All admin actions are logged for audit purposes
- Admin users should use strong passwords and enable two-factor authentication if available
- Admin sessions automatically expire after 24 hours of inactivity

## Troubleshooting

### Common Issues

1. **Cannot access Admin Dashboard**
   - Verify that the user has the 'admin' role in the database
   - Check if the user is properly authenticated
   - Clear browser cache and cookies

2. **Cannot perform admin actions**
   - Verify that the RLS policies are correctly set up in the database
   - Check if the user's admin role is correctly assigned
   - Ensure the Supabase client is properly initialized with the correct API key

3. **Changes not reflecting immediately**
   - Some changes may require a page refresh to take effect
   - Check the browser console for any errors
   - Verify that the database operations completed successfully

## Support

For additional support with admin functionality, contact the development team at dev@rosemama.com.