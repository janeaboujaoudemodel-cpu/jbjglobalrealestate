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
    source: 'Executive Assistant',
    translations: {
      ar: 'المساعدة التنفيذية',
      fr: 'Assistante de Direction',
      es: 'Asistente Ejecutiva',
      de: 'Geschäftsführungsassistentin',
      it: 'Assistente Esecutiva',
      nl: 'Directieassistente',
      pl: 'Asystentka Wykonawcza',
      ru: 'Исполнительный ассистент',
      tr: 'Yönetici Asistanı',
      fa: 'دستیار اجرایی',
      he: 'עוזרת בכירה',
      zh: '執行助理',
      ja: 'エグゼクティブ・アシスタント',
      hi: 'कार्यकारी सहायक',
    },
  },
  {
    source: 'Real Estate Brokerage',
    translations: {
      ar: 'وساطة عقارية',
      fr: 'Maison de Courtage Immobilier',
      es: 'Correduría Inmobiliaria',
      de: 'Immobilienmaklerhaus',
      it: 'Mediazione Immobiliare',
      nl: 'Vastgoedmakelaardij',
      pl: 'Pośrednictwo Nieruchomości',
      ru: 'Брокерское агентство недвижимости',
      tr: 'Gayrimenkul Komisyonculuğu',
      fa: 'کارگزاری املاک',
      he: 'תיווך נדל״ן',
      zh: '房地產經紀',
      ja: '不動産仲介',
      hi: 'रियल एस्टेट ब्रोकरेज',
    },
  },
  {
    source: 'Property Consultant',
    translations: {
      ar: 'مستشار عقاري',
      fr: 'Conseiller Immobilier',
      es: 'Consultor Inmobiliario',
      de: 'Immobilienberater',
      it: 'Consulente Immobiliare',
      nl: 'Vastgoedadviseur',
      pl: 'Doradca ds. Nieruchomości',
      ru: 'Консультант по недвижимости',
      tr: 'Gayrimenkul Danışmanı',
      fa: 'مشاور املاک',
      he: 'יועץ נדל״ן',
      zh: '房地產顧問',
      ja: '不動産コンサルタント',
      hi: 'संपत्ति सलाहकार',
    },
  },
  {
    source: 'Dubai',
    translations: { ar: 'دبي', fa: 'دبی', he: 'דובאי', ru: 'Дубай', zh: '迪拜', ja: 'ドバイ', hi: 'दुबई' },
  },
  {
    source: 'Abu Dhabi',
    translations: { ar: 'أبوظبي', fa: 'ابوظبی', he: 'אבו דאבי', ru: 'Абу-Даби', zh: '阿布扎比', ja: 'アブダビ', hi: 'अबू धाबी' },
  },
  {
    source: 'Sharjah',
    translations: { ar: 'الشارقة', fa: 'شارجه', he: 'שארג׳ה', ru: 'Шарджа', zh: '沙迦', ja: 'シャルジャ', hi: 'शारजाह' },
  },
  {
    source: 'Ras Al Khaimah',
    translations: { ar: 'رأس الخيمة', fa: 'راس الخیمه', he: 'ראס אל-ח׳יימה', ru: 'Рас-эль-Хайма', zh: '哈伊馬角', ja: 'ラアス・アル＝ハイマ', hi: 'रास अल खैमा' },
  },
  {
    source: 'Palm Jumeirah',
    translations: { ar: 'نخلة جميرا', fa: 'نخل جمیرا', he: 'פאלם ג׳ומיירה', ru: 'Палм-Джумейра', zh: '朱美拉棕櫚島', ja: 'パーム・ジュメイラ', hi: 'पाम जुमेरा' },
  },
  {
    source: 'Downtown Dubai',
    translations: { ar: 'وسط مدينة دبي', fa: 'مرکز شهر دبی', he: 'מרכז דובאי', ru: 'Даунтаун Дубай', zh: '迪拜市中心', ja: 'ダウンタウン・ドバイ', hi: 'डाउनटाउन दुबई' },
  },
  {
    source: 'Dubai Marina',
    translations: { ar: 'دبي مارينا', fa: 'دبی مارینا', he: 'דובאי מרינה', ru: 'Дубай-Марина', zh: '迪拜碼頭', ja: 'ドバイ・マリーナ', hi: 'दुबई मरीना' },
  },
  {
    source: 'Business Bay',
    translations: { ar: 'الخليج التجاري', fa: 'بیزینس بی', he: 'ביזנס ביי', ru: 'Бизнес-Бэй', zh: '商業灣', ja: 'ビジネス・ベイ', hi: 'बिज़नेस बे' },
  },
  {
    source: 'Jumeirah',
    translations: { ar: 'جميرا', fa: 'جمیرا', he: 'ג׳ומיירה', ru: 'Джумейра', zh: '朱美拉', ja: 'ジュメイラ', hi: 'जुमेरा' },
  },
  {
    source: 'Jumeirah Beach Residence',
    translations: { ar: 'مساكن شاطئ جميرا', fa: 'مساکن ساحلی جمیرا', he: 'ג׳ומיירה ביץ׳ רזידנס', ru: 'Джумейра-Бич-Резиденс', zh: '朱美拉海灘住宅', ja: 'ジュメイラ・ビーチ・レジデンス', hi: 'जुमेरा बीच रेजिडेंस' },
  },
  {
    source: 'United Arab Emirates',
    translations: { ar: 'الإمارات العربية المتحدة', fa: 'امارات متحده عربی', he: 'איחוד האמירויות הערביות', ru: 'Объединённые Арабские Эмираты', zh: '阿拉伯聯合大公國', ja: 'アラブ首長国連邦', hi: 'संयुक्त अरब अमीरात' },
  },
];

// Brand strings + acronyms that must never be translated (kept Latin everywhere).
// These cover global brand wordmarks, regulatory bodies, currency codes, and
// developer names that are recognised internationally in Latin script.
export const LATIN_LOCKED_STRINGS = new Set<string>([
  // Brand
  'JBJ',
  'JBJ GLOBAL REAL ESTATE',
  'JBJ Global Real Estate',
  // Currency codes (ISO 4217)
  'AED', 'USD', 'EUR', 'GBP', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR',
  // Regulatory / compliance acronyms
  'RERA', 'DLD', 'ESCROW', 'DIFC', 'JBR', 'KYC', 'AML',
  // Top developers — global brand wordmarks
  'Emaar', 'EMAAR', 'DAMAC', 'Damac', 'Sobha', 'SOBHA', 'Nakheel', 'NAKHEEL',
  'Aldar', 'ALDAR', 'Meraas', 'MERAAS', 'Dubai Properties', 'Omniyat',
  'Select Group', 'Ellington', 'Azizi', 'Binghatti', 'Danube',
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
