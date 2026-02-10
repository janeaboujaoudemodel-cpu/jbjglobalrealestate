import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const isScrollingRef = useRef(false);

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
        // Smaller top margin to detect sections earlier when scrolling down
        rootMargin: "-80px 0px -60% 0px", 
        threshold: [0, 0.1, 0.2, 0.3] 
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
    
    // Use a larger offset to ensure section header is clearly visible
    scrollToId(id, { extraOffset: 40 });

    // Re-enable observer after scroll animation completes (longer delay for reliability)
    setTimeout(() => {
      isScrollingRef.current = false;
    }, 1200);
  };

  const handleDismissTooltip = () => {
    setShowTooltip(false);
    localStorage.setItem(TOOLTIP_DISMISSED_KEY, "true");
  };

  return (
    <div className="fixed right-4 lg:right-8 top-32 z-40 w-64 lg:w-72">
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute right-full mr-4 top-0 w-64 z-50"
          >
            <div className="bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-gold/30 rounded-xl p-4 shadow-xl">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 bg-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <h4 className="font-semibold text-black text-sm mb-1">Quick Navigation</h4>
                  <p className="text-zinc-600 text-xs leading-relaxed">
                    Click any section button to jump directly to that part of the guide. The active section is highlighted in gold.
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
            {/* Arrow pointing to nav */}
            <div className="absolute top-4 -right-2 w-0 h-0 border-t-8 border-b-8 border-l-8 border-transparent border-l-[#E8DCC8]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main TOC Container - Fixed position with visible gold scrollbar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-gold/30 rounded-xl overflow-hidden shadow-lg max-h-[calc(100vh-200px)] jj-scrollbar-gold"
      >
        {/* Header with minimize button */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 bg-gradient-to-r from-gold/5 to-transparent">
          <div className="flex items-center gap-2">
            <List className="w-5 h-5 text-gold" />
            <h3 className="text-black font-semibold">{title}</h3>
          </div>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="w-8 h-8 rounded-lg bg-zinc-100 hover:bg-gold/10 flex items-center justify-center transition-colors"
            aria-label={isMinimized ? "Expand navigation" : "Minimize navigation"}
          >
            {isMinimized ? (
              <ChevronDown className="w-4 h-4 text-zinc-600" />
            ) : (
              <ChevronUp className="w-4 h-4 text-zinc-600" />
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
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all",
                    activeId === item.id
                      ? "bg-gradient-to-r from-champagne-light via-champagne to-champagne-dark text-black font-medium shadow-md border border-gold/40"
                      : "text-zinc-600 hover:text-black hover:bg-gold/10 border border-transparent hover:border-gold/30"
                  )}
                >
                  <span className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                    activeId === item.id
                      ? "bg-black text-gold"
                      : "bg-gold/10 text-gold"
                  )}>
                    {index + 1}
                  </span>
                  {item.icon && <item.icon className={cn(
                    "w-4 h-4",
                    activeId === item.id ? "text-black" : "text-gold"
                  )} />}
                  <span className="flex-1">{item.title}</span>
                </button>
              ))}
              
              {/* CTA Action Button - Premium 3D Glow Style */}
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

export default GuideTableOfContents;
