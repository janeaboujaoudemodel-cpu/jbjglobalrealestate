import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { User, UserCheck, ArrowRight } from "lucide-react";

const WELCOME_MODAL_KEY = "jj_welcome_shown";

const WelcomeModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if this is the user's first visit
    const hasSeenWelcome = localStorage.getItem(WELCOME_MODAL_KEY);
    
    if (!hasSeenWelcome) {
      // Small delay for better UX
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleContinueAsGuest = () => {
    localStorage.setItem(WELCOME_MODAL_KEY, "true");
    setIsOpen(false);
  };

  const handleLogin = () => {
    localStorage.setItem(WELCOME_MODAL_KEY, "true");
    setIsOpen(false);
    navigate("/auth");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        localStorage.setItem(WELCOME_MODAL_KEY, "true");
      }
      setIsOpen(open);
    }}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-md">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-black" />
          </div>
          <DialogTitle className="text-2xl font-semibold" style={{ fontFamily: "Poppins, sans-serif" }}>
            Welcome to JJ Global Capital
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-base">
            Discover premium real estate opportunities across the UAE
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-4">
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
          Save favorites and get personalized recommendations with an account
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;
