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
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
        // NOTE: manualChunks removed - was causing React to load out of order
        // resulting in "Cannot read properties of undefined (reading 'createContext')"
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
