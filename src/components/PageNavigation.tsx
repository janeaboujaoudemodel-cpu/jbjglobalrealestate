import { useEffect, useState, useCallback, useContext, forwardRef } from "react";
import { ChevronsUp, ChevronsDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { LanguageContext } from "@/contexts/LanguageContext";

interface PageNavigationProps {
  isChatOpen?: boolean;
  isChatMedium?: boolean;
}

/**
 * Premium emerald triple-chevron page-direction button.
 * - Shows ⇣ (jump to bottom) when user is in the top half.
 * - Shows ⇡ (back to top) when user is past the top half.
 * - Emerald pill + white glyph at both states, with hover glow.
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
    // Hide arrow while user is still inside the hero (first viewport).
    // Reveal once they've scrolled past ~70% of the first screen.
    const pastHero = scrollY > viewport * 0.7;
    setVisible(maxScroll > 120 && pastHero);
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

  const Icon = direction === "up" ? ChevronsUp : ChevronsDown;
  const label = direction === "up" ? "Scroll to top" : "Scroll to bottom";

  return (
    <div
      ref={ref}
      className={cn(
        // Always clear of the vertical sidebar at every viewport.
        // Mobile (<sm): sidebar hidden → 16px gutter.
        // sm+ collapsed sidebar = 48px → 64px from edge.
        // sm+ expanded sidebar = 200px → 216px from edge.
        "fixed z-[55] pointer-events-auto bottom-5 md:bottom-6 jj-page-nav-anchor",
        isRTL ? "jj-page-nav-anchor--right" : "jj-page-nav-anchor--left",
      )}
    >
      <button
        type="button"
        onClick={handleClick}
        aria-label={label}
        title={label}
        data-jj-page-nav-arrow
        data-on-dark
        data-allow-dark-cta
        className={cn(
          "allow-white group inline-flex items-center justify-center h-10 w-10 rounded-full !text-white",
          "transition-all duration-300 hover:-translate-y-1 active:scale-95",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#34D399]/70",
        )}
        style={{
          backgroundImage: "linear-gradient(135deg, #064E3B 0%, #042c1c 58%, #000000 100%)",
          border: "1px solid rgba(52,211,153,0.55)",
          boxShadow:
            "0 12px 28px -10px rgba(6,78,59,0.55), 0 0 0 1px rgba(52,211,153,0.20), 0 0 18px rgba(52,211,153,0.30)",
          color: "#FFFFFF",
        }}
      >
        <Icon
          className="h-5 w-5 allow-white !text-white transition-transform duration-300 group-hover:scale-110"
          strokeWidth={2.5}
          style={{ color: "#FFFFFF", stroke: "#FFFFFF" }}
        />
      </button>
    </div>
  );
});

PageNavigation.displayName = "PageNavigation";

export default PageNavigation;
