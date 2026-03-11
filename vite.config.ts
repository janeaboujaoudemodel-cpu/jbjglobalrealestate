import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
// PWA plugin removed to eliminate install prompts

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    historyApiFallback: true,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // PWA plugin completely disabled to prevent install prompts
  ].filter(Boolean),
  // Optimized build settings for large projects - PERFORMANCE CRITICAL
  build: {
    // Disable source maps to reduce memory usage during build
    sourcemap: false,
    // Disable gzip size reporting to speed up builds
    reportCompressedSize: false,
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 2000,
    // Target modern browsers for smaller bundle
    target: 'es2020',
    // Minification for production
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // Stable entry filename
        entryFileNames: "assets/app.js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
        // Code splitting for performance - split vendor chunks
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // UI library
          'ui-vendor': ['framer-motion', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-popover'],
          // Data fetching
          'data-vendor': ['@tanstack/react-query', '@supabase/supabase-js'],
          // Charts (heavy, rarely needed on initial load)
          'charts-vendor': ['recharts'],
          // Maps (only needed on map pages)
          'maps-vendor': ['leaflet', 'react-leaflet', '@react-leaflet/core'],
          // Document tools (only needed in toolkit)
          'docs-vendor': ['exceljs', 'jspdf', 'pdf-lib', 'jszip'],
          // Voice/audio (only needed in voice suite)
          'voice-vendor': ['@elevenlabs/react'],
        },
      },
    },
  },
  // Enforce a single React instance across all deps (prevents hooks dispatcher null errors).
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
  },
}));
