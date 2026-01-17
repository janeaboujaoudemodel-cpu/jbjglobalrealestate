import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { LucideIcon, List, X, ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface TOCItem {
  id: string;
  title: string;
  icon?: LucideIcon;
}

interface GuideTableOfContentsProps {
  items: TOCItem[];
  title?: string;
  sticky?: boolean;
}

const TOOLTIP_DISMISSED_KEY = "jbj_guide_nav_tooltip_dismissed";

export const GuideTableOfContents = ({ 
  items, 
  title = "In This Guide",
  sticky = true 
}: GuideTableOfContentsProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

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
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -50% 0px" }
    );

    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [items]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
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
            <div className="bg-white border border-gold/30 rounded-xl p-4 shadow-xl">
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
                className="w-full bg-gold hover:bg-gold/90 text-black font-medium text-xs"
              >
                I Understand
              </Button>
            </div>
            {/* Arrow pointing to nav */}
            <div className="absolute top-4 -right-2 w-0 h-0 border-t-8 border-b-8 border-l-8 border-transparent border-l-white" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main TOC Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "bg-white border border-gold/30 rounded-xl overflow-hidden shadow-lg",
          sticky && "sticky top-24"
        )}
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
              className="p-3 space-y-1"
            >
              {items.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all",
                    activeId === item.id
                      ? "bg-gradient-to-r from-gold to-gold-dark text-black font-medium shadow-md"
                      : "text-zinc-600 hover:text-black hover:bg-zinc-100 border border-transparent hover:border-zinc-200"
                  )}
                >
                  <span className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                    activeId === item.id
                      ? "bg-black/20 text-black"
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
            </motion.nav>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default GuideTableOfContents;