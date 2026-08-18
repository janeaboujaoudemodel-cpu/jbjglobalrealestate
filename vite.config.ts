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
          // Function form (not object form) on purpose:
          // with the object form Rollup hoisted shared helpers into whichever
          // vendor chunk it liked — Vite's `preload-helper` landed in
          // `pdf-vendor` (810 kB) and `clsx`/`tailwind-merge` in
          // `charts-vendor` (424 kB), so BOTH were static deps of the entry and
          // were modulepreloaded on first paint of every marketing page.
          // Explicit routing keeps the entry graph to react/ui/data/util only.
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              // Vite's dynamic-import preload helper — must stay in the entry
              // graph's cheapest chunk, never in a heavy vendor chunk.
              if (id.includes('vite/preload-helper')) return 'react-vendor';
              return undefined;
            }
            const pkg = (name: string) => id.includes(`node_modules/${name}/`) || id.includes(`node_modules/${name}@`);

            // Tiny styling utilities used by every component — own micro chunk.
            if (pkg('clsx') || pkg('tailwind-merge') || pkg('class-variance-authority')) return 'util-vendor';

            // Keep the React-ecosystem shared utilities with React itself.
            // These are tiny and are pulled in by both React-side packages
            // (@sentry/react -> hoist-non-react-statics, @stripe/react-stripe-js
            // -> prop-types) and by charting code, so leaving them unrouted
            // invites a split that puts React's own dependencies in a lazy
            // vendor chunk.
            if (pkg('react-is') || pkg('prop-types') || pkg('hoist-non-react-statics')) return 'react-vendor';

            if (pkg('react-router-dom') || pkg('react-router') || pkg('react-dom') || pkg('scheduler') || id.includes('node_modules/react/')) return 'react-vendor';
            // lucide-react is intentionally NOT a manual chunk: forcing the
            // package into one chunk defeats tree-shaking and produced a
            // 771 kB icons chunk preloaded on first paint. Per-route icon
            // splitting is far cheaper.
            if (pkg('framer-motion') || pkg('motion-dom') || pkg('motion-utils')) return 'motion-vendor';
            if (id.includes('node_modules/@radix-ui/')) return 'ui-vendor';
            if (pkg('@tanstack/react-query') || pkg('@supabase/supabase-js') || id.includes('node_modules/@supabase/')) return 'data-vendor';
            // JBJ-029 — recharts/d3 are deliberately NOT a manual chunk.
            //
            // Forcing them into `charts-vendor` produced a CIRCULAR chunk
            // dependency and a blank white site in production. The cause is
            // not any single package: Rollup generates a shared CommonJS
            // interop helper (`getDefaultExportFromCjs`) and hoists it into
            // the first chunk that needs it. That was `charts-vendor`, so
            // `react-vendor` then had to import the helper back out of
            // `charts-vendor`, while `charts-vendor` imports React out of
            // `react-vendor`. `manualChunks` cannot route a Rollup-generated
            // helper, so no package-level rule can break that cycle.
            //
            // Because `charts-vendor` was modulepreloaded first, it evaluated
            // before React was initialised and threw
            // `Cannot read properties of undefined (reading 'useState')` at
            // module scope, leaving #root empty. Every route was blank.
            //
            // Left unrouted, Rollup does its own splitting, which is acyclic
            // by construction, and recharts lands in the route chunks that
            // actually use it — which also serves the first-paint goal the
            // rest of this config is chasing. Enforced by
            // `npm run check:chunks` (scripts/check-chunk-cycles.mjs).
            if (pkg('leaflet') || pkg('react-leaflet') || id.includes('node_modules/@react-leaflet/')) return 'maps-vendor';
            if (pkg('jspdf') || pkg('pdf-lib')) return 'pdf-vendor';
            if (pkg('exceljs') || pkg('xlsx')) return 'excel-vendor';
            if (pkg('jszip')) return 'zip-vendor';
            if (pkg('html2canvas')) return 'canvas-vendor';
            if (pkg('papaparse') || pkg('dompurify')) return 'parse-vendor';
            if (id.includes('node_modules/@elevenlabs/')) return 'voice-vendor';
            if (pkg('react-hook-form') || pkg('zod') || id.includes('node_modules/@hookform/')) return 'form-vendor';
            if (pkg('date-fns')) return 'date-vendor';
            return undefined;
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
