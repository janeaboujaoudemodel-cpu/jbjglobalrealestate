import { useEffect, useState, useCallback, useContext, forwardRef } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { LanguageContext } from "@/contexts/LanguageContext";

interface PageNavigationProps {
  isChatOpen?: boolean;
  isChatMedium?: boolean;
}

/**
 * Floating gold arrow that scrolls to the top or bottom of the page.
 * - Shows ↓ (jump to bottom) when user is in the top half.
 * - Shows ↑ (back to top) when user is past the top half.
 * - Non-draggable (per global rule), pinned bottom-right.
 * - Auto-hides when chat / concierge / support drawers are open.
 */
const PageNavigation = forwardRef<HTMLDivElement, PageNavigationProps>(({ isChatOpen = false }, ref) => {
  const languageContext = useContext(LanguageContext);
  const isRTL = languageContext?.isRTL ?? false;
  const [direction, setDirection] = useState<"down" | "up">("down");
  const [visible, setVisible] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const recompute = useCallback(() => {
    const scrollY = window.scrollY;
    const viewport = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    const maxScroll = Math.max(docHeight - viewport, 0);
    setVisible(maxScroll > 120);
    setDirection(scrollY > maxScroll * 0.5 ? "up" : "down");
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", recompute, { passive: true });
    window.addEventListener("resize", recompute);
    recompute();
    const t = setTimeout(recompute, 400);
    return () => {
      window.removeEventListener("scroll", recompute);
      window.removeEventListener("resize", recompute);
      clearTimeout(t);
    };
  }, [recompute]);

  useEffect(() => {
    const check = () => {
      setDrawerOpen(
        !!document.querySelector('[data-jbj-concierge-open="true"]') ||
          !!document.querySelector('[data-jbj-chat-open="true"]') ||
          !!document.querySelector('[data-jbj-support-open="true"]'),
      );
    };
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.body, {
      attributes: true,
      subtree: true,
      attributeFilter: ["data-jbj-concierge-open", "data-jbj-chat-open", "data-jbj-support-open"],
    });
    return () => obs.disconnect();
  }, []);

  if (isChatOpen || drawerOpen || !visible) return null;

  const handleClick = () => {
    if (direction === "up") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
    }
  };

  const Icon = direction === "up" ? ArrowUp : ArrowDown;
  const label = direction === "up" ? "Scroll to top" : "Scroll to bottom";

  return (
    <div
      ref={ref}
      className={cn(
        // Aligned under the right-edge "Talk to us" stack, nudged down + right
        "fixed bottom-16 z-[55] pointer-events-auto",
        isRTL ? "left-3" : "right-3",
      )}
      data-no-contrast-guard
    >
      <button
        type="button"
        onClick={handleClick}
        aria-label={label}
        title={label}
        className={cn(
          "group inline-flex items-center justify-center h-9 w-9 bg-transparent border-0 shadow-none p-0",
          "text-[#B89555] hover:text-[#1A1A1A]",
          "transition-all duration-200 hover:-translate-y-[1px] active:scale-95",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B89555]/70 rounded-sm",
        )}
      >
        <Icon
          className="h-6 w-6 transition-transform duration-200 group-hover:scale-110"
          strokeWidth={2.5}
          data-no-contrast-guard
        />
      </button>
    </div>
  );
});

PageNavigation.displayName = "PageNavigation";

export default PageNavigation;
