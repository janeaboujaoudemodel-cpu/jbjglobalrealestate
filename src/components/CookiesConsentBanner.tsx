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

type CookieConsentAuditPayload = {
  visitor_id: string;
  user_id: string | null;
  consent_status: "all";
  preferences: { essential: boolean; analytics: boolean; marketing: boolean };
  user_agent: string;
  accepted_at: string;
  policy_version: string;
  policy_snapshot: typeof COOKIES_POLICY_SNAPSHOT;
  consent_source: "cookie_banner";
  page_url: string;
  referrer: string | null;
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
      const cookieConsentTable = supabase.from('cookie_consents') as unknown as {
        insert: (values: CookieConsentAuditPayload) => Promise<{ error: { message: string } | null }>;
      };
      const { error } = await cookieConsentTable.insert({
        visitor_id: visitorId,
        user_id: user?.id ?? null,
        consent_status: 'all',
        preferences: consentData.preferences,
        user_agent: navigator.userAgent,
        accepted_at: consentData.timestamp,
        policy_version: COOKIES_POLICY_SNAPSHOT.version,
        policy_snapshot: COOKIES_POLICY_SNAPSHOT,
        consent_source: 'cookie_banner',
        page_url: consentData.page_url,
        referrer: consentData.referrer,
      });
      if (error) throw error;
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
          className="cookie-banner pointer-events-none fixed bottom-3 right-3 z-50 w-[min(calc(100vw-1.5rem),26rem)] sm:bottom-4 sm:right-4 sm:w-[26rem]"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          data-chrome="cookie-banner"
        >
          <div
            data-surface="emerald"
            data-emerald="true"
            data-no-contrast-guard
            className="jj-emerald-metallic allow-white pointer-events-auto ml-auto flex w-full items-start gap-3 rounded-xl border border-white/25 px-4 py-3 shadow-[0_18px_45px_-22px_rgba(4,44,28,0.55)]"
            style={{ color: "#FFFFFF" }}
          >
            <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/15 border border-white/30">
              <Cookie className="h-4 w-4 allow-white" style={{ color: "#FFFFFF" }} />
            </div>
            <div className="flex-1 allow-white" style={{ color: "#FFFFFF" }}>
              <p className="allow-white text-[12px] font-semibold leading-tight" style={{ color: "#FFFFFF" }}>We use essential cookies to keep this experience secure and reliable.</p>
              <p className="allow-white mt-1 text-[11px] leading-snug" style={{ color: "rgba(255,255,255,0.88)" }}>
                By selecting Okay, your consent is recorded with date, time, browser and policy version. Read our{" "}
                <a href="/cookies" className="allow-white font-semibold underline underline-offset-2" style={{ color: "#FFFFFF" }}>Cookies Policy</a>
                {" "}and{" "}
                <a href="/privacy" className="allow-white font-semibold underline underline-offset-2" style={{ color: "#FFFFFF" }}>Privacy Policy</a>.
              </p>
            </div>
            <Button
              onClick={handleOkay}
              className="allow-white h-8 flex-none rounded-md bg-white/15 hover:bg-white/25 border border-white/40 px-4 text-[11px] font-semibold"
              data-cta="primary"
              data-surface="emerald"
              data-no-contrast-guard
              style={{ color: "#FFFFFF" }}
            >
              <span className="allow-white" style={{ color: "#FFFFFF" }}>Okay</span>
            </Button>
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookiesConsentBanner;
