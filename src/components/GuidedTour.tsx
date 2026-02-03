import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  ListPlus, 
  ArrowRight, 
  X, 
  Trophy,
  Compass,
  Send,
  FileSearch,
  TrendingUp,
  Calculator,
  Brain,
  Menu,
  Search,
  User,
  Globe,
  Phone,
  Map
} from "lucide-react";
import { JJLogoImage } from "./JJLogoImage";

const TOUR_COMPLETED_KEY = "jj_tour_completed";

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
}

const GuidedTour = ({ isOpen, onClose }: GuidedTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showTour, setShowTour] = useState<'choice' | 'tour' | 'shortcuts' | null>('choice');

  const handleTakeTour = () => {
    setShowTour('tour');
    setCurrentStep(0);
  };

  const handleExploreAlone = () => {
    setShowTour('shortcuts');
  };

  const handleComplete = () => {
    localStorage.setItem(TOUR_COMPLETED_KEY, "true");
    setShowTour(null);
    onClose();
  };

  // Enhanced tour steps with navigation focus
  const tourSteps = [
    {
      icon: Menu,
      iconColor: "text-gold",
      iconBg: "from-gold/20 to-gold/10",
      iconBorder: "border-gold/30",
      title: "Navigation Menu",
      description: "Find all pages in the header menu. Click on Buy, Rent, Projects, Services, or More to explore each section with detailed dropdown panels."
    },
    {
      icon: Search,
      iconColor: "text-blue-500",
      iconBg: "from-blue-500/20 to-blue-600/10",
      iconBorder: "border-blue-500/30",
      title: "Quick Search",
      description: "Click the search icon in the header to access services, shortcuts, and contact options. Find anything instantly across the platform."
    },
    {
      icon: User,
      iconColor: "text-purple-500",
      iconBg: "from-purple-500/20 to-purple-600/10",
      iconBorder: "border-purple-500/30",
      title: "Sign In & Account",
      description: "Click the user icon to access your account, favorites, settings, and personalized dashboard. Create an account to save properties."
    },
    {
      icon: Globe,
      iconColor: "text-cyan-500",
      iconBg: "from-cyan-500/20 to-cyan-600/10",
      iconBorder: "border-cyan-500/30",
      title: "Language & Currency",
      description: "Switch between English and Arabic, and select your preferred currency (AED, USD, EUR) using the icons in the header."
    },
    {
      icon: Heart,
      iconColor: "text-red-500",
      iconBg: "from-red-500/20 to-red-600/10",
      iconBorder: "border-red-500/30",
      title: "Save to Favorites",
      description: "Tap the heart icon on any property to save it to your favorites collection. Build your personal portfolio of dream properties."
    },
    {
      icon: ListPlus,
      iconColor: "text-gold",
      iconBg: "from-gold/20 to-gold/10",
      iconBorder: "border-gold/30",
      title: "Add to Shortlist",
      description: "Move your top favorites to the shortlist for detailed comparison. Select up to 5 properties to analyze side by side."
    },
    {
      icon: Trophy,
      iconColor: "text-gold",
      iconBg: "from-gold/30 to-amber-500/10",
      iconBorder: "border-gold/40",
      title: "Assign Badges",
      description: "Go to Favorites → Shortlist tab and click 'Add Badge' on each property. Rank with 🥇 Gold (Top 1), 🥈 Silver (Top 2), 🥉 Bronze (Top 3)."
    },
    {
      icon: Brain,
      iconColor: "text-purple-500",
      iconBg: "from-purple-500/20 to-purple-600/10",
      iconBorder: "border-purple-500/30",
      title: "JBJ AI Property Matchmaker",
      description: "Our AI analyzes your shortlisted properties and provides detailed investment comparisons on ROI, location value, and market trends."
    },
    {
      icon: Map,
      iconColor: "text-emerald-500",
      iconBg: "from-emerald-500/20 to-emerald-600/10",
      iconBorder: "border-emerald-500/30",
      title: "Sitemap & Help",
      description: "Find the complete sitemap in the footer or header 'More' menu. Access every page, tool, and resource in one convenient location."
    },
    {
      icon: Phone,
      iconColor: "text-green-500",
      iconBg: "from-green-500/20 to-green-600/10",
      iconBorder: "border-green-500/30",
      title: "Contact JBJ",
      description: "Reach us via WhatsApp, phone, or email. Click the search icon for quick contact options, or visit the Contact page for more ways to connect."
    },
    {
      icon: Send,
      iconColor: "text-gold",
      iconBg: "from-gold/20 to-gold/10",
      iconBorder: "border-gold/30",
      title: "Connect with JBJ Global Real Estate",
      description: "Submit your curated selection directly to our property consultants. Book consultations and finalize your UAE property purchase."
    }
  ];

  const shortcutItems = [
    {
      icon: Menu,
      iconColor: "text-gold",
      title: "Header Menu",
      description: "Buy, Rent, Projects, Services & More dropdowns"
    },
    {
      icon: Search,
      iconColor: "text-blue-500",
      title: "Quick Search",
      description: "Services, shortcuts & contact in header"
    },
    {
      icon: Heart,
      iconColor: "text-red-500",
      title: "Favorites & Shortlist",
      description: "Save properties and compare up to 5 side by side"
    },
    {
      icon: Brain,
      iconColor: "text-purple-500",
      title: "JBJ AI Property Matchmaker",
      description: "Get AI-powered investment analysis on your selections"
    },
    {
      icon: Map,
      iconColor: "text-emerald-500",
      title: "Sitemap",
      description: "Find all pages in footer or More menu"
    },
    {
      icon: Calculator,
      iconColor: "text-orange-500",
      title: "Mortgage Calculator",
      description: "Calculate payments and connect with advisors"
    }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Close button */}
          <button
            onClick={handleComplete}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>

          {/* Premium top accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />
          
          {/* Ambient glow */}
          <div 
            className="absolute top-0 left-0 right-0 h-40 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 50% -20%, hsl(40 32% 51% / 0.15) 0%, transparent 70%)`
            }}
          />

          <div className="relative p-6 sm:p-8">
            {/* CHOICE SCREEN */}
            {showTour === 'choice' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className="flex justify-center mb-6">
                  <JJLogoImage variant="light" size="md" />
                </div>

                <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-black mb-3" style={{ fontFamily: "Poppins, sans-serif" }}>
                  Welcome to JBJ Global
                </h2>
                <p className="text-gray-600 text-sm mb-8 max-w-sm mx-auto">
                  Take a quick guided tour to learn how to navigate our platform, or explore on your own
                </p>

                <div className="space-y-3">
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleTakeTour();
                    }}
                    type="button"
                    className="w-full py-5 sm:py-6 bg-black hover:bg-zinc-900 text-gold font-semibold text-base shadow-xl rounded-xl group relative overflow-hidden border border-gold/20"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    <Compass className="w-5 h-5 mr-3 relative z-10" />
                    <span className="flex-1 text-left relative z-10">Take a Quick Tour</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                  </Button>

                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleComplete();
                    }}
                    type="button"
                    variant="outline"
                    className="w-full py-5 sm:py-6 border-gray-300 bg-transparent text-black hover:bg-gray-100 hover:border-gold/50 group rounded-xl transition-all"
                  >
                    <span className="flex-1 text-left font-medium">Explore by Myself</span>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gold group-hover:translate-x-1 transition-all" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* TOUR STEPS */}
            {showTour === 'tour' && (
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center"
              >
                {/* Step indicator - scrollable on small screens */}
                <div className="flex justify-center gap-1.5 mb-6 flex-wrap">
                  {tourSteps.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentStep(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === currentStep 
                          ? 'w-6 bg-gold' 
                          : idx < currentStep 
                            ? 'w-2.5 bg-gold/50 hover:bg-gold/70' 
                            : 'w-2.5 bg-gray-300 hover:bg-gray-400'
                      }`}
                      aria-label={`Go to step ${idx + 1}`}
                    />
                  ))}
                </div>

                <div className="text-xs text-gray-500 mb-4">
                  Step {currentStep + 1} of {tourSteps.length}
                </div>

                <div className="relative inline-flex mb-6">
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${tourSteps[currentStep].iconBg} border ${tourSteps[currentStep].iconBorder} flex items-center justify-center shadow-lg`}>
                    {(() => {
                      const Icon = tourSteps[currentStep].icon;
                      return <Icon className={`w-8 h-8 sm:w-10 sm:h-10 ${tourSteps[currentStep].iconColor}`} />;
                    })()}
                  </div>
                </div>

                <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-black mb-3" style={{ fontFamily: "Poppins, sans-serif" }}>
                  {tourSteps[currentStep].title}
                </h3>
                <p className="text-gray-600 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
                  {tourSteps[currentStep].description}
                </p>

                <div className="flex gap-3">
                  {currentStep > 0 && (
                    <Button
                      onClick={() => setCurrentStep(currentStep - 1)}
                      variant="outline"
                      className="flex-1 py-4 sm:py-5 border-gray-300 bg-transparent text-black hover:bg-gray-100 rounded-xl"
                    >
                      Back
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      if (currentStep < tourSteps.length - 1) {
                        setCurrentStep(currentStep + 1);
                      } else {
                        handleComplete();
                      }
                    }}
                    className="flex-1 py-4 sm:py-5 bg-black hover:bg-zinc-900 text-gold font-semibold rounded-xl group border border-gold/20"
                  >
                    {currentStep < tourSteps.length - 1 ? 'Next' : 'Start Exploring'}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* SHORTCUTS OVERVIEW */}
            {showTour === 'shortcuts' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="text-center mb-6">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-black mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                    Great! Quick Overview
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Here are the key shortcuts you'll use
                  </p>
                </div>

                <div className="space-y-2.5 mb-6 max-h-[50vh] overflow-y-auto">
                  {shortcutItems.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl"
                    >
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center justify-center flex-shrink-0">
                        <item.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${item.iconColor}`} />
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <p className="text-black text-sm font-medium">{item.title}</p>
                        <p className="text-gray-500 text-xs truncate">{item.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <Button
                  onClick={handleComplete}
                  className="w-full py-4 sm:py-5 bg-black hover:bg-zinc-900 text-gold font-semibold rounded-xl group border border-gold/20"
                >
                  Start Exploring
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GuidedTour;
