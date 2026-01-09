import { useState, useEffect, useCallback } from "react";
import { Download, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logoDark from "@/assets/logo-dark.jpg";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STORAGE_KEYS = {
  INSTALLED: "pwa_installed",
  DISMISSED: "pwa_dismissed",
};

const InstallAppButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

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
    if (!deferredPrompt) return;
    
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === "accepted") {
        setIsInstalled(true);
        localStorage.setItem(STORAGE_KEYS.INSTALLED, "true");
        toast.success("App installed successfully!");
      } else {
        // User dismissed the native prompt
        setIsDismissed(true);
        localStorage.setItem(STORAGE_KEYS.DISMISSED, "true");
      }
      setDeferredPrompt(null);
    } catch (error) {
      console.error("Install prompt error:", error);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setIsDismissed(true);
    localStorage.setItem(STORAGE_KEYS.DISMISSED, "true");
  }, []);

  // Only show when native install prompt is available and not installed/dismissed
  if (isInstalled || isDismissed || !deferredPrompt) return null;

  return (
    <AnimatePresence>
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
          <span className="text-black font-bold text-sm tracking-wide">Install App</span>
          <Download className="w-5 h-5 text-black" />
        </button>
        
        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="ml-1 p-1 rounded-full hover:bg-black/10 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-black/60" />
        </button>
        
        {/* Glow ring effect */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gold/20 pointer-events-none"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      <style>{`
        @keyframes bounce-glow {
          0%, 100% {
            transform: translateY(0) scale(1);
            box-shadow: 0 0 20px rgba(212, 175, 55, 0.4), 0 0 40px rgba(212, 175, 55, 0.2);
          }
          50% {
            transform: translateY(-8px) scale(1.05);
            box-shadow: 0 0 30px rgba(212, 175, 55, 0.6), 0 0 60px rgba(212, 175, 55, 0.3);
          }
        }
      `}</style>
    </AnimatePresence>
  );
};

export default InstallAppButton;
