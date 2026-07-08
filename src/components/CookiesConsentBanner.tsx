import { useState, useEffect } from "react";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { usePopupVisibility } from "@/contexts/PopupCoordinatorContext";
import { supabase } from "@/integrations/supabase/client";
import { useAgreementSaver } from "@/hooks/useAgreementSaver";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user } = useAuth();

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
      page_url: window.location.href,
      referrer: document.referrer || null,
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
        user_id: user?.id ?? null,
        consent_status: 'all',
        preferences: consentData.preferences as any,
        user_agent: navigator.userAgent,
        accepted_at: consentData.timestamp,
        policy_version: COOKIES_POLICY_SNAPSHOT.version,
        policy_snapshot: COOKIES_POLICY_SNAPSHOT as any,
        consent_source: 'cookie_banner',
        page_url: consentData.page_url,
        referrer: consentData.referrer,
      } as any);
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
            className="surface-champagne pointer-events-auto mx-auto flex max-w-[24rem] items-center gap-2 rounded-2xl border border-[#B89555]/40 bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#EEF7F3] px-3 py-2.5 shadow-[0_18px_45px_-22px_rgba(4,44,28,0.45)] sm:max-w-lg sm:gap-3 sm:px-4 sm:py-3"
          >
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#EAF4EF] sm:h-7 sm:w-7">
              <Cookie className="h-3.5 w-3.5 text-[#064E3B] sm:h-4 sm:w-4" />
            </div>
            <div className="flex-1 text-[#1A1A1A]">
              <p className="text-[11px] font-semibold leading-tight sm:text-xs">We use essential cookies to keep this experience secure and reliable.</p>
              <p className="mt-0.5 text-[10px] leading-tight text-[#1A1A1A]/70 sm:text-[11px]">
                By selecting Okay, your consent is recorded with date, time, browser and policy version. Read our{" "}
                <a href="/cookies" className="font-semibold underline decoration-[#B89555] underline-offset-2 hover:text-[#064E3B]">Cookies Policy</a>
                {" "}and{" "}
                <a href="/privacy" className="font-semibold underline decoration-[#B89555] underline-offset-2 hover:text-[#064E3B]">Privacy Policy</a>.
              </p>
            </div>
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
