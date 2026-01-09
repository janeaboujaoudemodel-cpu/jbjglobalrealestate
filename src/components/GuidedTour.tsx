import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  ListPlus, 
  Sparkles, 
  ArrowRight, 
  X, 
  ChevronUp,
  Trophy,
  Compass,
  Send,
  FileSearch,
  TrendingUp,
  Calculator,
  Brain
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

  const tourSteps = [
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
      icon: FileSearch,
      iconColor: "text-cyan-500",
      iconBg: "from-cyan-500/20 to-cyan-600/10",
      iconBorder: "border-cyan-500/30",
      title: "JBJ Scan & Sign Documents",
      description: "Upload contracts, crop edges, add digital signatures, and auto-fill form fields. Manage all your investment documents digitally."
    },
    {
      icon: TrendingUp,
      iconColor: "text-emerald-500",
      iconBg: "from-emerald-500/20 to-emerald-600/10",
      iconBorder: "border-emerald-500/30",
      title: "JBJ Rental Index Tool",
      description: "Discover highest-performing areas for rental ROI. Compare short-term vs long-term rentals and get property valuation estimates."
    },
    {
      icon: Calculator,
      iconColor: "text-orange-500",
      iconBg: "from-orange-500/20 to-orange-600/10",
      iconBorder: "border-orange-500/30",
      title: "Mortgage Calculator",
      description: "Calculate monthly payments, down payments, and connect with our mortgage advisors for personalized financing solutions."
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
      icon: FileSearch,
      iconColor: "text-cyan-500",
      title: "JBJ Scan & Sign",
      description: "Scan, sign, and manage investment documents"
    },
    {
      icon: TrendingUp,
      iconColor: "text-emerald-500",
      title: "Rental Index",
      description: "Find highest ROI areas for rental investments"
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
          className="relative w-full max-w-lg bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xl"
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

          <div className="relative p-8">
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

                <h2 className="text-2xl md:text-3xl font-semibold text-black mb-3" style={{ fontFamily: "Poppins, sans-serif" }}>
                  How Would You Like to Start?
                </h2>
                <p className="text-gray-600 text-sm mb-8 max-w-sm mx-auto">
                  Take a quick guided tour to master the platform, or explore on your own
                </p>

                <div className="space-y-3">
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleTakeTour();
                    }}
                    type="button"
                    className="w-full py-6 bg-black hover:bg-zinc-900 text-gold font-semibold text-base shadow-xl rounded-xl group relative overflow-hidden border border-gold/20"
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
                    className="w-full py-6 border-gray-300 bg-transparent text-black hover:bg-gray-100 hover:border-gold/50 group rounded-xl transition-all"
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
                {/* Step indicator */}
                <div className="flex justify-center gap-2 mb-6">
                  {tourSteps.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === currentStep 
                          ? 'w-8 bg-gold' 
                          : idx < currentStep 
                            ? 'w-3 bg-gold/50' 
                            : 'w-3 bg-gray-300'
                      }`}
                    />
                  ))}
                </div>

                <div className="relative inline-flex mb-6">
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${tourSteps[currentStep].iconBg} border ${tourSteps[currentStep].iconBorder} flex items-center justify-center shadow-lg`}>
                    {(() => {
                      const Icon = tourSteps[currentStep].icon;
                      return <Icon className={`w-10 h-10 ${tourSteps[currentStep].iconColor}`} />;
                    })()}
                  </div>
                </div>

                <h3 className="text-xl md:text-2xl font-semibold text-black mb-3" style={{ fontFamily: "Poppins, sans-serif" }}>
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
                      className="flex-1 py-5 border-gray-300 bg-transparent text-black hover:bg-gray-100 rounded-xl"
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
                    className="flex-1 py-5 bg-black hover:bg-zinc-900 text-gold font-semibold rounded-xl group border border-gold/20"
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
                  <h3 className="text-xl md:text-2xl font-semibold text-black mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                    Great! Quick Overview
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Here are the key shortcuts you'll use
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  {shortcutItems.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center gap-4 p-3 bg-gray-50 border border-gray-200 rounded-xl"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center justify-center flex-shrink-0">
                        <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                      </div>
                      <div className="text-left">
                        <p className="text-black text-sm font-medium">{item.title}</p>
                        <p className="text-gray-500 text-xs">{item.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <Button
                  onClick={handleComplete}
                  className="w-full py-5 bg-black hover:bg-zinc-900 text-gold font-semibold rounded-xl group border border-gold/20"
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
