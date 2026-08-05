/**
 * HoverScrollRow — horizontal scroller with clean gold chevrons (no borders,
 * no circles). Hovering a chevron immediately starts a smooth continuous
 * scroll in that direction; leaving stops it. Arrows only render when there is
 * actually more content in that direction.
 *
 * Use this anywhere a row of pills/chips can overflow horizontally.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const GOLD = "#B89555";
const SPEED = 260; // px per second

interface Props {
  children: ReactNode;
  className?: string;
  /** Extra classes for the inner scrolling track. */
  trackClassName?: string;
  /** Surface colour used for the fade behind the arrows. */
  fade?: string;
}

export default function HoverScrollRow({ children, className = "", trackClassName = "", fade = "#F7F2EA" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const raf = useRef<number | null>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 2);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    Array.from(el.children).forEach((c) => ro.observe(c));
    return () => ro.disconnect();
  }, [measure, children]);

  const stop = useCallback(() => {
    if (raf.current != null) cancelAnimationFrame(raf.current);
    raf.current = null;
  }, []);

  const start = useCallback(
    (dir: 1 | -1) => {
      stop();
      let last = performance.now();
      const step = (now: number) => {
        const el = ref.current;
        if (!el) return;
        const dt = (now - last) / 1000;
        last = now;
        el.scrollLeft += dir * SPEED * dt;
        measure();
        raf.current = requestAnimationFrame(step);
      };
      raf.current = requestAnimationFrame(step);
    },
    [measure, stop],
  );

  useEffect(() => stop, [stop]);

  const arrow = (dir: 1 | -1, show: boolean) => {
    if (!show) return null;
    const Icon = dir === 1 ? ChevronRight : ChevronLeft;
    return (
      <button
        type="button"
        aria-label={dir === 1 ? "Scroll right" : "Scroll left"}
        tabIndex={-1}
        onMouseEnter={() => start(dir)}
        onMouseLeave={stop}
        onFocus={() => start(dir)}
        onBlur={stop}
        onClick={() => ref.current?.scrollBy({ left: dir * 200, behavior: "smooth" })}
        data-no-contrast-guard
        className={`absolute top-0 bottom-0 ${dir === 1 ? "right-0 pl-8 pr-1 justify-end" : "left-0 pr-8 pl-1 justify-start"} z-10 flex items-center border-0 shadow-none outline-none`}
        style={{
          color: GOLD,
          background: `linear-gradient(to ${dir === 1 ? "left" : "right"}, ${fade} 42%, ${fade}00 100%)`,
        }}
      >
        <Icon className="w-5 h-5" strokeWidth={2.25} style={{ color: GOLD, stroke: GOLD }} />
      </button>
    );
  };

  return (
    <div className={`relative ${className}`}>
      <div
        ref={ref}
        onScroll={measure}
        className={`flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${trackClassName}`}
      >
        {children}
      </div>
      {arrow(-1, canLeft)}
      {arrow(1, canRight)}
    </div>
  );
}
