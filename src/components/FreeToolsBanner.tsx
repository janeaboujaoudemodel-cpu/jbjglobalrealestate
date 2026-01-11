import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { X, Sparkles, Gift, Rocket } from "lucide-react";

const FREE_TOOLS_BANNER_KEY = "jbj_free_tools_banner_dismissed";
const BANNER_LAST_SHOWN_KEY = "jbj_free_tools_banner_last_shown";
const SHOW_DELAY = 3000; // 3 seconds after page load
const CLOSE_TIMER = 5; // 5 second countdown
const RESHOW_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export default function FreeToolsBanner() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [countdown, setCountdown] = useState(CLOSE_TIMER);
  const [canClose, setCanClose] = useState(false);

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
        setIsVisible(true);
        localStorage.setItem(BANNER_LAST_SHOWN_KEY, Date.now().toString());
      }
    }, SHOW_DELAY);

    return () => clearTimeout(showTimer);
  }, [user, loading]);

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
    setIsVisible(false);
    sessionStorage.setItem(FREE_TOOLS_BANNER_KEY, "1");
  }, [canClose]);

  const handleGetAccess = useCallback(() => {
    setIsVisible(false);
    sessionStorage.setItem(FREE_TOOLS_BANNER_KEY, "1");
    navigate("/auth?redirect=/broker-toolkit");
  }, [navigate]);

  // Don't show if user is logged in or still loading
  if (loading || user) return null;

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
            className="fixed inset-0 bg-black/30 z-40"
            onClick={canClose ? handleDismiss : undefined}
          />

          {/* Pop-up */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-[600px] md:max-w-[650px]"
            style={{ marginBottom: "60px" }} // Space for JBJ Support chat
          >
            <div 
              className="relative bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 rounded-2xl p-6 md:p-8"
              style={{
                boxShadow: `
                  0 0 0 1px rgba(168, 146, 90, 0.3),
                  0 0 20px rgba(255, 255, 255, 0.1),
                  0 0 40px rgba(168, 146, 90, 0.15),
                  0 25px 50px -12px rgba(0, 0, 0, 0.5)
                `,
                background: `
                  linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 40%),
                  linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 50%, #1a1a1a 100%)
                `
              }}
            >
              {/* White edge glow */}
              <div 
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 0 15px rgba(255,255,255,0.05)"
                }}
              />

              {/* Close button - only active after timer */}
              <button
                onClick={handleDismiss}
                disabled={!canClose}
                className={`absolute top-4 right-4 transition-all duration-300 ${
                  canClose 
                    ? "text-zinc-400 hover:text-white cursor-pointer" 
                    : "text-zinc-700 cursor-not-allowed"
                }`}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Content */}
              <div className="relative">
                {/* Icon row */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-lg shadow-gold/20">
                    <Gift className="w-6 h-6 text-black" />
                  </div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1.5 bg-gold/15 text-gold text-xs font-semibold rounded-full flex items-center gap-1.5 border border-gold/30">
                      <Sparkles className="w-3.5 h-3.5" />
                      FREE
                    </span>
                  </div>
                </div>

                {/* Limited time badge with pulsing glow */}
                <motion.div 
                  animate={{ 
                    boxShadow: [
                      "0 0 10px rgba(168, 146, 90, 0.3)",
                      "0 0 20px rgba(168, 146, 90, 0.5)",
                      "0 0 10px rgba(168, 146, 90, 0.3)"
                    ]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/40 rounded-full mb-4"
                >
                  <span className="text-emerald-400 text-xs font-bold tracking-wide">LIMITED TIME OFFER</span>
                </motion.div>

                {/* Headline - increased brightness */}
                <h3 
                  className="text-white font-bold text-xl md:text-2xl mb-3 leading-tight"
                  style={{ 
                    fontFamily: "Poppins, sans-serif",
                    textShadow: "0 0 20px rgba(255,255,255,0.1)"
                  }}
                >
                  Unlock $10,000+ Worth of AI Tools — FREE
                </h3>

                {/* Description */}
                <p className="text-zinc-300 text-sm md:text-base mb-6 leading-relaxed">
                  Software that costs thousands yearly — now{" "}
                  <span className="text-emerald-400 font-semibold">completely free</span>{" "}
                  for JBJ Global Real Estate members. Access AI assistants, tools, and more.
                </p>

                {/* CTA Button with hover glow */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handleGetAccess}
                    className="w-full bg-gradient-to-r from-gold to-gold-dark text-black font-bold text-base py-6 hover:brightness-110 transition-all shadow-lg shadow-gold/30 hover:shadow-xl hover:shadow-gold/40"
                    size="lg"
                  >
                    <Rocket className="w-5 h-5 mr-2" />
                    Get Free Access Now
                  </Button>
                </motion.div>

                {/* Footer note */}
                <p className="text-gold/80 text-xs text-center mt-4 font-medium">
                  No credit card required · Join 5,000+ members
                </p>

                {/* Countdown timer */}
                <div className="text-center mt-4">
                  {!canClose ? (
                    <p className="text-zinc-500 text-xs">
                      You can close this window in{" "}
                      <span className="text-gold font-semibold">{countdown}</span>{" "}
                      {countdown === 1 ? "second" : "seconds"}…
                    </p>
                  ) : (
                    <p className="text-zinc-400 text-xs">
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
