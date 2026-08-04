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
  const firstGroupRef = React.useRef<HTMLDivElement | null>(null);
  const secondGroupRef = React.useRef<HTMLDivElement | null>(null);
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
  const cycleWidthRef = React.useRef(0);

  // Measure the wrap point once per layout change instead of reading
  // `scrollWidth` inside the animation frame (that forced a synchronous
  // layout every frame and is what made the rails feel stuck on phones).
  React.useEffect(() => {
    const track = trackRef.current;
    const firstGroup = firstGroupRef.current;
    const secondGroup = secondGroupRef.current;
    if (!track || !firstGroup || !secondGroup) return;
    const measure = () => {
      // The distance between the two identical groups is the exact visual
      // cycle, including the inter-group gap. Using half of scrollWidth was
      // subtly wrong because a flex row with 2N items has 2N-1 gaps. That
      // mismatch caused a hitch every time the rail wrapped.
      cycleWidthRef.current = secondGroup.offsetLeft - firstGroup.offsetLeft;
      if (cycleWidthRef.current > 0 && offsetRef.current >= cycleWidthRef.current) {
        offsetRef.current %= cycleWidthRef.current;
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(firstGroup);
    ro.observe(secondGroup);
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
      const cycleWidth = cycleWidthRef.current;
      if (!s.paused && !s.dragging && now >= s.resumeAt && cycleWidth > 0) {
        offsetRef.current += (speed * dt) / 1000;
        if (offsetRef.current >= cycleWidth) offsetRef.current %= cycleWidth;
        track.style.transform = `translate3d(${-offsetRef.current}px,0,0)`;
      } else if (s.dragging) {
        track.style.transform = `translate3d(${-offsetRef.current}px,0,0)`;
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [items.length, speed]);

  const wrap = (value: number) => {
    const cycleWidth = cycleWidthRef.current;
    if (cycleWidth <= 0) return value;
    let next = value % cycleWidth;
    if (next < 0) next += cycleWidth;
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
    // Resume on the very next animation frame. A delayed restart reads as a
    // broken/stalling rail, especially after ordinary taps on touch devices.
    s.resumeAt = 0;
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
        <div ref={firstGroupRef} className={`flex shrink-0 items-stretch ${gapClassName}`}>
          {items.map((child, i) => (
            <div key={`first-${i}`} className={`shrink-0 ${itemClassName ?? ""}`} draggable={false}>
              {child}
            </div>
          ))}
        </div>
        <div ref={secondGroupRef} className={`flex shrink-0 items-stretch ${gapClassName}`} aria-hidden="true">
          {items.map((child, i) => (
            <div key={`second-${i}`} className={`shrink-0 ${itemClassName ?? ""}`} draggable={false}>
              {child}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
