import { useEffect, useMemo, useState, useCallback, useContext, forwardRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { LanguageContext } from "@/contexts/LanguageContext";

function getRouteString(loc: { pathname: string; search: string; hash: string }) {
  return `${loc.pathname}${loc.search}${loc.hash}`;
}

const PageNavigation = forwardRef<HTMLDivElement, Record<string, never>>((_, ref) => {
  const location = useLocation();
  const navigate = useNavigate();
  // Safe access - fallback to LTR if context not available
  const languageContext = useContext(LanguageContext);
  const isRTL = languageContext?.isRTL ?? false;
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(true);
  const isStampGenerator = location.pathname.includes('/stamp-generator/');
  const [stack, setStack] = useState<string[]>(() => {
    try {
      const raw = sessionStorage.getItem("nav-stack");
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      return Array.isArray(parsed) ? (parsed.filter((v) => typeof v === "string") as string[]) : [];
    } catch {
      return [];
    }
  });

  const current = useMemo(
    () => getRouteString({ pathname: location.pathname, search: location.search, hash: location.hash }),
    [location.pathname, location.search, location.hash]
  );

  useEffect(() => {
    setStack((prev) => {
      const next = prev.length && prev[prev.length - 1] === current ? prev : [...prev, current];
      const trimmed = next.slice(-20);
      try {
        sessionStorage.setItem("nav-stack", JSON.stringify(trimmed));
      } catch {
        // ignore
      }
      return trimmed;
    });
  }, [current]);

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;
    
    setShowScrollTop(scrollTop > 200);
    setShowScrollBottom(scrollTop + clientHeight < scrollHeight - 100);
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

  const previous = stack.length >= 2 ? stack[stack.length - 2] : null;
  const hasPrevious = previous && previous !== current;

  // Always allow going back - fallback to browser history or home
  const handleGoBack = useCallback(() => {
    if (hasPrevious && previous) {
      navigate(previous);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  }, [hasPrevious, previous, navigate]);

  // NOTE: We intentionally use native <button> here.
  // The global <Button /> component sanitizes bg/gradient classes by design,
  // which would strip the active champagne fill.
  const buttonBaseClass = cn(
    "h-10 w-10 sm:h-12 sm:w-12 rounded-full",
    "bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark",
    "border-2 border-gold/70",
    "shadow-lg transition-all duration-300",
    // Hover keeps same fill; only border/shadow intensity changes
    "hover:border-gold hover:shadow-[0_6px_26px_hsl(var(--gold)_/_0.45)]",
    "focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2",
    "flex items-center justify-center",
    // CRITICAL: Ensure clickability
    "pointer-events-auto select-none touch-manipulation cursor-pointer"
  );

  return (
    <div 
      ref={ref}
      className={cn(
        // Below popups/modals but above regular content
        "fixed bottom-20 sm:bottom-6 z-[9990] flex flex-col gap-2 sm:gap-3",
        // Explicit pointer-events-auto on container
        "pointer-events-auto",
        isRTL ? "right-6" : "left-6 lg:left-auto lg:right-6"
      )}
      style={{ touchAction: "manipulation" }}
    >
      {/* Scroll to Top */}
      <button
        type="button"
        onClick={scrollToTop}
        className={cn(
          buttonBaseClass,
          "transition-opacity duration-200",
          showScrollTop ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        aria-label="Scroll to top"
      >
        <ArrowUp className="w-5 h-5 text-black" />
      </button>

      {/* Back to Previous Page - ALWAYS SHOW (no longer conditional) */}
      <button
        type="button"
        onClick={handleGoBack}
        className={buttonBaseClass}
        aria-label="Go back"
      >
        {isRTL ? <ArrowRight className="w-5 h-5 text-black" /> : <ArrowLeft className="w-5 h-5 text-black" />}
      </button>

      {/* Scroll to Bottom — hidden on stamp-generator routes */}
      {!isStampGenerator && (
        <button
          type="button"
          onClick={scrollToBottom}
          className={cn(
            buttonBaseClass,
            "transition-opacity duration-200",
            showScrollBottom ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
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
