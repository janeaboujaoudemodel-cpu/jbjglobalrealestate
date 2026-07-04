import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import type { WheelEvent } from "react";
import { Link } from "react-router-dom";
import { LucideIcon, List, ChevronDown, ChevronUp, HelpCircle, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { scrollToId } from "@/lib/scroll";

interface TOCItem {
  id: string;
  title: string;
  icon?: LucideIcon;
}

interface CTAAction {
  label: string;
  href: string;
  icon?: LucideIcon;
}

interface GuideTableOfContentsProps {
  items: TOCItem[];
  title?: string;
  sticky?: boolean;
  ctaAction?: CTAAction;
}

const TOOLTIP_DISMISSED_KEY = "jbj_guide_nav_tooltip_dismissed";

export const GuideTableOfContents = ({ 
  items, 
  title = "In This Guide",
  sticky = true,
  ctaAction
}: GuideTableOfContentsProps) => {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    const hero = document.querySelector('[data-guide-hero]') as HTMLElement | null;
    if (!hero) {
      setPastHero(true);
      return;
    }
    const check = () => {
      const rect = hero.getBoundingClientRect();
      // Reveal only once the hero is mostly scrolled past (bottom edge above ~120px from top)
      setPastHero(rect.bottom < 120);
    };
    check();
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, []);


  const passBoundaryWheelToPage = (event: WheelEvent<HTMLElement>) => {
    const target = event.currentTarget;
    const hasLocalScroll = target.scrollHeight > target.clientHeight + 2;
    const atTop = target.scrollTop <= 0;
    const atBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 2;
    if (!hasLocalScroll || (event.deltaY < 0 && atTop) || (event.deltaY > 0 && atBottom)) {
      event.preventDefault();
      window.scrollBy({ top: event.deltaY, behavior: "auto" });
    }
  };

  useEffect(() => {
    // Check if tooltip was already dismissed
    const dismissed = localStorage.getItem(TOOLTIP_DISMISSED_KEY);
    if (!dismissed) {
      // Show tooltip after a short delay
      const timer = setTimeout(() => setShowTooltip(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Skip observer updates during programmatic scroll
        if (isScrollingRef.current) return;
        
        // Find all currently intersecting sections
        const visibleEntries = entries.filter(entry => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          // Get the section closest to the top of the viewport (but still visible)
          const sorted = visibleEntries.sort((a, b) => {
            const aTop = a.boundingClientRect.top;
            const bTop = b.boundingClientRect.top;
            return aTop - bTop;
          });
          // Pick the first one that's at or below the header area
          const bestEntry = sorted.find(entry => entry.boundingClientRect.top >= -50) || sorted[0];
          if (bestEntry) {
            setActiveId(bestEntry.target.id);
          }
        }
      },
      {
        rootMargin: "-112px 0px -58% 0px",
        threshold: [0, 0.1, 0.25, 0.5]
      }
    );

    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [items]);

  const scrollToSection = (id: string) => {
    // Lock observer during scroll and set active immediately
    isScrollingRef.current = true;
    setActiveId(id);
    
    scrollToId(id, { extraOffset: 20 });

    setTimeout(() => {
      isScrollingRef.current = false;
    }, 650);
  };

  const handleDismissTooltip = () => {
    setShowTooltip(false);
    localStorage.setItem(TOOLTIP_DISMISSED_KEY, "true");
  };

  return (
    <div
      className={cn(
        "fixed right-4 top-28 z-[80] hidden w-60 lg:block xl:right-6 xl:w-64 transition-opacity duration-300",
        pastHero ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}
      aria-hidden={!pastHero}
      data-guide-toc
      data-surface="emerald"
      data-premium-navigator
    >
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute right-full mr-4 top-0 w-64 z-50"
          >
            <div data-guide-tooltip data-surface="emerald" className="bg-[image:var(--jj-emerald-ombre)] border border-white/15 rounded-xl p-4 shadow-xl">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm mb-1">Quick Navigation</h4>
                  <p className="text-white/80 text-xs leading-relaxed">
                    Click any section button to jump directly to that part of the guide. The active section is highlighted in emerald.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleDismissTooltip}
                size="sm"
                variant="primary"
                data-guide-tooltip-button
                className="w-full text-xs"
              >
                I Understand
              </Button>
            </div>
            {/* Arrow pointing to nav */}
            <div className="absolute top-4 -right-2 w-0 h-0 border-t-8 border-b-8 border-l-8 border-transparent border-l-[#064E3B]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main TOC Container - fixed position with emerald scrollbar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        data-surface="emerald"
        className="bg-[image:var(--jj-emerald-ombre)] border border-white/15 rounded-2xl overflow-hidden shadow-[0_18px_40px_rgba(0,0,0,0.28)] max-h-[52dvh] flex flex-col jj-scrollbar-emerald"
      >
        {/* Header with minimize button */}
        <div data-guide-toc-header data-surface="emerald" className="flex items-center justify-between p-3 border-b border-white/15 bg-black/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <List className="w-5 h-5 text-white" />
            <h3 className="text-white font-semibold">{title}</h3>
          </div>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
              data-surface="emerald"
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/15 flex items-center justify-center transition-colors"
            aria-label={isMinimized ? "Expand navigation" : "Minimize navigation"}
          >
            {isMinimized ? (
              <ChevronDown className="w-4 h-4 text-white" />
            ) : (
              <ChevronUp className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
        
        {/* Collapsible content — stable scroll box; active rows never resize the container */}
        <AnimatePresence initial={false}>
          {!isMinimized && (
            <motion.nav
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              onWheel={passBoundaryWheelToPage}
              data-surface="emerald"
              className="p-2.5 space-y-1 overflow-y-auto overscroll-contain min-h-0 flex-1 jj-scrollbar-emerald"
            >
              {items.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  data-surface="emerald"
                  data-toc-item
                  data-toc-state={activeId === item.id ? "active" : "inactive"}
                  className={cn(
                    "w-full grid grid-cols-[1.75rem_1rem_minmax(0,1fr)] items-center gap-2.5 px-2.5 py-2.5 min-h-11 rounded-xl text-left text-sm transition-colors border box-border overflow-hidden",
                    activeId === item.id
                      ? "bg-white/12 text-white font-semibold border-white/10"
                      : "text-white hover:text-white hover:bg-white/10 border-transparent"
                  )}
                >
                  <span data-toc-number className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold",
                    activeId === item.id
                      ? "bg-white/15 text-white border border-white/20"
                      : "bg-black/15 text-white border border-white/10"
                  )}>
                    {index + 1}
                  </span>
                  {item.icon && <item.icon data-toc-icon className={cn(
                    "w-4 h-4",
                    "text-white"
                  )} />}
                  {!item.icon && <span aria-hidden />}
                  <span data-toc-label className="min-w-0 leading-snug">{item.title}</span>
                </button>
              ))}
              
              {/* CTA Action Button - Premium 3D Glow Style */}
              {ctaAction && (
                <Link to={ctaAction.href} className="block mt-4">
                  <Button 
                    variant="primary"
                    data-surface="emerald"
                    className="w-full relative py-3 mi-cta-emerald"
                  >
                    {ctaAction.icon && <ctaAction.icon className="w-4 h-4 mr-2" />}
                    <span>{ctaAction.label}</span>
                    <ArrowUpRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              )}
            </motion.nav>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default GuideTableOfContents;
