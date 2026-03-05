import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { Language, SUPPORTED_LANGUAGES, isRTLLanguage, getLanguageInfo } from '@/translations';
import { en } from '@/translations/en';

// Only English is loaded eagerly — all other languages are lazy-loaded on demand
const translationLoaders: Record<Language, () => Promise<Record<string, string>>> = {
  en: () => Promise.resolve(en),
  ar: () => import('@/translations/ar').then(m => m.ar),
  es: () => import('@/translations/es').then(m => m.es),
  fr: () => import('@/translations/fr').then(m => m.fr),
  ru: () => import('@/translations/ru').then(m => m.ru),
  zh: () => import('@/translations/zh').then(m => m.zh),
  hi: () => import('@/translations/hi').then(m => m.hi),
  fa: () => import('@/translations/fa').then(m => m.fa),
  tr: () => import('@/translations/tr').then(m => m.tr),
  de: () => import('@/translations/de').then(m => m.de),
  it: () => import('@/translations/it').then(m => m.it),
  nl: () => import('@/translations/nl').then(m => m.nl),
  he: () => import('@/translations/he').then(m => m.he),
  pl: () => import('@/translations/pl').then(m => m.pl),
  ja: () => import('@/translations/ja').then(m => m.ja),
};

// Cache for loaded translations
const loadedTranslations: Partial<Record<Language, Record<string, string>>> = { en };

// Cache for reverse maps (built on demand)
const reverseMapsCache: Partial<Record<Language, Map<string, string>>> = {};

function getOrBuildReverseMap(lang: Language): Map<string, string> | undefined {
  if (reverseMapsCache[lang]) return reverseMapsCache[lang];
  const dict = loadedTranslations[lang];
  if (!dict) return undefined;
  const map = new Map<string, string>();
  for (const [key, value] of Object.entries(dict)) {
    if (value && typeof value === 'string') {
      map.set(value.trim(), key);
    }
  }
  reverseMapsCache[lang] = map;
  return map;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallbackText?: string) => string;
  isRTL: boolean;
  translateText: (text: string) => string;
  translationVersion: number;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_KEY = 'jj_language';
const LANGUAGE_MANUAL_KEY = 'jj_language_manual';

const detectDeviceLanguage = (): Language => {
  try {
    const browserLang = navigator.language || (navigator as any).userLanguage || 'en';
    const langCode = browserLang.split('-')[0].toLowerCase();
    const supported = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
    if (supported) return supported.code;
    return 'en';
  } catch {
    return 'en';
  }
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem(LANGUAGE_KEY) as Language | null;
    const isManual = localStorage.getItem(LANGUAGE_MANUAL_KEY) === 'true';
    if (isManual && stored && SUPPORTED_LANGUAGES.some(l => l.code === stored)) {
      return stored;
    }
    const detected = detectDeviceLanguage();
    localStorage.setItem(LANGUAGE_KEY, detected);
    localStorage.removeItem(LANGUAGE_MANUAL_KEY);
    return detected;
  });

  // Force re-render when async translation loads
  const [, setLoadTick] = useState(0);
  const loadingRef = useRef<Set<Language>>(new Set());

  // Lazy-load translation for current language
  useEffect(() => {
    if (loadedTranslations[language] || loadingRef.current.has(language)) return;
    loadingRef.current.add(language);

    translationLoaders[language]().then(dict => {
      loadedTranslations[language] = dict;
      delete reverseMapsCache[language]; // invalidate cache
      setLoadTick(n => n + 1);
    });
  }, [language]);

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

  const t = useCallback((key: string, fallbackText?: string): string => {
    const currentDict = loadedTranslations[language];
    if (currentDict?.[key]) return currentDict[key];
    const englishValue = en[key];
    if (englishValue) return englishValue;
    return fallbackText || key;
  }, [language]);

  const translateText = useCallback((text: string): string => {
    const trimmed = text.trim();
    if (!trimmed) return text;

    if (language === 'en') {
      const enMap = getOrBuildReverseMap('en');
      if (enMap?.has(trimmed)) return text;
      // Check loaded languages only
      for (const [langCode, dict] of Object.entries(loadedTranslations)) {
        if (langCode === 'en' || !dict) continue;
        const rmap = getOrBuildReverseMap(langCode as Language);
        const key = rmap?.get(trimmed);
        if (key && en[key]) return en[key];
      }
      return text;
    }

    const currentMap = getOrBuildReverseMap(language);
    if (currentMap?.has(trimmed)) {
      const key = currentMap.get(trimmed)!;
      return loadedTranslations[language]?.[key] || text;
    }

    // Search loaded languages
    for (const [, dict] of Object.entries(loadedTranslations)) {
      if (!dict) continue;
    }
    for (const [langCode] of Object.entries(loadedTranslations)) {
      const rmap = getOrBuildReverseMap(langCode as Language);
      const key = rmap?.get(trimmed);
      if (key) {
        const translated = loadedTranslations[language]?.[key];
        if (translated) return translated;
        const englishVal = en[key];
        if (englishVal) return englishVal;
      }
    }

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
