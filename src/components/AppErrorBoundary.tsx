import React from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";

interface AppErrorBoundaryState {
  hasError: boolean;
  errorMessage?: string;
}

/**
 * Top-level error boundary that wraps the entire app.
 * Ensures users never see a blank white page - always shows a recovery UI.
 */
class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { hasError: true, errorMessage: msg };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("AppErrorBoundary caught error:", error, info);
  }

  private handleReload = () => {
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
              background: "#1a1a1a",
              borderRadius: "12px",
              padding: "2rem",
              border: "1px solid #333",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <AlertTriangle size={24} color="#ef4444" />
              <h1 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>
                Something went wrong
              </h1>
            </div>

            <p style={{ color: "#a1a1aa", fontSize: "0.875rem", marginBottom: "1rem" }}>
              We encountered an unexpected error. Please try refreshing the page or return to the homepage.
            </p>

            {this.state.errorMessage && (
              <pre
                style={{
                  fontSize: "0.75rem",
                  background: "#0f0f0f",
                  padding: "0.75rem",
                  borderRadius: "6px",
                  border: "1px solid #333",
                  color: "#a1a1aa",
                  overflow: "auto",
                  marginBottom: "1.5rem",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {this.state.errorMessage}
              </pre>
            )}

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                onClick={this.handleReload}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.625rem 1.25rem",
                  background: "#d4af37",
                  color: "#0a0a0a",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: 500,
                  cursor: "pointer",
                  fontSize: "0.875rem",
                }}
              >
                <RefreshCcw size={16} />
                Refresh Page
              </button>
              <button
                onClick={this.handleGoHome}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.625rem 1.25rem",
                  background: "transparent",
                  color: "#d4af37",
                  border: "1px solid #d4af37",
                  borderRadius: "6px",
                  fontWeight: 500,
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
