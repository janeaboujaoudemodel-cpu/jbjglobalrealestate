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
  const [pastHero, setPastHero] = useState(false);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    const hero = document.querySelector('[data-faq-hero], [data-guide-hero], [data-premium-emerald-hero], [data-hero-dark]') as HTMLElement | null;
    if (!hero) {
      setPastHero(true);
      return;
    }
    const check = () => setPastHero(hero.getBoundingClientRect().bottom <= 8);
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

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

  if (!pastHero) return null;

  return (
    <div
      className={cn(
        "fixed right-4 top-28 z-[80] hidden lg:block xl:right-6",
        isMinimized ? "w-auto" : "w-60 xl:w-64"
      )}
      data-faq-toc
      data-premium-navigator
    >
      <AnimatePresence>
        {showTooltip && !isMinimized && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="absolute right-full mr-4 top-0 w-64 z-50">
            <div data-surface="emerald" className="bg-[image:var(--jj-emerald-ombre)] border border-white/15 rounded-none p-4 shadow-xl">
              <div className="flex items-start gap-3 mb-3">
                <HelpCircle className="w-4 h-4 text-white shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white text-sm mb-1">Quick Navigation</h4>
                  <p className="text-white/80 text-xs">Jump to any FAQ category directly.</p>
                </div>
              </div>
              <Button onClick={handleDismissTooltip} size="sm" className="w-full rounded-none text-xs bg-[image:var(--jj-emerald-ombre)] text-white hover:opacity-90">I Understand</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
      <motion.div data-surface="emerald" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[image:var(--jj-emerald-ombre)] border border-white/15 rounded-none overflow-hidden shadow-[0_18px_40px_rgba(0,0,0,0.28)] flex flex-col jj-scrollbar-emerald max-h-[56dvh]">
        <div data-surface="emerald" className="flex items-center justify-between px-3 py-2.5 border-b border-white/15 bg-black/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <List className="w-4 h-4 text-white" />
            <h3 className="text-sm font-semibold text-white">{title}</h3>
          </div>
          <button onClick={() => setIsMinimized(true)} className="w-7 h-7 rounded-none bg-white/10 hover:bg-white/15 flex items-center justify-center transition-colors" aria-label="Minimize navigation">
            <ChevronUp className="w-4 h-4 text-white" />
          </button>
        </div>
        
          <nav className="p-2.5 space-y-1 overflow-y-auto flex-1 jj-scrollbar-emerald">
            {categories.map((category, index) => {
              const isActive = activeId === `category-${index}`;
              return (
                <button
                  key={category.id}
                  onClick={() => scrollToSection(`category-${index}`)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-none text-left text-xs transition-colors border",
                    isActive ? "bg-white/12 text-white font-semibold border-white/15" : "bg-black/10 text-white hover:bg-white/10 border-white/10"
                  )}
                >
                  <span className={cn("w-6 h-6 rounded-none flex items-center justify-center text-[10px] font-bold flex-shrink-0", isActive ? "bg-white/15 text-white border border-white/20" : "bg-black/15 text-white border border-white/10")}>
                    {index + 1}
                  </span>
                  <span className="truncate flex-1">{category.title}</span>
                </button>
              );
            })}
          </nav>
      </motion.div>
      )}
    </div>
  );
};

export default FAQFloatingSidebar;
