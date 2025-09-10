
# Rosémama Clothing Fashion E-Commerce App

A modern, React-based e-commerce platform for Rosémama Clothing, built with Vite, TypeScript, and Supabase.

## 🛒 Shopping Experience

### Guest Shopping (No Login Required)
- **Browse without registration**: Customers can explore products immediately
- **Guest cart**: Add items to cart without creating an account
- **Local storage**: Cart persists between browser sessions
- **Checkout options**: 
  - Proceed as guest with delivery details only
  - Optionally create account during checkout for tracking and rewards
- **Seamless transition**: Guest cart merges automatically when user logs in

### Authenticated Shopping
- **User accounts**: Full profile management with order history
- **Email verification**: Gentle reminders, never blocks checkout or browsing
- **Rewards system**: Earn and use points for discounts
- **Advanced features**: Order tracking and admin dashboard

### Email Verification Flow
- **No blocking**: Users can shop, checkout, and place orders without verification
- **Smart prompts**: Gentle reminders in header and profile without disruption
- **Post-checkout**: New accounts get verification email after successful order
- **Progressive benefits**: Full features unlock after verification

This is a code bundle for Rosémama Clothing Fashion E-Commerce App. The original project is available at https://www.figma.com/design/67LR8yZUy1TujNdkSd49mL/Rosemama-Clothing-Fashion-E-Commerce-App.osemama Clothing Fashion E-Commerce App

This is a code bundle for Rosemama Clothing Fashion E-Commerce App. The original project is available at https://www.figma.com/design/67LR8yZUy1TujNdkSd49mL/Rosemama-Clothing-Fashion-E-Commerce-App.

## Table of Contents

- [Getting Started](#getting-started)
- [Supabase Setup](#supabase-setup)
- [Environment Variables](#environment-variables)
- [Database Migrations](#database-migrations)
- [Admin Setup](#admin-setup)
- [Development](#development)
- [Deployment](#deployment)

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm i
   ```
3. Set up environment variables (see [Environment Variables](#environment-variables))
4. Set up Supabase (see [Supabase Setup](#supabase-setup))
5. Start the development server:
   ```bash
   npm run dev
   ```

## Supabase Setup

### Creating a Supabase Project

1. Sign up or log in at [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key (found in Project Settings > API)
4. Set up environment variables with these values (see [Environment Variables](#environment-variables))

### Database Setup

The application uses Supabase as its backend database. To set up the database schema:

1. Navigate to the SQL Editor in your Supabase dashboard
2. Run the migration scripts located in the `supabase/migrations` directory in sequence:
   - `20240626000000_initial_schema.sql` - Creates the base tables and relationships
   - `20240626000001_sample_data.sql` - Adds sample data (optional for development)
   - `20240626000002_functions.sql` - Adds database functions and triggers

Alternatively, you can use the Supabase CLI to run migrations:

```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-id
supabase db push
```

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Replace `your-project-id` and `your-anon-key` with your actual Supabase project values.

For detailed instructions, see the [Environment Setup Guide](./docs/environment-setup.md).

## Database Migrations

Database migrations are stored in the `supabase/migrations` directory. These SQL files define the database schema, relationships, and initial data.

When making changes to the database schema:

1. Create a new migration file with a timestamp prefix
2. Add your SQL commands to the file
3. Run the migration manually or using the Supabase CLI

## Admin Setup

The application includes an admin dashboard for managing products, orders, and users.

### Default Admin Account

The migration scripts create a default admin user:
- Email: admin@rosemama.com
- Role: admin

You'll need to set up a password for this account through the Supabase Authentication system.

For detailed instructions on admin functionality, see:
- [Admin Setup Guide](./docs/admin-setup.md)
- [Admin Role Management](./docs/admin-role-management.md)

## Development

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Deployment

This application can be deployed to various platforms:

### Vercel

1. Connect your repository to Vercel
2. Set up environment variables in the Vercel dashboard
3. Deploy

### Netlify

1. Connect your repository to Netlify
2. Set up environment variables in the Netlify dashboard
3. Configure the build command: `npm run build`
4. Configure the publish directory: `dist`
5. Deploy
  