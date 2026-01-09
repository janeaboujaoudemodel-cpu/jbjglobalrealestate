import { useState, useEffect, useCallback } from "react";
import { Download, X, Share } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logoDark from "@/assets/logo-dark.jpg";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STORAGE_KEYS = {
  INSTALLED: "jbj_pwa_installed",
  DISMISSED: "jbj_pwa_dismissed",
};

const isIOSDevice = () => {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1);
};

const InstallAppButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check localStorage for persisted states
    const wasInstalled = localStorage.getItem(STORAGE_KEYS.INSTALLED) === "true";
    const wasDismissed = localStorage.getItem(STORAGE_KEYS.DISMISSED) === "true";
    
    if (wasInstalled) {
      setIsInstalled(true);
      return;
    }
    
    if (wasDismissed) {
      setIsDismissed(true);
      return;
    }

    // Check if already running as PWA
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    const navigatorStandalone = (navigator as any).standalone === true;
    
    if (standalone || navigatorStandalone) {
      setIsInstalled(true);
      localStorage.setItem(STORAGE_KEYS.INSTALLED, "true");
      return;
    }

    // Check if iOS
    setIsIOS(isIOSDevice());

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      localStorage.setItem(STORAGE_KEYS.INSTALLED, "true");
      
      toast.success("App installed! Find it on your Dock or taskbar", {
        duration: 5000,
        description: "Tap the JBJ icon anytime for quick access",
      });
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    // iOS fallback - show instructions
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;
    
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === "accepted") {
        setIsInstalled(true);
        localStorage.setItem(STORAGE_KEYS.INSTALLED, "true");
        toast.success("App installed successfully!");
      } else {
        setIsDismissed(true);
        localStorage.setItem(STORAGE_KEYS.DISMISSED, "true");
      }
      setDeferredPrompt(null);
    } catch (error) {
      console.error("Install prompt error:", error);
    }
  }, [deferredPrompt, isIOS]);

  const handleDismiss = useCallback(() => {
    setIsDismissed(true);
    setShowIOSGuide(false);
    localStorage.setItem(STORAGE_KEYS.DISMISSED, "true");
  }, []);

  // Hide if installed or dismissed
  if (isInstalled || isDismissed) return null;

  // Show only if native prompt available OR if iOS (for fallback)
  if (!deferredPrompt && !isIOS) return null;

  return (
    <AnimatePresence>
      {/* iOS Instructions Modal */}
      {showIOSGuide && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-4"
          onClick={() => setShowIOSGuide(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-background rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-foreground mb-4">Add to Home Screen</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <span className="bg-gold/20 text-gold rounded-full w-6 h-6 flex items-center justify-center shrink-0 font-bold">1</span>
                <p>Tap the <Share className="inline w-4 h-4" /> Share button in Safari</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-gold/20 text-gold rounded-full w-6 h-6 flex items-center justify-center shrink-0 font-bold">2</span>
                <p>Scroll down and tap "Add to Home Screen"</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-gold/20 text-gold rounded-full w-6 h-6 flex items-center justify-center shrink-0 font-bold">3</span>
                <p>Tap "Add" to install the app</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="mt-6 w-full py-3 bg-gold text-black font-bold rounded-lg hover:bg-gold-light transition-colors"
            >
              Got it
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Install Button */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        className="fixed bottom-6 left-6 z-[9000] flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-gold to-gold-light shadow-2xl shadow-gold/40 group"
        style={{ animation: "bounce-glow 2s ease-in-out infinite" }}
      >
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-2 hover:scale-105 transition-transform"
          aria-label="Install app"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-black/30 shadow-inner">
            <img
              src={logoDark}
              alt="JBJ Global Real Estate"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <span className="text-black font-bold text-sm tracking-wide">
            {isIOS ? "Add to Home" : "Install App"}
          </span>
          <Download className="w-5 h-5 text-black" />
        </button>
        
        <button
          onClick={handleDismiss}
          className="ml-1 p-1 rounded-full hover:bg-black/10 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-black/60" />
        </button>
        
        <motion.div
          className="absolute inset-0 rounded-full bg-gold/20 pointer-events-none"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      <style>{`
        @keyframes bounce-glow {
          0%, 100% { transform: translateY(0) scale(1); box-shadow: 0 0 20px rgba(212, 175, 55, 0.4), 0 0 40px rgba(212, 175, 55, 0.2); }
          50% { transform: translateY(-8px) scale(1.05); box-shadow: 0 0 30px rgba(212, 175, 55, 0.6), 0 0 60px rgba(212, 175, 55, 0.3); }
        }
      `}</style>
    </AnimatePresence>
  );
};

export default InstallAppButton;
