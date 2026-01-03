import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { User, UserCheck, ArrowRight, Heart, ListPlus } from "lucide-react";

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
      <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-md">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-black" />
          </div>
          <DialogTitle className="text-2xl font-semibold" style={{ fontFamily: "Poppins, sans-serif" }}>
            {isReturningUser ? "Welcome Back!" : "Welcome to JJ Global Capital"}
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-base">
            {isReturningUser 
              ? "Great to see you again. Continue exploring premium properties."
              : "Discover premium real estate opportunities across the UAE"
            }
          </DialogDescription>
        </DialogHeader>

        {/* Feature Guide */}
        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800 mb-4">
          <p className="text-zinc-300 text-sm font-medium mb-3">Save your favorite properties:</p>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-black/60 border border-white/10 flex items-center justify-center">
                <Heart className="w-4 h-4 text-red-500" />
              </div>
              <span className="text-zinc-400 text-sm">Tap heart to add to <strong className="text-white">Favorites</strong></span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-black/60 border border-white/10 flex items-center justify-center">
                <ListPlus className="w-4 h-4 text-gold" />
              </div>
              <span className="text-zinc-400 text-sm">Tap list to add to <strong className="text-white">Shortlist</strong> for comparison</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleContinueAsGuest}
            variant="outline"
            className="w-full py-6 border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800 hover:border-gold/50 group"
          >
            <UserCheck className="w-5 h-5 mr-3 text-gold" />
            <span className="flex-1 text-left">Continue as Guest</span>
            <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-gold transition-colors" />
          </Button>

          <Button
            onClick={handleLogin}
            className="w-full py-6 bg-gradient-to-r from-gold to-gold-dark text-black hover:opacity-90 font-semibold"
          >
            <User className="w-5 h-5 mr-3" />
            <span className="flex-1 text-left">Sign In / Create Account</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-center text-zinc-500 text-sm mt-4">
          Favorites & shortlist work even as a guest!
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;
