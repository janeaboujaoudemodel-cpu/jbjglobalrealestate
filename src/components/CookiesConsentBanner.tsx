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

  // Flag the body while the banner is on screen so other floating
  // widgets (chat bubble, voice concierge) can move out of the way on mobile.
  useEffect(() => {
    if (shouldShow && isVisible) {
      document.body.setAttribute('data-cookie-banner-open', '1');
      return () => document.body.removeAttribute('data-cookie-banner-open');
    }
  }, [shouldShow, isVisible]);

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
          className="cookie-banner pointer-events-none fixed bottom-0 left-0 right-0 z-50 p-2 sm:p-3"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          data-chrome="cookie-banner"
        >
          <div data-surface="champagne" className="surface-champagne pointer-events-auto relative max-w-md sm:max-w-2xl mx-auto bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EEF7F3] backdrop-blur-xl border border-[#064E3B]/25 rounded-xl shadow-2xl shadow-emerald-950/10 overflow-hidden max-h-[58vh] overflow-y-auto overscroll-contain">
            {/* Top gold accent line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
            
            {/* Main Banner */}
            {!showPreferences ? (
              <div className="p-3 sm:p-4">
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#EAF4EF] border border-[#064E3B]/25 rounded-lg flex items-center justify-center flex-shrink-0 shadow-inner">
                    <Cookie className="w-4 h-4 sm:w-5 sm:h-5 text-[#064E3B]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[#1A1A1A] font-semibold text-sm sm:text-base mb-1">Cookies on your device</h3>
                    <p className="text-[#1A1A1A]/80 text-[11px] sm:text-xs leading-relaxed mb-2.5">
                      We placed essential cookies on your device. You can accept all or manage optional cookies.
                    </p>
                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 items-stretch">
                      <Button
                        onClick={handleAcceptAll}
                        className="jj-official-emerald allow-white shadow-md px-4 sm:px-5 text-xs sm:text-sm !whitespace-nowrap [word-break:keep-all] !flex-none h-9"
                        style={{ color: "#FFFFFF", width: "max-content", flex: "0 0 auto" }}
                        data-cta="primary"
                        data-surface="emerald"
                        data-emerald-icon-surface
                        data-no-contrast-guard
                      >
                        <span className="allow-white !whitespace-nowrap" style={{ color: "#FFFFFF" }}>Accept All</span>
                      </Button>
                      <Button
                        onClick={handleRejectNonEssential}
                        variant="outline"
                        className="jj-cta-outline shadow-sm px-4 sm:px-5 text-xs sm:text-sm !whitespace-nowrap [word-break:keep-all] !flex-none !min-w-[112px] h-9"
                        style={{ width: "auto", minWidth: "112px", flex: "0 0 auto" }}
                        data-cta="outline"
                      >
                        <span className="!whitespace-nowrap" style={{ display: "inline-block", width: "auto" }}>Reject All</span>
                      </Button>

                      <Button
                        onClick={() => setShowPreferences(true)}
                        className="jj-official-emerald allow-white shadow-md px-4 sm:px-5 text-xs sm:text-sm !whitespace-nowrap [word-break:keep-all] !flex-none h-9"
                        style={{ color: "#FFFFFF", width: "max-content", flex: "0 0 auto" }}
                        data-cta="primary"
                        data-surface="emerald"
                        data-emerald-icon-surface
                        data-no-contrast-guard
                      >
                        <span className="allow-white !whitespace-nowrap" style={{ color: "#FFFFFF" }}>Manage Preferences</span>
                      </Button>
                    </div>



                    <p className="text-[#1A1A1A]/65 text-[10px] mt-2">
                      <Link to="/cookies" className="text-[#8A6F3F] hover:text-[#6F5930] underline underline-offset-2 font-semibold">
                        Cookies Policy
                      </Link>{" · "}
                      <Link to="/privacy" className="text-[#8A6F3F] hover:text-[#6F5930] underline underline-offset-2 font-semibold">
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
                  <h3 className="text-[#1A1A1A] font-semibold text-lg">Cookie Preferences</h3>
                  {/* X button removed - use Cancel button instead */}
                </div>

                <div className="space-y-4 mb-6">
                  {/* Essential - Always on */}
                  <div className="flex items-center justify-between p-4 bg-[#FDFBF7]/70 border border-[#B89555]/20 rounded-xl">
                    <div>
                      <h4 className="text-[#1A1A1A] font-medium">Essential Cookies</h4>
                      <p className="text-[#1A1A1A]/60 text-sm">Required for the website to function</p>
                    </div>
                    <div className="px-3 py-1 bg-gradient-to-r from-gold/20 to-gold/10 text-[#1A1A1A] text-xs font-medium rounded-full border border-[#B89555]/30">
                      Always on
                    </div>
                  </div>

                  {/* Analytics */}
                  <label className="flex items-center justify-between p-4 bg-[#FDFBF7]/70 border border-[#B89555]/20 rounded-xl cursor-pointer hover:bg-[#FDFBF7]/90 hover:border-[#B89555]/40 transition-all">
                    <div>
                      <h4 className="text-[#1A1A1A] font-medium">Analytics Cookies</h4>
                      <p className="text-[#1A1A1A]/60 text-sm">Help us improve our website</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                      className="w-5 h-5 rounded border-[#B89555]/50 bg-[#FDFBF7] text-[#1A1A1A] focus:ring-gold focus:ring-offset-0 accent-gold"
                    />
                  </label>

                  {/* Marketing */}
                  <label className="flex items-center justify-between p-4 bg-[#FDFBF7]/70 border border-[#B89555]/20 rounded-xl cursor-pointer hover:bg-[#FDFBF7]/90 hover:border-[#B89555]/40 transition-all">
                    <div>
                      <h4 className="text-[#1A1A1A] font-medium">Marketing Cookies</h4>
                      <p className="text-[#1A1A1A]/60 text-sm">Personalized advertising</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                      className="w-5 h-5 rounded border-[#B89555]/50 bg-[#FDFBF7] text-[#1A1A1A] focus:ring-gold focus:ring-offset-0 accent-gold"
                    />
                  </label>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleSavePreferences}
                    className="jj-cta-champagne font-semibold hover:brightness-110 transition-all border border-[#B89555]/50 shadow-lg px-6"
                    data-cta="champagne"
                  >
                    Save preferences
                  </Button>
                  <Button
                    onClick={() => setShowPreferences(false)}
                    variant="outline"
                    className="jj-cta-outline bg-[#FDFBF7]/80 border-[#B89555]/40 text-[#1A1A1A] font-medium transition-all px-6"
                    data-cta="outline"
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
