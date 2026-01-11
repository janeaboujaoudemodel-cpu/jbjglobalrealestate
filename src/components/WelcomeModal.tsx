import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { User, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePopupVisibility } from "@/contexts/PopupCoordinatorContext";
import GuidedTour from "./GuidedTour";
import jbjMonogramTransparent from "@/assets/jbj-monogram-transparent.png";

const WELCOME_MODAL_KEY = "jj_welcome_shown";
const RETURNING_USER_KEY = "jj_returning_user";

const WelcomeModal = () => {
  const { requestToShow, dismiss, isVisible } = usePopupVisibility('welcome-modal');
  const [showTour, setShowTour] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
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
      setShouldShow(true);
      requestToShow();
    }, 500);
    return () => clearTimeout(timer);
  }, [location.pathname, requestToShow]);

  const handleClose = () => {
    localStorage.setItem(WELCOME_MODAL_KEY, "true");
    localStorage.setItem(RETURNING_USER_KEY, "true");
    dismiss();
    setShouldShow(false);
  };

  const handleContinueAsGuest = () => {
    localStorage.setItem(WELCOME_MODAL_KEY, "true");
    localStorage.setItem(RETURNING_USER_KEY, "true");
    dismiss();
    setShouldShow(false);
    setShowTour(true);
  };

  const handleLogin = () => {
    localStorage.setItem(WELCOME_MODAL_KEY, "true");
    localStorage.setItem(RETURNING_USER_KEY, "true");
    dismiss();
    setShouldShow(false);
    navigate("/auth");
  };

  const handleTourClose = () => {
    setShowTour(false);
  };

  if (!shouldShow) return <GuidedTour isOpen={showTour} onClose={handleTourClose} />;

  return (
    <>
      <Dialog
        open={isVisible}
        onOpenChange={(open) => {
          if (!open) {
            handleClose();
          }
        }}
      >
        <DialogContent 
          className="bg-black/95 backdrop-blur-xl border border-gold/30 text-white max-w-md p-0 overflow-hidden shadow-2xl rounded-2xl"
          dir={isRTL ? 'rtl' : 'ltr'}
          aria-describedby={undefined}
        >
          <VisuallyHidden.Root>
            <DialogTitle>Welcome to JBJ Global Real Estate</DialogTitle>
          </VisuallyHidden.Root>
          
          {/* Dark luxury background overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black" />
          
          {/* Gold accent at top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />
          
          {/* Subtle ambient gold glow */}
          <div 
            className="absolute top-0 left-0 right-0 h-64 pointer-events-none opacity-30"
            style={{
              background: `radial-gradient(ellipse at 50% 0%, hsl(40 32% 51% / 0.5) 0%, transparent 70%)`
            }}
          />

          {/* Corner accents - gold */}
          <div className="absolute top-6 left-6 w-10 h-10 border-l-2 border-t-2 border-gold/50" />
          <div className="absolute top-6 right-6 w-10 h-10 border-r-2 border-t-2 border-gold/50" />
          <div className="absolute bottom-6 left-6 w-10 h-10 border-l-2 border-b-2 border-gold/40" />
          <div className="absolute bottom-6 right-6 w-10 h-10 border-r-2 border-b-2 border-gold/40" />

          <div className="relative px-10 py-14">
            {/* Transparent Logo - Larger and Centered */}
            <div className="flex justify-center mb-8">
              <img 
                src={jbjMonogramTransparent} 
                alt="JBJ Global Real Estate" 
                className="h-32 md:h-40 w-auto object-contain"
              />
            </div>

            {/* Full Company Name - Large and Prominent */}
            <div className="text-center mb-6">
              <h2 
                className="text-2xl md:text-3xl font-bold tracking-[0.15em] text-gold uppercase mb-4"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                JBJ Global Real Estate
              </h2>
            </div>

            {/* Welcome Title */}
            <div className="text-center mb-8">
              <h3
                className="text-xl md:text-2xl font-semibold mb-4 tracking-tight text-white"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Welcome to JBJ Global Real Estate
              </h3>
              <p className="text-zinc-400 text-base leading-relaxed max-w-sm mx-auto">
                Your Gateway to{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-[hsl(40_50%_55%)] to-gold font-semibold">
                  Exclusive Real Estate Opportunities
                </span>
              </p>
            </div>

            {/* Refined gold divider */}
            <div className="relative h-px mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
              <div className="absolute left-1/2 -translate-x-1/2 -top-1.5 w-3 h-3 bg-gold/80 rotate-45" />
            </div>

            {/* Action Buttons - White background for primary, Gold outline for secondary */}
            <div className="space-y-4">
              {/* Primary Button - White background with gold text */}
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleLogin();
                }}
                type="button"
                className="w-full py-6 bg-white hover:bg-zinc-100 text-black font-bold text-base shadow-xl rounded-xl group relative overflow-hidden transition-all duration-300 border border-gold/40"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <User className="w-5 h-5 mr-3 relative z-10 text-gold" strokeWidth={2} />
                <span className="flex-1 text-left relative z-10">Sign In / Create Account</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10 text-gold" strokeWidth={2} />
              </Button>

              {/* Secondary Button - Gold outline */}
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleContinueAsGuest();
                }}
                type="button"
                variant="outline"
                className="w-full py-6 border-2 border-gold bg-transparent text-gold hover:bg-gold/10 hover:text-gold group rounded-xl transition-all duration-300 font-bold"
              >
                <span className="flex-1 text-left">Continue as Guest</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-all" strokeWidth={2} />
              </Button>
            </div>

            {/* Footer text with copyright */}
            <p className="text-center text-zinc-500 text-xs mt-8">
              © {new Date().getFullYear()} JBJ Global Real Estate. All Rights Reserved.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <GuidedTour isOpen={showTour} onClose={handleTourClose} />
    </>
  );
};

export default WelcomeModal;
