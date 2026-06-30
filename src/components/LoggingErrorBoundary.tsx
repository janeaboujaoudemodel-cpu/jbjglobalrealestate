import React from "react";
import { logClientError } from "@/utils/clientErrorLogger";

/**
 * Silent logging boundary — captures render errors from a child subtree,
 * forwards them to the client error log for QA visibility, then rethrows
 * (or renders nothing) so upstream boundaries can still handle UX.
 *
 * Use to instrument high-value surfaces (broker dashboard cards, report
 * preview modal, etc.) so failures show up in `window.__jbjErrorLog()`
 * even when an outer boundary swallows them.
 */
type Props = {
  surface: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type State = { hasError: boolean };

export default class LoggingErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    logClientError(this.props.surface, error, {
      componentStack: info.componentStack ?? undefined,
    });
  }

  render() {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}
