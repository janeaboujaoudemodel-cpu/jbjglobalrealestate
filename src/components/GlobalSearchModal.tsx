import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowRight, Building2, Sparkles, FileText, Scale, Layers, Phone, Award, Newspaper, User, Home as HomeIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Define searchable routes and keywords
const SEARCHABLE_ITEMS = [
  { 
    keywords: ["home", "homepage", "main", "start"], 
    route: "/", 
    label: "Home", 
    icon: HomeIcon,
    description: "Return to homepage"
  },
  { 
    keywords: ["property", "properties", "real estate", "apartment", "villa", "buy", "invest", "off-plan", "ready"], 
    route: "/properties", 
    label: "Properties", 
    icon: Building2,
    description: "Browse all properties"
  },
  { 
    keywords: ["concierge", "luxury", "jet", "yacht", "car", "limousine", "travel", "lifestyle"], 
    route: "/concierge", 
    label: "Luxury Concierge", 
    icon: Sparkles,
    description: "Premium lifestyle services"
  },
  { 
    keywords: ["ai", "quiz", "finder", "match", "recommend", "suggestion"], 
    route: "/quiz", 
    label: "AI Home Finder", 
    icon: Sparkles,
    description: "AI-powered property matching"
  },
  { 
    keywords: ["market", "report", "analysis", "insights", "uae", "dubai"], 
    route: "/market-report", 
    label: "Market Report", 
    icon: FileText,
    description: "UAE market insights"
  },
  { 
    keywords: ["mortgage", "calculator", "finance", "loan"], 
    route: "/mortgage-calculator", 
    label: "Mortgage Calculator", 
    icon: FileText,
    description: "Mortgage estimation tool"
  },
  { 
    keywords: ["law", "legal", "firm", "lawyer", "attorney"], 
    route: "/services/law-firm", 
    label: "Law Firm", 
    icon: Scale,
    description: "Legal services"
  },
  { 
    keywords: ["design", "build", "architecture", "interior", "fitout", "construction"], 
    route: "/services/design-build", 
    label: "Design & Build", 
    icon: Layers,
    description: "Architecture & design services"
  },
  { 
    keywords: ["contact", "email", "phone", "whatsapp", "reach", "inquiry"], 
    route: "/contact", 
    label: "Contact Us", 
    icon: Phone,
    description: "Get in touch"
  },
  { 
    keywords: ["about", "company", "who", "us"], 
    route: "/about", 
    label: "About Us", 
    icon: Building2,
    description: "Learn about JJ Global Capital"
  },
  { 
    keywords: ["founder", "jane", "jaoude", "leadership", "ceo", "chairwoman"], 
    route: "/founder", 
    label: "Founder & Leadership", 
    icon: User,
    description: "Meet Jane Abou Jaoude"
  },
  { 
    keywords: ["award", "awards", "recognition", "achievement"], 
    route: "/awards", 
    label: "Awards", 
    icon: Award,
    description: "Our achievements"
  },
  { 
    keywords: ["news", "blog", "article", "update", "insights"], 
    route: "/news", 
    label: "News & Insights", 
    icon: Newspaper,
    description: "Latest updates"
  },
  { 
    keywords: ["favorites", "shortlist", "saved", "compare", "wishlist"], 
    route: "/favorites", 
    label: "Favorites & Shortlist", 
    icon: Building2,
    description: "Your saved properties"
  },
];

const GlobalSearchModal = ({ isOpen, onClose }: GlobalSearchModalProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(SEARCHABLE_ITEMS.slice(0, 5));
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults(SEARCHABLE_ITEMS.slice(0, 5));
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(SEARCHABLE_ITEMS.slice(0, 5));
      return;
    }

    const searchTerms = query.toLowerCase().split(" ");
    const filtered = SEARCHABLE_ITEMS.filter(item => 
      searchTerms.some(term => 
        item.keywords.some(keyword => keyword.includes(term)) ||
        item.label.toLowerCase().includes(term)
      )
    );

    setResults(filtered.length > 0 ? filtered : SEARCHABLE_ITEMS.slice(0, 3));
  }, [query]);

  const handleSelect = (route: string) => {
    // If query contains property-related terms, add as search param
    if (route === "/properties" && query.trim()) {
      navigate(`/properties?q=${encodeURIComponent(query)}`);
    } else {
      navigate(route);
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && results.length > 0) {
      handleSelect(results[0].route);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-xl z-50 px-4"
          >
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
              {/* Search Input */}
              <div className="relative border-b border-zinc-800">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold" />
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search pages, properties, services..."
                  className="w-full h-14 pl-12 pr-12 bg-transparent border-0 text-white text-lg placeholder:text-zinc-500 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <button
                  onClick={onClose}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto p-2">
                {results.map((item, idx) => (
                  <button
                    key={item.route}
                    onClick={() => handleSelect(item.route)}
                    className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${
                      idx === 0 && query.trim() 
                        ? "bg-gold/10 border border-gold/30" 
                        : "hover:bg-zinc-800"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      idx === 0 && query.trim() 
                        ? "bg-gold/20 text-gold" 
                        : "bg-zinc-800 text-zinc-400"
                    }`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`font-medium ${idx === 0 && query.trim() ? "text-gold" : "text-white"}`}>
                        {item.label}
                      </p>
                      <p className="text-zinc-500 text-sm">{item.description}</p>
                    </div>
                    <ArrowRight className={`w-4 h-4 ${idx === 0 && query.trim() ? "text-gold" : "text-zinc-600"}`} />
                  </button>
                ))}
              </div>

              {/* Footer hint */}
              <div className="p-3 border-t border-zinc-800 bg-zinc-900/50">
                <p className="text-zinc-500 text-xs text-center">
                  Press <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">Enter</kbd> to go • <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">Esc</kbd> to close
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GlobalSearchModal;
