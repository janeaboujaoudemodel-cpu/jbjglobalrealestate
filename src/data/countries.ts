// ISO countries with nationality (demonym), dial code, and emoji flag.
// Used by NationalityPicker and PhoneInputWithCountry.

export interface CountryEntry {
  code: string;       // ISO-3166 alpha-2
  name: string;       // Country name
  nationality: string;// Demonym (e.g., "Emirati")
  dial: string;       // e.g., "+971"
  flag: string;       // emoji flag
}

export const COUNTRIES: CountryEntry[] = [
  { code: "AE", name: "United Arab Emirates", nationality: "Emirati", dial: "+971", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia", nationality: "Saudi", dial: "+966", flag: "🇸🇦" },
  { code: "QA", name: "Qatar", nationality: "Qatari", dial: "+974", flag: "🇶🇦" },
  { code: "KW", name: "Kuwait", nationality: "Kuwaiti", dial: "+965", flag: "🇰🇼" },
  { code: "BH", name: "Bahrain", nationality: "Bahraini", dial: "+973", flag: "🇧🇭" },
  { code: "OM", name: "Oman", nationality: "Omani", dial: "+968", flag: "🇴🇲" },
  { code: "JO", name: "Jordan", nationality: "Jordanian", dial: "+962", flag: "🇯🇴" },
  { code: "LB", name: "Lebanon", nationality: "Lebanese", dial: "+961", flag: "🇱🇧" },
  { code: "SY", name: "Syria", nationality: "Syrian", dial: "+963", flag: "🇸🇾" },
  { code: "IQ", name: "Iraq", nationality: "Iraqi", dial: "+964", flag: "🇮🇶" },
  { code: "YE", name: "Yemen", nationality: "Yemeni", dial: "+967", flag: "🇾🇪" },
  { code: "PS", name: "Palestine", nationality: "Palestinian", dial: "+970", flag: "🇵🇸" },
  { code: "IL", name: "Israel", nationality: "Israeli", dial: "+972", flag: "🇮🇱" },
  { code: "EG", name: "Egypt", nationality: "Egyptian", dial: "+20", flag: "🇪🇬" },
  { code: "MA", name: "Morocco", nationality: "Moroccan", dial: "+212", flag: "🇲🇦" },
  { code: "DZ", name: "Algeria", nationality: "Algerian", dial: "+213", flag: "🇩🇿" },
  { code: "TN", name: "Tunisia", nationality: "Tunisian", dial: "+216", flag: "🇹🇳" },
  { code: "LY", name: "Libya", nationality: "Libyan", dial: "+218", flag: "🇱🇾" },
  { code: "SD", name: "Sudan", nationality: "Sudanese", dial: "+249", flag: "🇸🇩" },
  { code: "TR", name: "Turkey", nationality: "Turkish", dial: "+90", flag: "🇹🇷" },
  { code: "IR", name: "Iran", nationality: "Iranian", dial: "+98", flag: "🇮🇷" },
  { code: "PK", name: "Pakistan", nationality: "Pakistani", dial: "+92", flag: "🇵🇰" },
  { code: "IN", name: "India", nationality: "Indian", dial: "+91", flag: "🇮🇳" },
  { code: "BD", name: "Bangladesh", nationality: "Bangladeshi", dial: "+880", flag: "🇧🇩" },
  { code: "LK", name: "Sri Lanka", nationality: "Sri Lankan", dial: "+94", flag: "🇱🇰" },
  { code: "NP", name: "Nepal", nationality: "Nepali", dial: "+977", flag: "🇳🇵" },
  { code: "AF", name: "Afghanistan", nationality: "Afghan", dial: "+93", flag: "🇦🇫" },
  { code: "CN", name: "China", nationality: "Chinese", dial: "+86", flag: "🇨🇳" },
  { code: "JP", name: "Japan", nationality: "Japanese", dial: "+81", flag: "🇯🇵" },
  { code: "KR", name: "South Korea", nationality: "Korean", dial: "+82", flag: "🇰🇷" },
  { code: "TH", name: "Thailand", nationality: "Thai", dial: "+66", flag: "🇹🇭" },
  { code: "VN", name: "Vietnam", nationality: "Vietnamese", dial: "+84", flag: "🇻🇳" },
  { code: "PH", name: "Philippines", nationality: "Filipino", dial: "+63", flag: "🇵🇭" },
  { code: "ID", name: "Indonesia", nationality: "Indonesian", dial: "+62", flag: "🇮🇩" },
  { code: "MY", name: "Malaysia", nationality: "Malaysian", dial: "+60", flag: "🇲🇾" },
  { code: "SG", name: "Singapore", nationality: "Singaporean", dial: "+65", flag: "🇸🇬" },
  { code: "HK", name: "Hong Kong", nationality: "Hong Konger", dial: "+852", flag: "🇭🇰" },
  { code: "TW", name: "Taiwan", nationality: "Taiwanese", dial: "+886", flag: "🇹🇼" },
  { code: "MM", name: "Myanmar", nationality: "Burmese", dial: "+95", flag: "🇲🇲" },
  { code: "KH", name: "Cambodia", nationality: "Cambodian", dial: "+855", flag: "🇰🇭" },
  { code: "LA", name: "Laos", nationality: "Lao", dial: "+856", flag: "🇱🇦" },
  { code: "MN", name: "Mongolia", nationality: "Mongolian", dial: "+976", flag: "🇲🇳" },
  { code: "KZ", name: "Kazakhstan", nationality: "Kazakh", dial: "+7", flag: "🇰🇿" },
  { code: "UZ", name: "Uzbekistan", nationality: "Uzbek", dial: "+998", flag: "🇺🇿" },
  { code: "TM", name: "Turkmenistan", nationality: "Turkmen", dial: "+993", flag: "🇹🇲" },
  { code: "KG", name: "Kyrgyzstan", nationality: "Kyrgyz", dial: "+996", flag: "🇰🇬" },
  { code: "TJ", name: "Tajikistan", nationality: "Tajik", dial: "+992", flag: "🇹🇯" },
  { code: "AZ", name: "Azerbaijan", nationality: "Azerbaijani", dial: "+994", flag: "🇦🇿" },
  { code: "AM", name: "Armenia", nationality: "Armenian", dial: "+374", flag: "🇦🇲" },
  { code: "GE", name: "Georgia", nationality: "Georgian", dial: "+995", flag: "🇬🇪" },
  { code: "RU", name: "Russia", nationality: "Russian", dial: "+7", flag: "🇷🇺" },
  { code: "UA", name: "Ukraine", nationality: "Ukrainian", dial: "+380", flag: "🇺🇦" },
  { code: "BY", name: "Belarus", nationality: "Belarusian", dial: "+375", flag: "🇧🇾" },
  { code: "PL", name: "Poland", nationality: "Polish", dial: "+48", flag: "🇵🇱" },
  { code: "CZ", name: "Czech Republic", nationality: "Czech", dial: "+420", flag: "🇨🇿" },
  { code: "SK", name: "Slovakia", nationality: "Slovak", dial: "+421", flag: "🇸🇰" },
  { code: "HU", name: "Hungary", nationality: "Hungarian", dial: "+36", flag: "🇭🇺" },
  { code: "RO", name: "Romania", nationality: "Romanian", dial: "+40", flag: "🇷🇴" },
  { code: "BG", name: "Bulgaria", nationality: "Bulgarian", dial: "+359", flag: "🇧🇬" },
  { code: "GR", name: "Greece", nationality: "Greek", dial: "+30", flag: "🇬🇷" },
  { code: "CY", name: "Cyprus", nationality: "Cypriot", dial: "+357", flag: "🇨🇾" },
  { code: "MT", name: "Malta", nationality: "Maltese", dial: "+356", flag: "🇲🇹" },
  { code: "IT", name: "Italy", nationality: "Italian", dial: "+39", flag: "🇮🇹" },
  { code: "ES", name: "Spain", nationality: "Spanish", dial: "+34", flag: "🇪🇸" },
  { code: "PT", name: "Portugal", nationality: "Portuguese", dial: "+351", flag: "🇵🇹" },
  { code: "FR", name: "France", nationality: "French", dial: "+33", flag: "🇫🇷" },
  { code: "DE", name: "Germany", nationality: "German", dial: "+49", flag: "🇩🇪" },
  { code: "AT", name: "Austria", nationality: "Austrian", dial: "+43", flag: "🇦🇹" },
  { code: "CH", name: "Switzerland", nationality: "Swiss", dial: "+41", flag: "🇨🇭" },
  { code: "BE", name: "Belgium", nationality: "Belgian", dial: "+32", flag: "🇧🇪" },
  { code: "NL", name: "Netherlands", nationality: "Dutch", dial: "+31", flag: "🇳🇱" },
  { code: "LU", name: "Luxembourg", nationality: "Luxembourgish", dial: "+352", flag: "🇱🇺" },
  { code: "GB", name: "United Kingdom", nationality: "British", dial: "+44", flag: "🇬🇧" },
  { code: "IE", name: "Ireland", nationality: "Irish", dial: "+353", flag: "🇮🇪" },
  { code: "DK", name: "Denmark", nationality: "Danish", dial: "+45", flag: "🇩🇰" },
  { code: "SE", name: "Sweden", nationality: "Swedish", dial: "+46", flag: "🇸🇪" },
  { code: "NO", name: "Norway", nationality: "Norwegian", dial: "+47", flag: "🇳🇴" },
  { code: "FI", name: "Finland", nationality: "Finnish", dial: "+358", flag: "🇫🇮" },
  { code: "IS", name: "Iceland", nationality: "Icelandic", dial: "+354", flag: "🇮🇸" },
  { code: "EE", name: "Estonia", nationality: "Estonian", dial: "+372", flag: "🇪🇪" },
  { code: "LV", name: "Latvia", nationality: "Latvian", dial: "+371", flag: "🇱🇻" },
  { code: "LT", name: "Lithuania", nationality: "Lithuanian", dial: "+370", flag: "🇱🇹" },
  { code: "HR", name: "Croatia", nationality: "Croatian", dial: "+385", flag: "🇭🇷" },
  { code: "SI", name: "Slovenia", nationality: "Slovenian", dial: "+386", flag: "🇸🇮" },
  { code: "RS", name: "Serbia", nationality: "Serbian", dial: "+381", flag: "🇷🇸" },
  { code: "BA", name: "Bosnia and Herzegovina", nationality: "Bosnian", dial: "+387", flag: "🇧🇦" },
  { code: "MK", name: "North Macedonia", nationality: "Macedonian", dial: "+389", flag: "🇲🇰" },
  { code: "AL", name: "Albania", nationality: "Albanian", dial: "+355", flag: "🇦🇱" },
  { code: "ME", name: "Montenegro", nationality: "Montenegrin", dial: "+382", flag: "🇲🇪" },
  { code: "XK", name: "Kosovo", nationality: "Kosovar", dial: "+383", flag: "🇽🇰" },
  { code: "MD", name: "Moldova", nationality: "Moldovan", dial: "+373", flag: "🇲🇩" },
  { code: "US", name: "United States", nationality: "American", dial: "+1", flag: "🇺🇸" },
  { code: "CA", name: "Canada", nationality: "Canadian", dial: "+1", flag: "🇨🇦" },
  { code: "MX", name: "Mexico", nationality: "Mexican", dial: "+52", flag: "🇲🇽" },
  { code: "BR", name: "Brazil", nationality: "Brazilian", dial: "+55", flag: "🇧🇷" },
  { code: "AR", name: "Argentina", nationality: "Argentine", dial: "+54", flag: "🇦🇷" },
  { code: "CL", name: "Chile", nationality: "Chilean", dial: "+56", flag: "🇨🇱" },
  { code: "CO", name: "Colombia", nationality: "Colombian", dial: "+57", flag: "🇨🇴" },
  { code: "PE", name: "Peru", nationality: "Peruvian", dial: "+51", flag: "🇵🇪" },
  { code: "VE", name: "Venezuela", nationality: "Venezuelan", dial: "+58", flag: "🇻🇪" },
  { code: "EC", name: "Ecuador", nationality: "Ecuadorian", dial: "+593", flag: "🇪🇨" },
  { code: "UY", name: "Uruguay", nationality: "Uruguayan", dial: "+598", flag: "🇺🇾" },
  { code: "PY", name: "Paraguay", nationality: "Paraguayan", dial: "+595", flag: "🇵🇾" },
  { code: "BO", name: "Bolivia", nationality: "Bolivian", dial: "+591", flag: "🇧🇴" },
  { code: "CR", name: "Costa Rica", nationality: "Costa Rican", dial: "+506", flag: "🇨🇷" },
  { code: "PA", name: "Panama", nationality: "Panamanian", dial: "+507", flag: "🇵🇦" },
  { code: "DO", name: "Dominican Republic", nationality: "Dominican", dial: "+1", flag: "🇩🇴" },
  { code: "CU", name: "Cuba", nationality: "Cuban", dial: "+53", flag: "🇨🇺" },
  { code: "JM", name: "Jamaica", nationality: "Jamaican", dial: "+1", flag: "🇯🇲" },
  { code: "AU", name: "Australia", nationality: "Australian", dial: "+61", flag: "🇦🇺" },
  { code: "NZ", name: "New Zealand", nationality: "New Zealander", dial: "+64", flag: "🇳🇿" },
  { code: "FJ", name: "Fiji", nationality: "Fijian", dial: "+679", flag: "🇫🇯" },
  { code: "ZA", name: "South Africa", nationality: "South African", dial: "+27", flag: "🇿🇦" },
  { code: "NG", name: "Nigeria", nationality: "Nigerian", dial: "+234", flag: "🇳🇬" },
  { code: "KE", name: "Kenya", nationality: "Kenyan", dial: "+254", flag: "🇰🇪" },
  { code: "ET", name: "Ethiopia", nationality: "Ethiopian", dial: "+251", flag: "🇪🇹" },
  { code: "GH", name: "Ghana", nationality: "Ghanaian", dial: "+233", flag: "🇬🇭" },
  { code: "TZ", name: "Tanzania", nationality: "Tanzanian", dial: "+255", flag: "🇹🇿" },
  { code: "UG", name: "Uganda", nationality: "Ugandan", dial: "+256", flag: "🇺🇬" },
  { code: "RW", name: "Rwanda", nationality: "Rwandan", dial: "+250", flag: "🇷🇼" },
  { code: "SN", name: "Senegal", nationality: "Senegalese", dial: "+221", flag: "🇸🇳" },
  { code: "CI", name: "Côte d'Ivoire", nationality: "Ivorian", dial: "+225", flag: "🇨🇮" },
  { code: "CM", name: "Cameroon", nationality: "Cameroonian", dial: "+237", flag: "🇨🇲" },
  { code: "AO", name: "Angola", nationality: "Angolan", dial: "+244", flag: "🇦🇴" },
  { code: "ZW", name: "Zimbabwe", nationality: "Zimbabwean", dial: "+263", flag: "🇿🇼" },
  { code: "ZM", name: "Zambia", nationality: "Zambian", dial: "+260", flag: "🇿🇲" },
  { code: "MZ", name: "Mozambique", nationality: "Mozambican", dial: "+258", flag: "🇲🇿" },
  { code: "MU", name: "Mauritius", nationality: "Mauritian", dial: "+230", flag: "🇲🇺" },
  { code: "SC", name: "Seychelles", nationality: "Seychellois", dial: "+248", flag: "🇸🇨" },
];

export const PRIORITY_COUNTRY_CODES = ["AE", "SA", "QA", "KW", "BH", "OM", "IN", "PK", "GB", "US"];

export function findCountryByDial(dial: string): CountryEntry | undefined {
  return COUNTRIES.find((c) => c.dial === dial);
}

export function findCountryByCode(code: string): CountryEntry | undefined {
  return COUNTRIES.find((c) => c.code === code.toUpperCase());
}

export function findCountryByNationality(nat: string): CountryEntry | undefined {
  const n = nat.trim().toLowerCase();
  return COUNTRIES.find((c) => c.nationality.toLowerCase() === n);
}

/** Parse an E.164 phone string into { dial, national }. Greedy longest match. */
export function splitE164(phone: string): { dial: string; national: string } {
  const p = (phone || "").replace(/\s+/g, "");
  if (!p.startsWith("+")) return { dial: "+971", national: p };
  // Try longest dial first
  const dials = Array.from(new Set(COUNTRIES.map((c) => c.dial))).sort((a, b) => b.length - a.length);
  for (const d of dials) {
    if (p.startsWith(d)) return { dial: d, national: p.slice(d.length) };
  }
  return { dial: "+971", national: p };
}
