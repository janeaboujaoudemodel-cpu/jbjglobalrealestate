import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
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
  const isScrollingRef = useRef(false);

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

  return (
    <div className="surface-light fixed right-4 lg:right-6 top-24 z-40 w-64 lg:w-72" data-surface="light">
      {/* Main TOC Container — internal scroll, stable active rows, sticky CTA footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden shadow-[0_18px_40px_rgba(0,0,0,0.18)] max-h-[calc(100dvh-8rem)] border bg-[#FDFBF7] border-white/30 flex flex-col"
      >
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/20 bg-[image:var(--jj-emerald-ombre)] flex-shrink-0">
          <div className="flex items-center gap-2">
            <List className="w-4 h-4 text-white" />
            <h3 className="text-sm font-semibold leading-snug text-white">{title}</h3>
          </div>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors bg-white/10 hover:bg-white/15"
            aria-label={isMinimized ? "Expand navigation" : "Minimize navigation"}
          >
            {isMinimized ? (
              <ChevronDown className="w-4 h-4 text-white" />
            ) : (
              <ChevronUp className="w-4 h-4 text-white" />
            )}
          </button>
        </div>

        {/* Collapsible content */}
        <AnimatePresence initial={false}>
          {!isMinimized && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col min-h-0 flex-1"
            >
              <nav className="px-2.5 py-2.5 space-y-1 overflow-y-auto overscroll-contain flex-1 min-h-0 jj-scrollbar-emerald">
                {items.map((item, index) => {
                  const isActive = activeId === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      data-surface={isActive ? "emerald" : "light"}
                      data-allow-white={isActive ? "true" : undefined}
                      data-no-contrast-guard
                      className={cn(
                        "w-full grid grid-cols-[1.75rem_1rem_minmax(0,1fr)] items-center gap-2.5 px-2.5 py-2.5 min-h-11 rounded-xl text-left transition-colors border text-[13px]",
                        isActive
                          ? "font-semibold shadow-sm border-white/20"
                          : "border-transparent bg-transparent hover:bg-[#064E3B]/8"
                      )}
                      style={
                        isActive
                          ? {
                              backgroundImage: 'var(--jj-emerald-ombre, linear-gradient(135deg,#0B5132 0%,#0F6B43 100%))',
                              color: '#FFFFFF',
                              WebkitTextFillColor: '#FFFFFF',
                            }
                          : { color: '#1A1A1A', WebkitTextFillColor: '#1A1A1A' }
                      }
                    >
                      <span
                        data-no-contrast-guard
                        className={cn(
                          "h-7 w-7 rounded-lg flex items-center justify-center text-[11px] font-bold leading-none",
                          isActive
                            ? "bg-white/12 text-white border border-white/35"
                            : "bg-[image:var(--jj-emerald-ombre)] text-white border border-white/25"
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
                          className="w-4 h-4 flex-shrink-0"
                          style={{ color: isActive ? '#FFFFFF' : '#064E3B', stroke: isActive ? '#FFFFFF' : '#064E3B' }}
                        />
                      )}
                      {!item.icon && <span aria-hidden />}
                      <span
                        className="min-w-0 leading-snug"
                        style={{ color: isActive ? '#FFFFFF' : '#1A1A1A', WebkitTextFillColor: isActive ? '#FFFFFF' : '#1A1A1A' }}
                      >
                        {item.title}
                      </span>
                    </button>
                  );
                })}

              </nav>

              {/* Sticky CTA footer — never cropped */}
              {ctaAction && (
                <div className="border-t border-white/20 p-2.5 bg-[#FDFBF7] flex-shrink-0">
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
    </div>
  );
};

export default MarketIntelligenceTableOfContents;
