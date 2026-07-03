import { useState, useEffect, ReactNode } from "react";
import { BrandedLoader } from "@/components/ui/BrandedLoader";

/**
 * DelayedLoader — prevents flash-of-loader on fast networks.
 * Renders nothing for the first `delay` ms, then shows children.
 */
export function DelayedLoader({ children, delay = 600 }: { children: ReactNode; delay?: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return show ? <>{children}</> : null;
}

/**
 * Thin top progress bar — non-blocking, no full-screen splash.
 * Replaces the previous monogram splash that flashed on every navigation.
 */
const TopProgressBar = () => (
  <div
    aria-hidden
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      height: 2,
      zIndex: 9999,
      background: "transparent",
      pointerEvents: "none",
    }}
  >
    <div
      style={{
        height: "100%",
        width: "30%",
        background: "linear-gradient(90deg, transparent, #064E3B, transparent)",
        animation: "pageLoaderSlide 1.1s ease-in-out infinite",
      }}
    />
    <style>{`
      @keyframes pageLoaderSlide {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(400%); }
      }
    `}</style>
  </div>
);

/**
 * PageLoader - Global loading fallback for lazy-loaded pages.
 * Now a thin emerald progress bar — no monogram, no dark gradient, no min-h-screen.
 */
const PageLoader = () => (
  <DelayedLoader delay={400}>
    <TopProgressBar />
  </DelayedLoader>
);

/**
 * InlinePageLoader - Layout-safe loader for use inside MainLayout.
 * Same thin top progress bar so the header/sidebar stay stable and visible.
 */
export const InlinePageLoader = () => (
  <DelayedLoader delay={400}>
    <TopProgressBar />
  </DelayedLoader>
);

// Re-export for any boot screens that still need the full branded loader.
export { BrandedLoader };

export default PageLoader;
