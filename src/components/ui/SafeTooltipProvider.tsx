import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

/**
 * SafeTooltipProvider - Error-boundary wrapped TooltipProvider
 * 
 * This component catches React errors (e.g., "Cannot read properties of null (reading 'useRef')")
 * that can occur when TooltipProvider is rendered during invalid React dispatcher states.
 * 
 * If an error occurs, tooltips simply won't show - but the app won't crash.
 */
class TooltipErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // Log but don't crash - tooltips are nice-to-have
    console.warn("[SafeTooltipProvider] Tooltip crashed and was disabled:", error.message);
  }

  render() {
    if (this.state.hasError) {
      // Just render children without tooltip functionality
      return <>{this.props.children}</>;
    }
    return this.props.children;
  }
}

interface SafeTooltipProviderProps {
  children: React.ReactNode;
  delayDuration?: number;
  skipDelayDuration?: number;
  disableHoverableContent?: boolean;
}

export const SafeTooltipProvider = React.forwardRef<
  HTMLDivElement,
  SafeTooltipProviderProps
>(({
  children,
  delayDuration = 300,
  skipDelayDuration = 200,
  disableHoverableContent = false,
}, _ref) => {
  return (
    <TooltipErrorBoundary>
      <TooltipPrimitive.Provider
        delayDuration={delayDuration}
        skipDelayDuration={skipDelayDuration}
        disableHoverableContent={disableHoverableContent}
      >
        {children}
      </TooltipPrimitive.Provider>
    </TooltipErrorBoundary>
  );
});

SafeTooltipProvider.displayName = "SafeTooltipProvider";

export default SafeTooltipProvider;
