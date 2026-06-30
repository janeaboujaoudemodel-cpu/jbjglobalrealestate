import React from "react";
import { AlertTriangle, Home, RefreshCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { logClientError } from "@/utils/clientErrorLogger";

type RouteErrorBoundaryProps = {
  children: React.ReactNode;
  routeName?: string;
};

type RouteErrorBoundaryState = {
  hasError: boolean;
  errorMessage?: string;
};

export default class RouteErrorBoundary extends React.Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: unknown): RouteErrorBoundaryState {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { hasError: true, errorMessage: msg };
  }

  componentDidCatch(error: unknown, info: unknown) {
    logClientError(`Route:${this.props.routeName ?? "unknown"}`, error, {
      componentStack: (info as React.ErrorInfo | undefined)?.componentStack ?? undefined,
    });
    // eslint-disable-next-line no-console
    console.error(
      "RouteErrorBoundary caught error:",
      {
        routeName: this.props.routeName,
        error,
        info,
      }
    );
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
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <Card className="w-full max-w-xl border-border bg-card">
            <CardHeader className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <CardTitle className="text-foreground">
                  {this.props.routeName ? `${this.props.routeName} failed to load` : "Page failed to load"}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Something went wrong while rendering this page. Please refresh. If the issue keeps happening, go back to the site and try again.
              </p>

              {this.state.errorMessage ? (
                <pre className="text-xs whitespace-pre-wrap rounded-md border border-border bg-muted p-3 text-muted-foreground">
                  {this.state.errorMessage}
                </pre>
              ) : null}

              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={this.handleReload} className="w-full sm:w-auto">
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button variant="outline" onClick={this.handleGoHome} className="w-full sm:w-auto">
                  <Home className="h-4 w-4 mr-2" />
                  Back to site
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
