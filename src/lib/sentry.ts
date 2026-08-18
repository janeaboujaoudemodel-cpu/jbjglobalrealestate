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

/**
 * Field names whose values must never leave the browser (backend audit 6.2).
 *
 * `captureToSentry` accepts arbitrary `extra` data, and error boundaries can
 * attach user-entered form state to it. Matching is substring + case
 * insensitive, so `customerEmail`, `user_email` and `EMAIL` all match `email`.
 */
const PII_KEY_PATTERNS = [
  "email",
  "phone",
  "mobile",
  "whatsapp",
  "password",
  "passwd",
  "secret",
  "token",
  "apikey",
  "api_key",
  "authorization",
  "auth",
  "cookie",
  "session",
  "creditcard",
  "card_number",
  "cardnumber",
  "cvv",
  "iban",
  "ssn",
  "passport",
  "emirates_id",
  "emiratesid",
  "nationalid",
  "national_id",
  "dob",
  "birthday",
  "birthdate",
  "address",
  "fullname",
  "full_name",
  "firstname",
  "lastname",
];

const REDACTED = "[redacted]";

/** Free-text values can carry an address even when the key looks innocuous. */
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
/** Loose international phone shape — 8+ digits with optional separators. */
const PHONE_RE = /(?:\+|\b00)\d[\d\s().-]{7,}\d/g;

/** Lower-cased with separators removed, so `Full_Name` and `fullName` both
 *  collapse to `fullname` and match the same pattern. */
function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[\s_-]/g, "");
}

const NORMALIZED_PII_PATTERNS = PII_KEY_PATTERNS.map(normalizeKey);

function isPiiKey(key: string): boolean {
  const normalized = normalizeKey(key);
  return NORMALIZED_PII_PATTERNS.some((pattern) => normalized.includes(pattern));
}

function scrubString(value: string): string {
  return value.replace(EMAIL_RE, REDACTED).replace(PHONE_RE, REDACTED);
}

/**
 * Recursively redact PII-shaped keys and free-text emails/phone numbers.
 * Depth- and breadth-bounded so a cyclic or huge payload can't hang the
 * error path — reporting an error must never itself become the problem.
 */
export function scrubPii(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  if (depth > 6) return "[truncated]";
  if (typeof value === "string") return scrubString(value);
  if (value === null || typeof value !== "object") return value;

  if (seen.has(value as object)) return "[circular]";
  seen.add(value as object);

  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => scrubPii(item, depth + 1, seen));
  }

  const out: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>).slice(0, 50)) {
    out[key] = isPiiKey(key) ? REDACTED : scrubPii(entry, depth + 1, seen);
  }
  return out;
}

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
    // Audit 6.2: last line of defence. Anything reaching Sentry — including
    // breadcrumbs and request data Sentry collects on its own, which never
    // pass through captureToSentry — gets scrubbed here.
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.extra) event.extra = scrubPii(event.extra) as Record<string, unknown>;
      if (event.contexts) event.contexts = scrubPii(event.contexts) as typeof event.contexts;
      if (event.request?.data) event.request.data = scrubPii(event.request.data);
      if (event.user) {
        // Keep the opaque id for grouping; drop everything identifying.
        event.user = event.user.id ? { id: event.user.id } : undefined;
      }
      if (event.message) event.message = scrubString(event.message);
      for (const value of event.exception?.values ?? []) {
        if (value.value) value.value = scrubString(value.value);
      }
      return event;
    },
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.message) breadcrumb.message = scrubString(breadcrumb.message);
      if (breadcrumb.data) breadcrumb.data = scrubPii(breadcrumb.data) as Record<string, unknown>;
      return breadcrumb;
    },
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
      // Audit 6.2: scrub before it ever reaches the Sentry scope. `beforeSend`
      // catches the rest, but redacting at the source keeps PII out of any
      // in-process buffer too.
      for (const [key, value] of Object.entries(extra)) {
        scope.setExtra(key, isPiiKey(key) ? REDACTED : scrubPii(value));
      }
    }
    const err = error instanceof Error ? error : new Error(String(error));
    Sentry.captureException(err);
  });
}
