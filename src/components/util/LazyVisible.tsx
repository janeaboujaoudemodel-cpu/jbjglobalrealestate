import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Defers mounting children until the placeholder scrolls within `rootMargin`
 * of the viewport. Zero visual change — reserves `minHeight` so layout is stable.
 *
 * This is the cheapest, safest perf win: below-the-fold chunks (and their
 * data fetches, images, motion runtime) are not requested until the user
 * actually scrolls toward them.
 */
interface Props {
  children: ReactNode;
  minHeight?: number;
  rootMargin?: string;
}

export default function LazyVisible({ children, minHeight = 200, rootMargin = "600px" }: Props) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible, rootMargin]);

  if (visible) return <>{children}</>;
  return <div ref={ref} style={{ minHeight }} aria-hidden="true" />;
}
