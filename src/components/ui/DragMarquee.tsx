import React from "react";

/**
 * DragMarquee — continuous auto-walking horizontal rail.
 *
 * Why transform-based instead of `scrollLeft`:
 * on iOS/Android the native touch scroller fights programmatic `scrollLeft`
 * writes (momentum, rubber-banding, lazy image reflow), so scroll-driven
 * marquees visibly stall on phones. Translating a duplicated track never
 * stalls, and drag is handled manually so the visitor can still swipe.
 *
 * Children are rendered twice; the offset wraps at half the track width.
 */
export function DragMarquee({
  children,
  speed = 34,
  className,
  itemClassName,
  gapClassName = "gap-6",
  pauseOnHover = true,
  ariaLabel,
}: {
  children: React.ReactNode[];
  /** px per second */
  speed?: number;
  className?: string;
  itemClassName?: string;
  gapClassName?: string;
  pauseOnHover?: boolean;
  ariaLabel?: string;
}) {
  const trackRef = React.useRef<HTMLDivElement | null>(null);
  const offsetRef = React.useRef(0);
  const stateRef = React.useRef({
    paused: false,
    dragging: false,
    startX: 0,
    startOffset: 0,
    resumeAt: 0,
    moved: 0,
  });
  const [grabbing, setGrabbing] = React.useState(false);

  const items = React.Children.toArray(children);
  const duplicated = items.length > 1 ? [...items, ...items] : items;

  const halfRef = React.useRef(0);

  // Measure the wrap point once per layout change instead of reading
  // `scrollWidth` inside the animation frame (that forced a synchronous
  // layout every frame and is what made the rails feel stuck on phones).
  React.useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      halfRef.current = track.scrollWidth / 2;
      if (halfRef.current > 0 && offsetRef.current > halfRef.current) {
        offsetRef.current = offsetRef.current % halfRef.current;
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    window.addEventListener("resize", measure);
    // Images finishing decode can change the track width.
    const t = window.setTimeout(measure, 600);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.clearTimeout(t);
    };
  }, [items.length]);

  React.useEffect(() => {
    const track = trackRef.current;
    if (!track || items.length < 2) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let last = performance.now();

    const step = (now: number) => {
      raf = requestAnimationFrame(step);
      const dt = Math.min(48, now - last);
      last = now;
      const s = stateRef.current;
      const half = halfRef.current;
      if (!s.paused && !s.dragging && now >= s.resumeAt && half > 0) {
        offsetRef.current += (speed * dt) / 1000;
        if (offsetRef.current >= half) offsetRef.current -= half;
        track.style.transform = `translate3d(${-offsetRef.current}px,0,0)`;
      } else if (s.dragging) {
        track.style.transform = `translate3d(${-offsetRef.current}px,0,0)`;
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [items.length, speed]);

  const wrap = (value: number) => {
    const half = halfRef.current;
    if (half <= 0) return value;
    let next = value % half;
    if (next < 0) next += half;
    return next;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const s = stateRef.current;
    s.dragging = true;
    s.startX = e.clientX;
    s.startOffset = offsetRef.current;
    s.moved = 0;
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* noop */ }
    setGrabbing(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const s = stateRef.current;
    if (!s.dragging) return;
    const dx = e.clientX - s.startX;
    s.moved = Math.abs(dx);
    // Only take over the gesture once it is clearly horizontal, so vertical
    // page scrolling on phones is never hijacked.
    if (s.moved > 6) offsetRef.current = wrap(s.startOffset - dx);
  };

  const endDrag = () => {
    const s = stateRef.current;
    if (!s.dragging) return;
    s.dragging = false;
    s.resumeAt = performance.now() + 700;
    setGrabbing(false);
  };

  return (
    <div
      className={`relative w-full select-none overflow-hidden ${className ?? ""}`}
      aria-label={ariaLabel}
      onMouseEnter={() => {
        if (pauseOnHover && window.matchMedia?.("(hover: hover) and (pointer: fine)").matches) {
          stateRef.current.paused = true;
        }
      }}
      onMouseLeave={() => {
        stateRef.current.paused = false;
        endDrag();
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={(e) => {
        // Swallow the click that terminates a swipe so dragging never opens a card.
        if (stateRef.current.moved > 6) {
          e.preventDefault();
          e.stopPropagation();
          stateRef.current.moved = 0;
        }
      }}
      style={{ cursor: grabbing ? "grabbing" : "grab", touchAction: "pan-y" }}
    >
      <div
        ref={trackRef}
        className={`flex w-max items-stretch ${gapClassName}`}
        style={{ willChange: "transform", transform: "translate3d(0,0,0)", backfaceVisibility: "hidden" }}
      >
        {duplicated.map((child, i) => (
          <div key={i} className={`shrink-0 ${itemClassName ?? ""}`} draggable={false}>
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
