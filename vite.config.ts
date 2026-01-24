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
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // PWA plugin completely disabled to prevent install prompts
  ].filter(Boolean),
  // Helps map runtime errors to real source files during QA.
  build: {
    sourcemap: true,
    // Disable gzip size reporting to speed up builds with many assets
    reportCompressedSize: false,
    // Increase chunk size warning limit for large asset bundles
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        // Use stable JS filenames to avoid blank-page failures caused by cached HTML
        // pointing at old (deleted) hashed bundle names.
        entryFileNames: "assets/app.js",
        chunkFileNames: "assets/chunk-[name].js",
        // Manual chunk splitting to reduce memory pressure during build
        manualChunks: (id) => {
          // Separate team assets into their own chunk
          if (id.includes('assets/team')) {
            return 'team-assets';
          }
          // Vendor chunk for node_modules
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('@radix-ui') || id.includes('@tanstack')) {
              return 'ui-vendor';
            }
            if (id.includes('recharts') || id.includes('framer-motion')) {
              return 'charts-vendor';
            }
            return 'vendor';
          }
        },
        // Reduce asset file names to save memory
        assetFileNames: 'assets/[hash][extname]',
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
}));
