import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { User, ArrowRight, Heart, ListPlus, Sparkles, Crown } from "lucide-react";

const WELCOME_MODAL_KEY = "jj_welcome_shown";
const RETURNING_USER_KEY = "jj_returning_user";

const WelcomeModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isReturningUser, setIsReturningUser] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem(WELCOME_MODAL_KEY);
    const isReturning = localStorage.getItem(RETURNING_USER_KEY);
    
    if (hasSeenWelcome) {
      // User has been here before, mark as returning
      if (!isReturning) {
        localStorage.setItem(RETURNING_USER_KEY, "true");
      }
      return;
    }
    
    // First-time visitor
    setIsReturningUser(!!isReturning);
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    localStorage.setItem(WELCOME_MODAL_KEY, "true");
    localStorage.setItem(RETURNING_USER_KEY, "true");
    setIsOpen(false);
  };

  const handleContinueAsGuest = () => {
    handleClose();
  };

  const handleLogin = () => {
    handleClose();
    navigate("/auth");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose();
      setIsOpen(open);
    }}>
      <DialogContent className="bg-black border border-zinc-800 text-white max-w-md p-0 overflow-hidden">
        {/* Premium top gradient glow */}
        <div 
          className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 50% 0%, hsl(40 32% 51% / 0.25) 0%, transparent 70%)",
          }}
        />
        
        {/* Gold accent line at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />
        
        <div className="relative px-8 pt-10 pb-8">
          {/* Premium Icon */}
          <div className="text-center mb-6">
            <div className="relative inline-flex">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold via-gold-light to-gold-dark flex items-center justify-center shadow-2xl shadow-gold/30">
                <Crown className="w-10 h-10 text-black" />
              </div>
              {/* Sparkle decorations */}
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-gold animate-pulse" />
              <Sparkles className="absolute -bottom-1 -left-3 w-4 h-4 text-gold-light animate-pulse" style={{ animationDelay: "0.5s" }} />
            </div>
          </div>

          {/* Title and Description */}
          <div className="text-center mb-6">
            <h2 
              className="text-3xl font-bold mb-3"
              style={{ 
                fontFamily: "Poppins, sans-serif",
                background: "linear-gradient(135deg, #ffffff 0%, hsl(40 32% 51%) 50%, #ffffff 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {isReturningUser ? "Welcome Back!" : "Welcome to JJ Global Capital"}
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              {isReturningUser 
                ? "We're glad you're back. Continue exploring premium properties."
                : "Your gateway to global real estate investments with expertise in the UAE market"
              }
            </p>
          </div>

          {/* Why UAE & Why Dubai Section */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-zinc-900/80 rounded-xl p-4 border border-zinc-800/50 backdrop-blur-sm">
              <h3 className="text-gold font-semibold text-sm mb-2">Why UAE?</h3>
              <ul className="text-zinc-400 text-xs space-y-1">
                <li>• Tax-free investment returns</li>
                <li>• World-class infrastructure</li>
                <li>• Golden Visa opportunities</li>
                <li>• Strong rental yields</li>
              </ul>
            </div>
            <div className="bg-zinc-900/80 rounded-xl p-4 border border-zinc-800/50 backdrop-blur-sm">
              <h3 className="text-gold font-semibold text-sm mb-2">Why Dubai?</h3>
              <ul className="text-zinc-400 text-xs space-y-1">
                <li>• Global business hub</li>
                <li>• Luxury lifestyle destination</li>
                <li>• Safe & stable economy</li>
                <li>• 100% foreign ownership</li>
              </ul>
            </div>
          </div>

          {/* Ornamental divider */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-gold/60" />
            <div className="w-2 h-2 rounded-full bg-gold shadow-lg shadow-gold/50" />
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-gold/60" />
          </div>

          {/* Feature Guide */}
          <div className="bg-zinc-900/80 rounded-xl p-4 border border-zinc-800/50 mb-5 backdrop-blur-sm">
            <p className="text-zinc-300 text-sm font-medium mb-3">Save your favorite properties:</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-black/80 border border-zinc-700 flex items-center justify-center shadow-inner">
                  <Heart className="w-4 h-4 text-red-500" />
                </div>
                <span className="text-zinc-400 text-xs">Tap heart to add to <span className="text-white font-medium">Favorites</span></span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-black/80 border border-zinc-700 flex items-center justify-center shadow-inner">
                  <ListPlus className="w-4 h-4 text-gold" />
                </div>
                <span className="text-zinc-400 text-xs">Tap list to add to <span className="text-white font-medium">Shortlist</span> for comparison</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleLogin}
              className="w-full py-5 bg-gradient-to-r from-gold via-gold-light to-gold text-black hover:opacity-90 font-semibold text-base shadow-xl shadow-gold/20 rounded-xl group"
            >
              <User className="w-5 h-5 mr-3" />
              <span className="flex-1 text-left">Sign In / Create Account</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button
              onClick={handleContinueAsGuest}
              variant="outline"
              className="w-full py-5 border-zinc-700 bg-zinc-900/50 text-white hover:bg-zinc-800 hover:border-gold/40 group rounded-xl"
            >
              <span className="flex-1 text-left">Continue as Guest</span>
              <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-gold transition-colors" />
            </Button>
          </div>

          <p className="text-center text-zinc-600 text-xs mt-4">
            Favorites & shortlist work even as a guest
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;