import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";


export default defineConfig(({ mode }) => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://mdafrewypkkrildjgtey.supabase.co";
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kYWZyZXd5cGtrcmlsZGpndGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NTA1NzgsImV4cCI6MjA4MzAyNjU3OH0.-9fLSEsMVLS38f9ca197UVYgXQGxb8g-BPrJv4ZvTp0";
  const supabaseProjectId = process.env.VITE_SUPABASE_PROJECT_ID || "mdafrewypkkrildjgtey";

  return {
    server: {
      host: "0.0.0.0",
      port: parseInt(process.env.PORT || "8080"),
      historyApiFallback: true,
      proxy: {
        "/api/download-file": {
          target: `${supabaseUrl}/functions/v1`,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\//, "/"),
        },
      },
    },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(supabaseKey),
      'import.meta.env.VITE_SUPABASE_PROJECT_ID': JSON.stringify(supabaseProjectId),
    },
    plugins: [
      react(),
      mcpPlugin(),
      mode === "development" && componentTagger(),
      mode !== "development" && visualizer({
        filename: "dist/stats.html",
        gzipSize: true,
        brotliSize: true,
        template: "treemap",
      }),
    ].filter(Boolean),
    build: {
      sourcemap: false,
      reportCompressedSize: false,
      chunkSizeWarningLimit: 2000,
      target: 'es2020',
      minify: 'esbuild',
      rollupOptions: {
        output: {
          entryFileNames: "assets/app.js",
          chunkFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash][extname]",
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'icons-vendor': ['lucide-react'],
            'motion-vendor': ['framer-motion'],
            'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-popover'],
            'data-vendor': ['@tanstack/react-query', '@supabase/supabase-js'],
            'charts-vendor': ['recharts'],
            'maps-vendor': ['leaflet', 'react-leaflet', '@react-leaflet/core'],
            // Split heavy document/export libs into their own chunks so they only
            // load on demand (Document Studio, exports, PDF preview) — never on
            // first paint of marketing pages.
            'pdf-vendor': ['jspdf', 'pdf-lib'],
            'excel-vendor': ['exceljs', 'xlsx'],
            'zip-vendor': ['jszip'],
            'canvas-vendor': ['html2canvas'],
            'parse-vendor': ['papaparse', 'dompurify'],
            'voice-vendor': ['@elevenlabs/react'],
            'form-vendor': ['react-hook-form', 'zod', '@hookform/resolvers'],
            'date-vendor': ['date-fns'],
          },
        },
      },
    },
    resolve: {
      dedupe: ["react", "react-dom"],
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
      entries: ['index.html', 'src/main.tsx'],
    },
  };
});
