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
  Share,
  Plus,
  MoreVertical,
  Sparkles,
  WifiOff,
  Zap,
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

    setInstalling(true);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
    setInstalling(false);
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
                alt="JJ Global Capital App Icon"
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
                JJ Global Capital
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
                You're using the JJ Global Capital app. Find it on your home screen or taskbar!
              </p>
              <Link to="/">
                <Button className="mt-6 bg-green-600 hover:bg-green-700 text-white">
                  Open App
                </Button>
              </Link>
            </motion.div>
          ) : (
            <>
              {/* One-Click Install Button (Android/Desktop) */}
              {deferredPrompt && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mb-8"
                >
                  <Button
                    onClick={handleInstall}
                    disabled={installing}
                    className="bg-gradient-to-r from-gold to-gold-light text-black font-bold px-10 py-7 text-xl hover:shadow-lg hover:shadow-gold/40 transition-all hover:scale-105 disabled:opacity-70"
                  >
                    {installing ? (
                      <>
                        <div className="w-5 h-5 mr-2 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        Installing...
                      </>
                    ) : (
                      <>
                        <Download className="w-6 h-6 mr-2" />
                        Install Now — One Click
                      </>
                    )}
                  </Button>
                  <p className="text-zinc-500 text-sm mt-3">
                    Click the button above and confirm. The app will appear on your home screen/taskbar.
                  </p>
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
                  <h3 className="text-white text-xl font-semibold mb-6">
                    📱 Install on iPhone / iPad
                  </h3>
                  <div className="space-y-5 text-left">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0 border border-blue-500/30">
                        <Share className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-lg">Step 1: Tap Share</p>
                        <p className="text-zinc-400">
                          Tap the <strong className="text-white">Share</strong> button (square with arrow) at the bottom of Safari
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center flex-shrink-0 border border-gold/30">
                        <Plus className="w-6 h-6 text-gold" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-lg">Step 2: Add to Home Screen</p>
                        <p className="text-zinc-400">
                          Scroll down and tap <strong className="text-white">"Add to Home Screen"</strong>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0 border border-green-500/30">
                        <Check className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-lg">Step 3: Tap "Add"</p>
                        <p className="text-zinc-400">
                          Confirm by tapping <strong className="text-white">"Add"</strong> in the top right
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <p className="text-blue-300 text-sm">
                      💡 <strong>Tip:</strong> Make sure you're using Safari browser for the best experience
                    </p>
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
                  <h3 className="text-white text-xl font-semibold mb-6">
                    📱 Install on Android / Desktop
                  </h3>
                  <div className="space-y-5 text-left">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center flex-shrink-0 border border-gold/30">
                        <MoreVertical className="w-6 h-6 text-gold" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-lg">Step 1: Open Menu</p>
                        <p className="text-zinc-400">
                          Tap the <strong className="text-white">⋮ menu</strong> button in your browser (top right)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0 border border-green-500/30">
                        <Download className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-lg">Step 2: Install App</p>
                        <p className="text-zinc-400">
                          Select <strong className="text-white">"Install app"</strong> or <strong className="text-white">"Add to Home screen"</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-gold/10 border border-gold/20 rounded-xl">
                    <p className="text-gold text-sm">
                      💡 <strong>Tip:</strong> Use Chrome or Edge browser for one-click install
                    </p>
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

