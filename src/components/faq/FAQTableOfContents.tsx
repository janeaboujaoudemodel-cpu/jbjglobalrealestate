import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { LucideIcon, List, ChevronDown, ChevronUp, Search, X, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { scrollToId } from "@/lib/scroll";

interface FAQCategory {
  id: string;
  title: string;
  icon: LucideIcon;
  questions: Array<{ question: string; answer: string }>;
}

interface FAQTableOfContentsProps {
  categories: FAQCategory[];
  title?: string;
  sticky?: boolean;
}

export const FAQTableOfContents = ({ 
  categories, 
  title = "FAQ Quick Access",
  sticky = true
}: FAQTableOfContentsProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ categoryIndex: number; questionIndex: number; question: string }>>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isScrollingRef = useRef(false);

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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    const results: Array<{ categoryIndex: number; questionIndex: number; question: string }> = [];
    const lowerQuery = query.toLowerCase();
    categories.forEach((category, categoryIndex) => {
      category.questions.forEach((q, questionIndex) => {
        if (q.question.toLowerCase().includes(lowerQuery) || q.answer.toLowerCase().includes(lowerQuery)) {
          results.push({ categoryIndex, questionIndex, question: q.question });
        }
      });
    });
    setSearchResults(results.slice(0, 5));
  };

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        data-surface="emerald"
        className={cn(
          "h-12 w-12 rounded-xl bg-[image:var(--jj-emerald-ombre)] border border-white/15 shadow-[0_18px_40px_rgba(0,0,0,0.28)] flex items-center justify-center hover:scale-[1.03] transition-transform",
          sticky ? "sticky top-28 z-40" : ""
        )}
        aria-label="Expand navigation"
      >
        <ChevronDown className="w-5 h-5 text-white" />
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-[image:var(--jj-emerald-ombre)] border border-white/15 rounded-2xl overflow-hidden shadow-[0_18px_40px_rgba(0,0,0,0.28)] flex flex-col jj-scrollbar-emerald",
        sticky ? "sticky top-28 z-40 max-h-[60dvh]" : "max-h-[400px]"
      )}
    >
      <div data-surface="emerald" className="flex items-center justify-between px-3 py-2.5 border-b border-white/15 bg-black/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <List className="w-4 h-4 text-white" />
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
        <button onClick={() => setIsMinimized(true)} className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/15 flex items-center justify-center transition-colors" aria-label="Minimize navigation">
          <ChevronUp className="w-4 h-4 text-white" />
        </button>
      </div>
      
      <AnimatePresence initial={false}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col min-h-0 flex-1 overflow-hidden p-2.5">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/70" />
              <Input
                ref={searchInputRef}
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9 pr-8 h-9 text-xs bg-white/10 border-white/15 text-white placeholder:text-white/60 focus:border-white/25 focus:ring-0 focus-visible:ring-0"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); setSearchResults([]); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                  <X className="w-3 h-3 text-white/70" />
                </button>
              )}
            </div>

            <nav className="space-y-1 overflow-y-auto jj-scrollbar-emerald flex-1">
              {categories.map((category, index) => {
                const isActive = activeId === `category-${index}`;
                return (
                  <button
                    key={category.id}
                    onClick={() => scrollToSection(`category-${index}`)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs transition-colors border",
                      isActive ? "bg-white/12 text-white font-semibold border-white/10" : "text-white hover:bg-white/10 border-transparent"
                    )}
                  >
                    <span className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0", isActive ? "bg-white/15 text-white border border-white/20" : "bg-black/15 text-white border border-white/10")}>
                      {index + 1}
                    </span>
                    <span className="truncate flex-1">{category.title}</span>
                  </button>
                );
              })}
            </nav>
          </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default FAQTableOfContents;
