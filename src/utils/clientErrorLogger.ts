/**
 * Lightweight client-side error logger for QA visibility.
 *
 * Captures errors from instrumented surfaces (broker dashboard, report preview,
 * etc.) into a single, structured stream:
 *  - console.error tagged with [jbj-error]
 *  - in-memory ring buffer (last 50 events) accessible via
 *    `window.__jbjErrorLog()` for manual QA inspection
 *  - sessionStorage mirror (key: `jbj_error_log`) so QA can copy/paste
 *    after a navigation
 *
 * Also forwards to Sentry (see src/lib/sentry.ts) so the team gets an
 * automatic alert instead of finding out from a client. Sentry forwarding
 * is opt-in via VITE_SENTRY_DSN — with no DSN set, nothing leaves the
 * browser and behavior is identical to before this was added.
 */
import { captureToSentry } from "@/lib/sentry";

export type JbjErrorEvent = {
  ts: string;
  surface: string;
  message: string;
  stack?: string;
  componentStack?: string;
  url?: string;
  extra?: Record<string, unknown>;
};

const BUFFER_MAX = 50;
const STORAGE_KEY = "jbj_error_log";
const buffer: JbjErrorEvent[] = [];

function persist() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(buffer));
  } catch {
    /* storage full or unavailable — ignore */
  }
}

export function logClientError(
  surface: string,
  error: unknown,
  extra?: Record<string, unknown> & { componentStack?: string },
) {
  const err = error instanceof Error ? error : new Error(String(error));
  const event: JbjErrorEvent = {
    ts: new Date().toISOString(),
    surface,
    message: err.message,
    stack: err.stack,
    componentStack: extra?.componentStack,
    url: typeof window !== "undefined" ? window.location.href : undefined,
    extra: extra && { ...extra, componentStack: undefined },
  };

  buffer.push(event);
  if (buffer.length > BUFFER_MAX) buffer.shift();
  persist();

  // eslint-disable-next-line no-console
  console.error(`[jbj-error][${surface}]`, err, extra ?? {});

  // Forward to Sentry (no-op if VITE_SENTRY_DSN isn't set — see src/lib/sentry.ts).
  // This is the one place every error boundary in the app already reports
  // through, so wiring it here covers all of them without touching each
  // call site individually. Local buffer/console behavior above is unchanged.
  captureToSentry(surface, err, extra);
}

export function getClientErrorLog(): JbjErrorEvent[] {
  return [...buffer];
}

export function clearClientErrorLog() {
  buffer.length = 0;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

if (typeof window !== "undefined") {
  (window as unknown as { __jbjErrorLog?: () => JbjErrorEvent[] }).__jbjErrorLog =
    getClientErrorLog;
  (window as unknown as { __jbjClearErrorLog?: () => void }).__jbjClearErrorLog =
    clearClientErrorLog;
}
