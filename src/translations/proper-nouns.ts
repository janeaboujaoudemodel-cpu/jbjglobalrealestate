// Curated proper-noun & brand overrides per language.
// These take precedence over AI translation output.
// Brand wordmark "JBJ GLOBAL REAL ESTATE" stays Latin everywhere.

import type { Language } from './index';

type ProperNounMap = Partial<Record<Language, string>>;

interface ProperNounEntry {
  source: string; // English / Latin form
  translations: ProperNounMap;
}

export const PROPER_NOUN_OVERRIDES: ProperNounEntry[] = [
  {
    source: 'Jane Bou Jaoude',
    translations: {
      ar: 'جاين بو جودة',
      fa: 'جاین بو ژودِه',
      he: "ג'יין בו ז'אודה",
      ru: 'Джейн Бу Жауд',
      zh: '簡·博·喬德',
      ja: 'ジェーン・ブー・ジャウデ',
      hi: 'जेन बू जौदे',
    },
  },
  {
    source: 'Founder & CEO',
    translations: {
      ar: 'المؤسِّسة والرئيسة التنفيذية',
      fr: 'Fondatrice et Présidente-Directrice Générale',
      es: 'Fundadora y Directora Ejecutiva',
      de: 'Gründerin & CEO',
      it: 'Fondatrice e Amministratrice Delegata',
      nl: 'Oprichtster & CEO',
      pl: 'Założycielka i Dyrektor Generalny',
      ru: 'Основательница и Генеральный директор',
      tr: 'Kurucu ve CEO',
      fa: 'بنیان‌گذار و مدیرعامل',
      he: 'מייסדת ומנכ״לית',
      zh: '創辦人兼執行長',
      ja: '創業者兼CEO',
      hi: 'संस्थापक और सीईओ',
    },
  },
  {
    source: 'Dubai',
    translations: {
      ar: 'دبي',
      fa: 'دبی',
      he: 'דובאי',
      ru: 'Дубай',
      zh: '迪拜',
      ja: 'ドバイ',
      hi: 'दुबई',
    },
  },
  {
    source: 'Abu Dhabi',
    translations: {
      ar: 'أبوظبي',
      fa: 'ابوظبی',
      he: 'אבו דאבי',
      ru: 'Абу-Даби',
      zh: '阿布扎比',
      ja: 'アブダビ',
      hi: 'अबू धाबी',
    },
  },
  {
    source: 'United Arab Emirates',
    translations: {
      ar: 'الإمارات العربية المتحدة',
      fa: 'امارات متحده عربی',
      he: 'איחוד האמירויות הערביות',
      ru: 'Объединённые Арабские Эмираты',
      zh: '阿拉伯聯合大公國',
      ja: 'アラブ首長国連邦',
      hi: 'संयुक्त अरब अमीरात',
    },
  },
];

// Brand strings that must never be translated.
export const LATIN_LOCKED_STRINGS = new Set<string>([
  'JBJ',
  'JBJ GLOBAL REAL ESTATE',
  'JBJ Global Real Estate',
]);

export function getProperNounOverride(text: string, lang: Language): string | null {
  if (lang === 'en') return null;
  const trimmed = text.trim();
  if (LATIN_LOCKED_STRINGS.has(trimmed)) return trimmed;
  for (const entry of PROPER_NOUN_OVERRIDES) {
    if (entry.source === trimmed) {
      return entry.translations[lang] ?? null;
    }
  }
  return null;
}
