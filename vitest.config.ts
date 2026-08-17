import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import {
  DEFAULT_SUPABASE_ANON_KEY,
  DEFAULT_SUPABASE_PROJECT_ID,
  DEFAULT_SUPABASE_URL,
} from "./src/config/backendDefaults";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
  // Mirrors the `define` block in vite.config.ts. Several modules — including
  // the generated src/integrations/supabase/client.ts — read
  // `import.meta.env.VITE_SUPABASE_*` directly rather than going through
  // src/config/backend.ts, so they have no fallback of their own. Under `vite
  // build` the define block supplies those values; under Vitest nothing did,
  // and the suite only passed because a committed .env happened to be on disk.
  // Now that .env is gitignored, CI has no .env and every test that imports the
  // supabase client would fail with "supabaseUrl is required" without this.
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
      process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL,
    ),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_ANON_KEY,
    ),
    "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(
      process.env.VITE_SUPABASE_PROJECT_ID || DEFAULT_SUPABASE_PROJECT_ID,
    ),
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
