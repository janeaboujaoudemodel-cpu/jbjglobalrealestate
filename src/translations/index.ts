// Translation system with 15 core languages
// English, Arabic, Spanish, French, Russian, Chinese (Simplified), Hindi, Persian, Turkish, German, Italian, Dutch, Hebrew, Polish, Japanese

export type Language = 
  | 'en' | 'ar' | 'es' | 'fr' | 'ru' 
  | 'zh' | 'hi' | 'fa' | 'tr' | 'de' | 'it' | 'nl'
  | 'he' | 'pl' | 'ja';

export interface LanguageInfo {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
  rtl: boolean;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', rtl: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇦🇪', rtl: true },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', rtl: false },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', rtl: false },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', rtl: false },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', rtl: false },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', rtl: false },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', flag: '🇮🇷', rtl: true },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', rtl: false },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', rtl: false },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', rtl: false },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', rtl: false },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', rtl: true },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱', rtl: false },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', rtl: false },
];

export const RTL_LANGUAGES: Language[] = ['ar', 'fa', 'he'];

export const isRTLLanguage = (lang: Language): boolean => RTL_LANGUAGES.includes(lang);

// Detect browser language and map to supported language
export const detectBrowserLanguage = (): Language => {
  const browserLang = navigator.language || (navigator as any).userLanguage || 'en';
  const langCode = browserLang.split('-')[0].toLowerCase();
  
  const supported = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
  return supported ? supported.code : 'en';
};

// Get language info by code
export const getLanguageInfo = (code: Language): LanguageInfo => {
  return SUPPORTED_LANGUAGES.find(l => l.code === code) || SUPPORTED_LANGUAGES[0];
};
