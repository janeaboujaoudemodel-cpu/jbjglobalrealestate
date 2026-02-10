import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
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
import { he } from '@/translations/he';
import { pl } from '@/translations/pl';
import { ja } from '@/translations/ja';

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
  en, ar, es, fr, ru, zh, hi, fa, tr, de, it, nl, he, pl, ja
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

// Pre-build reverse maps for ALL languages: value -> key
// This allows translateText() to find the key for ANY language's text
const allReverseMaps: Record<Language, Map<string, string>> = {} as any;
for (const [langCode, dict] of Object.entries(translations)) {
  const map = new Map<string, string>();
  for (const [key, value] of Object.entries(dict)) {
    if (value && typeof value === 'string') {
      map.set(value.trim(), key);
    }
  }
  allReverseMaps[langCode as Language] = map;
}

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

  // Direct text translation - uses bidirectional reverse maps
  // Searches ALL languages' reverse maps to find the key, then returns current language value
  const translateText = useCallback((text: string): string => {
    if (language === 'en') {
      // Even in English, resolve text from other languages back to English
      const trimmed = text.trim();
      if (!trimmed) return text;
      
      // Check if text is already an English value
      const enKey = allReverseMaps.en.get(trimmed);
      if (enKey) return text; // Already English
      
      // Check ALL other language reverse maps to find the key
      for (const [, reverseMap] of Object.entries(allReverseMaps)) {
        const key = reverseMap.get(trimmed);
        if (key && translations.en[key]) {
          return translations.en[key];
        }
      }
      return text;
    }
    
    const trimmedText = text.trim();
    if (!trimmedText) return text;
    
    // First, check if text is already in the current language
    const currentKey = allReverseMaps[language]?.get(trimmedText);
    if (currentKey) {
      // Text is already in current language, return as-is
      return translations[language][currentKey] || text;
    }
    
    // Search ALL language reverse maps to find the key for this text
    for (const [, reverseMap] of Object.entries(allReverseMaps)) {
      const key = reverseMap.get(trimmedText);
      if (key) {
        // Found the key - return the current language's value
        const translated = translations[language][key];
        if (translated) return translated;
        // Fallback to English if current language doesn't have this key
        const englishVal = translations.en[key];
        if (englishVal) return englishVal;
      }
    }
    
    // No match found, return original text (for numbers, proper nouns, etc.)
    return text;
  }, [language]);

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
