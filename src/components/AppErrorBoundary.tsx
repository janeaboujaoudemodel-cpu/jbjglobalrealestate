import React from "react";
import { logClientError } from "@/utils/clientErrorLogger";


interface AppErrorBoundaryState {
  hasError: boolean;
  errorMessage?: string;
  retryCount: number;
  isReloading: boolean;
}

/**
 * Top-level error boundary that wraps the entire app.
 * Silently retries on chunk/module loading failures.
 * Never shows technical errors to users.
 */
class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false, retryCount: 0, isReloading: false };

  static getDerivedStateFromError(error: unknown): Partial<AppErrorBoundaryState> {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { hasError: true, errorMessage: msg };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    logClientError("AppErrorBoundary", error, { componentStack: info.componentStack ?? undefined });
    // eslint-disable-next-line no-console
    console.error("AppErrorBoundary caught error:", error, info);

    const msg = error instanceof Error ? error.message : "";
    const looksLikeChunk =
      msg.includes("module") ||
      msg.includes("import") ||
      msg.includes("chunk") ||
      msg.includes("Loading") ||
      msg.includes("Failed to fetch") ||
      msg.includes("dynamically imported") ||
      msg.includes("Importing a module");

    // Non-chunk render errors: silently remount, but cap retries to avoid
    // an infinite setState loop (React error #185) when the child throws
    // synchronously on every remount. Defer setState out of the commit phase.
    if (!looksLikeChunk) {
      if (this.state.retryCount < 3) {
        setTimeout(() => {
          this.setState((prev) => ({ hasError: false, retryCount: prev.retryCount + 1 }));
        }, 0);
      }
      return;
    }

    // Chunk/network errors: silently retry up to 6 times. If we suspect a
    // stale bundle (deploy mid-session), do a one-shot hard reload after
    // the first failure so the user picks up the new chunk hashes.
    if (this.state.retryCount < 6) {
      setTimeout(() => {
        this.setState((prev) => ({ hasError: false, retryCount: prev.retryCount + 1 }));
      }, 0);
      if (this.state.retryCount === 0) {
        try {
          const k = "jbj_chunk_reload_at";
          const last = Number(sessionStorage.getItem(k) || 0);
          if (Date.now() - last > 60_000) {
            sessionStorage.setItem(k, String(Date.now()));
            setTimeout(() => window.location.reload(), 600);
          }
        } catch {
          setTimeout(() => window.location.reload(), 600);
        }
      }
    }
  }

  private handleReload = () => {
    this.setState({ isReloading: true });

    try {
      localStorage.removeItem("jbj_recent_searches");
      sessionStorage.removeItem("jbj_recent_searches");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("Failed to clear cached recent search data before reload", e);
    }

    // Preserve exact current URL on reload
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      // Never show a user-facing "Connection issue" card. Always render
      // nothing while we silently retry. If retries are exhausted, schedule
      // a one-shot hard reload (rate-limited) instead of surfacing a modal.
      if (this.state.retryCount >= 6) {
        try {
          const k = "jbj_boundary_hard_reload_at";
          const last = Number(sessionStorage.getItem(k) || 0);
          if (Date.now() - last > 60_000) {
            sessionStorage.setItem(k, String(Date.now()));
            setTimeout(() => window.location.reload(), 400);
          }
        } catch {
          setTimeout(() => window.location.reload(), 400);
        }
      }
      return null;
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
