// Centralized, reusable options for lead capture selects.
// Keep lists comprehensive but UI-friendly.

// Comprehensive global language list - all major world languages
const ALL_LANGUAGES = [
  "Afrikaans",
  "Albanian",
  "Amharic",
  "Arabic",
  "Armenian",
  "Assamese",
  "Azerbaijani",
  "Basque",
  "Belarusian",
  "Bengali",
  "Bosnian",
  "Bulgarian",
  "Burmese",
  "Catalan",
  "Cebuano",
  "Chinese (Cantonese)",
  "Chinese (Mandarin)",
  "Chinese (Simplified)",
  "Chinese (Traditional)",
  "Croatian",
  "Czech",
  "Danish",
  "Dari",
  "Dutch",
  "English",
  "Estonian",
  "Filipino",
  "Finnish",
  "French",
  "Galician",
  "Georgian",
  "German",
  "Greek",
  "Gujarati",
  "Haitian Creole",
  "Hausa",
  "Hebrew",
  "Hindi",
  "Hungarian",
  "Icelandic",
  "Igbo",
  "Indonesian",
  "Irish",
  "Italian",
  "Japanese",
  "Javanese",
  "Kannada",
  "Kazakh",
  "Khmer",
  "Kinyarwanda",
  "Korean",
  "Kurdish",
  "Kyrgyz",
  "Lao",
  "Latvian",
  "Lithuanian",
  "Luxembourgish",
  "Macedonian",
  "Malagasy",
  "Malay",
  "Malayalam",
  "Maltese",
  "Maori",
  "Marathi",
  "Mongolian",
  "Nepali",
  "Norwegian",
  "Odia",
  "Pashto",
  "Persian",
  "Polish",
  "Portuguese",
  "Punjabi",
  "Romanian",
  "Russian",
  "Samoan",
  "Serbian",
  "Sesotho",
  "Shona",
  "Sindhi",
  "Sinhala",
  "Slovak",
  "Slovenian",
  "Somali",
  "Spanish",
  "Sundanese",
  "Swahili",
  "Swedish",
  "Tagalog",
  "Tajik",
  "Tamil",
  "Tatar",
  "Telugu",
  "Thai",
  "Tibetan",
  "Tigrinya",
  "Turkish",
  "Turkmen",
  "Ukrainian",
  "Urdu",
  "Uyghur",
  "Uzbek",
  "Vietnamese",
  "Welsh",
  "Xhosa",
  "Yiddish",
  "Yoruba",
  "Zulu",
];

const FALLBACK_COUNTRIES = [
  "United Arab Emirates",
  "Saudi Arabia",
  "Qatar",
  "Kuwait",
  "Bahrain",
  "Oman",
  "Lebanon",
  "Jordan",
  "Egypt",
  "Morocco",
  "Algeria",
  "Tunisia",
  "United Kingdom",
  "United States",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Italy",
  "Spain",
  "Switzerland",
  "Russia",
  "Ukraine",
  "China",
  "Hong Kong",
  "India",
  "Pakistan",
  "Bangladesh",
  "Sri Lanka",
  "Philippines",
  "Singapore",
  "Malaysia",
  "Indonesia",
  "Japan",
  "South Korea",
  "South Africa",
  "Nigeria",
  "Kenya",
  "Brazil",
  "Mexico",
];

function uniqSorted(list: string[]) {
  return Array.from(new Set(list.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

export function getCountryList(locale: string = "en"): string[] {
  try {
    const supportedValuesOf = (Intl as any).supportedValuesOf as undefined | ((key: string) => string[]);
    const regionCodes = supportedValuesOf?.("region");
    if (!Array.isArray(regionCodes) || regionCodes.length === 0) {
      return [...uniqSorted(FALLBACK_COUNTRIES), "Other"];
    }

    const dn = new Intl.DisplayNames([locale], { type: "region" });
    const names = regionCodes
      .map((code) => dn.of(code))
      .filter((v): v is string => typeof v === "string" && v.trim().length > 0);

    return [...uniqSorted(names), "Other"];
  } catch {
    return [...uniqSorted(FALLBACK_COUNTRIES), "Other"];
  }
}

export function getLanguageList(): string[] {
  return [...uniqSorted(ALL_LANGUAGES), "Other"];
}
