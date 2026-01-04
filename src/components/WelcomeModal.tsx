import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { User, ArrowRight, Heart, ListPlus, Sparkles, Crown, Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const WELCOME_MODAL_KEY = "jj_welcome_shown";
const RETURNING_USER_KEY = "jj_returning_user";

const WelcomeModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isReturningUser, setIsReturningUser] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, isRTL } = useLanguage();

  useEffect(() => {
    // Show this only on the homepage
    if (location.pathname !== "/") return;

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
  }, [location.pathname]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(WELCOME_MODAL_KEY, "true");
    localStorage.setItem(RETURNING_USER_KEY, "true");
  };

  const handleContinueAsGuest = () => {
    // Immediately close the modal
    setIsOpen(false);
    localStorage.setItem(WELCOME_MODAL_KEY, "true");
    localStorage.setItem(RETURNING_USER_KEY, "true");
  };

  const handleLogin = () => {
    setIsOpen(false);
    localStorage.setItem(WELCOME_MODAL_KEY, "true");
    localStorage.setItem(RETURNING_USER_KEY, "true");
    navigate("/auth");
  };

  // Prevent reopening if already closed
  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setIsOpen(false);
          localStorage.setItem(WELCOME_MODAL_KEY, "true");
          localStorage.setItem(RETURNING_USER_KEY, "true");
        }
      }}
    >
      <DialogContent 
        className="bg-gradient-to-b from-zinc-950 via-black to-zinc-950 border border-gold/30 text-white max-w-md p-0 overflow-hidden shadow-2xl shadow-gold/10"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Premium layered gradient glow */}
        <div
          className="absolute top-0 left-0 right-0 h-48 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse at 50% -20%, hsl(40 32% 51% / 0.4) 0%, transparent 60%),
              radial-gradient(ellipse at 20% 20%, hsl(40 32% 51% / 0.15) 0%, transparent 40%),
              radial-gradient(ellipse at 80% 20%, hsl(40 32% 51% / 0.15) 0%, transparent 40%)
            `,
          }}
        />

        {/* Animated gold accent line at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent animate-pulse" />

        {/* Corner decorations */}
        <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-gold/30 rounded-tl-lg" />
        <div className="absolute top-4 right-4 w-12 h-12 border-r-2 border-t-2 border-gold/30 rounded-tr-lg" />

        <div className="relative px-8 pt-12 pb-8">
          {/* Ultra Premium Icon with multiple layers */}
          <div className="text-center mb-8">
            <div className="relative inline-flex">
              {/* Outer glow ring */}
              <div className="absolute inset-0 w-24 h-24 -m-2 rounded-full bg-gradient-to-br from-gold/20 via-transparent to-gold/20 animate-pulse" />
              
              {/* Main icon container */}
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-gold via-[hsl(40_45%_55%)] to-gold-dark flex items-center justify-center shadow-2xl shadow-gold/40">
                {/* Inner highlight */}
                <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/20 via-transparent to-transparent" />
                <Crown className="w-10 h-10 text-black relative z-10" />
              </div>
              
              {/* Floating sparkles */}
              <Sparkles className="absolute -top-3 -right-3 w-6 h-6 text-gold animate-pulse" />
              <Star className="absolute -bottom-1 -left-3 w-4 h-4 text-gold/80 animate-pulse" style={{ animationDelay: "0.3s" }} />
              <Sparkles className="absolute top-1/2 -right-5 w-4 h-4 text-gold/60 animate-pulse" style={{ animationDelay: "0.6s" }} />
            </div>
          </div>

          {/* Title and Description with premium typography */}
          <div className="text-center mb-8">
            <h2
              className="text-3xl md:text-4xl font-bold mb-4 leading-tight"
              style={{
                fontFamily: "Poppins, sans-serif",
                background: "linear-gradient(135deg, #ffffff 0%, hsl(40 32% 51%) 40%, hsl(40 40% 60%) 60%, #ffffff 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {isReturningUser ? t('welcome.titleReturning') : t('welcome.title')}
            </h2>
            <p className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-sm mx-auto">
              {isReturningUser ? t('welcome.subtitleReturning') : t('welcome.subtitle')}
            </p>
          </div>

          {/* Premium Divider */}
          <div className="relative h-px mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
            <div className="absolute left-1/2 -translate-x-1/2 -top-1.5 w-3 h-3 bg-gold rotate-45 shadow-lg shadow-gold/30" />
          </div>

          {/* Feature Guide - Ultra Premium Card */}
          <div className="relative bg-gradient-to-br from-zinc-900/90 via-zinc-900/70 to-zinc-900/90 rounded-2xl p-5 border border-gold/20 mb-6 backdrop-blur-sm overflow-hidden">
            {/* Card inner glow */}
            <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-gold/5 to-transparent pointer-events-none" />
            
            <p className="text-zinc-200 text-sm font-semibold mb-4 relative z-10">{t('welcome.saveFavorites')}</p>
            <div className="space-y-3 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 flex items-center justify-center shadow-lg shadow-red-500/10">
                  <Heart className="w-5 h-5 text-red-500" />
                </div>
                <span className="text-zinc-300 text-sm">
                  {t('welcome.tapHeart')} <span className="text-white font-semibold">{t('welcome.favorites')}</span>
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold/20 to-gold/10 border border-gold/30 flex items-center justify-center shadow-lg shadow-gold/10">
                  <ListPlus className="w-5 h-5 text-gold" />
                </div>
                <span className="text-zinc-300 text-sm">
                  {t('welcome.tapList')} <span className="text-white font-semibold">{t('welcome.shortlist')}</span> {t('welcome.comparison')}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons - Ultra Premium */}
          <div className="space-y-3">
            <Button
              onClick={handleLogin}
              className="w-full py-6 bg-gradient-to-r from-gold via-[hsl(40_45%_55%)] to-gold text-black hover:opacity-95 font-bold text-base shadow-xl shadow-gold/30 rounded-xl group relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-gold/40"
            >
              {/* Button shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <User className="w-5 h-5 mr-3 relative z-10" />
              <span className="flex-1 text-left relative z-10">{t('welcome.signIn')}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
            </Button>

            <Button
              onClick={handleContinueAsGuest}
              variant="outline"
              className="w-full py-6 border-zinc-700 bg-zinc-900/50 text-white hover:bg-zinc-800 hover:border-gold/50 group rounded-xl transition-all duration-300"
            >
              <span className="flex-1 text-left">{t('welcome.guest')}</span>
              <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-gold group-hover:translate-x-1 transition-all" />
            </Button>
          </div>

          <p className="text-center text-zinc-600 text-xs mt-5">
            {t('welcome.guestNote')}
          </p>
        </div>

        {/* Bottom corner decorations */}
        <div className="absolute bottom-4 left-4 w-12 h-12 border-l-2 border-b-2 border-gold/20 rounded-bl-lg" />
        <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-gold/20 rounded-br-lg" />
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;
