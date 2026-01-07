import { useState, useEffect, useCallback } from "react";
import { Download, Plus, Share } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import logoDark from "@/assets/logo-dark.jpg";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "jj_install_popup_dismissed_at";
const DISMISS_TTL_MS = 24 * 60 * 60 * 1000;

const isIOSDevice = () => {
  try {
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    // iPadOS 13+ reports as Mac, but has touch points
    const isIPadOS = navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1;
    return isIOS || isIPadOS;
  } catch {
    return false;
  }
};

const isMobileLikeDevice = () => {
  try {
    const ua = navigator.userAgent;
    return /Android|iPhone|iPad|iPod|Mobi/i.test(ua) || isIOSDevice();
  } catch {
    return false;
  }
};

const InstallAppButton = () => {
  const navigate = useNavigate();

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsInstalled(standalone);
    setIsIOS(isIOSDevice());

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setFallbackOpen(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Auto-popup (mainly for iOS where beforeinstallprompt does not exist)
  useEffect(() => {
    if (isInstalled) return;
    if (!isMobileLikeDevice()) return;
    if (deferredPrompt) return; // native prompt will handle it

    try {
      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      if (dismissedAt && Date.now() - Number(dismissedAt) < DISMISS_TTL_MS) return;
    } catch {
      // ignore
    }

    const t = setTimeout(() => setFallbackOpen(true), 4500);
    return () => clearTimeout(t);
  }, [isInstalled, deferredPrompt]);

  const handleInstallClick = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      return;
    }

    setFallbackOpen(true);
  }, [deferredPrompt]);

  const handleOpenChange = (open: boolean) => {
    setFallbackOpen(open);
    if (!open) {
      try {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
      } catch {
        // ignore
      }
    }
  };

  if (isInstalled) return null;

  // Show only on mobile/tablet (or when native prompt exists)
  const shouldShowFloating = !!deferredPrompt || isMobileLikeDevice();
  if (!shouldShowFloating) return null;

  return (
    <>
      <AnimatePresence>
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          onClick={handleInstallClick}
          className="fixed bottom-6 left-6 z-[9000] flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-gold to-gold-light shadow-2xl shadow-gold/30 hover:scale-105 transition-transform group"
          aria-label="Download app"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden border border-black/20">
            <img
              src={logoDark}
              alt="JJ Global Capital"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <span className="text-black font-semibold text-sm">Download App</span>
          <Download className="w-4 h-4 text-black" />
        </motion.button>
      </AnimatePresence>

      <Dialog open={fallbackOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="bg-zinc-950 border border-gold/20">
          <DialogHeader>
            <DialogTitle className="text-white">Install JJ Global Capital</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Add the app to your home screen for one-tap access.
            </DialogDescription>
          </DialogHeader>

          {isIOS ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                  <Share className="w-5 h-5 text-gold" />
                </div>
                <p className="text-sm text-zinc-200">
                  In Safari, tap <span className="text-white font-medium">Share</span>.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                  <Plus className="w-5 h-5 text-gold" />
                </div>
                <p className="text-sm text-zinc-200">
                  Choose <span className="text-white font-medium">Add to Home Screen</span>.
                </p>
              </div>
              <p className="text-xs text-zinc-500">
                Tip: iPhone/iPad doesn’t show the one-click install popup like Chrome.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-zinc-200">
                If you don’t see the browser install popup, open the install guide and follow the steps.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                handleOpenChange(false);
                navigate("/install");
              }}
            >
              Open Install Guide
            </Button>
            <Button variant="ghost" onClick={() => handleOpenChange(false)}>
              Not now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InstallAppButton;
