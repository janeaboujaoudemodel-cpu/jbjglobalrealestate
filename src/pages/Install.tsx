import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Download,
  Smartphone,
  Monitor,
  Tablet,
  Check,
  ArrowLeft,
  Sparkles,
  WifiOff,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMonogram } from "@/components/BrandMonogram";
import { trackPWAEvent } from "@/hooks/usePWAAnalytics";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkStandalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsStandalone(checkStandalone);
    setIsInstalled(checkStandalone);

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      trackPWAEvent('prompt_shown');
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Listen for successful install
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      trackPWAEvent('install_accepted');
      toast.success("App installed successfully! Find it on your home screen.");
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    // Track button click
    trackPWAEvent('button_click', { hasPrompt: !!deferredPrompt, isIOS });
    
    // For Android/Desktop with install prompt
    if (deferredPrompt) {
      setInstalling(true);
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
          setIsInstalled(true);
          // install_accepted is tracked via appinstalled event
        } else {
          trackPWAEvent('install_dismissed');
        }
      } catch (err) {
        console.error('Install prompt failed:', err);
        toast.error("Installation failed. Try using browser menu.");
      }
      setDeferredPrompt(null);
      setInstalling(false);
      return;
    }
    
    // For iOS - trigger share sheet automatically if possible
    if (isIOS) {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'JBJ Global Real Estate',
            text: 'Install the JBJ Global Real Estate app',
            url: window.location.origin,
          });
        } catch {
          // User cancelled or share failed - show instructions
          toast.info("Tap the Share button (⬆), then 'Add to Home Screen'");
        }
      } else {
        toast.info("Tap the Share button (⬆), then 'Add to Home Screen'");
      }
      return;
    }
    
    // Fallback for browsers without install prompt
    toast.info("Use your browser menu → 'Install app' or 'Add to Home Screen'");
  };

  const features = [
    { icon: Zap, title: "Lightning Fast", description: "Loads instantly, even offline" },
    { icon: Smartphone, title: "Native Feel", description: "Full-screen app experience" },
    { icon: WifiOff, title: "Works Offline", description: "Access key features anytime" },
  ];

  return (
    <section className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gold/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Back button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-gold transition-colors mb-12"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </Link>

        <div className="max-w-2xl mx-auto text-center">
          {/* App Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6"
          >
            <div className="w-24 h-24 mx-auto rounded-3xl bg-white shadow-2xl shadow-gold/20 flex items-center justify-center overflow-hidden border-2 border-gold/30">
              <img
                src="/pwa-192x192.jpg"
                alt="JBJ Global Real Estate App Icon"
                className="w-full h-full object-contain"
              />
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/20 border border-gold/30 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-gold" />
              <span className="text-gold text-sm font-medium">Free Download</span>
            </div>

            <h1 className="text-white text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Install{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-light">
                JBJ Global Real Estate
              </span>
            </h1>
            <p className="text-zinc-400 text-lg mb-8 max-w-lg mx-auto">
              Add our app to your home screen for instant access. No app store required.
            </p>
          </motion.div>

          {/* Already Installed */}
          {isInstalled || isStandalone ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/10 border border-green-500/30 rounded-2xl p-8 mb-8"
            >
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-white text-xl font-semibold mb-2">App Installed!</h2>
              <p className="text-zinc-400">
                You're using the JBJ Global Real Estate app. Find it on your home screen or taskbar!
              </p>
              <Link to="/">
                <Button className="mt-6 bg-green-600 hover:bg-green-700 text-white">
                  Open App
                </Button>
              </Link>
            </motion.div>
          ) : (
            <>
              {/* One-Click Install Button - Works for all platforms */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
              >
                <Button
                  onClick={handleInstall}
                  disabled={installing}
                  className="bg-gradient-to-r from-gold to-gold-light text-black font-bold px-10 py-7 text-xl hover:shadow-lg hover:shadow-gold/40 transition-all hover:scale-105 disabled:opacity-70 animate-[bounce_2s_ease-in-out_infinite]"
                  style={{
                    boxShadow: '0 0 30px rgba(168, 146, 90, 0.4)',
                  }}
                >
                  {installing ? (
                    <>
                      <div className="w-5 h-5 mr-2 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Installing...
                    </>
                  ) : (
                    <>
                      <Download className="w-6 h-6 mr-2" />
                      Download App
                    </>
                  )}
                </Button>
                
                {/* Quick tip based on platform */}
                <p className="text-zinc-500 text-sm mt-4">
                  {isIOS 
                    ? "Tap above, then select 'Add to Home Screen' from the share menu"
                    : deferredPrompt 
                      ? "One click install - app appears on your home screen instantly"
                      : "Tap ⋮ menu → 'Install app' or 'Add to Home Screen'"
                  }
                </p>
              </motion.div>
            </>
          )}

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12"
          >
            {features.map((feature, i) => (
              <div
                key={i}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mx-auto mb-3">
                  <feature.icon className="w-6 h-6 text-gold" />
                </div>
                <h4 className="text-white font-medium mb-1">{feature.title}</h4>
                <p className="text-zinc-500 text-sm">{feature.description}</p>
              </div>
            ))}
          </motion.div>

          {/* Device Support */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-6 text-zinc-500"
          >
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              <span className="text-sm">Mobile</span>
            </div>
            <div className="flex items-center gap-2">
              <Tablet className="w-5 h-5" />
              <span className="text-sm">Tablet</span>
            </div>
            <div className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              <span className="text-sm">Desktop</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Install;

