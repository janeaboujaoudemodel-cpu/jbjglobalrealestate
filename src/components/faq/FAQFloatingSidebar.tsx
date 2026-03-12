import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { LucideIcon, List, ChevronDown, ChevronUp, HelpCircle, Search, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { scrollToId } from "@/lib/scroll";

interface FAQCategory {
  id: string;
  title: string;
  icon: LucideIcon;
  questions: Array<{ question: string; answer: string }>;
}

interface FAQFloatingSidebarProps {
  categories: FAQCategory[];
  title?: string;
}

const TOOLTIP_DISMISSED_KEY = "jbj_faq_nav_tooltip_dismissed";

export const FAQFloatingSidebar = ({ 
  categories, 
  title = "Navigator"
}: FAQFloatingSidebarProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    // Check if tooltip was already dismissed
    const dismissed = localStorage.getItem(TOOLTIP_DISMISSED_KEY);
    if (!dismissed) {
      // Show tooltip after a short delay
      const timer = setTimeout(() => setShowTooltip(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Skip observer updates during programmatic scroll
        if (isScrollingRef.current) return;
        
        const visibleEntries = entries.filter(entry => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          // Sort by top position to get the topmost visible section
          const sorted = visibleEntries.sort((a, b) => {
            return a.boundingClientRect.top - b.boundingClientRect.top;
          });
          const bestEntry = sorted.find(entry => entry.boundingClientRect.top >= -100) || sorted[0];
          if (bestEntry) {
            setActiveId(bestEntry.target.id);
          }
        }
      },
      { rootMargin: "-140px 0px -50% 0px", threshold: [0, 0.25, 0.5] }
    );

    categories.forEach((_, index) => {
      const element = document.getElementById(`category-${index}`);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [categories]);

  const scrollToSection = (id: string) => {
    // Lock observer during scroll
    isScrollingRef.current = true;
    setActiveId(id);
    
    scrollToId(id, { extraOffset: 20 });

    // Re-enable observer after scroll animation completes
    setTimeout(() => {
      isScrollingRef.current = false;
    }, 900);
  };

  const handleDismissTooltip = () => {
    setShowTooltip(false);
    localStorage.setItem(TOOLTIP_DISMISSED_KEY, "true");
  };

  return (
    <div className="relative">
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
                    Click any category to jump directly to that section. The active category is highlighted in gold.
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
            <div className="absolute top-4 -right-2 w-0 h-0 border-t-8 border-b-8 border-l-8 border-transparent border-l-champagne" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Floating Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-gold/30 rounded-xl overflow-hidden shadow-lg max-h-[calc(100vh-200px)] jj-scrollbar-gold"
      >
        {/* Header with minimize button */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 bg-gradient-to-r from-gold/5 to-transparent">
          <div className="flex items-center gap-2">
            <List className="w-5 h-5 text-gold" />
            <h3 className="text-black font-semibold text-sm">{title}</h3>
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
              className="p-3 space-y-1"
            >
              {categories.map((category, index) => (
                <button
                  key={category.id}
                  onClick={() => scrollToSection(`category-${index}`)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-all",
                    activeId === `category-${index}`
                      ? "bg-gradient-to-r from-champagne-light via-champagne to-champagne-dark text-black font-medium shadow-md border border-gold/40"
                      : "text-zinc-600 hover:text-black hover:bg-gold/10 border border-transparent hover:border-gold/30"
                  )}
                >
                  <span className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium flex-shrink-0",
                    activeId === `category-${index}`
                      ? "bg-black text-gold"
                      : "bg-gold/10 text-gold"
                  )}>
                    {index + 1}
                  </span>
                  {category.icon && <category.icon className={cn(
                    "w-3.5 h-3.5 flex-shrink-0",
                    activeId === `category-${index}` ? "text-black" : "text-gold"
                  )} />}
                  <span className="flex-1 truncate text-xs">{category.title}</span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full",
                    activeId === `category-${index}`
                      ? "bg-black/10 text-black"
                      : "bg-gold/10 text-gold"
                  )}>
                    {category.questions.length}
                  </span>
                </button>
              ))}
              
              {/* CTA Actions - Compact */}
              <div className="pt-3 mt-2 border-t border-gold/20 space-y-2">
                <Button 
                  size="sm"
                  variant="primary"
                  className="w-full py-2 text-xs"
                  asChild
                >
                  <Link to="/contact">
                    <Phone className="w-3 h-3 mr-1.5" />
                    Ask Our Team
                  </Link>
                </Button>
                <Link to="/buyer-guide" className="block">
                  <Button 
                    size="sm"
                    variant="secondary"
                    className="w-full text-xs py-2"
                  >
                    <Search className="w-3 h-3 mr-1.5" />
                    View Buyer Guide
                  </Button>
                </Link>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default FAQFloatingSidebar;