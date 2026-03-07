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

  if (!showRail) return null;

  const btnSize = arrowSize === "sm" ? "w-6 h-6" : "w-7 h-7";
  const iconSize = arrowSize === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";

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

      {/* Gold Rail */}
      <div
        ref={railRef}
        className="flex-1 h-[3px] rounded-full bg-gold/15 relative overflow-hidden"
      >
        <div
          className="absolute top-0 h-full rounded-full bg-gradient-to-r from-gold/60 to-gold/40 transition-[left,width] duration-100"
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
