import { useState, useEffect, useCallback } from 'react';

const COOKIES_CONSENT_KEY = "jj_cookies_consent";

export interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

export interface ConsentData {
  status: 'pending' | 'all' | 'essential' | 'custom';
  preferences: CookiePreferences;
  timestamp: string;
}

export const useMarketingConsent = () => {
  const [consent, setConsent] = useState<ConsentData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIES_CONSENT_KEY);
    if (stored) {
      try {
        setConsent(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse consent data:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  const hasAnalyticsConsent = useCallback(() => {
    return consent?.preferences?.analytics === true;
  }, [consent]);

  const hasMarketingConsent = useCallback(() => {
    return consent?.preferences?.marketing === true;
  }, [consent]);

  const refreshConsent = useCallback(() => {
    const stored = localStorage.getItem(COOKIES_CONSENT_KEY);
    if (stored) {
      try {
        setConsent(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse consent data:', e);
      }
    }
  }, []);

  return {
    consent,
    isLoaded,
    hasAnalyticsConsent,
    hasMarketingConsent,
    refreshConsent,
  };
};
