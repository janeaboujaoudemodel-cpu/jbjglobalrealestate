import { useState, useEffect, useCallback } from "react";
import { Download, X, ChevronUp, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallAppButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showButton, setShowButton] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isStandalone) {
      setIsInstalled(true);
      setShowButton(false);
      return;
    }

    // Check for iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Check if user minimized (not permanently dismissed)
    const wasMinimized = sessionStorage.getItem("pwa-install-minimized") === "true";
    setIsMinimized(wasMinimized);

    // Always show if not installed
    setShowButton(true);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowButton(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (deferredPrompt) {
      // One-click install for Android/Desktop Chrome
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowButton(false);
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // For iOS or browsers without prompt, go to instructions page
      navigate("/install");
    }
  }, [deferredPrompt, navigate]);

  const handleMinimize = useCallback(() => {
    setIsMinimized(true);
    sessionStorage.setItem("pwa-install-minimized", "true");
  }, []);

  const handleExpand = useCallback(() => {
    setIsMinimized(false);
    sessionStorage.removeItem("pwa-install-minimized");
  }, []);

  // Don't show if already installed
  if (isInstalled || !showButton) return null;

  return (
    <AnimatePresence mode="wait">
      {isMinimized ? (
        // Minimized floating icon - tap to expand
        <motion.button
          key="minimized"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          onClick={handleExpand}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-gold to-gold-light shadow-2xl shadow-gold/30 flex items-center justify-center hover:scale-110 transition-transform"
          aria-label="Show install button"
        >
          <Smartphone className="w-6 h-6 text-black" />
        </motion.button>
      ) : (
        // Expanded install prompt
        <motion.div
          key="expanded"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-[360px] z-50"
        >
          <div className="bg-zinc-900/95 backdrop-blur-xl border border-gold/30 rounded-2xl p-4 shadow-2xl shadow-black/50">
            {/* Header with close/minimize */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/20 to-gold/10 border border-gold/30 flex items-center justify-center">
                  <img 
                    src="/pwa-192x192.jpg" 
                    alt="JJ Global Capital" 
                    className="w-10 h-10 rounded-lg object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-base">Get Our App</h3>
                  <p className="text-zinc-400 text-xs">
                    {isIOS ? "Add to Home Screen" : "Install for quick access"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleMinimize}
                className="text-zinc-500 hover:text-white p-1 rounded-full hover:bg-zinc-800 transition-colors"
                aria-label="Minimize"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
            </div>

            {/* Benefits */}
            <div className="flex gap-2 mb-4 text-xs text-zinc-400">
              <span className="px-2 py-1 bg-zinc-800/50 rounded-full">⚡ Fast</span>
              <span className="px-2 py-1 bg-zinc-800/50 rounded-full">📱 Offline</span>
              <span className="px-2 py-1 bg-zinc-800/50 rounded-full">🔔 Updates</span>
            </div>

            {/* Install button */}
            <Button
              onClick={handleInstallClick}
              className="w-full bg-gradient-to-r from-gold to-gold-light hover:from-gold-light hover:to-gold text-black font-semibold py-5 rounded-xl shadow-lg shadow-gold/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="w-5 h-5 mr-2" />
              {deferredPrompt ? "Install Now — One Click" : isIOS ? "See How to Install" : "Install App"}
            </Button>

            {/* Skip link */}
            <button
              onClick={handleMinimize}
              className="w-full text-center text-zinc-500 text-xs mt-3 hover:text-zinc-300 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallAppButton;
