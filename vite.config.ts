import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  // For custom domain deployment, use root path
  base: '/',
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  
  build: {
    outDir: 'dist',
    // Ensure assets are placed in the assets directory
    assetsDir: 'assets',
    // Generate manifest for better caching
    manifest: false,
    // Optimize chunks
    rollupOptions: {
      output: {
        // Better chunk naming for caching
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || []
          const ext = info[info.length - 1]
          
          // Handle different asset types
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico|webp)$/i.test(assetInfo.name || '')) {
            return 'assets/images/[name]-[hash][extname]'
          }
          if (ext === 'css') {
            return 'assets/css/[name]-[hash][extname]'
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name || '')) {
            return 'assets/fonts/[name]-[hash][extname]'
          }
          
          return 'assets/[name]-[hash][extname]'
        }
      }
    },
    // Increase chunk size warning limit (your bundle is >500KB)
    chunkSizeWarningLimit: 1000,
  },
  
  // Ensure proper asset handling in development
  publicDir: 'public',
})