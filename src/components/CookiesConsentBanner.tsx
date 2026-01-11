import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { usePopupVisibility } from "@/contexts/PopupCoordinatorContext";

const COOKIES_CONSENT_KEY = "jj_cookies_consent";

type ConsentStatus = "pending" | "all" | "essential" | "custom";

interface CookiePreferences {
  essential: boolean; // Always true
  analytics: boolean;
  marketing: boolean;
}

const CookiesConsentBanner = () => {
  const { requestToShow, dismiss, isVisible } = usePopupVisibility('cookies-consent');
  const [showPreferences, setShowPreferences] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem(COOKIES_CONSENT_KEY);
    if (!consent) {
      // Small delay before showing banner for better UX
      const timer = setTimeout(() => {
        setShouldShow(true);
        requestToShow();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [requestToShow]);

  const saveConsent = (status: ConsentStatus, prefs?: CookiePreferences) => {
    const consentData = {
      status,
      preferences: prefs || preferences,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(COOKIES_CONSENT_KEY, JSON.stringify(consentData));
    dismiss();
    setShouldShow(false);
    setShowPreferences(false);
  };

  const handleAcceptAll = () => {
    const allAccepted = { essential: true, analytics: true, marketing: true };
    setPreferences(allAccepted);
    saveConsent("all", allAccepted);
  };

  const handleRejectNonEssential = () => {
    const essentialOnly = { essential: true, analytics: false, marketing: false };
    setPreferences(essentialOnly);
    saveConsent("essential", essentialOnly);
  };

  const handleSavePreferences = () => {
    saveConsent("custom", preferences);
  };

  if (!shouldShow) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4"
        >
          <div className="max-w-4xl mx-auto bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
            {/* Main Banner */}
            {!showPreferences ? (
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gold/10 border border-gold/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Cookie className="w-6 h-6 text-gold" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg mb-2">We use cookies</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                      We use essential cookies to run this website. With your permission, we also use 
                      optional cookies for analytics and marketing. You can accept all, reject non-essential, 
                      or manage preferences.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={handleAcceptAll}
                        className="bg-gold hover:bg-gold-light text-black font-semibold px-6"
                      >
                        Accept all
                      </Button>
                      <Button
                        onClick={handleRejectNonEssential}
                        variant="outline"
                        className="border-zinc-600 text-white hover:bg-zinc-800"
                      >
                        Reject non-essential
                      </Button>
                      <Button
                        onClick={() => setShowPreferences(true)}
                        variant="ghost"
                        className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                      >
                        Manage preferences
                      </Button>
                    </div>
                    <p className="text-zinc-500 text-xs mt-4">
                      Read our{" "}
                      <Link to="/cookies" className="text-gold hover:underline">
                        Cookies Policy
                      </Link>{" "}
                      and{" "}
                      <Link to="/privacy" className="text-gold hover:underline">
                        Privacy Policy
                      </Link>
                    </p>
                  </div>
                  <button
                    onClick={handleRejectNonEssential}
                    className="text-zinc-500 hover:text-white transition-colors p-1"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              /* Preferences Panel */
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white font-semibold text-lg">Cookie Preferences</h3>
                  <button
                    onClick={() => setShowPreferences(false)}
                    className="text-zinc-500 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  {/* Essential - Always on */}
                  <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
                    <div>
                      <h4 className="text-white font-medium">Essential Cookies</h4>
                      <p className="text-zinc-400 text-sm">Required for the website to function</p>
                    </div>
                    <div className="px-3 py-1 bg-gold/20 text-gold text-xs font-medium rounded-full">
                      Always on
                    </div>
                  </div>

                  {/* Analytics */}
                  <label className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl cursor-pointer hover:bg-zinc-800 transition-colors">
                    <div>
                      <h4 className="text-white font-medium">Analytics Cookies</h4>
                      <p className="text-zinc-400 text-sm">Help us improve our website</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                      className="w-5 h-5 rounded border-zinc-600 bg-zinc-700 text-gold focus:ring-gold focus:ring-offset-0"
                    />
                  </label>

                  {/* Marketing */}
                  <label className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl cursor-pointer hover:bg-zinc-800 transition-colors">
                    <div>
                      <h4 className="text-white font-medium">Marketing Cookies</h4>
                      <p className="text-zinc-400 text-sm">Personalized advertising</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                      className="w-5 h-5 rounded border-zinc-600 bg-zinc-700 text-gold focus:ring-gold focus:ring-offset-0"
                    />
                  </label>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleSavePreferences}
                    className="bg-gold hover:bg-gold-light text-black font-semibold px-6"
                  >
                    Save preferences
                  </Button>
                  <Button
                    onClick={() => setShowPreferences(false)}
                    variant="ghost"
                    className="text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookiesConsentBanner;
