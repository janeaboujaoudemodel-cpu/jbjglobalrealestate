import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { User, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import GuidedTour from "./GuidedTour";
import jbjFullLogoLight from "@/assets/jbj-fulllogo-light.png";

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
          className="bg-white border-0 text-zinc-900 max-w-md p-0 overflow-hidden shadow-2xl rounded-2xl"
          dir={isRTL ? 'rtl' : 'ltr'}
          aria-describedby={undefined}
        >
          <VisuallyHidden.Root>
            <DialogTitle>Welcome to JJ Global Capital</DialogTitle>
          </VisuallyHidden.Root>
          
          {/* Premium white background */}
          <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50 to-white" />
          
          {/* Gold accent at top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />
          
          {/* Subtle ambient glow */}
          <div 
            className="absolute top-0 left-0 right-0 h-64 pointer-events-none opacity-20"
            style={{
              background: `radial-gradient(ellipse at 50% 0%, hsl(40 32% 51% / 0.4) 0%, transparent 70%)`
            }}
          />

          {/* Corner accents - refined gold */}
          <div className="absolute top-6 left-6 w-8 h-8 border-l border-t border-gold/30" />
          <div className="absolute top-6 right-6 w-8 h-8 border-r border-t border-gold/30" />
          <div className="absolute bottom-6 left-6 w-8 h-8 border-l border-b border-gold/20" />
          <div className="absolute bottom-6 right-6 w-8 h-8 border-r border-b border-gold/20" />

          <div className="relative px-10 py-14">
            {/* Full Logo - Light version for welcome popup */}
            <div className="flex justify-center mb-10">
              <img 
                src={jbjFullLogoLight} 
                alt="JBJ Global Real Estate" 
                className="h-28 w-auto object-contain"
              />
            </div>

            {/* Title */}
            <div className="text-center mb-10">
              <h2
                className="text-3xl md:text-4xl font-semibold mb-5 tracking-tight text-black"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Welcome
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed max-w-xs mx-auto">
                Your Gateway to<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-[hsl(40_50%_45%)] to-gold font-semibold">
                  Global Real Estate
                </span>
              </p>
            </div>

            {/* Refined divider */}
            <div className="relative h-px mb-10">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
              <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-gold/60 rotate-45" />
            </div>

            {/* Action Buttons - Premium Black with Gold Text */}
            <div className="space-y-4">
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleLogin();
                }}
                type="button"
                className="w-full py-6 bg-black hover:bg-zinc-900 text-gold font-semibold text-base shadow-xl rounded-xl group relative overflow-hidden transition-all duration-300 border border-gold/20"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
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
                className="w-full py-6 border-gray-300 bg-transparent text-black hover:bg-gray-100 hover:border-gold/50 group rounded-xl transition-all duration-300"
              >
                <span className="flex-1 text-left font-medium">Continue as Guest</span>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gold group-hover:translate-x-1 transition-all" strokeWidth={1.5} />
              </Button>
            </div>

            {/* Footer text */}
            <p className="text-center text-gray-400 text-xs mt-8">
              © {new Date().getFullYear()} JJ Global Capital. All Rights Reserved.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <GuidedTour isOpen={showTour} onClose={handleTourClose} />
    </>
  );
};

export default WelcomeModal;
