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
  const [activeId, setActiveId] = useState<string | null>(null);
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
        rootMargin: "-140px 0px -50% 0px",
        threshold: [0, 0.25, 0.5],
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

    scrollToId(id, { extraOffset: 8, behavior: "auto" });

    setTimeout(() => {
      isScrollingRef.current = false;
    }, 120);
  };

  return (
    <div className="surface-light fixed right-4 lg:right-6 top-28 z-40 w-60 lg:w-64" data-surface="light">
      {/* Main TOC Container — capped to half viewport, internal scroll, sticky CTA footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl overflow-hidden shadow-lg max-h-[50vh] border bg-[#FDFBF7] border-[#B89555]/30 flex flex-col"
      >
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#B89555]/25 bg-[#F7F2EA] flex-shrink-0">
          <div className="flex items-center gap-2">
            <List className="w-4 h-4 text-[#1A1A1A]" />
            <h3 className="text-sm font-semibold leading-snug text-[#1A1A1A]">{title}</h3>
          </div>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[#EFE6D6]"
            aria-label={isMinimized ? "Expand navigation" : "Minimize navigation"}
          >
            {isMinimized ? (
              <ChevronDown className="w-4 h-4 text-[#1A1A1A]" />
            ) : (
              <ChevronUp className="w-4 h-4 text-[#1A1A1A]" />
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
              <nav className="px-2 py-2 space-y-0.5 overflow-y-auto flex-1 min-h-0">
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
                        "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left transition-all border text-[13px]",
                        isActive
                          ? "font-semibold shadow-sm border-transparent"
                          : "border-transparent bg-transparent hover:bg-[#EFE6D6]/60"
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
                          "h-6 w-6 rounded-md flex items-center justify-center text-[11px] font-bold flex-shrink-0 leading-none",
                          isActive
                            ? "bg-[#FDFBF7] text-[#0B5132] border border-[#B89555]"
                            : "bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/30"
                        )}
                        style={
                          isActive
                            ? { color: '#0B5132', WebkitTextFillColor: '#0B5132' }
                            : { color: '#1A1A1A', WebkitTextFillColor: '#1A1A1A' }
                        }
                      >
                        {index + 1}
                      </span>
                      {item.icon && (
                        <item.icon
                          className="w-3.5 h-3.5 flex-shrink-0"
                          style={{ color: isActive ? '#FFFFFF' : '#1A1A1A', stroke: isActive ? '#FFFFFF' : '#1A1A1A' }}
                        />
                      )}
                      <span
                        className="flex-1 truncate"
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
                <div className="border-t border-[#B89555]/25 p-2.5 bg-[#FDFBF7] flex-shrink-0">
                  <Link to={ctaAction.href} className="block">
                    <Button variant="primary" size="sm" className="w-full">
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
