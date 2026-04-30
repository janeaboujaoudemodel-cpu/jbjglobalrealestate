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
  MI_TOC_ITEM,
  MI_CHIP,
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
  ctaAction
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
        
        const visibleEntries = entries.filter(entry => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          const sorted = visibleEntries.sort((a, b) => {
            return a.boundingClientRect.top - b.boundingClientRect.top;
          });
          const bestEntry = sorted.find(entry => entry.boundingClientRect.top >= -100) || sorted[0];
          if (bestEntry) {
            setActiveId(bestEntry.target.id);
          }
        }
      },
      { 
        rootMargin: "-140px 0px -50% 0px",
        threshold: [0, 0.25, 0.5]
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
    
    scrollToId(id, { extraOffset: 20 });

    setTimeout(() => {
      isScrollingRef.current = false;
    }, 900);
  };

  const handleDismissTooltip = () => {
    setShowTooltip(false);
    localStorage.setItem(TOOLTIP_DISMISSED_KEY, "true");
  };

  return (
    <div className="surface-light fixed right-4 lg:right-8 top-32 z-40 w-64 lg:w-72" data-surface="light">
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute right-full mr-4 top-0 w-64 z-50"
          >
            <div className="rounded-xl p-4 shadow-xl border bg-card border-border">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-foreground">
                  <HelpCircle className="w-4 h-4 text-background" />
                </div>
                <div>
                  <h4 className={`${MI_H4} mb-1`}>Quick Navigation</h4>
                  <p className={MI_CAPTION}>
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
            <div className="absolute top-4 -right-2 w-0 h-0 border-t-8 border-b-8 border-l-8 border-transparent border-l-card" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main TOC Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl overflow-hidden shadow-lg max-h-[calc(100vh-200px)] border bg-card border-border"
      >
        <div className="flex items-center justify-between p-4 border-b bg-muted border-border">
          <div className="flex items-center gap-2">
            <List className="w-5 h-5 text-foreground" />
            <h3 className="text-base font-semibold leading-snug text-foreground">{title}</h3>
          </div>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-muted hover:bg-accent"
            aria-label={isMinimized ? "Expand navigation" : "Minimize navigation"}
          >
            {isMinimized ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>
        
        {/* Collapsible content */}
        <AnimatePresence>
          {!isMinimized && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-3 space-y-1 overflow-y-auto"
            >
              {items.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all border",
                    MI_TOC_ITEM,
                    activeId === item.id
                      ? "font-semibold shadow-sm bg-foreground text-background border-foreground"
                      : "border-transparent text-muted-foreground bg-transparent hover:bg-accent"
                  )}
                >
                  <span className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center",
                    MI_CHIP,
                    activeId === item.id
                      ? "bg-background text-foreground"
                      : "bg-muted text-foreground"
                  )}>
                    {index + 1}
                  </span>
                  {item.icon && <item.icon className="w-4 h-4" />}
                  <span className="flex-1">{item.title}</span>
                </button>
              ))}
              
              {/* CTA Action Button */}
              {ctaAction && (
                <Link to={ctaAction.href} className="block mt-4">
                  <Button 
                    variant="primary"
                    className="w-full relative py-3 shadow-[0_4px_20px_rgba(200,167,102,0.3),0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_25px_rgba(200,167,102,0.5),0_10px_40px_rgba(0,0,0,0.2)] hover:scale-[1.02] transition-all duration-300"
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

export default MarketIntelligenceTableOfContents;
