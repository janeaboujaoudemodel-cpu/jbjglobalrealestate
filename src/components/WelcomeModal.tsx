import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { User, ArrowRight, Compass } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePopupVisibility } from "@/contexts/PopupCoordinatorContext";
import jbjMonogramLightTransparent from "@/assets/jbj-monogram-light-transparent.png";

const WELCOME_MODAL_KEY = "jj_welcome_shown";
const RETURNING_USER_KEY = "jj_returning_user";

const WelcomeModal = () => {
  const { requestToShow, dismiss, isVisible } = usePopupVisibility('welcome-modal');
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

  const handleLogin = () => {
    localStorage.setItem(WELCOME_MODAL_KEY, "true");
    localStorage.setItem(RETURNING_USER_KEY, "true");
    dismiss();
    setShouldShow(false);
    navigate("/auth");
  };

  const handleExplore = () => {
    localStorage.setItem(WELCOME_MODAL_KEY, "true");
    localStorage.setItem(RETURNING_USER_KEY, "true");
    dismiss();
    setShouldShow(false);
  };

  if (!shouldShow) return null;

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
          className="bg-[#1A1A1A]/95 backdrop-blur-xl border border-[#B89555]/30 text-white max-w-md p-0 overflow-hidden shadow-2xl rounded-2xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto overscroll-contain"
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
          <div className="absolute top-6 left-6 w-10 h-10 border-l-2 border-t-2 border-[#B89555]/50" />
          <div className="absolute top-6 right-6 w-10 h-10 border-r-2 border-t-2 border-[#B89555]/50" />
          <div className="absolute bottom-6 left-6 w-10 h-10 border-l-2 border-b-2 border-[#B89555]/40" />
          <div className="absolute bottom-6 right-6 w-10 h-10 border-r-2 border-b-2 border-[#B89555]/40" />

          <div className="relative px-6 sm:px-10 py-8 sm:py-14">
            {/* Transparent Logo - Larger and Centered */}
            <div className="flex justify-center mb-6">
              <img 
                src={jbjMonogramLightTransparent} 
                alt="JBJ Global Real Estate" 
                className="h-36 md:h-44 w-auto object-contain"
               loading="lazy" decoding="async" />
            </div>

            {/* Full Company Name - Large and Prominent - Full Width */}
            <div className="text-center mb-6">
              <h2 
                className="text-xl sm:text-2xl md:text-3xl font-bold tracking-[0.12em] text-[#1A1A1A] uppercase leading-tight"
              >
                JBJ GLOBAL REAL ESTATE
              </h2>
            </div>

            {/* Welcome Title */}
            <div className="text-center mb-8">
              <h3
                className="text-lg md:text-xl font-semibold mb-3 tracking-tight text-white"
              >
                Welcome to JBJ Global Real Estate
              </h3>
              <p className="text-white/70 text-sm md:text-base leading-relaxed max-w-sm mx-auto">
                Your Gateway to{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-[hsl(40_50%_55%)] to-gold font-semibold">
                  Exclusive Real Estate Opportunities
                </span>
              </p>
            </div>

            {/* Refined gold divider */}
            <div className="relative h-px mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
              <div className="absolute left-1/2 -translate-x-1/2 -top-1.5 w-3 h-3 bg-[#EFE6D6]/80 rotate-45" />
            </div>

            {/* Action Buttons — Sign In + Explore */}
            <div className="space-y-3">
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleLogin();
                }}
                type="button"
                className="w-full py-6 bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A] font-bold text-base shadow-xl rounded-xl group relative overflow-hidden transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <User className="w-5 h-5 mr-3 relative z-10" strokeWidth={2} />
                <span className="flex-1 text-left relative z-10">Sign In / Create Account</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" strokeWidth={2} />
              </Button>

              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleExplore();
                }}
                type="button"
                variant="outline"
                className="w-full py-6 bg-transparent border border-[#B89555]/30 text-[#1A1A1A] hover:bg-[#EFE6D6]/10 font-semibold text-base rounded-xl group relative overflow-hidden transition-all duration-300"
              >
                <Compass className="w-5 h-5 mr-3 relative z-10" strokeWidth={2} />
                <span className="flex-1 text-left relative z-10">Explore the Platform</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10 opacity-50" strokeWidth={2} />
              </Button>
            </div>

            {/* Loyalty hint */}
            <p className="text-center text-white/90 text-xs mt-6 leading-relaxed">
              Sign in to earn loyalty points on every activity —<br />
              redeemable on purchases & subscriptions
            </p>

            {/* Footer text with copyright */}
            <p className="text-center text-[#1A1A1A]/70 text-[10px] mt-4">
              © {new Date().getFullYear()} JBJ Global Real Estate. All rights reserved.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WelcomeModal;
