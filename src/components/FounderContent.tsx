import { ReactNode } from "react";
import { useFounderVisibility } from "@/contexts/FounderVisibilityContext";

interface FounderContentProps {
  children: ReactNode;
  /** 
   * Fallback content to show when founder content is hidden.
   * If not provided, nothing will be rendered when hidden.
   */
  fallback?: ReactNode;
  /**
   * If true, the element will be hidden via CSS (display: none) instead of 
   * being removed from the DOM. This preserves layout calculations.
   */
  preserveSpace?: boolean;
  /**
   * Custom class name to apply when content is visible
   */
  className?: string;
}

/**
 * FounderContent - Wrapper component for founder-related content.
 * 
 * When founder visibility is disabled globally, this component will:
 * - Hide its children (either via CSS or conditional rendering)
 * - Optionally show fallback content
 * - Preserve the exact DOM structure when visibility is re-enabled
 * 
 * Usage:
 * <FounderContent>
 *   <span>Jane Bou Jaoude</span>
 * </FounderContent>
 * 
 * With fallback:
 * <FounderContent fallback={<span>Leadership</span>}>
 *   <span>Jane Bou Jaoude, Founder & CEO</span>
 * </FounderContent>
 */
export const FounderContent = ({ 
  children, 
  fallback = null, 
  preserveSpace = false,
  className = ""
}: FounderContentProps) => {
  const { isFounderVisible, isLoading } = useFounderVisibility();

  // During loading, show nothing to prevent flicker
  if (isLoading) {
    return preserveSpace ? (
      <span className={`invisible ${className}`}>{children}</span>
    ) : null;
  }

  // If visible, render children normally
  if (isFounderVisible) {
    return <>{children}</>;
  }

  // If hidden with preserveSpace, use CSS to hide
  if (preserveSpace) {
    return (
      <span className={`invisible pointer-events-none ${className}`} aria-hidden="true">
        {children}
      </span>
    );
  }

  // If hidden, render fallback or nothing
  return <>{fallback}</>;
};

/**
 * FounderName - Convenience wrapper for founder name text.
 * Automatically handles the standard name format.
 */
export const FounderName = ({ 
  includeArabic = true,
  fallback = "Leadership"
}: { 
  includeArabic?: boolean;
  fallback?: string;
}) => {
  const { isFounderVisible } = useFounderVisibility();

  if (!isFounderVisible) {
    return <>{fallback}</>;
  }

  return (
    <>
      Jane Bou Jaoude{includeArabic && " (جاين بو جودة)"}
    </>
  );
};

/**
 * FounderTitle - Convenience wrapper for founder title.
 */
export const FounderTitle = ({ 
  fallback = "Executive Leadership"
}: { 
  fallback?: string;
}) => {
  const { isFounderVisible } = useFounderVisibility();

  if (!isFounderVisible) {
    return <>{fallback}</>;
  }

  return <>Founder & CEO</>;
};

export default FounderContent;
