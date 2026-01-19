import { useCallback, useEffect, useState } from "react";
import { Download, X, ArrowUp } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

import jbjMonogramDarkBg from "@/assets/jbj-monogram-dark-bg.png";
import { usePopupVisibility } from "@/contexts/PopupCoordinatorContext";

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
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const isIPadOS =
    navigator.platform === "MacIntel" &&
    (navigator as any).maxTouchPoints > 1 &&
    !ua.includes("Macintosh");
  return isIOS || isIPadOS;
};

const isSafariBrowser = () => {
  const ua = navigator.userAgent;
  return /Safari/.test(ua) && !/Chrome/.test(ua) && !/CriOS/.test(ua);
};

const isMacDesktop = () => {
  return navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints <= 1;
};

const InstallAppButton = () => {
  const { requestToShow, dismiss, isVisible } = usePopupVisibility("install-app-button");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isMacSafari, setIsMacSafari] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const [showArrowIndicator, setShowArrowIndicator] = useState(false);

  useEffect(() => {
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

    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    const navigatorStandalone = (navigator as any).standalone === true;
    if (standalone || navigatorStandalone) {
      setIsInstalled(true);
      localStorage.setItem(STORAGE_KEYS.INSTALLED, "true");
      return;
    }

    const iosDevice = isIOSDevice();
    const macDesktopSafari = isMacDesktop() && isSafariBrowser();

    setIsIOS(iosDevice);
    setIsMacSafari(macDesktopSafari);

    // Desktop Safari doesn't support PWA installs
    if (macDesktopSafari) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShouldShow(true);
      requestToShow();
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      localStorage.setItem(STORAGE_KEYS.INSTALLED, "true");
      dismiss();
      toast.success("App installed! Look for it in the top-right corner of your browser.");
      
      // Show arrow indicator pointing to the installed app location
      setShowArrowIndicator(true);
      setTimeout(() => setShowArrowIndicator(false), 8000); // Show for 8 seconds
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // iOS: show the floating button after a delay (no internal step-by-step guide)
    let timer: number | undefined;
    if (iosDevice) {
      timer = window.setTimeout(() => {
        setShouldShow(true);
        requestToShow();
      }, 5000);
    }

    return () => {
      if (timer) window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [requestToShow, dismiss]);

  const handleInstallClick = useCallback(async () => {
    // iOS: Try to trigger share sheet automatically for one-click experience
    if (isIOS) {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'JBJ Global Real Estate',
            text: 'Install the JBJ Global Real Estate app',
            url: window.location.origin,
          });
        } catch {
          // User cancelled - silently dismiss
        }
      }
      return;
    }

    // One-click install for browsers with deferred prompt
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
          setIsInstalled(true);
          localStorage.setItem(STORAGE_KEYS.INSTALLED, "true");
          dismiss();
          toast.success("App installed.");
        }

        setDeferredPrompt(null);
      } catch (error) {
        console.error("Install prompt error:", error);
      }
      return;
    }

    // Silently dismiss if install not available - no error messages
    dismiss();
  }, [deferredPrompt, dismiss, isIOS]);

  const handleDismiss = useCallback(() => {
    setIsDismissed(true);
    localStorage.setItem(STORAGE_KEYS.DISMISSED, "true");
    dismiss();
  }, [dismiss]);

  // Show arrow indicator even if installed (for a short time after install)
  if ((isInstalled && !showArrowIndicator) || isDismissed || isMacSafari) return null;
  if (!shouldShow && !showArrowIndicator) return null;

  return (
    <AnimatePresence>
      {/* Arrow indicator pointing to installed app in Chrome toolbar */}
      {showArrowIndicator && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-20 z-[9999] flex flex-col items-center gap-2"
        >
          {/* Pulsing arrow pointing up-right toward Chrome extension area */}
          <motion.div
            className="flex flex-col items-center"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <ArrowUp className="w-8 h-8 text-gold rotate-45 drop-shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
            <ArrowUp className="w-6 h-6 text-gold rotate-45 -mt-3 drop-shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
          </motion.div>
          
          {/* Label */}
          <motion.div
            className="bg-black/90 border border-gold/50 rounded-lg px-4 py-2 shadow-xl shadow-gold/20"
            animate={{ 
              boxShadow: [
                "0 0 20px rgba(212,175,55,0.3)",
                "0 0 40px rgba(212,175,55,0.6)",
                "0 0 20px rgba(212,175,55,0.3)"
              ]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <p className="text-gold font-semibold text-sm whitespace-nowrap">
              App installed! Find it here →
            </p>
          </motion.div>
          
          {/* Close button */}
          <button
            onClick={() => setShowArrowIndicator(false)}
            className="absolute -top-2 -right-2 w-6 h-6 bg-black border border-gold/50 rounded-full flex items-center justify-center hover:bg-gold/20 transition-colors"
          >
            <X className="w-3 h-3 text-gold" />
          </button>
        </motion.div>
      )}

      {/* Install prompt button */}
      {isVisible && !showArrowIndicator && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 sm:left-4 sm:translate-x-0 z-[8500] flex items-center gap-1.5 px-3 py-2 rounded-full bg-gradient-to-r from-gold to-gold-light shadow-lg shadow-gold/30 group max-w-[calc(100vw-2rem)] sm:max-w-none"
          style={{ animation: "bounce-glow 3s ease-in-out infinite" }}
        >
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-2 hover:scale-105 transition-transform"
            aria-label="Install app"
          >
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-black shadow-inner flex-shrink-0">
              <img
                src={jbjMonogramDarkBg}
                alt="JBJ Global Real Estate"
                className="w-full h-full object-contain p-0.5"
                loading="lazy"
              />
            </div>
            <span className="text-black font-bold text-xs tracking-wide whitespace-nowrap">
              {isIOS ? "Add to Home" : "Install"}
            </span>
            <Download className="w-4 h-4 text-black flex-shrink-0" />
          </button>

          <button
            onClick={handleDismiss}
            className="ml-1 p-1 rounded-full hover:bg-black/10 transition-colors flex-shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4 text-black/60" />
          </button>

          <motion.div
            className="absolute inset-0 rounded-full bg-gold/20 pointer-events-none"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />

          <style>{`
            @keyframes bounce-glow {
              0%, 100% { transform: translateY(0) scale(1); box-shadow: 0 0 20px rgba(212, 175, 55, 0.4), 0 0 40px rgba(212, 175, 55, 0.2); }
              50% { transform: translateY(-8px) scale(1.05); box-shadow: 0 0 30px rgba(212, 175, 55, 0.6), 0 0 60px rgba(212, 175, 55, 0.3); }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallAppButton;
