// Centralized, reusable options for lead capture selects.
// Keep lists comprehensive but UI-friendly.

// Priority countries to show at top of country/nationality dropdowns
export const PRIORITY_COUNTRIES = [
  "United Arab Emirates",
  "Cyprus",
  "Indonesia",
  "Oman",
  "Thailand",
];

// Language flags mapping
export const LANGUAGE_FLAGS: Record<string, string> = {
  "Afrikaans": "🇿🇦",
  "Albanian": "🇦🇱",
  "Amharic": "🇪🇹",
  "Arabic": "🇦🇪",
  "Armenian": "🇦🇲",
  "Azerbaijani": "🇦🇿",
  "Bengali": "🇧🇩",
  "Bosnian": "🇧🇦",
  "Bulgarian": "🇧🇬",
  "Burmese": "🇲🇲",
  "Chinese (Cantonese)": "🇭🇰",
  "Chinese (Mandarin)": "🇨🇳",
  "Chinese (Simplified)": "🇨🇳",
  "Chinese (Traditional)": "🇹🇼",
  "Croatian": "🇭🇷",
  "Czech": "🇨🇿",
  "Danish": "🇩🇰",
  "Dutch": "🇳🇱",
  "English": "🇬🇧",
  "Estonian": "🇪🇪",
  "Filipino": "🇵🇭",
  "Finnish": "🇫🇮",
  "French": "🇫🇷",
  "Georgian": "🇬🇪",
  "German": "🇩🇪",
  "Greek": "🇬🇷",
  "Gujarati": "🇮🇳",
  "Hebrew": "🇮🇱",
  "Hindi": "🇮🇳",
  "Hungarian": "🇭🇺",
  "Icelandic": "🇮🇸",
  "Indonesian": "🇮🇩",
  "Irish": "🇮🇪",
  "Italian": "🇮🇹",
  "Japanese": "🇯🇵",
  "Kannada": "🇮🇳",
  "Kazakh": "🇰🇿",
  "Khmer": "🇰🇭",
  "Korean": "🇰🇷",
  "Kurdish": "🇮🇶",
  "Kyrgyz": "🇰🇬",
  "Lao": "🇱🇦",
  "Latvian": "🇱🇻",
  "Lithuanian": "🇱🇹",
  "Macedonian": "🇲🇰",
  "Malay": "🇲🇾",
  "Malayalam": "🇮🇳",
  "Maltese": "🇲🇹",
  "Marathi": "🇮🇳",
  "Mongolian": "🇲🇳",
  "Nepali": "🇳🇵",
  "Norwegian": "🇳🇴",
  "Pashto": "🇦🇫",
  "Persian": "🇮🇷",
  "Polish": "🇵🇱",
  "Portuguese": "🇵🇹",
  "Punjabi": "🇮🇳",
  "Romanian": "🇷🇴",
  "Russian": "🇷🇺",
  "Serbian": "🇷🇸",
  "Sinhala": "🇱🇰",
  "Slovak": "🇸🇰",
  "Slovenian": "🇸🇮",
  "Somali": "🇸🇴",
  "Spanish": "🇪🇸",
  "Swahili": "🇹🇿",
  "Swedish": "🇸🇪",
  "Tagalog": "🇵🇭",
  "Tamil": "🇮🇳",
  "Telugu": "🇮🇳",
  "Thai": "🇹🇭",
  "Turkish": "🇹🇷",
  "Ukrainian": "🇺🇦",
  "Urdu": "🇵🇰",
  "Uzbek": "🇺🇿",
  "Vietnamese": "🇻🇳",
  "Welsh": "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
  "Yoruba": "🇳🇬",
  "Zulu": "🇿🇦",
};

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
  "Syria",
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

const COUNTRY_NAME_ALIASES: Record<string, string> = {
  "Syrian Arab Republic": "Syria",
  "Russian Federation": "Russia",
  "Iran, Islamic Republic of": "Iran",
  "Korea, Republic of": "South Korea",
  "Korea, Democratic People's Republic of": "North Korea",
  "Viet Nam": "Vietnam",
  "Lao People's Democratic Republic": "Laos",
};

function normalizeCountryName(name: string) {
  return COUNTRY_NAME_ALIASES[name] ?? name;
}

export function getCountryList(locale: string = "en"): string[] {
  try {
    const supportedValuesOf = (Intl as any).supportedValuesOf as undefined | ((key: string) => string[]);
    const regionCodes = supportedValuesOf?.("region");
    if (!Array.isArray(regionCodes) || regionCodes.length === 0) {
      // Return priority countries first, then alphabetical rest
      const sorted = uniqSorted(FALLBACK_COUNTRIES.filter(c => !PRIORITY_COUNTRIES.includes(c)));
      return [...PRIORITY_COUNTRIES, ...sorted];
    }

    const dn = new Intl.DisplayNames([locale], { type: "region" });
    const names = regionCodes
      .map((code) => dn.of(code))
      .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
      .map((name) => normalizeCountryName(name));

    // Remove priority countries from sorted list, add them first
    const sorted = uniqSorted(names.filter(n => !PRIORITY_COUNTRIES.includes(n)));
    return [...PRIORITY_COUNTRIES, ...sorted];
  } catch {
    const sorted = uniqSorted(FALLBACK_COUNTRIES.filter(c => !PRIORITY_COUNTRIES.includes(c)));
    return [...PRIORITY_COUNTRIES, ...sorted];
  }
}

export function getLanguageList(): string[] {
  // English first, then alphabetical, no "Other" option
  const sorted = uniqSorted(ALL_LANGUAGES.filter(l => l !== "English"));
  return ["English", ...sorted];
}

/**
 * Get language with flag for display
 */
export function getLanguageWithFlag(language: string): string {
  const flag = LANGUAGE_FLAGS[language] || "";
  return flag ? `${flag} ${language}` : language;
}

/**
 * Get languages with flags as objects for select options
 */
export function getLanguageOptionsWithFlags(): { value: string; label: string; flag: string }[] {
  const languages = getLanguageList();
  return languages.map(lang => ({
    value: lang,
    label: lang,
    flag: LANGUAGE_FLAGS[lang] || "",
  }));
}
