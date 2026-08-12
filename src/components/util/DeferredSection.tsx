/**
 * DeferredSection — mounts its children only when the placeholder comes near
 * the viewport (IntersectionObserver, 600px rootMargin).
 *
 * Why: the project detail page eagerly mounted every below-fold section
 * (mortgage calculator, AI analyzer, buyer insights, recommendation strips,
 * market widget). That inflated DOM nodes, style recalculation, layout and
 * script time on mobile even though none of it is visible on first paint.
 * A reserved min-height keeps CLS at zero, and once mounted the section stays
 * mounted so scroll-anchor navigation and internal state behave exactly as
 * before.
 */
import { ReactNode, useEffect, useRef, useState } from "react";

type Props = {
  children: ReactNode;
  /** Reserved height before mount — keeps scroll position and CLS stable. */
  minHeight?: number;
  className?: string;
  rootMargin?: string;
};

export default function DeferredSection({
  children,
  minHeight = 320,
  className,
  rootMargin = "600px 0px",
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (shown) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    // Hidden tabs and transformed ancestors can prevent an observer callback.
    // Mount after a bounded delay rather than leaving a blank shell forever.
    const fallbackTimer = window.setTimeout(() => setShown(true), 2000);
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => {
      window.clearTimeout(fallbackTimer);
      io.disconnect();
    };
  }, [shown, rootMargin]);

  // Print / PDF export must never depend on scrolling.
  useEffect(() => {
    if (shown) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("print").matches || window.location.search.includes("print=1")) {
      setShown(true);
    }
  }, [shown]);

  if (shown) return <>{children}</>;
  return (
    <div
      ref={ref}
      className={`jj-bleed-allow ${className ?? ""}`}
      style={{ minHeight, padding: 0 }}
      aria-hidden="true"
    />
  );

}
