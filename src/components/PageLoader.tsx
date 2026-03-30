import { useState, useEffect, ReactNode } from "react";
import { BrandedLoader } from "@/components/ui/BrandedLoader";

/**
 * DelayedLoader — prevents flash-of-loader on fast networks.
 * Renders nothing for the first `delay` ms, then shows children.
 */
export function DelayedLoader({ children, delay = 300 }: { children: ReactNode; delay?: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return show ? <>{children}</> : null;
}

/**
 * PageLoader - Global loading fallback for lazy-loaded pages
 * Displays the JBJ monogram with a gold fill animation
 */
const PageLoader = () => (
  <DelayedLoader>
    <div className="min-h-screen bg-gradient-to-br from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)] flex items-center justify-center">
      <BrandedLoader text="Loading..." className="min-h-screen" />
    </div>
  </DelayedLoader>
);

/**
 * InlinePageLoader - Layout-safe loader for use inside MainLayout
 * Does NOT replace the entire screen — keeps header/sidebar stable
 */
export const InlinePageLoader = () => (
  <DelayedLoader>
    <div className="flex items-center justify-center py-32 min-h-[60vh] bg-gradient-to-br from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)]">
      <BrandedLoader text="Loading..." className="min-h-0" />
    </div>
  </DelayedLoader>
);

export default PageLoader;
