import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  scanPrintBlockers,
  applyPrintOverrides,
  loadCachedBlockers,
  saveCachedBlockers,
  mergeBlockers,
  logBlockersToServer,
} from "@/lib/printBlockerEngine";

/**
 * Mounts the print-blocker detection + auto-override engine globally.
 * - On boot: applies cached overrides immediately (instant clean baseline).
 * - Idle scan after each route change to catch lazy-loaded stylesheets.
 * - Logs newly discovered blockers to Supabase (best-effort, deduped).
 * Renders nothing.
 */
const PrintBlockerGuard = () => {
  const { pathname } = useLocation();

  // Apply cached overrides synchronously on first mount
  useEffect(() => {
    const cached = loadCachedBlockers();
    if (cached.length > 0) {
      applyPrintOverrides(cached);
    }
  }, []);

  // Re-scan on every route change (lazy chunks may inject new stylesheets)
  useEffect(() => {
    let cancelled = false;

    const run = () => {
      if (cancelled) return;
      try {
        const found = scanPrintBlockers();
        const cached = loadCachedBlockers();
        const { merged, added } = mergeBlockers(cached, found);

        if (added.length > 0 || cached.length === 0) {
          applyPrintOverrides(merged);
          saveCachedBlockers(merged);
        }

        if (added.length > 0) {
          // Fire-and-forget; safe in anon + authed sessions
          void logBlockersToServer(added, pathname);
        }
      } catch (err) {
        if (typeof console !== "undefined") {
          console.debug("[print-blocker] scan failed:", err);
        }
      }
    };

    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number;
    };
    let idleHandle: number | undefined;
    let timeoutHandle: number | undefined;
    if (typeof w.requestIdleCallback === "function") {
      idleHandle = w.requestIdleCallback(run, { timeout: 2000 });
    } else {
      timeoutHandle = window.setTimeout(run, 600);
    }

    return () => {
      cancelled = true;
      if (idleHandle !== undefined && "cancelIdleCallback" in window) {
        (window as any).cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle !== undefined) {
        window.clearTimeout(timeoutHandle);
      }
    };
  }, [pathname]);

  return null;
};

export default PrintBlockerGuard;
