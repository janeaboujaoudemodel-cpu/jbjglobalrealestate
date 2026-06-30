/**
 * Broker auth + role routing debug logger.
 *
 * Goal: when something on /broker/* throws a 400/409 (RLS / conflict /
 * validation), we want a single timeline that shows:
 *   1. Auth state transitions (user id, email, loading)
 *   2. Role-resolution checkpoints inside BrokerGuard
 *     (verify-owner → crm_brokers → broker_subscriptions)
 *   3. Every backend 4xx response originating from a /broker/* page
 *
 * All entries are pushed to console (grouped by source) AND mirrored into
 * sessionStorage under `jbj_broker_debug` so you can paste them back here.
 *
 * Access from the browser console:
 *   __brokerDebug.dump()      → console.table of the last 200 entries
 *   __brokerDebug.copy()      → copies JSON to clipboard
 *   __brokerDebug.clear()     → wipes the buffer
 */

type Level = "info" | "warn" | "error";
type Entry = {
  ts: string;
  level: Level;
  source: string;
  msg: string;
  data?: unknown;
  path?: string;
  userId?: string | null;
};

const KEY = "jbj_broker_debug";
const MAX = 200;

function read(): Entry[] {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(entries: Entry[]) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(entries.slice(-MAX)));
  } catch {
    /* sessionStorage may be unavailable in SSR / private mode */
  }
}

function onBrokerRoute(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.pathname.startsWith("/broker");
}

export function brokerLog(
  source: string,
  msg: string,
  data?: unknown,
  level: Level = "info",
) {
  const entry: Entry = {
    ts: new Date().toISOString(),
    level,
    source,
    msg,
    data: data === undefined ? undefined : safeClone(data),
    path: typeof window !== "undefined" ? window.location.pathname + window.location.search : undefined,
  };
  const buf = read();
  buf.push(entry);
  write(buf);

  const tag = `%c[broker:${source}]`;
  const style =
    level === "error"
      ? "color:#B00020;font-weight:600"
      : level === "warn"
      ? "color:#B89555;font-weight:600"
      : "color:#0F5132;font-weight:600";
  // eslint-disable-next-line no-console
  (console[level] || console.log)(tag, style, msg, data ?? "");
}

function safeClone(v: unknown): unknown {
  try {
    return JSON.parse(JSON.stringify(v));
  } catch {
    return String(v);
  }
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Global fetch interceptor — installed once. Logs every 4xx from /broker.  */
/* ──────────────────────────────────────────────────────────────────────── */

let installed = false;

export function installBrokerNetworkLogger() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const origFetch = window.fetch.bind(window);
  window.fetch = async (...args: Parameters<typeof fetch>) => {
    const started = performance.now();
    const req = args[0];
    const init = args[1];
    const url =
      typeof req === "string"
        ? req
        : req instanceof URL
        ? req.toString()
        : (req as Request).url;
    const method =
      (init && init.method) ||
      (req instanceof Request ? req.method : "GET") ||
      "GET";

    try {
      const res = await origFetch(...args);
      if (
        onBrokerRoute() &&
        (res.status === 400 || res.status === 401 || res.status === 403 || res.status === 409)
      ) {
        // Clone so we can read the body without consuming the caller's stream.
        let body: unknown = undefined;
        try {
          body = await res.clone().json();
        } catch {
          try {
            body = await res.clone().text();
          } catch { /* ignore */ }
        }
        brokerLog(
          "net",
          `${method} ${shortUrl(url)} → ${res.status}`,
          { status: res.status, url, body, ms: Math.round(performance.now() - started) },
          res.status >= 500 ? "error" : "warn",
        );
      }
      return res;
    } catch (err) {
      if (onBrokerRoute()) {
        brokerLog("net", `${method} ${shortUrl(url)} → THREW`, { err: String(err) }, "error");
      }
      throw err;
    }
  };

  brokerLog("init", "broker network logger installed");
}

function shortUrl(u: string): string {
  try {
    const url = new URL(u);
    return url.pathname + (url.search ? "?…" : "");
  } catch {
    return u;
  }
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Window helpers for manual inspection                                     */
/* ──────────────────────────────────────────────────────────────────────── */

declare global {
  interface Window {
    __brokerDebug?: {
      dump: () => Entry[];
      copy: () => Promise<void>;
      clear: () => void;
    };
  }
}

if (typeof window !== "undefined" && !window.__brokerDebug) {
  window.__brokerDebug = {
    dump: () => {
      const entries = read();
      // eslint-disable-next-line no-console
      console.table(entries);
      return entries;
    },
    copy: async () => {
      const json = JSON.stringify(read(), null, 2);
      try {
        await navigator.clipboard.writeText(json);
        // eslint-disable-next-line no-console
        console.log("[broker:debug] copied", read().length, "entries");
      } catch {
        // eslint-disable-next-line no-console
        console.log(json);
      }
    },
    clear: () => {
      write([]);
      // eslint-disable-next-line no-console
      console.log("[broker:debug] cleared");
    },
  };
}
