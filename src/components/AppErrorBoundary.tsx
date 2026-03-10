import React from "react";
import { RefreshCcw, Home } from "lucide-react";

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
    // eslint-disable-next-line no-console
    console.error("AppErrorBoundary caught error:", error, info);

    const msg = error instanceof Error ? error.message : "";
    const isChunkError =
      msg.includes("module") ||
      msg.includes("import") ||
      msg.includes("chunk") ||
      msg.includes("Loading") ||
      msg.includes("Failed to fetch") ||
      msg.includes("dynamically imported") ||
      msg.includes("Importing a module");

    // Auto-retry up to 3 times for chunk/module loading failures
    if (isChunkError && this.state.retryCount < 3) {
      this.setState((prev) => ({ hasError: false, retryCount: prev.retryCount + 1 }));
      setTimeout(() => window.location.reload(), 2500);
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
      return (
        <div
          style={{
            minHeight: "100vh",
            background: "#0a0a0a",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: "500px",
              width: "100%",
              background: "linear-gradient(135deg, #FDFBF7 0%, #F5F0E6 50%, #EDE4D3 100%)",
              borderRadius: "16px",
              padding: "2rem",
              border: "2px solid rgba(200,167,102,0.5)",
              boxShadow: "0 12px 40px rgba(200,167,102,0.25)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #C8A766, #E8DCC8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <RefreshCcw size={20} color="#1a1a1a" />
              </div>
              <h1 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0, color: "#1a1a1a" }}>
                We're getting things ready
              </h1>
            </div>

            <p style={{ color: "#555", fontSize: "0.875rem", marginBottom: "1.5rem", lineHeight: 1.6 }}>
              The page is taking a moment to load. Please check your internet connection and try refreshing, or return to the homepage.
            </p>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                onClick={this.handleReload}
                disabled={this.state.isReloading}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.625rem 1.25rem",
                  background: "linear-gradient(135deg, #C8A766, #E8DCC8)",
                  color: "#1a1a1a",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 600,
                  cursor: this.state.isReloading ? "wait" : "pointer",
                  fontSize: "0.875rem",
                  boxShadow: "0 4px 12px rgba(200,167,102,0.3)",
                  opacity: this.state.isReloading ? 0.75 : 1,
                }}
              >
                <RefreshCcw size={16} />
                {this.state.isReloading ? "Refreshing..." : "Refresh Page"}
              </button>
              <button
                onClick={this.handleGoHome}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.625rem 1.25rem",
                  background: "transparent",
                  color: "#1a1a1a",
                  border: "2px solid rgba(200,167,102,0.6)",
                  borderRadius: "8px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "0.875rem",
                }}
              >
                <Home size={16} />
                Go to Homepage
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
