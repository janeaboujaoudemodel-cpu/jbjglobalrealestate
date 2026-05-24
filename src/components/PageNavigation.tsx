import { useEffect, useState, useCallback, useContext, forwardRef, useRef } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { LanguageContext } from "@/contexts/LanguageContext";

interface PageNavigationProps {
  isChatOpen?: boolean;
  isChatMedium?: boolean;
}

const PageNavigation = forwardRef<HTMLDivElement, PageNavigationProps>(({ isChatOpen = false, isChatMedium = false }, ref) => {
  const languageContext = useContext(LanguageContext);
  const isRTL = languageContext?.isRTL ?? false;
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Drag state
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startOffX: 0, startOffY: 0, moved: false });
  const buttonRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    setShowScrollTop(scrollTop > 200);
  }, []);

  const supportDrawerOpen =
    typeof document !== "undefined" &&
    (!!document.querySelector('[data-jbj-concierge-open="true"]') || !!document.querySelector('[data-jbj-chat-open="true"]'));

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    const timer = setTimeout(handleScroll, 500);
    return () => { window.removeEventListener("scroll", handleScroll); clearTimeout(timer); };
  }, [handleScroll]);

  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== undefined && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const curOff = dragOffset ?? { x: 0, y: 0 };
    dragRef.current = { startX: e.clientX, startY: e.clientY, startOffX: curOff.x, startOffY: curOff.y, moved: false };
    setIsDragging(true);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragRef.current.moved = true;
    }
    if (dragRef.current.moved) {
      setDragOffset({ x: dragRef.current.startOffX + dx, y: dragRef.current.startOffY + dy });
    }
  }

  function onPointerUp() {
    setIsDragging(false);
    if (dragRef.current.moved && buttonRef.current) {
      // Clamp to viewport
      const rect = buttonRef.current.getBoundingClientRect();
      const margin = 20;
      let adjX = 0, adjY = 0;
      if (rect.left < margin) adjX = margin - rect.left;
      if (rect.top < margin) adjY = margin - rect.top;
      if (rect.right > window.innerWidth - margin) adjX = window.innerWidth - margin - rect.right;
      if (rect.bottom > window.innerHeight - margin) adjY = window.innerHeight - margin - rect.bottom;
      if (adjX !== 0 || adjY !== 0) {
        setDragOffset(prev => prev ? { x: prev.x + adjX, y: prev.y + adjY } : null);
      }
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const buttonBaseClass = cn(
    "h-9 w-9 sm:h-10 sm:w-10",
    "text-[#1A1A1A] hover:text-[#B89555]",
    "transition-colors duration-200",
    "focus:outline-none focus-visible:ring-1 focus-visible:ring-[#B89555]/60 rounded-sm",
    "flex items-center justify-center",
    "pointer-events-auto select-none touch-manipulation cursor-pointer",
    "drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
  );

  // Hide when chat is open, or when user hasn't scrolled far enough yet.
  if (isChatOpen) return null;
  if (supportDrawerOpen) return null;
  if (!showScrollTop) return null;

  const transform = dragOffset ? `translate(${dragOffset.x}px, ${dragOffset.y}px)` : undefined;

  return (
    <div 
      ref={(node) => {
        (buttonRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      className={cn(
        "fixed z-[10049] flex flex-col gap-2 transform-gpu",
        // Stacks above voice concierge pill (which sits at bottom-[148px] + ~52px).
        isChatMedium ? "bottom-[280px]" : "bottom-[216px]",
        "pointer-events-auto",
        isRTL ? "left-4" : "right-6"
      )}
      style={{ 
        transform, 
        transition: isDragging ? 'none' : 'transform 0.2s ease', 
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: "manipulation" 
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <button
        type="button"
        onClick={(e) => { if (!dragRef.current.moved) scrollToTop(); e.stopPropagation(); }}
        className={buttonBaseClass}
        aria-label="Scroll to top"
      >
        <ArrowUp className="w-5 h-5" strokeWidth={1.75} />
      </button>
    </div>
  );
});

PageNavigation.displayName = 'PageNavigation';

export default PageNavigation;
