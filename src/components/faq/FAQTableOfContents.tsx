import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { LucideIcon, List, ChevronDown, ChevronUp, Search, X, Send, HelpCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

    categories.forEach((category, index) => {
      const element = document.getElementById(`category-${index}`);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [categories]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      // Set active immediately for better UX
      setActiveId(id);
      
      // Use a larger offset to account for sticky headers (same as GuideTableOfContents)
      const offset = 150;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
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
        "bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-gold/30 rounded-xl overflow-hidden shadow-lg scrollbar-thin scrollbar-thumb-gold/60 scrollbar-track-gold/10",
        sticky ? "sticky top-4 z-[60] max-h-[calc(100vh-200px)] overflow-y-auto" : "max-h-[400px] overflow-y-auto"
      )}
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(200,167,102,0.6) rgba(200,167,102,0.1)'
      }}
    >
      {/* Header */}
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
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="p-3"
          >
            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search your question..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-10 bg-zinc-50 border-zinc-200 focus:border-gold focus:ring-gold/20"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setShowNoResults(false);
                    setShowContactForm(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-zinc-200 hover:bg-zinc-300 flex items-center justify-center transition-colors"
                >
                  <X className="w-3 h-3 text-zinc-600" />
                </button>
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mb-4 p-2 bg-gold/5 rounded-lg border border-gold/20">
                <p className="text-xs text-zinc-500 mb-2">{searchResults.length} result(s) found:</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {searchResults.map((result, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleResultClick(result.categoryIndex, result.questionIndex)}
                      className="w-full text-left text-sm text-zinc-700 hover:text-gold p-2 rounded-md hover:bg-gold/10 transition-colors truncate"
                    >
                      {result.question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No Results - Show submit option */}
            {showNoResults && !showContactForm && (
              <div className="mb-4 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                <div className="flex items-start gap-2 mb-3">
                  <HelpCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-black">Question not found</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Would you like to submit this question? We'll add it to our FAQ and contact you with the answer.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowContactForm(true)}
                  size="sm"
                  className="w-full bg-gold hover:bg-gold/90 text-black font-medium"
                >
                  <Send className="w-3 h-3 mr-2" />
                  Submit Question
                </Button>
              </div>
            )}

            {/* Contact Form for submitting question */}
            {showContactForm && (
              <div className="mb-4 p-3 bg-zinc-50 rounded-lg border border-zinc-200 space-y-3">
                <p className="text-sm font-medium text-black">Your Contact Details (Optional)</p>
                <Input
                  type="text"
                  placeholder="Your Name"
                  value={contactInfo.name}
                  onChange={(e) => setContactInfo(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-white border-zinc-200 text-sm"
                />
                <Input
                  type="email"
                  placeholder="Your Email"
                  value={contactInfo.email}
                  onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-white border-zinc-200 text-sm"
                />
                <Input
                  type="tel"
                  placeholder="Your Phone"
                  value={contactInfo.phone}
                  onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                  className="bg-white border-zinc-200 text-sm"
                />
                <Button
                  onClick={handleSubmitQuestion}
                  disabled={isSubmitting}
                  className="w-full bg-gold hover:bg-gold/90 text-black font-medium"
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
                      ? "bg-gradient-to-r from-champagne-light via-champagne to-champagne-dark text-black font-medium shadow-md border border-gold/40"
                      : "text-zinc-600 hover:text-black hover:bg-gold/10 border border-transparent hover:border-gold/30"
                  )}
                >
                  <category.icon className={cn(
                    "w-4 h-4 flex-shrink-0",
                    activeId === `category-${index}` ? "text-black" : "text-gold"
                  )} />
                  <span className="flex-1 truncate">{category.title}</span>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    activeId === `category-${index}`
                      ? "bg-black/10 text-black"
                      : "bg-gold/10 text-gold"
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
