import { useState, useEffect } from "react";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { usePopupVisibility } from "@/contexts/PopupCoordinatorContext";
import { supabase } from "@/integrations/supabase/client";
import { useAgreementSaver } from "@/hooks/useAgreementSaver";

const COOKIES_CONSENT_KEY = "jj_cookies_consent";

const COOKIES_POLICY_SNAPSHOT = {
  title: "JBJ Global Real Estate - Cookies Policy",
  version: "1.0",
  sections: [
    { heading: "Essential Cookies", description: "Required for the website to function properly." },
  ],
  legal_basis: "By continuing to use this website, you consent to the use of essential cookies as described in our Cookies Policy and Privacy Policy.",
  effective_date: "2025-01-01",
};

const CookiesConsentBanner = () => {
  const { requestToShow, dismiss, isVisible } = usePopupVisibility('cookies-consent');
  const [shouldShow, setShouldShow] = useState(false);
  const { saveAgreement } = useAgreementSaver();

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

  useEffect(() => {
    if (shouldShow && isVisible) {
      document.body.setAttribute('data-cookie-banner-open', '1');
      return () => document.body.removeAttribute('data-cookie-banner-open');
    }
  }, [shouldShow, isVisible]);

  const handleOkay = async () => {
    const consentData = {
      status: "all",
      preferences: { essential: true, analytics: true, marketing: true },
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(COOKIES_CONSENT_KEY, JSON.stringify(consentData));
    dismiss();
    setShouldShow(false);

    await saveAgreement({
      agreementType: 'cookies_policy',
      agreementSnapshot: COOKIES_POLICY_SNAPSHOT,
      consentDetails: consentData,
    });

    try {
      const visitorId = localStorage.getItem('jj_visitor_id') || crypto.randomUUID();
      localStorage.setItem('jj_visitor_id', visitorId);
      await supabase.from('cookie_consents').insert({
        visitor_id: visitorId,
        consent_status: 'all',
        preferences: consentData.preferences as any,
        user_agent: navigator.userAgent,
      });
    } catch (e) {
      console.error('Failed to persist cookie consent:', e);
    }
  };

  if (!shouldShow) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="cookie-banner pointer-events-none fixed bottom-0 left-0 right-0 z-50 p-2 sm:p-3"
          style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
          data-chrome="cookie-banner"
        >
          <div
            data-surface="champagne"
            className="surface-champagne pointer-events-auto mx-auto flex max-w-[22rem] items-center gap-2 rounded-full border border-[#064E3B]/20 bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#EEF7F3] px-3 py-2 shadow-lg shadow-emerald-950/10 sm:max-w-md sm:gap-3 sm:px-4 sm:py-2.5"
          >
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#EAF4EF] sm:h-7 sm:w-7">
              <Cookie className="h-3.5 w-3.5 text-[#064E3B] sm:h-4 sm:w-4" />
            </div>
            <p className="flex-1 text-[10px] leading-tight text-[#1A1A1A]/90 sm:text-xs">
              We have placed some cookies.
            </p>
            <Button
              onClick={handleOkay}
              className="jj-official-emerald allow-white h-7 flex-none rounded-full px-3 text-[10px] sm:h-8 sm:px-4 sm:text-xs"
              data-cta="primary"
              data-surface="emerald"
              data-no-contrast-guard
            >
              <span className="allow-white">Okay</span>
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookiesConsentBanner;
