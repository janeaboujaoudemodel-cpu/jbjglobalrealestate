import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  ListPlus, 
  Award, 
  Sparkles, 
  ArrowRight, 
  X, 
  ChevronUp,
  Trophy,
  Compass,
  Send
} from "lucide-react";

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
      description: "Rank your top 3 choices with Gold, Silver, and Bronze badges. Mark your #1 choice to prioritize your investment decision."
    },
    {
      icon: Sparkles,
      iconColor: "text-purple-400",
      iconBg: "from-purple-500/20 to-purple-600/10",
      iconBorder: "border-purple-500/30",
      title: "AI Analysis",
      description: "Select 2-3 properties and unlock AI-powered investment analysis. Get detailed comparisons on ROI, location value, and market trends."
    },
    {
      icon: Send,
      iconColor: "text-emerald-400",
      iconBg: "from-emerald-500/20 to-emerald-600/10",
      iconBorder: "border-emerald-500/30",
      title: "Connect with JJ Global Capital",
      description: "Submit your curated selection directly to our investment advisors. Book consultations and finalize your UAE property investment."
    }
  ];

  const shortcutItems = [
    {
      icon: ChevronUp,
      iconColor: "text-zinc-400",
      title: "Scroll to Top",
      description: "Quick navigation button to return to the top of any page"
    },
    {
      icon: Heart,
      iconColor: "text-red-500",
      title: "Favorites",
      description: "Save unlimited properties to your personal collection"
    },
    {
      icon: ListPlus,
      iconColor: "text-gold",
      title: "Shortlist",
      description: "Select up to 5 properties for comparison"
    },
    {
      icon: Trophy,
      iconColor: "text-gold",
      title: "Top 1, 2, 3 Badges",
      description: "Rank your shortlisted properties with medal badges"
    },
    {
      icon: Sparkles,
      iconColor: "text-purple-400",
      title: "AI Analysis",
      description: "Intelligent comparison of 2-3 selected properties"
    }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-gradient-to-b from-zinc-900 via-black to-zinc-950 border border-gold/30 rounded-3xl overflow-hidden shadow-2xl shadow-gold/10"
        >
          {/* Close button */}
          <button
            onClick={handleComplete}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-zinc-800/50 hover:bg-zinc-700/50 transition-colors"
          >
            <X className="w-4 h-4 text-zinc-400" />
          </button>

          {/* Premium top accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />
          
          {/* Ambient glow */}
          <div 
            className="absolute top-0 left-0 right-0 h-40 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 50% -20%, hsl(40 32% 51% / 0.3) 0%, transparent 70%)`
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
                <div className="relative inline-flex mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold via-[hsl(40_45%_55%)] to-gold-dark flex items-center justify-center shadow-2xl shadow-gold/40">
                    <Compass className="w-10 h-10 text-black" />
                  </div>
                  <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-gold animate-pulse" />
                </div>

                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3" style={{ fontFamily: "Poppins, sans-serif" }}>
                  How Would You Like to Start?
                </h2>
                <p className="text-zinc-400 text-sm mb-8 max-w-sm mx-auto">
                  Take a quick guided tour to master the platform, or explore on your own
                </p>

                <div className="space-y-3">
                  <Button
                    onClick={handleTakeTour}
                    className="w-full py-6 bg-gradient-to-r from-gold via-[hsl(40_45%_55%)] to-gold text-black hover:opacity-95 font-bold text-base shadow-xl shadow-gold/30 rounded-xl group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    <Compass className="w-5 h-5 mr-3 relative z-10" />
                    <span className="flex-1 text-left relative z-10">Take a Quick Tour</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                  </Button>

                  <Button
                    onClick={handleExploreAlone}
                    variant="outline"
                    className="w-full py-6 border-zinc-700 bg-zinc-900/50 text-white hover:bg-zinc-800 hover:border-gold/50 group rounded-xl transition-all"
                  >
                    <span className="flex-1 text-left">Explore by Myself</span>
                    <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-gold group-hover:translate-x-1 transition-all" />
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
                            : 'w-3 bg-zinc-700'
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

                <h3 className="text-xl md:text-2xl font-bold text-white mb-3" style={{ fontFamily: "Poppins, sans-serif" }}>
                  {tourSteps[currentStep].title}
                </h3>
                <p className="text-zinc-400 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
                  {tourSteps[currentStep].description}
                </p>

                <div className="flex gap-3">
                  {currentStep > 0 && (
                    <Button
                      onClick={() => setCurrentStep(currentStep - 1)}
                      variant="outline"
                      className="flex-1 py-5 border-zinc-700 bg-zinc-900/50 text-white hover:bg-zinc-800 rounded-xl"
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
                    className="flex-1 py-5 bg-gradient-to-r from-gold to-gold-dark text-black font-bold rounded-xl group"
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
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                    Great! Quick Overview
                  </h3>
                  <p className="text-zinc-400 text-sm">
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
                      className="flex items-center gap-4 p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl"
                    >
                      <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                        <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                      </div>
                      <div className="text-left">
                        <p className="text-white text-sm font-medium">{item.title}</p>
                        <p className="text-zinc-500 text-xs">{item.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <Button
                  onClick={handleComplete}
                  className="w-full py-5 bg-gradient-to-r from-gold to-gold-dark text-black font-bold rounded-xl group"
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
