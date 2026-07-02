import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { LucideIcon, List, ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
    const dismissed = localStorage.getItem(TOOLTIP_DISMISSED_KEY);
    if (!dismissed) {
      const timer = setTimeout(() => setShowTooltip(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return;
        const visibleEntries = entries.filter(entry => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          const sorted = visibleEntries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          const bestEntry = sorted.find(entry => entry.boundingClientRect.top >= -100) || sorted[0];
          if (bestEntry) setActiveId(bestEntry.target.id);
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
    isScrollingRef.current = true;
    setActiveId(id);
    scrollToId(id, { extraOffset: 20 });
    setTimeout(() => { isScrollingRef.current = false; }, 900);
  };

  const handleDismissTooltip = () => {
    setShowTooltip(false);
    localStorage.setItem(TOOLTIP_DISMISSED_KEY, "true");
  };

  return (
    <div className="fixed right-4 top-28 z-40 hidden w-60 lg:block xl:right-6 xl:w-64">
      <AnimatePresence>
        {showTooltip && !isMinimized && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="absolute right-full mr-4 top-0 w-64 z-50">
            <div className="bg-[#FDFBF7] border border-white/30 rounded-xl p-4 shadow-xl">
              <div className="flex items-start gap-3 mb-3">
                <HelpCircle className="w-4 h-4 text-[#1A1A1A] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-[#1A1A1A] text-sm mb-1">Quick Navigation</h4>
                  <p className="text-[#1A1A1A]/70 text-xs">Jump to any FAQ category directly.</p>
                </div>
              </div>
              <Button onClick={handleDismissTooltip} size="sm" className="w-full text-xs bg-[image:var(--jj-emerald-ombre)] text-white hover:opacity-90">I Understand</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#FDFBF7] border border-white/30 rounded-2xl overflow-hidden shadow-[0_18px_40px_rgba(0,0,0,0.18)] flex flex-col jj-scrollbar-emerald max-h-[56dvh]">
        <div data-surface="emerald" className="flex items-center justify-between px-3 py-2.5 border-b border-white/20 bg-[image:var(--jj-emerald-ombre)] flex-shrink-0">
          <div className="flex items-center gap-2">
            <List className="w-4 h-4 text-white" />
            <h3 className="text-sm font-semibold text-white">{title}</h3>
          </div>
          <button onClick={() => setIsMinimized(!isMinimized)} className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/15 flex items-center justify-center transition-colors">
            {isMinimized ? <ChevronDown className="w-4 h-4 text-white" /> : <ChevronUp className="w-4 h-4 text-white" />}
          </button>
        </div>
        
        {!isMinimized && (
          <nav className="p-2.5 space-y-1 overflow-y-auto flex-1 jj-scrollbar-emerald">
            {categories.map((category, index) => {
              const isActive = activeId === `category-${index}`;
              return (
                <button
                  key={category.id}
                  onClick={() => scrollToSection(`category-${index}`)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-left text-xs transition-colors border",
                    isActive ? "bg-[image:var(--jj-emerald-ombre)] text-white font-semibold border-white/20" : "text-[#1A1A1A] hover:bg-[#064E3B]/8 border-transparent"
                  )}
                >
                  <span className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0", isActive ? "bg-[#064E3B] text-white border border-white/35" : "bg-[image:var(--jj-emerald-ombre)] text-white border border-white/25")}>
                    {index + 1}
                  </span>
                  <span className="truncate flex-1">{category.title}</span>
                </button>
              );
            })}
          </nav>
        )}
      </motion.div>
    </div>
  );
};

export default FAQFloatingSidebar;
