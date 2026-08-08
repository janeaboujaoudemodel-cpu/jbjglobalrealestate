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
  speed = 110,
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
  const animationRef = React.useRef<Animation | null>(null);
  const cycleWidthRef = React.useRef(0);
  const stateRef = React.useRef({
    dragging: false,
    startX: 0,
    startTime: 0,
    moved: 0,
    captured: false,
  });

  const [grabbing, setGrabbing] = React.useState(false);

  const items = React.Children.toArray(children);
  // Use a compositor-owned Web Animation rather than advancing the rail from
  // requestAnimationFrame. The /access page has substantially more React work
  // than the homepage; a JS-driven transform therefore slowed or stopped when
  // the main thread was busy even though both rails requested the same speed.
  React.useEffect(() => {
    const track = trackRef.current;
    const firstGroup = firstGroupRef.current;
    const secondGroup = secondGroupRef.current;
    if (!track || !firstGroup || !secondGroup) return;
    if (items.length < 2 || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const measure = () => {
      const cycleWidth = secondGroup.offsetLeft - firstGroup.offsetLeft;
      if (
        cycleWidth <= 0 ||
        (Math.abs(cycleWidth - cycleWidthRef.current) < 0.5 && animationRef.current)
      ) return;

      const previous = animationRef.current;
      const previousProgress = previous && previous.effect?.getComputedTiming().progress;
      previous?.cancel();
      cycleWidthRef.current = cycleWidth;
      const animation = track.animate(
        [
          { transform: "translate3d(0, 0, 0)" },
          { transform: `translate3d(${-cycleWidth}px, 0, 0)` },
        ],
        { duration: (cycleWidth / speed) * 1000, iterations: Infinity, easing: "linear" },
      );
      if (typeof previousProgress === "number") {
        animation.currentTime = previousProgress * ((cycleWidth / speed) * 1000);
      }
      animationRef.current = animation;
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
      animationRef.current?.cancel();
      animationRef.current = null;
      cycleWidthRef.current = 0;
    };
  }, [items.length, speed]);

  const onPointerDown = (e: React.PointerEvent) => {
    const s = stateRef.current;
    s.dragging = true;
    s.startX = e.clientX;
    s.startTime = Number(animationRef.current?.currentTime ?? 0);
    s.moved = 0;
    s.captured = false;
    animationRef.current?.pause();
    setGrabbing(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const s = stateRef.current;
    if (!s.dragging) return;
    const dx = e.clientX - s.startX;
    s.moved = Math.abs(dx);
    // Take over as soon as the gesture reads horizontal (3px) so holding and
    // dragging moves the rail immediately, while vertical page scrolling on
    // phones is still never hijacked.
    if (s.moved > 3 && animationRef.current) {
      // Pointer capture is claimed ONLY after the gesture proves to be a drag.
      // Capturing on pointerdown retargets the resulting `click` to this
      // container, which silently killed every card/book link inside the rail.
      if (!s.captured) {
        try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); s.captured = true; } catch { /* noop */ }
      }
      const duration = (cycleWidthRef.current / speed) * 1000;
      let nextTime = (s.startTime - (dx / speed) * 1000) % duration;
      if (nextTime < 0) nextTime += duration;
      animationRef.current.currentTime = nextTime;
    }
  };

  const endDrag = (e?: React.PointerEvent) => {
    const s = stateRef.current;
    if (!s.dragging) return;
    s.dragging = false;
    if (s.captured && e) {
      try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* noop */ }
    }
    s.captured = false;
    animationRef.current?.play();
    setGrabbing(false);
  };

  // Two-finger trackpad / horizontal wheel: nudge the rail immediately.
  // React's onWheel is passive, so the listener is attached natively.
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let resume: number | undefined;
    const onWheel = (e: WheelEvent) => {
      const anim = animationRef.current;
      const cycle = cycleWidthRef.current;
      if (!anim || !cycle) return;
      const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : 0;
      if (!dx) return;
      e.preventDefault();
      anim.pause();
      const duration = (cycle / speed) * 1000;
      let next = (Number(anim.currentTime ?? 0) + (dx / speed) * 1000) % duration;
      if (next < 0) next += duration;
      anim.currentTime = next;
      window.clearTimeout(resume);
      resume = window.setTimeout(() => anim.play(), 700);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      window.clearTimeout(resume);
    };
  }, [speed]);

  return (
    <div
      ref={rootRef}
      className={`relative w-full select-none overflow-hidden ${className ?? ""}`}
      aria-label={ariaLabel}
      onMouseEnter={() => {
        if (pauseOnHover && window.matchMedia?.("(hover: hover) and (pointer: fine)").matches) {
          animationRef.current?.pause();
        }
      }}
      onMouseLeave={() => {
        animationRef.current?.play();
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
        style={{ willChange: "transform", backfaceVisibility: "hidden" }}
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
