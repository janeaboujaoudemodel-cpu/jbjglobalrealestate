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
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] backdrop-blur-xl border border-gold/40 rounded-2xl shadow-2xl shadow-gold/10 overflow-hidden">
            {/* Top gold accent line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
            
            {/* Main Banner */}
            {!showPreferences ? (
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-gold/20 to-gold/10 border border-gold/50 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner">
                    <Cookie className="w-6 h-6 text-gold" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-black font-semibold text-lg mb-2">We value your privacy</h3>
                    <p className="text-black/70 text-sm leading-relaxed mb-4">
                      We use cookies to enhance your experience and improve performance. You can choose 
                      your preferences anytime. Essential cookies are required for the website to function.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={handleAcceptAll}
                        className="bg-gradient-to-r from-gold via-[#D4AF37] to-gold text-black font-semibold hover:brightness-110 transition-all border border-gold/50 shadow-lg px-6"
                      >
                        Accept All
                      </Button>
                      <Button
                        onClick={() => setShowPreferences(true)}
                        variant="outline"
                        className="bg-white/80 border-black/20 text-black font-medium hover:bg-black hover:text-white transition-all px-6"
                      >
                        Manage Preferences
                      </Button>
                    </div>
                    <p className="text-black/50 text-xs mt-4">
                      Read our{" "}
                      <Link to="/cookies" className="text-gold hover:text-gold/80 underline underline-offset-2 font-medium">
                        Cookies Policy
                      </Link>{" "}
                      and{" "}
                      <Link to="/privacy" className="text-gold hover:text-gold/80 underline underline-offset-2 font-medium">
                        Privacy Policy
                      </Link>
                    </p>
                  </div>
                  <button
                    onClick={handleRejectNonEssential}
                    className="text-black/50 hover:text-black transition-colors p-1.5 rounded-lg hover:bg-black/5"
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
                  <h3 className="text-black font-semibold text-lg">Cookie Preferences</h3>
                  <button
                    onClick={() => setShowPreferences(false)}
                    className="text-black/50 hover:text-black transition-colors p-1.5 rounded-lg hover:bg-black/5"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  {/* Essential - Always on */}
                  <div className="flex items-center justify-between p-4 bg-white/70 border border-gold/20 rounded-xl">
                    <div>
                      <h4 className="text-black font-medium">Essential Cookies</h4>
                      <p className="text-black/60 text-sm">Required for the website to function</p>
                    </div>
                    <div className="px-3 py-1 bg-gradient-to-r from-gold/20 to-gold/10 text-gold text-xs font-medium rounded-full border border-gold/30">
                      Always on
                    </div>
                  </div>

                  {/* Analytics */}
                  <label className="flex items-center justify-between p-4 bg-white/70 border border-gold/20 rounded-xl cursor-pointer hover:bg-white/90 hover:border-gold/40 transition-all">
                    <div>
                      <h4 className="text-black font-medium">Analytics Cookies</h4>
                      <p className="text-black/60 text-sm">Help us improve our website</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                      className="w-5 h-5 rounded border-gold/50 bg-white text-gold focus:ring-gold focus:ring-offset-0 accent-gold"
                    />
                  </label>

                  {/* Marketing */}
                  <label className="flex items-center justify-between p-4 bg-white/70 border border-gold/20 rounded-xl cursor-pointer hover:bg-white/90 hover:border-gold/40 transition-all">
                    <div>
                      <h4 className="text-black font-medium">Marketing Cookies</h4>
                      <p className="text-black/60 text-sm">Personalized advertising</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                      className="w-5 h-5 rounded border-gold/50 bg-white text-gold focus:ring-gold focus:ring-offset-0 accent-gold"
                    />
                  </label>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleSavePreferences}
                    className="bg-gradient-to-r from-gold via-[#D4AF37] to-gold text-black font-semibold hover:brightness-110 transition-all border border-gold/50 shadow-lg px-6"
                  >
                    Save preferences
                  </Button>
                  <Button
                    onClick={() => setShowPreferences(false)}
                    variant="outline"
                    className="bg-white/80 border-black/20 text-black font-medium hover:bg-black hover:text-white transition-all px-6"
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
