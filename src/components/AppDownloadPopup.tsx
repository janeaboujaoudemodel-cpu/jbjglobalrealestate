import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Download, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { usePopupVisibility } from "@/contexts/PopupCoordinatorContext";
import jbjMonogramLightBg from "@/assets/jbj-monogram-light-bg.png";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface AppDownloadPopupProps {
  /** Whether the banner should auto-appear after delayMs */
  showOnLoad?: boolean;
  /** Delay before requesting to show (ms) */
  delayMs?: number;
  /** Visual style */
  variant?: "compact" | "full";
}

const STORAGE_KEYS = {
  INSTALLED: "jbj_pwa_installed",
  DISMISSED_AT: "jbj_app_popup_dismissed",
};

const isIOSDevice = () => {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  // iPadOS 13+ reports as MacIntel but has touch support
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

const isMacSafari = () => isMacDesktop() && isSafariBrowser();

const AppDownloadPopup = ({
  showOnLoad = true,
  delayMs = 3000,
  variant = "compact",
}: AppDownloadPopupProps) => {
  const { requestToShow, dismiss, isVisible } = usePopupVisibility("app-download-popup");

  const [mounted, setMounted] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    // Already installed?
    const installed = localStorage.getItem(STORAGE_KEYS.INSTALLED) === "true";
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;

    if (installed || isStandalone) {
      setIsInstalled(true);
      localStorage.setItem(STORAGE_KEYS.INSTALLED, "true");
      return;
    }

    // Don't show if dismissed within last 24h
    const dismissedAt = localStorage.getItem(STORAGE_KEYS.DISMISSED_AT);
    const dismissedTime = dismissedAt ? parseInt(dismissedAt, 10) : 0;
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    if (dismissedTime > oneDayAgo) return;

    const ios = isIOSDevice();
    setIsIOS(ios);

    // macOS Safari doesn't support PWA installs - don't show popup
    if (!ios && isMacSafari()) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      localStorage.setItem(STORAGE_KEYS.INSTALLED, "true");
      setIsInstalled(true);
      setDeferredPrompt(null);
      dismiss();
      toast.success("App installed.");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Show the popup after delay for all supported browsers (iOS gets instructions, others get install)
    let timer: number | undefined;
    if (showOnLoad) {
      timer = window.setTimeout(() => {
        setShouldShow(true);
        requestToShow();
      }, delayMs);
    }

    return () => {
      if (timer) window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [delayMs, dismiss, requestToShow, showOnLoad]);

  const handleInstall = useCallback(async () => {
    if (isInstalling) return;

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

    // One-click install where supported
    if (deferredPrompt) {
      setIsInstalling(true);
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
          localStorage.setItem(STORAGE_KEYS.INSTALLED, "true");
          setIsInstalled(true);
          dismiss();
          toast.success("App installed.");
        }

        setDeferredPrompt(null);
      } catch (error) {
        console.error("Install error:", error);
      } finally {
        setIsInstalling(false);
      }
      return;
    }

    // Silently dismiss if install not available - no error messages
    localStorage.setItem(STORAGE_KEYS.DISMISSED_AT, Date.now().toString());
    setShouldShow(false);
    dismiss();
  }, [deferredPrompt, dismiss, isInstalling, isIOS]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.DISMISSED_AT, Date.now().toString());
    dismiss();
  }, [dismiss]);

  if (!mounted || isInstalled || !shouldShow) return null;

  const compactContent = (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ type: "spring", damping: 26, stiffness: 260 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[10000] w-[min(420px,calc(100vw-32px))]"
          style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom))" }}
        >
          <div className="pointer-events-auto rounded-2xl border border-border bg-background shadow-lg">
            <div className="flex items-center gap-3 p-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-foreground/5 border border-border">
                <img
                  src={jbjMonogramLightBg}
                  alt="JBJ Global Real Estate"
                  className="w-full h-full object-contain p-1"
                  loading="lazy"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground leading-tight">Install JBJ Global Real Estate</p>
                <p className="text-xs text-muted-foreground leading-tight truncate">
                  One tap install where supported.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={handleInstall} disabled={isInstalling} className="h-9 rounded-xl px-3">
                  <span className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    <span className="text-sm">Install</span>
                  </span>
                </Button>

                <button
                  onClick={handleDismiss}
                  className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground"
                  aria-label="Dismiss install prompt"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const fullContent = (
    <AnimatePresence>
      {isVisible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[9999]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 12 }}
            transition={{ type: "spring", damping: 25, stiffness: 260 }}
            className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-4"
            style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
          >
            <div className="w-full max-w-[420px] rounded-2xl border border-border bg-background shadow-2xl overflow-hidden">
              <div className="p-5 relative">
                <button
                  onClick={handleDismiss}
                  className="absolute top-3 right-3 h-9 w-9 inline-flex items-center justify-center rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-foreground/5 border border-border">
                    <img
                      src={jbjMonogramLightBg}
                      alt="JBJ Global Real Estate"
                      className="w-full h-full object-contain p-2"
                      loading="lazy"
                    />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-foreground leading-tight">Install the app</h3>
                    <p className="text-sm text-muted-foreground leading-snug">
                      One tap install where your browser supports it.
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <Button onClick={handleInstall} disabled={isInstalling} className="w-full h-11 rounded-xl">
                    <span className="flex items-center justify-center gap-2">
                      <Download className="w-5 h-5" />
                      <span>{isInstalling ? "Installing…" : "Install"}</span>
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  const content = variant === "compact" ? compactContent : fullContent;

  return createPortal(content, document.body);
};

export default AppDownloadPopup;
