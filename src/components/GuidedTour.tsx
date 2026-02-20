import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  ListPlus, 
  ArrowRight, 
  ArrowLeft,
  X, 
  Trophy,
  Compass,
  Send,
  TrendingUp,
  Calculator,
  Brain,
  Menu,
  Search,
  User,
  Globe,
  Phone,
  Map,
  DollarSign,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { JJLogoImage } from "./JJLogoImage";
import { Link } from "react-router-dom";

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

  // Enhanced tour steps with navigation focus and direct links
  const tourSteps = [
    {
      icon: Menu,
      iconColor: "text-gold",
      iconBg: "from-gold/20 to-gold/10",
      iconBorder: "border-gold/30",
      title: "Navigation Menu",
      description: "Find all pages in the header menu. Click on Buy, Rent, Projects, Services, or More to explore each section.",
      link: null,
      linkLabel: null
    },
    {
      icon: Search,
      iconColor: "text-blue-500",
      iconBg: "from-blue-500/20 to-blue-600/10",
      iconBorder: "border-blue-500/30",
      title: "Quick Search",
      description: "Click the search icon in the header to access services, shortcuts, and contact options instantly.",
      link: null,
      linkLabel: null
    },
    {
      icon: User,
      iconColor: "text-purple-500",
      iconBg: "from-purple-500/20 to-purple-600/10",
      iconBorder: "border-purple-500/30",
      title: "Sign In & Account",
      description: "Click the user icon to access your account, favorites, settings, and personalized dashboard.",
      link: "/my-account",
      linkLabel: "Go to My Account"
    },
    {
      icon: Globe,
      iconColor: "text-cyan-500",
      iconBg: "from-cyan-500/20 to-cyan-600/10",
      iconBorder: "border-cyan-500/30",
      title: "Language Selection",
      description: "Switch between English and Arabic using the language icon in the header. Perfect for your preferred reading experience.",
      link: null,
      linkLabel: null
    },
    {
      icon: DollarSign,
      iconColor: "text-emerald-500",
      iconBg: "from-emerald-500/20 to-emerald-600/10",
      iconBorder: "border-emerald-500/30",
      title: "Currency Selection",
      description: "Select your preferred currency (AED, USD, EUR, GBP) using the currency icon in the header.",
      link: null,
      linkLabel: null
    },
    {
      icon: Heart,
      iconColor: "text-red-500",
      iconBg: "from-red-500/20 to-red-600/10",
      iconBorder: "border-red-500/30",
      title: "Save to Favorites",
      description: "Tap the heart icon on any property to save it to your favorites collection.",
      link: "/favorites",
      linkLabel: "View Favorites"
    },
    {
      icon: ListPlus,
      iconColor: "text-gold",
      iconBg: "from-gold/20 to-gold/10",
      iconBorder: "border-gold/30",
      title: "Add to Shortlist",
      description: "Move your top favorites to the shortlist for detailed comparison. Select up to 5 properties.",
      link: "/favorites",
      linkLabel: "Manage Shortlist"
    },
    {
      icon: Trophy,
      iconColor: "text-gold",
      iconBg: "from-gold/30 to-amber-500/10",
      iconBorder: "border-gold/40",
      title: "Assign Badges",
      description: "In Favorites → Shortlist tab, click 'Add Badge' to rank: Gold (Top 1), Silver (Top 2), Bronze (Top 3).",
      link: "/favorites",
      linkLabel: "Assign Badges"
    },
    {
      icon: Brain,
      iconColor: "text-purple-500",
      iconBg: "from-purple-500/20 to-purple-600/10",
      iconBorder: "border-purple-500/30",
      title: "AI Property Matchmaker",
      description: "Our AI analyzes your shortlisted properties and provides detailed investment comparisons.",
      link: "/quiz",
      linkLabel: "Try AI Quiz"
    },
    {
      icon: Calculator,
      iconColor: "text-orange-500",
      iconBg: "from-orange-500/20 to-orange-600/10",
      iconBorder: "border-orange-500/30",
      title: "Mortgage Calculator",
      description: "Calculate your monthly payments and connect with mortgage advisors for personalized guidance.",
      link: "/mortgage-calculator",
      linkLabel: "Open Calculator"
    },
    {
      icon: TrendingUp,
      iconColor: "text-green-500",
      iconBg: "from-green-500/20 to-green-600/10",
      iconBorder: "border-green-500/30",
      title: "Market Intelligence",
      description: "Access real-time market data, area insights, and investment analytics for informed decisions.",
      link: "/market-intelligence/overview",
      linkLabel: "View Market Data"
    },
    {
      icon: Map,
      iconColor: "text-blue-500",
      iconBg: "from-blue-500/20 to-blue-600/10",
      iconBorder: "border-blue-500/30",
      title: "Sitemap & Help",
      description: "Find the complete sitemap in the footer or header 'More' menu for quick access to every page.",
      link: "/sitemap",
      linkLabel: "View Sitemap"
    },
    {
      icon: Phone,
      iconColor: "text-green-500",
      iconBg: "from-green-500/20 to-green-600/10",
      iconBorder: "border-green-500/30",
      title: "Contact JBJ",
      description: "Reach us via WhatsApp, phone, or email. Click the search icon for quick contact options.",
      link: "/contact",
      linkLabel: "Contact Us"
    },
    {
      icon: Send,
      iconColor: "text-gold",
      iconBg: "from-gold/20 to-gold/10",
      iconBorder: "border-gold/30",
      title: "Connect with JBJ",
      description: "Submit your curated selection directly to our property consultants and book consultations.",
      link: "/contact",
      linkLabel: "Get in Touch"
    }
  ];

  const shortcutItems = [
    {
      icon: Menu,
      iconColor: "text-gold",
      title: "Header Menu",
      description: "Buy, Rent, Projects, Services & More",
      link: null
    },
    {
      icon: Search,
      iconColor: "text-blue-500",
      title: "Quick Search",
      description: "Services, shortcuts & contact in header",
      link: null
    },
    {
      icon: Heart,
      iconColor: "text-red-500",
      title: "Favorites & Shortlist",
      description: "Save and compare up to 5 properties",
      link: "/favorites"
    },
    {
      icon: Brain,
      iconColor: "text-purple-500",
      title: "AI Property Matchmaker",
      description: "Get AI-powered investment analysis",
      link: "/quiz"
    },
    {
      icon: Calculator,
      iconColor: "text-orange-500",
      title: "Mortgage Calculator",
      description: "Calculate payments and connect with advisors",
      link: "/mortgage-calculator"
    },
    {
      icon: Map,
      iconColor: "text-emerald-500",
      title: "Sitemap",
      description: "Find all pages in footer or More menu",
      link: "/sitemap"
    }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
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
            aria-label="Close tour"
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

                {/* Welcome badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold/10 border border-gold/30 rounded-full mb-4">
                  <Sparkles className="w-3.5 h-3.5 text-gold" />
                  <span className="text-gold text-xs font-medium">Welcome Guide</span>
                </div>

                <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-black mb-3" style={{ fontFamily: "Poppins, sans-serif" }}>
                  Welcome to JBJ Global Real Estate
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
                      handleExploreAlone();
                    }}
                    type="button"
                    variant="outline"
                    className="w-full py-5 sm:py-6 border-gray-300 bg-transparent text-black hover:bg-gray-100 hover:border-gold/50 group rounded-xl transition-all"
                  >
                    <span className="flex-1 text-left font-medium">View Quick Shortcuts</span>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gold group-hover:translate-x-1 transition-all" />
                  </Button>

                  <button
                    onClick={handleComplete}
                    className="w-full py-3 text-gray-500 hover:text-gray-700 text-sm transition-colors"
                  >
                    Skip for now
                  </button>
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
                {/* Progress bar */}
                <div className="mb-6">
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-gold to-gold/70 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">Step {currentStep + 1} of {tourSteps.length}</span>
                    <div className="flex gap-1">
                      {tourSteps.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentStep(idx)}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            idx === currentStep 
                              ? 'bg-gold scale-125' 
                              : idx < currentStep 
                                ? 'bg-gold/50 hover:bg-gold/70' 
                                : 'bg-gray-300 hover:bg-gray-400'
                          }`}
                          aria-label={`Go to step ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Icon with arrow pointer */}
                <div className="relative inline-flex mb-6">
                  <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br ${tourSteps[currentStep].iconBg} border-2 ${tourSteps[currentStep].iconBorder} flex items-center justify-center shadow-lg`}>
                    {(() => {
                      const Icon = tourSteps[currentStep].icon;
                      return <Icon className={`w-10 h-10 sm:w-12 sm:h-12 ${tourSteps[currentStep].iconColor}`} />;
                    })()}
                  </div>
                  {/* Animated arrow pointing to icon */}
                  <motion.div 
                    className="absolute -bottom-3 left-1/2 -translate-x-1/2"
                    animate={{ y: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <div className="w-4 h-4 bg-gold rotate-45 shadow-lg" />
                  </motion.div>
                </div>

                <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-black mb-3" style={{ fontFamily: "Poppins, sans-serif" }}>
                  {tourSteps[currentStep].title}
                </h3>
                <p className="text-gray-600 text-sm mb-6 max-w-sm mx-auto leading-relaxed">
                  {tourSteps[currentStep].description}
                </p>

                {/* Direct link button if available */}
                {tourSteps[currentStep].link && (
                  <Link
                    to={tourSteps[currentStep].link}
                    onClick={handleComplete}
                    className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-gold/10 hover:bg-gold/20 border border-gold/30 rounded-lg text-gold text-sm font-medium transition-all group"
                  >
                    {tourSteps[currentStep].linkLabel}
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                )}

                {/* Navigation buttons */}
                <div className="flex gap-3">
                  {currentStep > 0 && (
                    <Button
                      onClick={() => setCurrentStep(currentStep - 1)}
                      variant="outline"
                      className="flex-1 py-4 sm:py-5 border-gray-300 bg-transparent text-black hover:bg-gray-100 rounded-xl group"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-0.5 transition-transform" />
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
                    {currentStep < tourSteps.length - 1 ? (
                      <>
                        Next
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </>
                    ) : (
                      <>
                        Start Exploring
                        <Sparkles className="w-4 h-4 ml-2" />
                      </>
                    )}
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
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold/10 border border-gold/30 rounded-full mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-gold" />
                    <span className="text-gold text-xs font-medium">Quick Reference</span>
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-black mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                    Key Shortcuts
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Here are the main features you'll use
                  </p>
                </div>

                <div className="space-y-2.5 mb-6 max-h-[50vh] overflow-y-auto">
                  {shortcutItems.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.08 }}
                    >
                      {item.link ? (
                        <Link
                          to={item.link}
                          onClick={handleComplete}
                          className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl hover:border-gold/50 hover:bg-gold/5 transition-all group"
                        >
                          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center justify-center flex-shrink-0 group-hover:border-gold/30 transition-colors">
                            <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                          </div>
                          <div className="text-left min-w-0 flex-1">
                            <p className="text-black text-sm font-medium group-hover:text-gold transition-colors">{item.title}</p>
                            <p className="text-gray-500 text-xs truncate">{item.description}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gold group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                        </Link>
                      ) : (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center justify-center flex-shrink-0">
                            <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                          </div>
                          <div className="text-left min-w-0 flex-1">
                            <p className="text-black text-sm font-medium">{item.title}</p>
                            <p className="text-gray-500 text-xs truncate">{item.description}</p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={handleComplete}
                    className="w-full py-4 sm:py-5 bg-black hover:bg-zinc-900 text-gold font-semibold rounded-xl group border border-gold/20"
                  >
                    Start Exploring
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <button
                    onClick={() => {
                      setShowTour('tour');
                      setCurrentStep(0);
                    }}
                    className="w-full py-2.5 text-gray-500 hover:text-gold text-sm transition-colors"
                  >
                    Take the full tour instead
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GuidedTour;