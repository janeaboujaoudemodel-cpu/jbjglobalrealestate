import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Download, Smartphone, Monitor, Tablet, Check, 
  ArrowLeft, Share, Plus, MoreVertical, Sparkles,
  Wifi, WifiOff, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { JJLogoImage } from "@/components/JJLogoImage";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

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
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Listen for successful install
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
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
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <JJLogoImage variant="light" size="lg" />
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/20 border border-gold/30 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-gold" />
              <span className="text-gold text-sm font-medium">Install App</span>
            </div>

            <h1 className="text-white text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Get the{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-light">
                JJ Capital App
              </span>
            </h1>
            <p className="text-zinc-400 text-lg mb-8 max-w-lg mx-auto">
              Install our app directly from your browser for the best experience. No app store needed.
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
                You're already using the JJ Global Capital app. Enjoy the full experience!
              </p>
            </motion.div>
          ) : (
            <>
              {/* Install Button (Android/Desktop) */}
              {deferredPrompt && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mb-8"
                >
                  <Button
                    onClick={handleInstall}
                    className="bg-gradient-to-r from-gold to-gold-light text-black font-semibold px-8 py-6 text-lg hover:shadow-lg hover:shadow-gold/30 transition-all"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Install App Now
                  </Button>
                </motion.div>
              )}

              {/* iOS Instructions */}
              {isIOS && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8"
                >
                  <h3 className="text-white text-lg font-semibold mb-4">
                    Install on iPhone/iPad
                  </h3>
                  <div className="space-y-4 text-left">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center flex-shrink-0">
                        <Share className="w-5 h-5 text-gold" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Step 1</p>
                        <p className="text-zinc-400 text-sm">
                          Tap the <strong>Share</strong> button at the bottom of Safari
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center flex-shrink-0">
                        <Plus className="w-5 h-5 text-gold" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Step 2</p>
                        <p className="text-zinc-400 text-sm">
                          Scroll down and tap <strong>"Add to Home Screen"</strong>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-5 h-5 text-gold" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Step 3</p>
                        <p className="text-zinc-400 text-sm">
                          Tap <strong>"Add"</strong> in the top right corner
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Android/Chrome Instructions (when no prompt available) */}
              {!isIOS && !deferredPrompt && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8"
                >
                  <h3 className="text-white text-lg font-semibold mb-4">
                    Install on Android/Desktop
                  </h3>
                  <div className="space-y-4 text-left">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center flex-shrink-0">
                        <MoreVertical className="w-5 h-5 text-gold" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Step 1</p>
                        <p className="text-zinc-400 text-sm">
                          Tap the <strong>menu (⋮)</strong> in your browser
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center flex-shrink-0">
                        <Download className="w-5 h-5 text-gold" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Step 2</p>
                        <p className="text-zinc-400 text-sm">
                          Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
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
