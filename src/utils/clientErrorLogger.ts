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
 * No PII, no network egress. Safe in production.
 */

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
