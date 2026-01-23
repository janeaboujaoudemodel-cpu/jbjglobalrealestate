import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Language, SUPPORTED_LANGUAGES, isRTLLanguage, getLanguageInfo } from '@/translations';
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
import { nl } from '@/translations/nl';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallbackText?: string) => string;
  isRTL: boolean;
  translateText: (text: string) => string;
  /** Legacy: kept for compatibility, no longer used */
  translationVersion: number;
}

const translations: Record<Language, Record<string, string>> = {
  en, ar, es, fr, ru, zh, hi, fa, tr, de, it, nl
};

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_KEY = 'jj_language';
const LANGUAGE_MANUAL_KEY = 'jj_language_manual';

// Detect device/browser language
const detectDeviceLanguage = (): Language => {
  try {
    const browserLang = navigator.language || (navigator as any).userLanguage || 'en';
    const langCode = browserLang.split('-')[0].toLowerCase();
    
    // Check if browser language is supported
    const supported = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
    if (supported) {
      return supported.code;
    }
    
    // Default to English
    return 'en';
  } catch {
    return 'en';
  }
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem(LANGUAGE_KEY) as Language | null;
    const isManual = localStorage.getItem(LANGUAGE_MANUAL_KEY) === 'true';

    // Use stored language ONLY if the user explicitly selected it.
    if (isManual && stored && SUPPORTED_LANGUAGES.some(l => l.code === stored)) {
      return stored;
    }

    // Otherwise, always follow the device/browser language.
    const detected = detectDeviceLanguage();
    localStorage.setItem(LANGUAGE_KEY, detected);
    localStorage.removeItem(LANGUAGE_MANUAL_KEY);
    return detected;
  });

  // Legacy: kept for compatibility, no longer triggers re-renders
  const translationVersion = 0;

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_KEY, lang);
    localStorage.setItem(LANGUAGE_MANUAL_KEY, 'true');
    document.documentElement.lang = lang;
    document.documentElement.dir = isRTLLanguage(lang) ? 'rtl' : 'ltr';
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isRTLLanguage(language) ? 'rtl' : 'ltr';
  }, [language]);

  // INSTANT translation function - NO async calls
  const t = useCallback((key: string, fallbackText?: string): string => {
    // 1. Check if key exists in current language dictionary
    const currentDict = translations[language];
    if (currentDict?.[key]) {
      return currentDict[key];
    }

    // 2. Fallback to English value
    const englishValue = translations.en[key];
    if (englishValue) {
      return englishValue;
    }

    // 3. Return fallback text or key
    return fallbackText || key;
  }, [language]);

  // Direct text translation - returns text as-is (no async)
  const translateText = useCallback((text: string): string => {
    // For dynamic content, just return the text
    // The dictionaries handle keyed translations
    return text;
  }, []);

  const isRTL = isRTLLanguage(language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL, translateText, translationVersion }}>
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
