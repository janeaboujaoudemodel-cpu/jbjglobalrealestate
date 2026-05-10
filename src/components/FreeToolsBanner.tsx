import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { X, Sparkles, Gift, Rocket } from "lucide-react";
import { usePopupVisibility } from "@/contexts/PopupCoordinatorContext";

const FREE_TOOLS_BANNER_KEY = "jbj_free_tools_banner_dismissed";
const BANNER_LAST_SHOWN_KEY = "jbj_free_tools_banner_last_shown";
const SHOW_DELAY = 3000; // 3 seconds after page load
const CLOSE_TIMER = 5; // 5 second countdown
const RESHOW_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export default function FreeToolsBanner() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { requestToShow, dismiss, isVisible } = usePopupVisibility('free-tools-banner');
  const [countdown, setCountdown] = useState(CLOSE_TIMER);
  const [canClose, setCanClose] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Check if already dismissed this session or within 24 hours
    const dismissedThisSession = sessionStorage.getItem(FREE_TOOLS_BANNER_KEY);
    const lastShown = localStorage.getItem(BANNER_LAST_SHOWN_KEY);
    
    if (dismissedThisSession) return;
    
    // Check if 24 hours have passed since last shown
    if (lastShown) {
      const timeSinceLastShown = Date.now() - parseInt(lastShown, 10);
      if (timeSinceLastShown < RESHOW_INTERVAL) return;
    }

    // Show popup after 3 seconds
    const showTimer = setTimeout(() => {
      if (!user && !loading) {
        setShouldShow(true);
        requestToShow();
        localStorage.setItem(BANNER_LAST_SHOWN_KEY, Date.now().toString());
      }
    }, SHOW_DELAY);

    return () => clearTimeout(showTimer);
  }, [user, loading, requestToShow]);

  // Countdown timer
  useEffect(() => {
    if (!isVisible) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanClose(true);
    }
  }, [isVisible, countdown]);

  const handleDismiss = useCallback(() => {
    if (!canClose) return;
    dismiss();
    setShouldShow(false);
    sessionStorage.setItem(FREE_TOOLS_BANNER_KEY, "1");
  }, [canClose, dismiss]);

  const handleGetAccess = useCallback(() => {
    dismiss();
    setShouldShow(false);
    sessionStorage.setItem(FREE_TOOLS_BANNER_KEY, "1");
    navigate("/auth?redirect=/broker-toolkit");
  }, [navigate, dismiss]);

  // Don't show if user is logged in or still loading
  if (loading || user || !shouldShow) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Background overlay - 30% dim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-[#1A1A1A]/30 z-40"
            onClick={canClose ? handleDismiss : undefined}
          />

          {/* Pop-up - Perfectly centered on all devices with safe margins */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-[600px] max-h-[90vh] overflow-y-auto"
          >
            <div 
              className="relative rounded-2xl p-6 md:p-8"
              style={{
                boxShadow: `
                  0 0 0 1px rgba(255, 255, 255, 0.15),
                  0 0 0 2px rgba(168, 146, 90, 0.25),
                  0 0 30px rgba(255, 255, 255, 0.12),
                  0 0 60px rgba(168, 146, 90, 0.2),
                  0 30px 60px -15px rgba(0, 0, 0, 0.6)
                `,
                background: `
                  linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 30%, transparent 60%),
                  linear-gradient(135deg, #1f1f1f 0%, #0e0e0e 50%, #1a1a1a 100%)
                `
              }}
            >
              {/* Premium white edge glow overlay */}
              <div 
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  boxShadow: `
                    inset 0 1px 0 rgba(255,255,255,0.2),
                    inset 0 0 20px rgba(255,255,255,0.03),
                    0 0 25px rgba(255,255,255,0.08)
                  `,
                  border: "1px solid rgba(255,255,255,0.08)"
                }}
              />

              {/* Close button - only active after timer */}
              <button
                onClick={handleDismiss}
                disabled={!canClose}
                className={`absolute top-4 right-4 z-10 p-1 rounded-full transition-all duration-300 ${
                  canClose 
                    ? "text-[#1A1A1A]/70 hover:text-white hover:bg-[#FDFBF7]/10 cursor-pointer" 
                    : "text-[#1A1A1A]/70 cursor-not-allowed opacity-50"
                }`}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Content */}
              <div className="relative">
                {/* Icon row */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-lg shadow-gold/30">
                    <Gift className="w-6 h-6 text-[#1A1A1A]" />
                  </div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1.5 bg-[#EFE6D6]/20 text-[#1A1A1A] text-xs font-bold rounded-full flex items-center gap-1.5 border border-[#B89555]/40 shadow-sm shadow-gold/20">
                      <Sparkles className="w-3.5 h-3.5" />
                      FREE
                    </span>
                  </div>
                </div>

                {/* Limited time badge with pulsing gold glow every 2 seconds */}
                <motion.div 
                  animate={{ 
                    boxShadow: [
                      "0 0 8px rgba(168, 146, 90, 0.2)",
                      "0 0 25px rgba(168, 146, 90, 0.6)",
                      "0 0 8px rgba(168, 146, 90, 0.2)"
                    ]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/50 rounded-full mb-4"
                >
                  <span className="text-emerald-400 text-xs font-bold tracking-wide uppercase">Limited Time Offer</span>
                </motion.div>

                {/* Headline - brighter with enhanced glow */}
                <h3 
                  className="font-bold text-xl md:text-2xl mb-3 leading-tight"
                  style={{ 
                    color: "#ffffff",
                    textShadow: "0 0 30px rgba(255,255,255,0.2), 0 0 60px rgba(255,255,255,0.1)"
                  }}
                >
                  Unlock $10,000+ Worth of AI Tools — FREE
                </h3>

                {/* Description */}
                <p className="text-gray-200 text-sm md:text-base mb-6 leading-relaxed">
                  Software that costs thousands yearly — now{" "}
                  <span className="text-emerald-400 font-semibold">completely free</span>{" "}
                  for JBJ Global Real Estate members. Access AI assistants, tools, and more.
                </p>

                {/* CTA Button with expanding gold glow on hover */}
                <motion.div
                  whileHover={{ 
                    scale: 1.02,
                    boxShadow: "0 0 40px rgba(168, 146, 90, 0.5)"
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-lg"
                >
                  <Button
                    onClick={handleGetAccess}
                    className="w-full bg-gradient-to-r from-gold via-gold-dark to-gold text-[#1A1A1A] font-bold text-base py-6 hover:brightness-110 transition-all duration-300 shadow-lg shadow-gold/40 hover:shadow-xl hover:shadow-gold/50"
                    size="lg"
                  >
                    <Rocket className="w-5 h-5 mr-2" />
                    Get Free Access Now
                  </Button>
                </motion.div>

                {/* Footer note */}
                <p className="text-[#1A1A1A] text-xs text-center mt-4 font-medium opacity-90">
                  No credit card required · Join 5,000+ members already using JBJ tools daily
                </p>

                {/* Countdown timer - positioned bottom-right */}
                <div className="flex justify-end mt-4">
                  {!canClose ? (
                    <p className="text-white/90 text-xs">
                      You can close this window in{" "}
                      <span className="text-[#1A1A1A] font-bold">{countdown}</span>{" "}
                      {countdown === 1 ? "second" : "seconds"}…
                    </p>
                  ) : (
                    <p className="text-white/70 text-xs font-medium">
                      You may now close this window.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
