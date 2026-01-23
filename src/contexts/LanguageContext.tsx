import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
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
import { supabase } from '@/integrations/supabase/client';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallbackText?: string) => string;
  isRTL: boolean;
  translateText: (text: string) => string;
  /** Increments whenever async translations resolve; lets DOM translators re-process instantly */
  translationVersion: number;
}

const translations: Record<Language, Record<string, string>> = {
  en, ar, es, fr, ru, zh, hi, fa, tr, de, it, nl
};

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_KEY = 'jj_language';
const LANGUAGE_MANUAL_KEY = 'jj_language_manual';
const LANGUAGE_CHANGE_TIME_KEY = 'jj_language_change_time';
const TRANSLATION_CACHE_KEY = 'jj_auto_translations';

// In-memory cache for auto-translations (persisted to localStorage)
let autoTranslationCache: Record<string, Record<string, string>> = {};

// Load cache from localStorage
const loadTranslationCache = () => {
  try {
    const cached = localStorage.getItem(TRANSLATION_CACHE_KEY);
    if (cached) {
      autoTranslationCache = JSON.parse(cached);
    }
  } catch (e) {
    console.error('Failed to load translation cache:', e);
  }
};

// Save cache to localStorage
const saveTranslationCache = () => {
  try {
    localStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(autoTranslationCache));
  } catch (e) {
    console.error('Failed to save translation cache:', e);
  }
};

// Queue for batching translation requests
let translationQueue: { text: string; lang: Language; resolve: (val: string) => void }[] = [];
let translationTimeout: ReturnType<typeof setTimeout> | null = null;

// Process the translation queue
const processTranslationQueue = async () => {
  if (translationQueue.length === 0) return;

  const batch = [...translationQueue];
  translationQueue = [];

  // Group by language
  const byLang: Record<string, { text: string; resolve: (val: string) => void }[]> = {};
  for (const item of batch) {
    if (!byLang[item.lang]) byLang[item.lang] = [];
    byLang[item.lang].push({ text: item.text, resolve: item.resolve });
  }

  for (const [lang, items] of Object.entries(byLang)) {
    const texts = items.map(i => i.text);
    
    try {
      const response = await supabase.functions.invoke('auto-translate', {
        body: { texts, targetLang: lang }
      });

      if (response.data?.translations) {
        const translated = response.data.translations as string[];
        
        // Update cache and resolve promises
        if (!autoTranslationCache[lang]) autoTranslationCache[lang] = {};
        
        for (let i = 0; i < items.length; i++) {
          const translatedText = translated[i] || items[i].text;
          autoTranslationCache[lang][items[i].text] = translatedText;
          items[i].resolve(translatedText);
        }
        
        saveTranslationCache();
      } else {
        // Fallback: resolve with original text
        for (const item of items) {
          item.resolve(item.text);
        }
      }
    } catch (error) {
      console.error('Auto-translation failed:', error);
      // Fallback: resolve with original text
      for (const item of items) {
        item.resolve(item.text);
      }
    }
  }
};

// Queue a text for translation
const queueTranslation = (text: string, lang: Language): Promise<string> => {
  return new Promise((resolve) => {
    // Check cache first
    if (autoTranslationCache[lang]?.[text]) {
      resolve(autoTranslationCache[lang][text]);
      return;
    }

    // Add to queue
    translationQueue.push({ text, lang, resolve });

    // Debounce: process after 100ms of no new requests
    if (translationTimeout) clearTimeout(translationTimeout);
    translationTimeout = setTimeout(processTranslationQueue, 100);
  });
};

// Track language change in database
const trackLanguageChange = async (fromLang: Language, toLang: Language) => {
  try {
    const sessionId = sessionStorage.getItem('visitor_session_id');
    const previousChangeTime = localStorage.getItem(LANGUAGE_CHANGE_TIME_KEY);
    const now = new Date().toISOString();
    
    let durationOnPreviousLang: number | null = null;
    if (previousChangeTime) {
      const prevTime = new Date(previousChangeTime);
      durationOnPreviousLang = Math.floor((Date.now() - prevTime.getTime()) / 1000);
    }
    
    localStorage.setItem(LANGUAGE_CHANGE_TIME_KEY, now);

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
    localStorage.setItem(LANGUAGE_CHANGE_TIME_KEY, new Date().toISOString());
    return detected;
  });

  // State to trigger re-renders when translations complete
  const [translationVersion, setTranslationVersion] = useState(0);
  const pendingTranslations = useRef<Set<string>>(new Set());

  // Load translation cache on mount
  useEffect(() => {
    loadTranslationCache();
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    const previousLang = language;
    
    if (previousLang !== lang) {
      trackLanguageChange(previousLang, lang);
    }
    
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_KEY, lang);
    localStorage.setItem(LANGUAGE_MANUAL_KEY, 'true');
    document.documentElement.lang = lang;
    document.documentElement.dir = isRTLLanguage(lang) ? 'rtl' : 'ltr';
  }, [language]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isRTLLanguage(language) ? 'rtl' : 'ltr';
  }, [language]);

  // Main translation function
  const t = useCallback((key: string, fallbackText?: string): string => {
    // 1. Check if key exists in current language dictionary
    const currentDict = translations[language];
    if (currentDict?.[key]) {
      return currentDict[key];
    }

    // 2. Check English fallback
    const englishValue = translations.en[key];
    
    // If we're in English or the key maps to English, return it
    if (language === 'en') {
      return englishValue || fallbackText || key;
    }

    // 3. For non-English: check if we have a cached auto-translation
    const textToTranslate = englishValue || fallbackText || key;
    
    // Check local cache first
    if (autoTranslationCache[language]?.[textToTranslate]) {
      return autoTranslationCache[language][textToTranslate];
    }

    // 4. Queue for auto-translation (async, will update on next render)
    if (!pendingTranslations.current.has(`${language}:${textToTranslate}`)) {
      pendingTranslations.current.add(`${language}:${textToTranslate}`);
      
      queueTranslation(textToTranslate, language).then(() => {
        pendingTranslations.current.delete(`${language}:${textToTranslate}`);
        setTranslationVersion(v => v + 1);
      });
    }

    // Return English/fallback while waiting for translation
    return textToTranslate;
  }, [language]);

  // Direct text translation (for dynamic content not using keys)
  const translateText = useCallback((text: string): string => {
    if (!text || language === 'en') return text;
    
    // Check cache
    if (autoTranslationCache[language]?.[text]) {
      return autoTranslationCache[language][text];
    }

    // Queue for translation
    if (!pendingTranslations.current.has(`${language}:${text}`)) {
      pendingTranslations.current.add(`${language}:${text}`);
      
      queueTranslation(text, language).then(() => {
        pendingTranslations.current.delete(`${language}:${text}`);
        setTranslationVersion(v => v + 1);
      });
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
