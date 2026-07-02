import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { LucideIcon, List, ChevronDown, ChevronUp, Search, X, Send, HelpCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  const [showNoResults, setShowNoResults] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactInfo, setContactInfo] = useState({ name: "", email: "", phone: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isScrollingRef = useRef(false);

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

    categories.forEach((category, index) => {
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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setShowNoResults(false);
    setShowContactForm(false);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    const results: Array<{ categoryIndex: number; questionIndex: number; question: string }> = [];
    const lowerQuery = query.toLowerCase();

    categories.forEach((category, categoryIndex) => {
      category.questions.forEach((q, questionIndex) => {
        if (
          q.question.toLowerCase().includes(lowerQuery) ||
          q.answer.toLowerCase().includes(lowerQuery)
        ) {
          results.push({ categoryIndex, questionIndex, question: q.question });
        }
      });
    });

    setSearchResults(results);

    if (results.length === 0 && query.length >= 3) {
      setShowNoResults(true);
    }
  };

  const handleResultClick = (categoryIndex: number, questionIndex: number) => {
    const accordionId = `${categoryIndex}-${questionIndex}`;
    const categoryElement = document.getElementById(`category-${categoryIndex}`);
    
    if (categoryElement) {
      categoryElement.scrollIntoView({ behavior: "smooth" });
      // Try to open the accordion item
      setTimeout(() => {
        const accordionTrigger = document.querySelector(`[data-accordion-item="${accordionId}"]`);
        if (accordionTrigger) {
          (accordionTrigger as HTMLButtonElement).click();
        }
      }, 500);
    }
    
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleSubmitQuestion = async () => {
    if (!searchQuery.trim()) return;

    setIsSubmitting(true);

    try {
      // Find the closest matching category based on the search
      let matchedCategory = null;
      const lowerQuery = searchQuery.toLowerCase();
      
      for (const category of categories) {
        if (category.title.toLowerCase().includes(lowerQuery)) {
          matchedCategory = category.title;
          break;
        }
      }

      const { error } = await supabase
        .from('faq_unanswered_questions')
        .insert({
          question: searchQuery,
          user_email: contactInfo.email || null,
          user_phone: contactInfo.phone || null,
          user_name: contactInfo.name || null,
          matched_category: matchedCategory
        });

      if (error) throw error;

      toast({
        title: "Question Submitted!",
        description: "We've recorded your question and will add it to our FAQ. Our team will contact you with the answer.",
      });

      setSearchQuery("");
      setShowContactForm(false);
      setShowNoResults(false);
      setContactInfo({ name: "", email: "", phone: "" });
    } catch (error) {
      console.error("Error submitting question:", error);
      toast({
        title: "Submission Failed",
        description: "Please try again or contact us directly.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-[#FDFBF7] border border-white/30 rounded-xl overflow-hidden shadow-lg jj-scrollbar-emerald",
        sticky ? "sticky top-4 z-[60] max-h-[calc(100vh-200px)]" : "max-h-[400px]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/30 bg-[image:var(--jj-emerald-ombre)]">
        <div className="flex items-center gap-2">
          <List className="w-5 h-5 text-white" />
          <h3 className="text-white font-semibold">{title}</h3>
        </div>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="w-8 h-8 rounded-lg bg-[#F7F2EA] hover:bg-[#EFE6D6]/10 flex items-center justify-center transition-colors"
          aria-label={isMinimized ? "Expand navigation" : "Minimize navigation"}
        >
          {isMinimized ? (
            <ChevronDown className="w-4 h-4 text-white/70" />
          ) : (
            <ChevronUp className="w-4 h-4 text-white/70" />
          )}
        </button>
      </div>
      
      {/* Collapsible content */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="p-3"
          >
            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search your question..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-10 bg-[#F7F2EA] border-white/30 focus:border-[#B89555] focus:ring-gold/20"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setShowNoResults(false);
                    setShowContactForm(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#EFE6D6] hover:bg-[#EFE6D6] flex items-center justify-center transition-colors"
                >
                  <X className="w-3 h-3 text-white/70" />
                </button>
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mb-4 p-2 bg-[#EFE6D6]/5 rounded-lg border border-[#B89555]/20">
                <p className="text-xs text-white/70 mb-2">{searchResults.length} result(s) found:</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {searchResults.map((result, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleResultClick(result.categoryIndex, result.questionIndex)}
                      className="w-full text-left text-sm text-white/70 hover:text-white p-2 rounded-md hover:bg-[#EFE6D6]/10 transition-colors truncate"
                    >
                      {result.question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No Results - Show submit option */}
            {showNoResults && !showContactForm && (
              <div className="mb-4 p-3 bg-[#F7F2EA] rounded-lg border border-white/30">
                <div className="flex items-start gap-2 mb-3">
                  <HelpCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white">Question not found</p>
                    <p className="text-xs text-white/70 mt-1">
                      Would you like to submit this question? We'll add it to our FAQ and contact you with the answer.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowContactForm(true)}
                  size="sm"
                  className="w-full bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-white font-medium"
                >
                  <Send className="w-3 h-3 mr-2" />
                  Submit Question
                </Button>
              </div>
            )}

            {/* Contact Form for submitting question */}
            {showContactForm && (
              <div className="mb-4 p-3 bg-[#F7F2EA] rounded-lg border border-white/30 space-y-3">
                <p className="text-sm font-medium text-white">Your Contact Details (Optional)</p>
                <Input
                  type="text"
                  placeholder="Your Name"
                  value={contactInfo.name}
                  onChange={(e) => setContactInfo(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-[#FDFBF7] border-white/30 text-sm"
                />
                <Input
                  type="email"
                  placeholder="Your Email"
                  value={contactInfo.email}
                  onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-[#FDFBF7] border-white/30 text-sm"
                />
                <Input
                  type="tel"
                  placeholder="Your Phone"
                  value={contactInfo.phone}
                  onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                  className="bg-[#FDFBF7] border-white/30 text-sm"
                />
                <Button
                  onClick={handleSubmitQuestion}
                  disabled={isSubmitting}
                  className="w-full bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-white font-medium"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Question
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Category Links */}
            <nav className="space-y-1">
              {categories.map((category, index) => (
                <button
                  key={`category-${index}`}
                  onClick={() => scrollToSection(`category-${index}`)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all",
                    activeId === `category-${index}`
                      ? "bg-gradient-to-r from-champagne-light via-champagne to-champagne-dark text-white font-medium shadow-md border border-[#B89555]/40"
                      : "text-white/70 hover:text-white hover:bg-[#EFE6D6]/10 border border-transparent hover:border-white/30"
                  )}
                >
                  <category.icon className={cn(
                    "w-4 h-4 flex-shrink-0",
                    activeId === `category-${index}` ? "text-white" : "text-white"
                  )} />
                  <span className="flex-1 truncate">{category.title}</span>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    activeId === `category-${index}`
                      ? "bg-[#1A1A1A]/10 text-white"
                      : "bg-[#EFE6D6]/10 text-white"
                  )}>
                    {category.questions.length}
                  </span>
                </button>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FAQTableOfContents;
