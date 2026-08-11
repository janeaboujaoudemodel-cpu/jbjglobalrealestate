import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Defers mounting children until the placeholder scrolls within `rootMargin`
 * of the viewport.
 *
 * CLS contract (LOCKED): the wrapper element is **persistent** — the same DOM
 * node holds the placeholder and, later, the mounted children. The reserved
 * min-height is kept after mount, so a section can never collapse when its
 * real content turns out shorter than the reserve (that collapse was the
 * dominant homepage CLS source: 0.83 desktop / 1.21 mobile). Sections can only
 * grow past the reserve, and reserves are calibrated per breakpoint to the
 * measured content height so growth is ~0 too.
 *
 * Pass `minHeightMobile` when a section is materially shorter/taller under
 * 768px — the reserve is applied through CSS custom properties so no JS
 * viewport read is required.
 */
interface Props {
  children: ReactNode;
  /** Reserved height (desktop / default) in px. */
  minHeight?: number;
  /** Reserved height under 768px in px. Defaults to `minHeight`. */
  minHeightMobile?: number;
  rootMargin?: string;
  className?: string;
  /**
   * Data-dependent sections (a strip that renders nothing when the query is
   * empty) release the reserve after mount so an empty state never leaves a
   * blank gap. They mount far off-screen (large rootMargin) so the height
   * correction happens outside the viewport and scores zero CLS.
   */
  release?: boolean;
}

export default function LazyVisible({
  children,
  minHeight = 120,
  minHeightMobile,
  rootMargin = "1200px",
  className = "",
  release = false,
}: Props) {
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

  return (
    <div
      ref={ref}
      className={`jj-lv ${className}`}
      data-lv-state={visible ? "mounted" : "pending"}
      data-lv-release={release ? "1" : undefined}
      style={
        {
          "--lv-h": `${minHeight}px`,
          "--lv-hm": `${minHeightMobile ?? minHeight}px`,
        } as React.CSSProperties
      }
      aria-hidden={visible ? undefined : true}
    >
      {visible ? children : null}
    </div>
  );
}
