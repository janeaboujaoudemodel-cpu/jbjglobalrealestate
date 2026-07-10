import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import type { WheelEvent } from "react";
import { Link } from "react-router-dom";
import { LucideIcon, List, ChevronDown, ChevronUp, ArrowUpRight } from "lucide-react";
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

interface MarketIntelligenceTableOfContentsProps {
  items: TOCItem[];
  title?: string;
  sticky?: boolean;
  ctaAction?: CTAAction;
}

export const MarketIntelligenceTableOfContents = ({
  items,
  title = "In This Section",
  sticky = true,
  ctaAction,
}: MarketIntelligenceTableOfContentsProps) => {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    const HERO_SEL = '[data-mi-hero], [data-guide-hero], [data-faq-hero], [data-premium-emerald-hero], [data-hero-dark]';
    let io: IntersectionObserver | null = null;
    let raf = 0;
    const attach = () => {
      const hero = document.querySelector(HERO_SEL) as HTMLElement | null;
      if (!hero) {
        // No hero found yet — retry a few frames, then default to visible.
        if (raf < 30) { raf++; requestAnimationFrame(attach); }
        else setPastHero(true);
        return;
      }
      io = new IntersectionObserver(
        (entries) => {
          const e = entries[0];
          // pastHero = hero no longer intersecting viewport (scrolled past).
          setPastHero(!e.isIntersecting);
        },
        { threshold: 0, rootMargin: "-8px 0px 0px 0px" }
      );
      io.observe(hero);
    };
    attach();
    return () => { io?.disconnect(); };
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
    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return;

        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          const sorted = visibleEntries.sort((a, b) => {
            return a.boundingClientRect.top - b.boundingClientRect.top;
          });
          const bestEntry = sorted.find((entry) => entry.boundingClientRect.top >= -100) || sorted[0];
          if (bestEntry) {
            setActiveId(bestEntry.target.id);
          }
        }
      },
      {
        rootMargin: "-112px 0px -58% 0px",
        threshold: [0, 0.1, 0.25, 0.5],
      }
    );

    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [items]);

  const scrollToSection = (id: string) => {
    isScrollingRef.current = true;
    setActiveId(id);

    scrollToId(id, { extraOffset: 20, behavior: "smooth" });

    setTimeout(() => {
      isScrollingRef.current = false;
    }, 650);
  };

  // Do not mount the TOC while the hero is still in view. Rendering + then
  // hiding via opacity is unreliable because global !important CSS forces
  // opacity:1 on emerald surfaces. Unmounting is the guaranteed hide.
  if (!pastHero) return null;

  return (
    <div
      className={cn(
        "fixed right-4 top-28 z-[80] hidden lg:block",
        isMinimized ? "w-auto" : "w-60 xl:right-6 xl:w-64"
      )}
      data-mi-toc
      data-premium-navigator
    >
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          data-surface="emerald"
          className="h-12 w-12 rounded-none bg-[image:var(--jj-emerald-ombre)] border border-white/15 shadow-[0_18px_40px_rgba(0,0,0,0.28)] flex items-center justify-center hover:scale-[1.03] transition-transform"
          aria-label="Expand navigation"
        >
          <ChevronDown className="w-5 h-5 text-white" />
        </button>
      ) : (
      /* Main TOC Container — internal scroll, stable active rows, sticky CTA footer */
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        data-surface="emerald"
        className="rounded-none overflow-hidden shadow-[0_18px_40px_rgba(0,0,0,0.28)] max-h-[56dvh] border border-white/15 bg-[image:var(--jj-emerald-ombre)] flex flex-col"
      >
        <div data-surface="emerald" className="flex items-center justify-between px-3 py-2.5 border-b border-white/15 bg-black/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <List className="w-4 h-4 text-white" />
            <h3 className="text-sm font-semibold leading-snug text-white">{title}</h3>
          </div>
          <button
            onClick={() => setIsMinimized(true)}
            data-surface="emerald"
            className="w-7 h-7 rounded-none flex items-center justify-center transition-colors bg-white/10 hover:bg-white/15"
            aria-label="Minimize navigation"
          >
            <ChevronUp className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Collapsible content — no height animation, so the internal list keeps a stable scroll box */}
        <AnimatePresence initial={false}>
          {!isMinimized && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="flex flex-col min-h-0 flex-1 overflow-hidden"
            >
              <nav onWheel={passBoundaryWheelToPage} className="px-2.5 py-2.5 space-y-1 overflow-y-auto overscroll-contain flex-1 min-h-0 jj-scrollbar-emerald bg-transparent">
                {items.map((item, index) => {
                  const isActive = activeId === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      data-toc-item
                      data-toc-state={isActive ? "active" : "inactive"}
                      data-surface="emerald"
                      data-allow-white="true"
                      data-no-contrast-guard
                      className={cn(
                        "w-full grid grid-cols-[1.75rem_1rem_minmax(0,1fr)] items-center gap-2.5 px-2.5 py-2.5 min-h-11 rounded-none text-left transition-colors border text-[13px] box-border overflow-hidden",
                        isActive
                          ? "font-semibold border-white/15 bg-white/12"
                          : "border-white/10 bg-black/10 hover:bg-white/10"
                      )}
                      style={
                        isActive
                          ? {
                              backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.08) 100%)',
                              color: '#FFFFFF',
                              WebkitTextFillColor: '#FFFFFF',
                            }
                          : {
                              backgroundImage: 'linear-gradient(135deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.08) 100%)',
                              color: '#FFFFFF',
                              WebkitTextFillColor: '#FFFFFF',
                            }
                      }
                    >
                      <span
                        data-toc-number
                        data-no-contrast-guard
                        className={cn(
                          "h-7 w-7 rounded-none flex items-center justify-center text-[11px] font-bold leading-none",
                          isActive
                            ? "bg-white/15 text-white border border-white/20"
                            : "bg-black/15 text-white border border-white/10"
                        )}
                        style={
                          isActive
                            ? { color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }
                            : { color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }
                        }
                      >
                        {index + 1}
                      </span>
                      {item.icon && (
                        <item.icon
                          data-toc-icon
                          className="w-4 h-4 flex-shrink-0"
                          style={{ color: '#FFFFFF', stroke: '#FFFFFF' }}
                        />
                      )}
                      {!item.icon && <span aria-hidden />}
                      <span
                        data-toc-label
                        className="min-w-0 leading-snug"
                        style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}
                      >
                        {item.title}
                      </span>
                    </button>
                  );
                })}

              </nav>

              {/* Sticky CTA footer — never cropped */}
              {ctaAction && (
                <div className="border-t border-white/15 p-2.5 bg-black/10 flex-shrink-0">
                  <Link to={ctaAction.href} className="block">
                    <Button variant="primary" size="sm" className="w-full mi-cta-emerald">
                      {ctaAction.icon && <ctaAction.icon className="w-3.5 h-3.5 mr-1.5" />}
                      <span className="text-xs">{ctaAction.label}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      )}
    </div>
  );
};

export default MarketIntelligenceTableOfContents;
