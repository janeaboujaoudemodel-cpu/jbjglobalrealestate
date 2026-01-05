import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallAppButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showButton, setShowButton] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already installed or dismissed
    const isInstalled = window.matchMedia("(display-mode: standalone)").matches;
    const wasDismissed = localStorage.getItem("pwa-install-dismissed");
    
    if (isInstalled || wasDismissed) {
      setShowButton(false);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowButton(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Show button for iOS (no beforeinstallprompt support)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS && !isInstalled) {
      setShowButton(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowButton(false);
      }
      setDeferredPrompt(null);
    } else {
      // For iOS or manual instructions
      navigate("/install");
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowButton(false);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  if (!showButton || dismissed) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
      <div className="relative">
        <Button
          onClick={handleInstallClick}
          className="bg-gradient-to-r from-[#B5935A] to-[#D4AF37] hover:from-[#D4AF37] hover:to-[#B5935A] text-black font-semibold px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 transition-all duration-300 hover:scale-105"
        >
          <Download className="w-5 h-5" />
          Install App
        </Button>
        <button
          onClick={handleDismiss}
          className="absolute -top-2 -right-2 bg-black/80 hover:bg-black text-white rounded-full p-1 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default InstallAppButton;
