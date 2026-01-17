import { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function getRouteString(loc: { pathname: string; search: string; hash: string }) {
  return `${loc.pathname}${loc.search}${loc.hash}`;
}

export default function PageNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(true);
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

  const buttonBaseClass = cn(
    "h-10 w-10 rounded-full shadow-lg transition-all duration-300",
    "bg-white backdrop-blur-md border-2 border-gold",
    "hover:bg-gold/10 hover:shadow-[0_4px_20px_hsl(45_32%_39%_/_0.4)]",
    "focus:ring-2 focus:ring-gold focus:ring-offset-2"
  );

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2">
      {/* Scroll to Top */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={scrollToTop}
        className={cn(
          buttonBaseClass,
          "transition-opacity",
          showScrollTop ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        aria-label="Scroll to top"
      >
        <ArrowUp className="w-4 h-4 text-gold" />
      </Button>

      {/* Back to Previous Page */}
      {hasPrevious && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => navigate(previous)}
          className={buttonBaseClass}
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4 text-gold" />
        </Button>
      )}

      {/* Scroll to Bottom */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={scrollToBottom}
        className={cn(
          buttonBaseClass,
          "transition-opacity",
          showScrollBottom ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        aria-label="Scroll to bottom"
      >
        <ArrowDown className="w-4 h-4 text-gold" />
      </Button>
    </div>
  );
}
