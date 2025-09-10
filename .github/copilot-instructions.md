# Copilot Instructions for Rosémama Clothing E-Commerce

This is a **Vite + React + TypeScript** fashion e-commerce platform deployed to **GitHub Pages** with **Supabase** backend.

## Architecture & Tech Stack

### Core Technologies
- **Frontend**: Vite + React 18 + TypeScript, deployed to GitHub Pages with custom domain
- **Backend**: Supabase (PostgreSQL) with Row Level Security (RLS) policies
- **UI**: Radix UI components + Tailwind CSS v4 with custom gradients
- **Package Manager**: pnpm (faster CI builds, use `pnpm` not `npm`)
- **Routing**: React Router DOM v7

### Key Dependencies
```json
{
  "@supabase/supabase-js": "^2.39.0",
  "@radix-ui/*": "Latest versions",
  "html2canvas": "^1.4.1",
  "jspdf": "^3.0.2",
  "react-router-dom": "^7.8.2"
}
```

## Project Structure Patterns

### Component Organization
- `src/components/` - Main UI components
- `src/components/admin/` - Admin dashboard components with beautiful gradient UIs
- `src/components/ui/` - Reusable Radix UI wrapper components
- `src/contexts/` - React Context providers (Auth, Cart, Products)
- `src/utils/supabase/` - Database client and type definitions

### Database Integration
```typescript
// Always use typed Supabase client
import { supabase } from '../utils/supabase/client';
import type { Database } from '../utils/supabase/types';

// Transform Supabase data to match app types
const transformedProducts: Product[] = supabaseProducts.map((p: SupabaseProduct) => ({
  id: p.id,
  name: p.name,
  // ... transform other fields
}));
```

### Authentication Pattern
```typescript
// Check admin status with RPC function
export const isAdmin = async (): Promise<boolean> => {
  const { data, error } = await supabase.rpc('is_admin');
  return data || false;
};
```

## UI Development Guidelines

### Component Styling
- Use **gradient backgrounds** for headers: `bg-gradient-to-r from-rose-500 to-pink-600`
- **Radix Accordion** for collapsible sections with icons
- **Dropdown menus** for actions (View, Edit, Delete, Print)
- **Card components** with proper shadows and spacing

### Beautiful Order Management
```tsx
// Use EnhancedOrderView.tsx as template for admin interfaces
<Accordion type="multiple" className="w-full space-y-2">
  <AccordionItem value="customer" className="border rounded-lg">
    <AccordionTrigger className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
      <div className="flex items-center gap-2">
        <User className="h-4 w-4" />
        Customer Information
      </div>
    </AccordionTrigger>
  </AccordionItem>
</Accordion>
```

## Build & Deployment

### CI/CD Configuration
- **Use pnpm**: `pnpm install --frozen-lockfile` in CI
- **Environment variables**: Create `.env` files in CI from secrets
- **Build command**: `pnpm run build:ci` (includes TypeScript checking)
- **Deploy target**: GitHub Pages with custom domain `rosemamaclothing.store`

### TypeScript Configuration
```json
// tsconfig.json - relaxed for faster CI
{
  "compilerOptions": {
    "noUnusedLocals": false,
    "noUnusedParameters": false
  }
}
```

### Vite Configuration
```typescript
// vite.config.ts - optimized for GitHub Pages
export default defineConfig({
  base: '/', // Important for custom domain
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom']
        }
      }
    }
  }
});
```

## PDF Generation

### Usage Pattern
```typescript
import { generateStyledPDF } from '../utils/pdfGenerator';

// Generate PDF from beautiful UI components
const handlePrintInvoice = async () => {
  const element = document.getElementById('invoice-content');
  if (element) {
    await generateStyledPDF(element, `invoice-${order.id}.pdf`);
  }
};
```

## Database Schema

### Core Tables
- `users` - Customer accounts with RLS policies
- `products` - Inventory with categories: Casual, Party, Shoes, Outwear, Dresses, Accessories
- `orders` - Order management with status tracking
- `order_items` - Line items for each order

### Migration Files
Located in `supabase/migrations/` with timestamped SQL files for schema evolution.

## Development Workflow

1. **Start development**: `pnpm dev`
2. **Build locally**: `pnpm run build:ci`
3. **Deploy**: Push to main branch (auto-deploys via GitHub Actions)
4. **Database changes**: Add migrations to `supabase/migrations/`

## Admin Features

### Order Management Dashboard
- Grid/List view toggle
- Search and filter capabilities
- Statistics cards with metrics
- Enhanced order view with PDF generation
- Beautiful gradient-based UI components

Always prioritize beautiful, gradient-enhanced UIs with proper accessibility and responsive design.
