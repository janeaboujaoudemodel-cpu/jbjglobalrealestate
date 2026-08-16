/**
 * Error monitoring (Sentry) — frontend.
 *
 * Priority-1 fix from the Aug 2026 CTO audit: previously, client-side
 * errors were only captured into an in-memory/sessionStorage buffer
 * (see src/utils/clientErrorLogger.ts) with "no network egress" by
 * design — meaning nobody was ever notified when something broke in
 * production. This module forwards the same errors to Sentry so the
 * team gets an automatic alert instead of hearing about it from a client.
 *
 * Safe by default: if VITE_SENTRY_DSN is not set (e.g. local dev, or
 * before the DSN is provisioned), this is a complete no-op — nothing
 * initializes and nothing is sent anywhere.
 */
import * as Sentry from "@sentry/react";

let initialized = false;

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

  if (!dsn) {
    // No DSN configured — stay silent, don't send anything, don't warn
    // loudly in production. A single dev-console note is enough.
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info("[sentry] VITE_SENTRY_DSN not set — error monitoring disabled.");
    }
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    // Keep this conservative: we want error alerts, not a performance/
    // session-replay bill on day one. Both can be turned on deliberately
    // later via integrations + tracesSampleRate.
    tracesSampleRate: 0,
    // Don't let Sentry duplicate work AppErrorBoundary already does
    // (silent retry / reload) — we only want it to *observe* and report.
    autoSessionTracking: true,
  });

  initialized = true;
}

/**
 * Forward a single error to Sentry, tagged with the same "surface" label
 * already used by logClientError (e.g. "AppErrorBoundary", "MapErrorBoundary").
 * No-op if Sentry was never initialized (no DSN).
 */
export function captureToSentry(
  surface: string,
  error: unknown,
  extra?: Record<string, unknown>,
) {
  if (!initialized) return;

  Sentry.withScope((scope) => {
    scope.setTag("surface", surface);
    if (extra) {
      for (const [key, value] of Object.entries(extra)) {
        // Sentry's setExtra accepts unknown; stringify anything non-primitive
        // so nested objects don't get silently dropped.
        scope.setExtra(key, value);
      }
    }
    const err = error instanceof Error ? error : new Error(String(error));
    Sentry.captureException(err);
  });
}
