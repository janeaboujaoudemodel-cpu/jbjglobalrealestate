import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WALKTHROUGH_KEY = 'jj_mobile_walkthrough_done';

interface WalkthroughStep {
  targetId: string;
  label: string;
  description: string;
}

const STEPS: WalkthroughStep[] = [
  { 
    targetId: 'mobile-guides', 
    label: 'Guides Library', 
    description: 'Find all buyer, seller, tenant, and landlord guides here' 
  },
  { 
    targetId: 'mobile-favorites', 
    label: 'Favorites', 
    description: 'Save and compare your favorite properties' 
  },
  { 
    targetId: 'mobile-sitemap', 
    label: 'Sitemap', 
    description: 'Browse all pages on one screen' 
  },
];

interface MobileMenuWalkthroughProps {
  isOpen: boolean;
  onComplete: () => void;
  onClose: () => void;
}

const MobileMenuWalkthrough = ({ isOpen, onComplete, onClose }: MobileMenuWalkthroughProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const updateTargetPosition = useCallback(() => {
    if (!isOpen) return;
    const step = STEPS[currentStep];
    const target = document.querySelector(`[data-walkthrough-id="${step.targetId}"]`);
    if (target) {
      setTargetRect(target.getBoundingClientRect());
      // Scroll target into view
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentStep, isOpen]);

  useEffect(() => {
    updateTargetPosition();
    window.addEventListener('resize', updateTargetPosition);
    return () => window.removeEventListener('resize', updateTargetPosition);
  }, [updateTargetPosition]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem(WALKTHROUGH_KEY, 'true');
    setCurrentStep(0);
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem(WALKTHROUGH_KEY, 'true');
    setCurrentStep(0);
    onClose();
  };

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#1A1A1A]/60 z-[10001]"
            onClick={handleSkip}
          />

          {/* Spotlight Cutout - highlights the target */}
          {targetRect && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed z-[10002] pointer-events-none"
              style={{
                top: targetRect.top - 8,
                left: targetRect.left - 8,
                width: targetRect.width + 16,
                height: targetRect.height + 16,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
                borderRadius: '12px',
                border: '2px solid hsl(var(--gold))',
              }}
            />
          )}

          {/* Arrow and Tooltip */}
          {targetRect && (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed z-[10003]"
              style={{
                top: targetRect.bottom + 16,
                left: Math.max(16, Math.min(targetRect.left, window.innerWidth - 280)),
                width: 260,
              }}
            >
              {/* Arrow pointing up */}
              <div 
                className="absolute -top-2 w-4 h-4 bg-gradient-to-br from-[#F7F1E6] to-[#D8C7A6] rotate-45 border-l border-t border-[#B89555]/40"
                style={{ left: Math.min(targetRect.left + targetRect.width / 2 - 8, 240) }}
              />
              
              {/* Tooltip Card */}
              <div 
                className="relative rounded-xl p-4 border-2 border-[#B89555]/40 shadow-2xl"
                style={{ background: 'linear-gradient(135deg, #F7F1E6 0%, #ECE2D2 50%, #D8C7A6 100%)' }}
              >
                {/* Close button */}
                <button
                  onClick={handleSkip}
                  className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-[#EFE6D6]/20 transition-colors"
                >
                  <X className="w-4 h-4 text-[#1A1A1A]/70" />
                </button>

                {/* Step indicator */}
                <div className="flex items-center gap-1 mb-2">
                  {STEPS.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === currentStep 
                          ? 'w-6 bg-[#EFE6D6]' 
                          : idx < currentStep 
                            ? 'w-2 bg-[#EFE6D6]/60' 
                            : 'w-2 bg-[#EFE6D6]/30'
                      }`}
                    />
                  ))}
                </div>

                {/* Content */}
                <h4 className="text-[#1A1A1A] font-bold text-sm mb-1 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-[#1A1A1A]" />
                  {step.label}
                </h4>
                <p className="text-[#1A1A1A]/70 text-xs mb-4">
                  {step.description}
                </p>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleSkip}
                    className="text-xs text-white/90 hover:text-[#1A1A1A] transition-colors"
                  >
                    Skip tour
                  </button>
                  <Button
                    onClick={handleNext}
                    size="sm"
                    className="bg-[#1A1A1A] hover:bg-[#1A1A1A]/90 text-white text-xs px-4"
                  >
                    {isLastStep ? 'Done' : 'Next'}
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileMenuWalkthrough;

// Hook to check if walkthrough should auto-start
export const useAutoWalkthrough = () => {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Check if walkthrough has been completed
    const done = localStorage.getItem(WALKTHROUGH_KEY);
    if (!done) {
      // Delay to allow menu to fully render
      const timer = setTimeout(() => {
        setShouldShow(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const resetWalkthrough = () => {
    localStorage.removeItem(WALKTHROUGH_KEY);
    setShouldShow(true);
  };

  return { shouldShow, setShouldShow, resetWalkthrough };
};
