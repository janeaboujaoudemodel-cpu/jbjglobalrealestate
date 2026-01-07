import { useState, useEffect, useCallback } from "react";
import { Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logoDark from "@/assets/logo-dark.jpg";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const isIOSDevice = () => {
  try {
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
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
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsInstalled(standalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowSuccess(true);
      
      // Show success message with location info
      const isIOS = isIOSDevice();
      const message = isIOS 
        ? "App installed! Find it on your Home Screen" 
        : "App installed! Find it in your app drawer or Home Screen";
      
      toast.success(message, {
        duration: 5000,
        description: "Tap the JJ icon anytime for quick access",
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
    // If native prompt is available, use it directly
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (error) {
        console.error("Install prompt error:", error);
      }
      return;
    }

    // For iOS or when no prompt available, show instructions via toast
    const isIOS = isIOSDevice();
    if (isIOS) {
      toast.info("To install on iOS:", {
        duration: 8000,
        description: "Tap the Share button (□↑) in Safari, then 'Add to Home Screen'",
      });
    } else {
      toast.info("Installing...", {
        duration: 3000,
        description: "Look for the install prompt in your browser's address bar",
      });
    }
  }, [deferredPrompt]);

  if (isInstalled) return null;

  // Show on all devices (desktop and mobile)
  const shouldShow = !!deferredPrompt || isMobileLikeDevice() || true;
  if (!shouldShow) return null;

  return (
    <AnimatePresence>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: 1, 
          opacity: 1,
        }}
        exit={{ scale: 0, opacity: 0 }}
        onClick={handleInstallClick}
        className="fixed bottom-6 left-6 z-[9000] flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-gold to-gold-light shadow-2xl shadow-gold/40 hover:scale-110 transition-transform group animate-bounce-glow"
        aria-label="Download app"
        style={{
          animation: "bounce-glow 2s ease-in-out infinite",
        }}
      >
        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-black/30 shadow-inner">
          <img
            src={logoDark}
            alt="JJ Global Capital"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <span className="text-black font-bold text-sm tracking-wide">Download App</span>
        <Download className="w-5 h-5 text-black animate-pulse" />
        
        {/* Glow ring effect */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gold/20"
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
      </motion.button>

      {/* Add keyframes for custom animation */}
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
        .animate-bounce-glow {
          animation: bounce-glow 2s ease-in-out infinite;
        }
      `}</style>
    </AnimatePresence>
  );
};

export default InstallAppButton;
