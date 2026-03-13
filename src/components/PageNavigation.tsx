import { useEffect, useState, useCallback, useContext, forwardRef } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { LanguageContext } from "@/contexts/LanguageContext";

const PageNavigation = forwardRef<HTMLDivElement, Record<string, never>>((_, ref) => {
  const languageContext = useContext(LanguageContext);
  const isRTL = languageContext?.isRTL ?? false;
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(true);

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;
    const isScrollable = scrollHeight > clientHeight + 50;
    
    setShowScrollTop(scrollTop > 200);
    // Show down arrow only if page is actually scrollable and not at bottom
    setShowScrollBottom(isScrollable && scrollTop + clientHeight < scrollHeight - 100);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
  };

  const buttonBaseClass = cn(
    "h-10 w-10 sm:h-12 sm:w-12 rounded-full",
    "bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark",
    "border-2 border-gold/70",
    "shadow-lg transition-all duration-300",
    "hover:border-gold hover:shadow-[0_6px_26px_hsl(var(--gold)_/_0.45)]",
    "focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2",
    "flex items-center justify-center",
    "pointer-events-auto select-none touch-manipulation cursor-pointer"
  );

  // Show only one arrow at a time: up when scrolled down, down when at top
  const showUp = showScrollTop;
  const showDown = !showScrollTop && showScrollBottom;

  if (!showUp && !showDown) return null;

  return (
    <div 
      ref={ref}
      className={cn(
        "fixed bottom-24 z-[9995] flex flex-col gap-2",
        "pointer-events-auto",
        isRTL ? "left-4" : "left-4"
      )}
      style={{ touchAction: "manipulation" }}
    >
      {showUp && (
        <button
          type="button"
          onClick={scrollToTop}
          className={buttonBaseClass}
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5 text-black" />
        </button>
      )}

      {showDown && (
        <button
          type="button"
          onClick={scrollToBottom}
          className={buttonBaseClass}
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="w-5 h-5 text-black" />
        </button>
      )}
    </div>
  );
});

PageNavigation.displayName = 'PageNavigation';

export default PageNavigation;
