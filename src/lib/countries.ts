// Canonical country list with ISO-2 codes for flag emojis and dial codes.
// Use across all phone/nationality dropdowns site-wide.

export interface Country {
  name: string;
  iso: string; // ISO 3166-1 alpha-2
  code: string; // dial code, e.g. "+971"
}

export const COUNTRIES: Country[] = [
  { name: "United Arab Emirates", iso: "AE", code: "+971" },
  { name: "Saudi Arabia", iso: "SA", code: "+966" },
  { name: "Qatar", iso: "QA", code: "+974" },
  { name: "Kuwait", iso: "KW", code: "+965" },
  { name: "Oman", iso: "OM", code: "+968" },
  { name: "Bahrain", iso: "BH", code: "+973" },
  { name: "United Kingdom", iso: "GB", code: "+44" },
  { name: "United States", iso: "US", code: "+1" },
  { name: "Canada", iso: "CA", code: "+1" },
  { name: "India", iso: "IN", code: "+91" },
  { name: "Pakistan", iso: "PK", code: "+92" },
  { name: "Egypt", iso: "EG", code: "+20" },
  { name: "Jordan", iso: "JO", code: "+962" },
  { name: "Lebanon", iso: "LB", code: "+961" },
  { name: "Türkiye", iso: "TR", code: "+90" },
  { name: "France", iso: "FR", code: "+33" },
  { name: "Germany", iso: "DE", code: "+49" },
  { name: "Italy", iso: "IT", code: "+39" },
  { name: "Spain", iso: "ES", code: "+34" },
  { name: "Portugal", iso: "PT", code: "+351" },
  { name: "Netherlands", iso: "NL", code: "+31" },
  { name: "Switzerland", iso: "CH", code: "+41" },
  { name: "Russia", iso: "RU", code: "+7" },
  { name: "China", iso: "CN", code: "+86" },
  { name: "Japan", iso: "JP", code: "+81" },
  { name: "South Korea", iso: "KR", code: "+82" },
  { name: "Singapore", iso: "SG", code: "+65" },
  { name: "Hong Kong", iso: "HK", code: "+852" },
  { name: "Australia", iso: "AU", code: "+61" },
  { name: "South Africa", iso: "ZA", code: "+27" },
  { name: "Nigeria", iso: "NG", code: "+234" },
  { name: "Brazil", iso: "BR", code: "+55" },
  { name: "Mexico", iso: "MX", code: "+52" },
];

// Convert ISO-2 country code (e.g. "AE") to the corresponding regional-indicator flag emoji.
export function flagEmoji(iso: string): string {
  if (!iso || iso.length !== 2) return "";
  const base = 0x1f1e6;
  const A = "A".charCodeAt(0);
  const up = iso.toUpperCase();
  return String.fromCodePoint(base + (up.charCodeAt(0) - A)) +
    String.fromCodePoint(base + (up.charCodeAt(1) - A));
}
