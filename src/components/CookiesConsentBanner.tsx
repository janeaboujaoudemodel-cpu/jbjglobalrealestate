import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { usePopupVisibility } from "@/contexts/PopupCoordinatorContext";
import { supabase } from "@/integrations/supabase/client";
import { useAgreementSaver } from "@/hooks/useAgreementSaver";

const COOKIES_CONSENT_KEY = "jj_cookies_consent";

type ConsentStatus = "pending" | "all" | "essential" | "custom";

interface CookiePreferences {
  essential: boolean; // Always true
  analytics: boolean;
  marketing: boolean;
}

const COOKIES_POLICY_SNAPSHOT = {
  title: "JBJ Global Real Estate - Cookies Policy",
  version: "1.0",
  sections: [
    { heading: "Essential Cookies", description: "Required for the website to function properly. Cannot be disabled." },
    { heading: "Analytics Cookies", description: "Help us understand how visitors interact with our website by collecting and reporting information anonymously." },
    { heading: "Marketing Cookies", description: "Used to track visitors across websites to display personalized advertising." },
  ],
  legal_basis: "By accepting cookies, you consent to the use of cookies as described in our Cookies Policy and Privacy Policy, in compliance with GDPR, CCPA, and UAE data protection regulations.",
  effective_date: "2025-01-01",
};

const CookiesConsentBanner = () => {
  const { requestToShow, dismiss, isVisible } = usePopupVisibility('cookies-consent');
  const [showPreferences, setShowPreferences] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const { saveAgreement } = useAgreementSaver();
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem(COOKIES_CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => {
        setShouldShow(true);
        requestToShow();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [requestToShow]);

  const saveConsent = async (status: ConsentStatus, prefs?: CookiePreferences) => {
    const finalPrefs = prefs || preferences;
    const consentData = {
      status,
      preferences: finalPrefs,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(COOKIES_CONSENT_KEY, JSON.stringify(consentData));
    dismiss();
    setShouldShow(false);
    setShowPreferences(false);

    // Save to user_agreements (authenticated, court-ready)
    await saveAgreement({
      agreementType: 'cookies_policy',
      agreementSnapshot: COOKIES_POLICY_SNAPSHOT,
      consentDetails: { status, preferences: finalPrefs },
    });

    // Also persist to legacy cookie_consents table for backward compatibility
    try {
      const visitorId = localStorage.getItem('jj_visitor_id') || crypto.randomUUID();
      localStorage.setItem('jj_visitor_id', visitorId);
      await supabase.from('cookie_consents').insert({
        visitor_id: visitorId,
        consent_status: status === 'pending' ? 'essential' : status,
        preferences: finalPrefs as any,
        user_agent: navigator.userAgent,
      });
    } catch (e) {
      console.error('Failed to persist cookie consent:', e);
    }
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
          <div className="max-w-lg sm:max-w-4xl mx-auto bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] backdrop-blur-xl border border-gold/40 rounded-2xl shadow-2xl shadow-gold/10 overflow-hidden">
            {/* Top gold accent line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
            
            {/* Main Banner */}
            {!showPreferences ? (
              <div className="p-4 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-gold/20 to-gold/10 border border-gold/50 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner">
                    <Cookie className="w-5 h-5 sm:w-6 sm:h-6 text-gold" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-black font-semibold text-base sm:text-lg mb-1.5">We value your privacy</h3>
                    <p className="text-black/70 text-xs sm:text-sm leading-relaxed mb-3">
                      We use cookies to enhance your experience. Essential cookies are required for the website to function.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <Button
                        onClick={handleAcceptAll}
                        className="bg-gold text-black font-semibold hover:brightness-110 transition-all border border-gold/50 shadow-lg px-4 sm:px-6 text-sm"
                      >
                        Accept All
                      </Button>
                      <Button
                        onClick={() => setShowPreferences(true)}
                        variant="outline"
                        className="bg-white/80 border-black/20 text-black font-medium hover:bg-black hover:text-white transition-all px-4 sm:px-6 text-sm"
                      >
                        Manage Preferences
                      </Button>
                    </div>
                    <p className="text-black/50 text-[10px] sm:text-xs mt-3">
                      <Link to="/cookies" className="text-gold hover:text-gold/80 underline underline-offset-2 font-medium">
                        Cookies Policy
                      </Link>{" · "}
                      <Link to="/privacy" className="text-gold hover:text-gold/80 underline underline-offset-2 font-medium">
                        Privacy Policy
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Preferences Panel */
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-black font-semibold text-lg">Cookie Preferences</h3>
                  {/* X button removed - use Cancel button instead */}
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
                    className="bg-gold text-black font-semibold hover:brightness-110 transition-all border border-gold/50 shadow-lg px-6"
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
