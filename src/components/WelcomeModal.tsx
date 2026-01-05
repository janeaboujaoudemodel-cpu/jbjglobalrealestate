import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { User, ArrowRight, Crown, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import GuidedTour from "./GuidedTour";

const WELCOME_MODAL_KEY = "jj_welcome_shown";
const RETURNING_USER_KEY = "jj_returning_user";

const WelcomeModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isRTL } = useLanguage();

  useEffect(() => {
    if (location.pathname !== "/") return;

    const hasSeenWelcome = localStorage.getItem(WELCOME_MODAL_KEY);
    const isReturning = localStorage.getItem(RETURNING_USER_KEY);

    if (hasSeenWelcome) {
      if (!isReturning) {
        localStorage.setItem(RETURNING_USER_KEY, "true");
      }
      return;
    }

    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const handleClose = () => {
    localStorage.setItem(WELCOME_MODAL_KEY, "true");
    localStorage.setItem(RETURNING_USER_KEY, "true");
    setIsOpen(false);
  };

  const handleContinueAsGuest = () => {
    localStorage.setItem(WELCOME_MODAL_KEY, "true");
    localStorage.setItem(RETURNING_USER_KEY, "true");
    setIsOpen(false);
    setShowTour(true);
  };

  const handleLogin = () => {
    localStorage.setItem(WELCOME_MODAL_KEY, "true");
    localStorage.setItem(RETURNING_USER_KEY, "true");
    setIsOpen(false);
    navigate("/auth");
  };

  const handleTourClose = () => {
    setShowTour(false);
    // Tour completed - user stays on homepage, no modal reopens
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleClose();
          }
        }}
      >
        <DialogContent 
          className="bg-white border-0 text-zinc-900 max-w-md p-0 overflow-hidden shadow-2xl"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {/* Premium white background */}
          <div className="absolute inset-0 bg-gradient-to-b from-white via-zinc-50 to-white" />
          
          {/* Gold accent at top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />
          
          {/* Subtle ambient glow */}
          <div 
            className="absolute top-0 left-0 right-0 h-64 pointer-events-none opacity-30"
            style={{
              background: `radial-gradient(ellipse at 50% 0%, hsl(40 32% 51% / 0.3) 0%, transparent 70%)`
            }}
          />

          {/* Corner accents - refined gold */}
          <div className="absolute top-6 left-6 w-8 h-8 border-l border-t border-gold/40" />
          <div className="absolute top-6 right-6 w-8 h-8 border-r border-t border-gold/40" />
          <div className="absolute bottom-6 left-6 w-8 h-8 border-l border-b border-gold/25" />
          <div className="absolute bottom-6 right-6 w-8 h-8 border-r border-b border-gold/25" />

          <div className="relative px-10 py-14">
            {/* Premium Icon */}
            <div className="text-center mb-10">
              <div className="relative inline-flex">
                <div className="absolute inset-0 w-24 h-24 -m-2 rounded-full border border-gold/20" />
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-gold via-[hsl(40_42%_50%)] to-[hsl(40_35%_40%)] flex items-center justify-center shadow-xl shadow-gold/30">
                  <div className="absolute inset-0.5 rounded-full bg-gradient-to-br from-white/20 via-transparent to-transparent" />
                  <Crown className="w-9 h-9 text-white relative z-10" strokeWidth={1.5} />
                </div>
                <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-gold" />
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-10">
              <h2
                className="text-3xl md:text-4xl font-semibold mb-5 tracking-tight text-zinc-900"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Welcome to JJ<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-[hsl(40_50%_45%)] to-gold">
                  Global Capital
                </span>
              </h2>
              <p className="text-zinc-600 text-base leading-relaxed max-w-xs mx-auto">
                Your gateway to global real estate investments with expertise in the UAE market
              </p>
            </div>

            {/* Refined divider */}
            <div className="relative h-px mb-10">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
              <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-gold/60 rotate-45" />
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleLogin();
                }}
                type="button"
                className="w-full py-6 bg-gradient-to-r from-gold via-[hsl(40_42%_52%)] to-gold text-white hover:opacity-95 font-semibold text-base shadow-lg shadow-gold/30 rounded-lg group relative overflow-hidden transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <User className="w-5 h-5 mr-3 relative z-10" strokeWidth={1.5} />
                <span className="flex-1 text-left relative z-10">Sign In / Create Account</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" strokeWidth={1.5} />
              </Button>

              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleContinueAsGuest();
                }}
                type="button"
                variant="outline"
                className="w-full py-6 border-zinc-300 bg-transparent text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 hover:border-gold/50 group rounded-lg transition-all duration-300"
              >
                <span className="flex-1 text-left">Continue as Guest</span>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-gold group-hover:translate-x-1 transition-all" strokeWidth={1.5} />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <GuidedTour isOpen={showTour} onClose={handleTourClose} />
    </>
  );
};

export default WelcomeModal;
