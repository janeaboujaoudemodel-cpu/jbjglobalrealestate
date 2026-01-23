import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      // IMPORTANT: keep SW disabled in dev/preview to avoid mixed cached chunks that can break React hooks.
      devOptions: {
        enabled: false,
      },
      includeAssets: ["favicon.png", "favicon.svg", "robots.txt", "og-image.jpg"],
      manifest: {
        name: "JBJ Global Real Estate - Dubai Property Brokerage",
        short_name: "JBJ Real Estate",
        description: "Buy, sell, or rent luxury properties in Dubai with JBJ Global Real Estate. Founded by Jane Bou Jaoude. Expert brokerage services across UAE.",
        theme_color: "#0a0a0a",
        background_color: "#0a0a0a",
        // Changed from "standalone" to "browser" to prevent PWA install prompts
        display: "browser",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/",
        lang: "en",
        dir: "ltr",
        categories: ["business", "real estate", "lifestyle"],
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
        ],
        // Removed shortcuts to further reduce PWA installability signals
        shortcuts: [],
      },
      workbox: {
        // Allow larger JS bundles to be precached (our main chunk can exceed 7MB)
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024, // 8MB limit
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2}"],
        cleanupOutdatedCaches: true,
        // Skip waiting to activate new SW immediately
        skipWaiting: true,
        // Claim clients immediately
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "jbj-google-fonts-v2",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "jbj-gstatic-fonts-v2",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "jbj-images-v2",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
    }),
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
