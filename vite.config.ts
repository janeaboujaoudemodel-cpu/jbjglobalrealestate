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

            if (pkg('react-router-dom') || pkg('react-router') || pkg('react-dom') || pkg('scheduler') || id.includes('node_modules/react/')) return 'react-vendor';
            // lucide-react is intentionally NOT a manual chunk: forcing the
            // package into one chunk defeats tree-shaking and produced a
            // 771 kB icons chunk preloaded on first paint. Per-route icon
            // splitting is far cheaper.
            if (pkg('framer-motion') || pkg('motion-dom') || pkg('motion-utils')) return 'motion-vendor';
            if (id.includes('node_modules/@radix-ui/')) return 'ui-vendor';
            if (pkg('@tanstack/react-query') || pkg('@supabase/supabase-js') || id.includes('node_modules/@supabase/')) return 'data-vendor';
            // recharts and its d3 dependencies are deliberately NOT hand-chunked.
            //
            // They used to be forced into a 'charts-vendor' chunk. In a production
            // build that chunk was evaluated with the React namespace still
            // undefined and threw on first paint:
            //
            //   Uncaught TypeError: Cannot read properties of undefined (reading 'useState')
            //   at /assets/charts-vendor-*.js
            //
            // which trips index.html's pre-mount boot overlay, so React never
            // mounts and #root stays empty — the blank owner portal reported as
            // audit finding 3.1. It only ever showed in a bundled build, never
            // under `vite dev` (which serves unbundled ESM and does no manual
            // chunking), which is why the finding kept coming back as "not
            // reproducible from source" while production was blank.
            //
            // Hand-assigning a React-consuming library to its own chunk is what
            // creates the cycle; letting Rollup place these modules keeps the
            // React-before-consumer evaluation order intact. Covered by
            // tests/owner-shell-renders.spec.ts, which runs against a real
            // production build in .github/workflows/owner-shell-renders.yml.
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
