import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import viteCompression from 'vite-plugin-compression';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    mode === "production" && viteCompression({
      algorithm: 'gzip',
      threshold: 1024
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // PDF functionality in separate chunk
          'pdf': ['jspdf', 'jspdf-autotable'],
          // Core React libraries
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          // UI components library
          'ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-alert-dialog'
          ],
          // Supabase functionality
          'supabase': ['@supabase/supabase-js'],
          // React Query
          'query': ['@tanstack/react-query'],
          // Chart and form libraries
          'charts': ['recharts'],
          'forms': ['react-hook-form', '@hookform/resolvers', 'zod']
        }
      }
    },
    chunkSizeWarningLimit: 500,
    minify: 'esbuild',
    target: 'es2015',
    // Enable source maps for better debugging in production
    sourcemap: false
  }
}));
