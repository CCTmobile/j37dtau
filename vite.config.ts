import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  
  // Important: Use root path for custom domain
  base: '/',
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Important: Generate clean builds
    emptyOutDir: true,
    
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom']
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash][extname]'
      }
    },
    
    // Suppress chunk size warnings
    chunkSizeWarningLimit: 1000,
    
    // Ensure proper source maps for debugging
    sourcemap: false
  },
  
  // Important: Configure for custom domain
  server: {
    port: 3000,
    host: true
  },
  
  preview: {
    port: 4173,
    host: true
  }
})