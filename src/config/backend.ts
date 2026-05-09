/**
 * Centralized backend configuration.
 *
 * All frontend code that needs the Supabase URL / anon key / project ID
 * should import from here instead of reading `import.meta.env.*` directly.
 *
 * The values are public (anon / publishable) and safe to embed in client
 * bundles.  Vite `define` in vite.config.ts also injects them at build
 * time, but this module acts as a hard fallback so the app can never
 * crash with "supabaseUrl is required" even if env injection fails.
 */

const FALLBACK_URL = "https://mdafrewypkkrildjgtey.supabase.co";
const FALLBACK_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kYWZyZXd5cGtrcmlsZGpndGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NTA1NzgsImV4cCI6MjA4MzAyNjU3OH0.-9fLSEsMVLS38f9ca197UVYgXQGxb8g-BPrJv4ZvTp0";
const FALLBACK_PROJECT_ID = "mdafrewypkkrildjgtey";

/**
 * Public-facing domain used when building shareable links (signing URLs,
 * email CTAs, WhatsApp share text). Always prefer this over
 * `window.location.origin` which leaks `*.lovable.app` from preview/sandbox.
 */
export const PUBLIC_DOMAIN: string = "https://jbj.ae";

export function buildPublicUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${PUBLIC_DOMAIN}${p}`;
}

export const SUPABASE_URL: string =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) || FALLBACK_URL;

export const SUPABASE_ANON_KEY: string =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY) || FALLBACK_KEY;

export const SUPABASE_PROJECT_ID: string =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_PROJECT_ID) || FALLBACK_PROJECT_ID;

/** Convenience: build a full edge-function URL */
export function edgeFnUrl(fnName: string): string {
  return `${SUPABASE_URL}/functions/v1/${fnName}`;
}

/** Standard headers for anon-key calls */
export function anonHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    "Content-Type": "application/json",
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    ...extra,
  };
}
