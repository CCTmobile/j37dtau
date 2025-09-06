# Environment Variables Setup for Supabase

## Overview

This document explains how to set up environment variables for the Rosemama Clothing Fashion E-Commerce App, focusing on Supabase configuration. Proper environment variable management is crucial for security and deployment flexibility.

## Required Environment Variables

The application requires the following Supabase-related environment variables:

```
VITE_SUPABASE_URL=https://xsgumgcioyaehccvklbr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzZ3VtZ2Npb3lhZWhjY3ZrbGJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MDM2MTIsImV4cCI6MjA3MTM3OTYxMn0.WdjuHdpQglzzCvuEUWOdLl8Z94bK2FQhtJgS2Dlfs5Q
```

> **IMPORTANT**: The values shown above are for development purposes only. In production, use your own Supabase project credentials and ensure they are kept secure.

## Local Development Setup

### Method 1: Using .env File

1. Create a `.env` file in the root directory of the project
2. Add the required environment variables to the file:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

3. Restart your development server for the changes to take effect

### Method 2: Using .env.local File (Preferred for Local Development)

1. Create a `.env.local` file in the root directory of the project
2. Add the required environment variables to the file
3. This file will be automatically loaded by Vite and will override values in the `.env` file
4. The `.env.local` file should be added to `.gitignore` to prevent committing sensitive information

## Production Deployment

### Vercel Deployment

If deploying to Vercel:

1. Go to your project settings in the Vercel dashboard
2. Navigate to the "Environment Variables" section
3. Add each environment variable with its corresponding value
4. Redeploy your application for the changes to take effect

### Netlify Deployment

If deploying to Netlify:

1. Go to your site settings in the Netlify dashboard
2. Navigate to "Build & deploy" > "Environment variables"
3. Add each environment variable with its corresponding value
4. Trigger a new deployment for the changes to take effect

## Accessing Environment Variables in Code

In the application code, environment variables are accessed using the `import.meta.env` object provided by Vite:

```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## Security Considerations

1. **Never commit sensitive keys to version control**
2. **Use different API keys for development and production**
3. **Restrict API key permissions to only what's necessary**
4. **Regularly rotate API keys, especially after team member changes**
5. **Use environment-specific variables for different deployment environments**

## Troubleshooting

### Common Issues

1. **Environment variables not loading**
   - Ensure variable names are prefixed with `VITE_`
   - Restart the development server after changing environment variables
   - Check for typos in variable names

2. **"Cannot read property of undefined" errors**
   - Ensure all required environment variables are defined
   - Add fallback values for non-critical variables

3. **Authentication failures**
   - Verify that the Supabase URL and anon key are correct
   - Check if the Supabase project is active and not in maintenance mode
   - Ensure the API keys have the necessary permissions

## Additional Resources

- [Vite Environment Variables Documentation](https://vitejs.dev/guide/env-and-mode.html)
- [Supabase JavaScript Client Documentation](https://supabase.com/docs/reference/javascript/initializing)
- [Environment Variables Best Practices](https://12factor.net/config)