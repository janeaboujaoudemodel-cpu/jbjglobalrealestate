// Centralized, reusable options for lead capture selects.
// Keep lists comprehensive but UI-friendly.

const COMMON_LANGUAGES = [
  "English",
  "Arabic",
  "French",
  "Spanish",
  "Portuguese",
  "Russian",
  "Chinese",
  "Hindi",
  "Urdu",
  "German",
  "Italian",
  "Turkish",
  "Persian",
  "Bengali",
  "Japanese",
  "Korean",
  "Dutch",
  "Polish",
  "Ukrainian",
  "Romanian",
  "Greek",
  "Hebrew",
  "Thai",
  "Vietnamese",
  "Indonesian",
  "Malay",
  "Filipino",
  "Tamil",
  "Telugu",
  "Marathi",
  "Gujarati",
  "Punjabi",
  "Kannada",
  "Malayalam",
  "Sinhala",
  "Nepali",
  "Czech",
  "Hungarian",
  "Danish",
  "Swedish",
  "Norwegian",
  "Finnish",
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
  return [...uniqSorted(COMMON_LANGUAGES), "Other"];
}
