import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Language, SUPPORTED_LANGUAGES, isRTLLanguage, detectBrowserLanguage, getLanguageInfo } from '@/translations';
import { en } from '@/translations/en';
import { ar } from '@/translations/ar';
import { es } from '@/translations/es';
import { fr } from '@/translations/fr';
import { ru } from '@/translations/ru';
import { zh } from '@/translations/zh';
import { hi } from '@/translations/hi';
import { fa } from '@/translations/fa';
import { tr } from '@/translations/tr';
import { de } from '@/translations/de';
import { it } from '@/translations/it';
import { supabase } from '@/integrations/supabase/client';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  en, ar, es, fr, ru, zh, hi, fa, tr, de, it
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_KEY = 'jj_language';
const AUTO_DETECT_KEY = 'jj_language_auto_detected';
const LANGUAGE_CHANGE_TIME_KEY = 'jj_language_change_time';

// Track language change in database
const trackLanguageChange = async (fromLang: Language, toLang: Language) => {
  try {
    const sessionId = sessionStorage.getItem('visitor_session_id');
    const previousChangeTime = localStorage.getItem(LANGUAGE_CHANGE_TIME_KEY);
    const now = new Date().toISOString();
    
    // Calculate duration on previous language
    let durationOnPreviousLang: number | null = null;
    if (previousChangeTime) {
      const prevTime = new Date(previousChangeTime);
      durationOnPreviousLang = Math.floor((Date.now() - prevTime.getTime()) / 1000);
    }
    
    // Save current change time
    localStorage.setItem(LANGUAGE_CHANGE_TIME_KEY, now);

    // Log to visitor_events table
    await supabase.from('visitor_events').insert({
      session_id: sessionId,
      event_type: 'language_change',
      event_name: `Language changed from ${fromLang} to ${toLang}`,
      event_data: {
        from_language: fromLang,
        to_language: toLang,
        duration_on_previous_seconds: durationOnPreviousLang,
        changed_at: now,
      },
      page_url: window.location.href,
      page_title: document.title,
    });
    
    console.log(`Language tracked: ${fromLang} → ${toLang} (spent ${durationOnPreviousLang}s on ${fromLang})`);
  } catch (error) {
    console.error('Failed to track language change:', error);
  }
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem(LANGUAGE_KEY) as Language;
    if (stored && SUPPORTED_LANGUAGES.some(l => l.code === stored)) {
      return stored;
    }
    // Auto-detect on first visit
    const autoDetected = localStorage.getItem(AUTO_DETECT_KEY);
    if (!autoDetected) {
      const detected = detectBrowserLanguage();
      localStorage.setItem(AUTO_DETECT_KEY, 'true');
      localStorage.setItem(LANGUAGE_KEY, detected);
      localStorage.setItem(LANGUAGE_CHANGE_TIME_KEY, new Date().toISOString());
      return detected;
    }
    return 'en';
  });

  const setLanguage = useCallback((lang: Language) => {
    const previousLang = language;
    
    // Track the language change
    if (previousLang !== lang) {
      trackLanguageChange(previousLang, lang);
    }
    
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_KEY, lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = isRTLLanguage(lang) ? 'rtl' : 'ltr';
  }, [language]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isRTLLanguage(language) ? 'rtl' : 'ltr';
  }, [language]);

  const t = (key: string): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  const isRTL = isRTLLanguage(language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export { SUPPORTED_LANGUAGES, getLanguageInfo };
export type { Language };
