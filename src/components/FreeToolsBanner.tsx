import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { X, Sparkles, Gift, Rocket } from "lucide-react";

const FREE_TOOLS_BANNER_KEY = "jj_free_tools_banner_dismissed";
const SCROLL_THRESHOLD = 400; // Show after scrolling 400px

export default function FreeToolsBanner() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed this session
    const dismissed = sessionStorage.getItem(FREE_TOOLS_BANNER_KEY);
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    const handleScroll = () => {
      if (window.scrollY > SCROLL_THRESHOLD && !isDismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isDismissed]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    sessionStorage.setItem(FREE_TOOLS_BANNER_KEY, "1");
  };

  const handleGetAccess = () => {
    handleDismiss();
    navigate("/auth?redirect=" + encodeURIComponent(window.location.pathname));
  };

  // Don't show if user is logged in or still loading
  if (loading || user || isDismissed) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50"
        >
          <div className="relative bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border border-gold/30 rounded-2xl p-5 shadow-2xl shadow-gold/10">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-zinc-500 hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-gold/5 via-transparent to-gold/5 rounded-2xl pointer-events-none" />

            {/* Content */}
            <div className="relative">
              {/* Icon row */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
                  <Gift className="w-5 h-5 text-black" />
                </div>
                <div className="flex gap-1">
                  <span className="px-2 py-1 bg-gold/10 text-gold text-xs font-medium rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    FREE
                  </span>
                </div>
              </div>

              {/* Limited time badge */}
              <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full mb-2">
                <span className="text-emerald-400 text-xs font-semibold">LIMITED TIME OFFER</span>
              </div>

              {/* Headline */}
              <h3 className="text-white font-bold text-lg mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                Unlock $10,000+ Worth of AI Tools — FREE
              </h3>

              {/* Description */}
              <p className="text-zinc-400 text-sm mb-4 leading-relaxed">
                Software that costs thousands yearly — now <span className="text-emerald-400 font-semibold">completely free</span> for JBJ members. 
                AI assistants, property tools, documents & more.
              </p>

              {/* CTA */}
              <Button
                onClick={handleGetAccess}
                className="w-full bg-gradient-to-r from-gold to-gold-dark text-black font-semibold hover:brightness-110 transition-all"
                size="lg"
              >
                <Rocket className="w-4 h-4 mr-2" />
                Get Free Access Now
              </Button>

              {/* Footer note */}
              <p className="text-zinc-600 text-xs text-center mt-3">
                No credit card required • Join 5,000+ members
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
