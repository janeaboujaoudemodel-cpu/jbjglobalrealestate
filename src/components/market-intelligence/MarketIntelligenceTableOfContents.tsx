import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { LucideIcon, List, ChevronDown, ChevronUp, HelpCircle, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { scrollToId } from "@/lib/scroll";
import {
  MI_H4,
  MI_CAPTION,
} from "./MarketIntelligenceTypography";

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

const TOOLTIP_DISMISSED_KEY = "jbj_market_intel_nav_tooltip_dismissed";

export const MarketIntelligenceTableOfContents = ({
  items,
  title = "In This Section",
  sticky = true,
  ctaAction,
}: MarketIntelligenceTableOfContentsProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(TOOLTIP_DISMISSED_KEY);
    if (!dismissed) {
      const timer = setTimeout(() => setShowTooltip(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

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

  const handleDismissTooltip = () => {
    setShowTooltip(false);
    localStorage.setItem(TOOLTIP_DISMISSED_KEY, "true");
  };

  return (
    <div className="surface-light fixed right-4 lg:right-6 top-28 z-40 w-60 lg:w-64" data-surface="light">
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute right-full mr-4 top-0 w-64 z-50"
          >
            <div className="rounded-xl p-4 shadow-xl border bg-[#FDFBF7] border-[#B89555]/40">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#1A1A1A]">
                  <HelpCircle className="w-4 h-4 text-white allow-white" />
                </div>
                <div>
                  <h4 className={`${MI_H4} mb-1 text-[#1A1A1A]`}>Quick Navigation</h4>
                  <p className={`${MI_CAPTION} text-[#1A1A1A]/70`}>
                    Click any section button to jump directly to that part of the page. The active section is highlighted.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleDismissTooltip}
                size="sm"
                variant="primary"
                className="w-full text-xs"
              >
                I Understand
              </Button>
            </div>
            <div className="absolute top-4 -right-2 w-0 h-0 border-t-8 border-b-8 border-l-8 border-transparent border-l-[#FDFBF7]" />
          </motion.div>
        )}
      </AnimatePresence>

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
                {items.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    data-surface={activeId === item.id ? "ink" : "light"}
                    data-no-contrast-guard={activeId === item.id ? "" : undefined}
                    className={cn(
                      "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left transition-all border text-[13px]",
                        activeId === item.id
                          ? "font-semibold shadow-sm bg-[#1A1A1A] text-white border-[#1A1A1A]"
                        : "border-transparent text-[#1A1A1A] bg-transparent hover:bg-[#EFE6D6]"
                    )}
                  >
                    <span
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0",
                        activeId === item.id
                          ? "bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]"
                          : "bg-[#EFE6D6] text-[#1A1A1A]"
                      )}
                    >
                      {index + 1}
                    </span>
                    {item.icon && <item.icon className="w-3.5 h-3.5" />}
                    <span className="flex-1 truncate">{item.title}</span>
                  </button>
                ))}
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
