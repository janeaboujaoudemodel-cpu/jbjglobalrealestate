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
              background: "linear-gradient(135deg, #FDFBF7 0%, #F5F0E6 50%, #EDE4D3 100%)",
              borderRadius: "16px",
              padding: "2rem",
              border: "2px solid rgba(200,167,102,0.5)",
              boxShadow: "0 12px 40px rgba(200,167,102,0.25)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <AlertTriangle size={24} color="#C8A766" />
              <h1 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0, color: "#1a1a1a" }}>
                We're getting things ready
              </h1>
            </div>

            <p style={{ color: "#555", fontSize: "0.875rem", marginBottom: "1rem" }}>
              The page is taking a moment to load. Please try refreshing or return to the homepage.
            </p>

            {this.state.errorMessage && (
              <pre
                style={{
                  fontSize: "0.75rem",
                  background: "rgba(200,167,102,0.1)",
                  padding: "0.75rem",
                  borderRadius: "8px",
                  border: "1px solid rgba(200,167,102,0.3)",
                  color: "#666",
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
                  background: "linear-gradient(135deg, #C8A766, #E8DCC8)",
                  color: "#1a1a1a",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  boxShadow: "0 4px 12px rgba(200,167,102,0.3)",
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
