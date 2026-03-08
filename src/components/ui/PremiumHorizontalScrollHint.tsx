import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumHorizontalScrollHintProps {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  className?: string;
  arrowSize?: "sm" | "md";
}

export default function PremiumHorizontalScrollHint({
  scrollRef,
  className,
  arrowSize = "sm",
}: PremiumHorizontalScrollHintProps) {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [thumbLeft, setThumbLeft] = useState(0);
  const [thumbWidth, setThumbWidth] = useState(0);
  const [showRail, setShowRail] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartScrollLeft = useRef(0);

  const measure = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const overflow = scrollWidth > clientWidth + 2;
    setShowRail(overflow);
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
    if (overflow && railRef.current) {
      const railW = railRef.current.clientWidth;
      const ratio = clientWidth / scrollWidth;
      const tw = Math.max(24, railW * ratio);
      const tl = (scrollLeft / scrollWidth) * railW;
      setThumbWidth(tw);
      setThumbLeft(Math.min(tl, railW - tw));
    }
  }, [scrollRef]);

  useEffect(() => {
    measure();
    const el = scrollRef.current;
    el?.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    const ro = new ResizeObserver(measure);
    if (el) ro.observe(el);
    return () => {
      el?.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      ro.disconnect();
    };
  }, [measure, scrollRef]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -180 : 180, behavior: "smooth" });
  };

  // Drag-to-scroll on rail/thumb
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    dragging.current = true;
    dragStartX.current = e.clientX;
    dragStartScrollLeft.current = scrollRef.current?.scrollLeft ?? 0;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [scrollRef]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || !scrollRef.current || !railRef.current) return;
    const railW = railRef.current.clientWidth;
    const el = scrollRef.current;
    const deltaX = e.clientX - dragStartX.current;
    const scrollRatio = el.scrollWidth / railW;
    el.scrollLeft = dragStartScrollLeft.current + deltaX * scrollRatio;
  }, [scrollRef]);

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  if (!showRail) return null;

  const btnSize = arrowSize === "sm" ? "w-8 h-8" : "w-9 h-9";
  const iconSize = arrowSize === "sm" ? "w-4 h-4" : "w-4.5 h-4.5";

  return (
    <div className={cn("flex items-center gap-1.5 mt-1", className)}>
      {/* Left Arrow */}
      <button
        onClick={() => scroll("left")}
        disabled={!canScrollLeft}
        className={cn(
          btnSize,
          "rounded-full flex items-center justify-center shrink-0 transition-all border",
          canScrollLeft
            ? "bg-gradient-to-br from-[#FDFBF7] to-[#EDE4D3] border-gold/50 text-black hover:border-gold shadow-sm"
            : "bg-transparent border-gold/15 text-black/20 cursor-default"
        )}
        aria-label="Scroll left"
      >
        <ChevronLeft className={iconSize} />
      </button>

      {/* Gold Rail — draggable */}
      <div
        ref={railRef}
        className="flex-1 h-[5px] rounded-full relative overflow-hidden cursor-pointer"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: 'none' }}
      >
        <div
          className="absolute top-0 h-full rounded-full bg-gradient-to-r from-gold/60 to-gold/40 transition-[left,width] duration-100 cursor-grab active:cursor-grabbing"
          style={{ left: thumbLeft, width: thumbWidth }}
        />
      </div>

      {/* Right Arrow */}
      <button
        onClick={() => scroll("right")}
        disabled={!canScrollRight}
        className={cn(
          btnSize,
          "rounded-full flex items-center justify-center shrink-0 transition-all border",
          canScrollRight
            ? "bg-gradient-to-br from-[#FDFBF7] to-[#EDE4D3] border-gold/50 text-black hover:border-gold shadow-sm"
            : "bg-transparent border-gold/15 text-black/20 cursor-default"
        )}
        aria-label="Scroll right"
      >
        <ChevronRight className={iconSize} />
      </button>
    </div>
  );
}
