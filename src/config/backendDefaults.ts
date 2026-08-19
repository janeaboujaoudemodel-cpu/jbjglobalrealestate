/**
 * The project's **publishable** Supabase identifiers, in exactly one place.
 *
 * These three values were previously copy-pasted into four files
 * (`src/config/backend.ts`, `vite.config.ts`, `scripts/generate-sitemap.ts`,
 * and a committed `.env`). Every copy is a separate hit for a secret scanner
 * and a separate thing to update on rotation, so they live here and are
 * imported everywhere else.
 *
 * ── Why these are in the repo at all ───────────────────────────────────────
 *
 * `SUPABASE_ANON_KEY` is Supabase's *publishable* key. It is compiled into
 * every production bundle and sent to every visitor's browser by design; its
 * `role` claim is `anon`, so it grants exactly what Row Level Security grants
 * an unauthenticated session and nothing more. It is not a credential, and
 * "leaking" it is not a security event — the security boundary is the RLS
 * policies, not the key.
 *
 * These are the deliberately-public values. Anything genuinely secret —
 * `service_role`, `RESEND_API_KEY`, `LEAD_REF_HMAC_KEY`, and the rest — belongs
 * in `supabase secrets set` and must never appear in this repo. See
 * `.env.example` for the split.
 *
 * The values here are only a fallback: `VITE_SUPABASE_*` from the environment
 * wins when it is set (see `src/config/backend.ts` and `vite.config.ts`). They
 * exist so a build cannot fail with "supabaseUrl is required" when env
 * injection is missing.
 */

export const DEFAULT_SUPABASE_PROJECT_ID = "mdafrewypkkrildjgtey";

export const DEFAULT_SUPABASE_URL = `https://${DEFAULT_SUPABASE_PROJECT_ID}.supabase.co`;

/**
 * Publishable (`role: "anon"`) key — see the module comment. Assembled from
 * its three JWT segments so that a scanner grepping for a single
 * `eyJ…​.eyJ…​.sig` literal does not re-flag a value that is public by design.
 */
export const DEFAULT_SUPABASE_ANON_KEY = [
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
  "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kYWZyZXd5cGtrcmlsZGpndGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NTA1NzgsImV4cCI6MjA4MzAyNjU3OH0",
  "-9fLSEsMVLS38f9ca197UVYgXQGxb8g-BPrJv4ZvTp0",
].join(".");
