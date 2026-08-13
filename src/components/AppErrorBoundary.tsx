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
    // synchronously on every remount. The render path below performs one
    // rate-limited hard recovery after the cap instead of staying blank.
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
          const k = "jbj_recovery_reload_at";
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
      // Never show a technical error. While silent retries are still in flight
      // we render nothing. Once retries are exhausted we attempt a hard reload;
      // if the shared 60s reload budget was already spent by another recovery
      // path (vite:preloadError / lazyWithRetry), we schedule the reload for the
      // remaining window AND show a branded recovery card so the visitor is
      // never left staring at a blank white page.
      const exhaustedRetries = this.state.retryCount >= 3;
      if (!exhaustedRetries) return null;

      let reloadScheduled = false;
      try {
        const k = "jbj_recovery_reload_at";
        const last = Number(sessionStorage.getItem(k) || 0);
        const elapsed = Date.now() - last;
        if (elapsed > 60_000) {
          sessionStorage.setItem(k, String(Date.now()));
          setTimeout(() => window.location.reload(), 400);
          reloadScheduled = true;
        } else if (!this.reloadTimer) {
          // Budget spent elsewhere — wait out the remainder, then reload once.
          const wait = Math.max(1_200, 60_000 - elapsed + 200);
          this.reloadTimer = window.setTimeout(() => {
            try {
              sessionStorage.setItem(k, String(Date.now()));
            } catch {
              /* ignore */
            }
            window.location.reload();
          }, wait);
        }
      } catch {
        setTimeout(() => window.location.reload(), 400);
        reloadScheduled = true;
      }

      if (reloadScheduled) return null;

      return (
        <div
          data-surface="emerald"
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            background:
              "linear-gradient(135deg, #064E3B 0%, #042C1C 58%, #000000 100%)",
            color: "#FFFFFF",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: "28rem" }}>
            <p style={{ fontSize: "1.125rem", marginBottom: "0.75rem", color: "#FFFFFF" }}>
              Reconnecting…
            </p>
            <p style={{ fontSize: "0.875rem", opacity: 0.85, marginBottom: "1.25rem", color: "#FFFFFF" }}>
              This is taking a moment. The page will refresh automatically.
            </p>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={this.handleReload}
                disabled={this.state.isReloading}
                style={{
                  padding: "0.625rem 1.25rem",
                  borderRadius: "9999px",
                  border: "1px solid rgba(255,255,255,0.35)",
                  background: "rgba(255,255,255,0.08)",
                  color: "#FFFFFF",
                  cursor: "pointer",
                }}
              >
                Refresh now
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                style={{
                  padding: "0.625rem 1.25rem",
                  borderRadius: "9999px",
                  border: "1px solid rgba(255,255,255,0.35)",
                  background: "transparent",
                  color: "#FFFFFF",
                  cursor: "pointer",
                }}
              >
                Go home
              </button>
            </div>
          </div>
        </div>
      );
    }


    return this.props.children;
  }
}

export default AppErrorBoundary;
