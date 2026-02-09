import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { CheckCircle, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

// Timezone to country code mapping
const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  // GCC
  "Asia/Dubai": "+971",
  "Asia/Riyadh": "+966",
  "Asia/Qatar": "+974",
  "Asia/Kuwait": "+965",
  "Asia/Bahrain": "+973",
  "Asia/Muscat": "+968",
  // Middle East
  "Africa/Cairo": "+20",
  "Asia/Beirut": "+961",
  "Asia/Amman": "+962",
  "Europe/Istanbul": "+90",
  "Asia/Tehran": "+98",
  "Asia/Jerusalem": "+972",
  "Asia/Baghdad": "+964",
  "Africa/Casablanca": "+212",
  "Africa/Algiers": "+213",
  "Africa/Tunis": "+216",
  // Europe
  "Europe/London": "+44",
  "Europe/Berlin": "+49",
  "Europe/Paris": "+33",
  "Europe/Rome": "+39",
  "Europe/Madrid": "+34",
  "Europe/Zurich": "+41",
  "Europe/Moscow": "+7",
  "Europe/Amsterdam": "+31",
  "Europe/Brussels": "+32",
  "Europe/Vienna": "+43",
  "Europe/Stockholm": "+46",
  "Europe/Oslo": "+47",
  "Europe/Copenhagen": "+45",
  "Europe/Helsinki": "+358",
  "Europe/Warsaw": "+48",
  "Europe/Lisbon": "+351",
  "Europe/Athens": "+30",
  "Europe/Dublin": "+353",
  "Europe/Prague": "+420",
  "Europe/Budapest": "+36",
  "Europe/Bucharest": "+40",
  "Europe/Kiev": "+380",
  "Europe/Bratislava": "+421",
  "Europe/Ljubljana": "+386",
  "Europe/Zagreb": "+385",
  "Europe/Belgrade": "+381",
  "Europe/Sofia": "+359",
  "Europe/Riga": "+371",
  "Europe/Vilnius": "+370",
  "Europe/Tallinn": "+372",
  "Europe/Minsk": "+375",
  "Europe/Skopje": "+389",
  "Europe/Sarajevo": "+387",
  "Europe/Podgorica": "+382",
  "Europe/Tirana": "+355",
  "Europe/Luxembourg": "+352",
  "Europe/Monaco": "+377",
  "Europe/Malta": "+356",
  // Asia Pacific
  "Asia/Shanghai": "+86",
  "Asia/Hong_Kong": "+852",
  "Asia/Kolkata": "+91",
  "Asia/Karachi": "+92",
  "Asia/Dhaka": "+880",
  "Asia/Colombo": "+94",
  "Asia/Kathmandu": "+977",
  "Australia/Sydney": "+61",
  "Pacific/Auckland": "+64",
  "Asia/Singapore": "+65",
  "Asia/Kuala_Lumpur": "+60",
  "Asia/Manila": "+63",
  "Asia/Jakarta": "+62",
  "Asia/Bangkok": "+66",
  "Asia/Ho_Chi_Minh": "+84",
  "Asia/Tokyo": "+81",
  "Asia/Seoul": "+82",
  "Asia/Taipei": "+886",
  "Asia/Kabul": "+93",
  "Asia/Baku": "+994",
  "Asia/Tbilisi": "+995",
  "Asia/Yerevan": "+374",
  "Asia/Almaty": "+7",
  "Asia/Tashkent": "+998",
  "Asia/Bishkek": "+996",
  "Asia/Dushanbe": "+992",
  "Asia/Ashgabat": "+993",
  "Asia/Ulaanbaatar": "+976",
  "Asia/Yangon": "+95",
  "Asia/Phnom_Penh": "+855",
  "Asia/Vientiane": "+856",
  "Pacific/Fiji": "+679",
  "Pacific/Guam": "+1671",
  "Pacific/Honolulu": "+1808",
  // Americas
  "America/New_York": "+1",
  "America/Los_Angeles": "+1",
  "America/Chicago": "+1",
  "America/Toronto": "+1",
  "America/Mexico_City": "+52",
  "America/Sao_Paulo": "+55",
  "America/Buenos_Aires": "+54",
  "America/Santiago": "+56",
  "America/Bogota": "+57",
  "America/Caracas": "+58",
  "America/Lima": "+51",
  "America/Costa_Rica": "+506",
  "America/Panama": "+507",
  "America/Guatemala": "+502",
  "America/Havana": "+53",
  "America/Santo_Domingo": "+1809",
  "America/Port-au-Prince": "+509",
  "America/Jamaica": "+1876",
  "America/Montevideo": "+598",
  "America/Asuncion": "+595",
  "America/La_Paz": "+591",
  "America/Quito": "+593",
  // Africa
  "Africa/Johannesburg": "+27",
  "Africa/Lagos": "+234",
  "Africa/Nairobi": "+254",
  "Africa/Accra": "+233",
  "Africa/Addis_Ababa": "+251",
  "Africa/Dar_es_Salaam": "+255",
  "Africa/Kampala": "+256",
  "Indian/Mauritius": "+230",
  "Africa/Khartoum": "+249",
  "Africa/Kinshasa": "+243",
  "Africa/Luanda": "+244",
  "Africa/Maputo": "+258",
  "Africa/Abidjan": "+225",
  "Africa/Dakar": "+221",
  "Africa/Douala": "+237",
};

// Detect country code from browser timezone or locale
const detectCountryCode = (): string => {
  try {
    // First try timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone && TIMEZONE_TO_COUNTRY[timezone]) {
      return TIMEZONE_TO_COUNTRY[timezone];
    }
    
    // Fallback to browser language/locale
    const locale = navigator.language || (navigator as { userLanguage?: string }).userLanguage || '';
    const region = locale.split('-')[1]?.toUpperCase();
    
    // Map common region codes to dial codes
    const REGION_TO_DIAL: Record<string, string> = {
      'AE': '+971', 'SA': '+966', 'QA': '+974', 'KW': '+965', 'BH': '+973', 'OM': '+968',
      'US': '+1', 'CA': '+1', 'GB': '+44', 'UK': '+44', 'DE': '+49', 'FR': '+33',
      'IT': '+39', 'ES': '+34', 'AU': '+61', 'NZ': '+64', 'IN': '+91', 'PK': '+92',
      'CN': '+86', 'HK': '+852', 'SG': '+65', 'MY': '+60', 'JP': '+81', 'KR': '+82',
      'RU': '+7', 'BR': '+55', 'MX': '+52', 'EG': '+20', 'ZA': '+27', 'NG': '+234',
      'TR': '+90', 'IR': '+98', 'IL': '+972', 'JO': '+962', 'LB': '+961',
      'PH': '+63', 'ID': '+62', 'TH': '+66', 'VN': '+84', 'BD': '+880',
      'LK': '+94', 'NP': '+977', 'AF': '+93', 'IQ': '+964', 'SY': '+963',
      'YE': '+967', 'MA': '+212', 'DZ': '+213', 'TN': '+216', 'LY': '+218',
      'SD': '+249', 'ET': '+251', 'KE': '+254', 'TZ': '+255', 'UG': '+256',
      'GH': '+233', 'CI': '+225', 'SN': '+221', 'CM': '+237', 'CD': '+243',
      'AO': '+244', 'MZ': '+258', 'ZW': '+263', 'MU': '+230',
      'CO': '+57', 'VE': '+58', 'PE': '+51', 'CL': '+56', 'AR': '+54',
      'CU': '+53', 'DO': '+1809', 'JM': '+1876', 'HT': '+509', 'GT': '+502',
      'PA': '+507', 'CR': '+506', 'UY': '+598', 'PY': '+595', 'BO': '+591', 'EC': '+593',
      'PL': '+48', 'UA': '+380', 'RO': '+40', 'HU': '+36', 'CZ': '+420',
      'GR': '+30', 'PT': '+351', 'IE': '+353', 'AT': '+43', 'CH': '+41',
      'BE': '+32', 'NL': '+31', 'SE': '+46', 'NO': '+47', 'DK': '+45', 'FI': '+358',
      'SK': '+421', 'SI': '+386', 'HR': '+385', 'RS': '+381', 'BG': '+359',
      'LV': '+371', 'LT': '+370', 'EE': '+372', 'BY': '+375', 'MK': '+389',
      'BA': '+387', 'ME': '+382', 'AL': '+355', 'LU': '+352', 'MC': '+377', 'MT': '+356',
      'AZ': '+994', 'GE': '+995', 'AM': '+374', 'KZ': '+7', 'UZ': '+998',
      'KG': '+996', 'TJ': '+992', 'TM': '+993', 'MN': '+976', 'MM': '+95',
      'KH': '+855', 'LA': '+856', 'FJ': '+679', 'TW': '+886',
    };
    
    if (region && REGION_TO_DIAL[region]) {
      return REGION_TO_DIAL[region];
    }
  } catch {
    // Silent fail - use default
  }
  
  // Default to UAE for this platform
  return "+971";
};

// Complete country codes list organized by region
export const COUNTRY_CODES_BY_REGION = {
  "GCC": [
    { code: "+971", country: "United Arab Emirates", flag: "🇦🇪", minLen: 9, maxLen: 9 },
    { code: "+966", country: "Saudi Arabia", flag: "🇸🇦", minLen: 9, maxLen: 9 },
    { code: "+974", country: "Qatar", flag: "🇶🇦", minLen: 8, maxLen: 8 },
    { code: "+965", country: "Kuwait", flag: "🇰🇼", minLen: 8, maxLen: 8 },
    { code: "+973", country: "Bahrain", flag: "🇧🇭", minLen: 8, maxLen: 8 },
    { code: "+968", country: "Oman", flag: "🇴🇲", minLen: 8, maxLen: 8 },
  ],
  "Middle East & North Africa": [
    { code: "+20", country: "Egypt", flag: "🇪🇬", minLen: 10, maxLen: 10 },
    { code: "+961", country: "Lebanon", flag: "🇱🇧", minLen: 7, maxLen: 8 },
    { code: "+962", country: "Jordan", flag: "🇯🇴", minLen: 9, maxLen: 9 },
    { code: "+90", country: "Turkey", flag: "🇹🇷", minLen: 10, maxLen: 10 },
    { code: "+98", country: "Iran", flag: "🇮🇷", minLen: 10, maxLen: 10 },
    { code: "+972", country: "Israel", flag: "🇮🇱", minLen: 9, maxLen: 9 },
    { code: "+964", country: "Iraq", flag: "🇮🇶", minLen: 10, maxLen: 10 },
    { code: "+963", country: "Syria", flag: "🇸🇾", minLen: 9, maxLen: 9 },
    { code: "+967", country: "Yemen", flag: "🇾🇪", minLen: 9, maxLen: 9 },
    { code: "+212", country: "Morocco", flag: "🇲🇦", minLen: 9, maxLen: 9 },
    { code: "+213", country: "Algeria", flag: "🇩🇿", minLen: 9, maxLen: 9 },
    { code: "+216", country: "Tunisia", flag: "🇹🇳", minLen: 8, maxLen: 8 },
    { code: "+218", country: "Libya", flag: "🇱🇾", minLen: 9, maxLen: 9 },
    { code: "+249", country: "Sudan", flag: "🇸🇩", minLen: 9, maxLen: 9 },
    { code: "+970", country: "Palestine", flag: "🇵🇸", minLen: 9, maxLen: 9 },
  ],
  "Europe": [
    { code: "+44", country: "United Kingdom", flag: "🇬🇧", minLen: 10, maxLen: 10 },
    { code: "+49", country: "Germany", flag: "🇩🇪", minLen: 10, maxLen: 11 },
    { code: "+33", country: "France", flag: "🇫🇷", minLen: 9, maxLen: 9 },
    { code: "+39", country: "Italy", flag: "🇮🇹", minLen: 9, maxLen: 10 },
    { code: "+34", country: "Spain", flag: "🇪🇸", minLen: 9, maxLen: 9 },
    { code: "+41", country: "Switzerland", flag: "🇨🇭", minLen: 9, maxLen: 9 },
    { code: "+7", country: "Russia", flag: "🇷🇺", minLen: 10, maxLen: 10 },
    { code: "+31", country: "Netherlands", flag: "🇳🇱", minLen: 9, maxLen: 9 },
    { code: "+32", country: "Belgium", flag: "🇧🇪", minLen: 9, maxLen: 9 },
    { code: "+43", country: "Austria", flag: "🇦🇹", minLen: 10, maxLen: 11 },
    { code: "+46", country: "Sweden", flag: "🇸🇪", minLen: 9, maxLen: 9 },
    { code: "+47", country: "Norway", flag: "🇳🇴", minLen: 8, maxLen: 8 },
    { code: "+45", country: "Denmark", flag: "🇩🇰", minLen: 8, maxLen: 8 },
    { code: "+358", country: "Finland", flag: "🇫🇮", minLen: 9, maxLen: 10 },
    { code: "+48", country: "Poland", flag: "🇵🇱", minLen: 9, maxLen: 9 },
    { code: "+351", country: "Portugal", flag: "🇵🇹", minLen: 9, maxLen: 9 },
    { code: "+30", country: "Greece", flag: "🇬🇷", minLen: 10, maxLen: 10 },
    { code: "+353", country: "Ireland", flag: "🇮🇪", minLen: 9, maxLen: 9 },
    { code: "+420", country: "Czech Republic", flag: "🇨🇿", minLen: 9, maxLen: 9 },
    { code: "+36", country: "Hungary", flag: "🇭🇺", minLen: 9, maxLen: 9 },
    { code: "+40", country: "Romania", flag: "🇷🇴", minLen: 9, maxLen: 9 },
    { code: "+380", country: "Ukraine", flag: "🇺🇦", minLen: 9, maxLen: 9 },
    { code: "+421", country: "Slovakia", flag: "🇸🇰", minLen: 9, maxLen: 9 },
    { code: "+386", country: "Slovenia", flag: "🇸🇮", minLen: 8, maxLen: 8 },
    { code: "+385", country: "Croatia", flag: "🇭🇷", minLen: 9, maxLen: 9 },
    { code: "+381", country: "Serbia", flag: "🇷🇸", minLen: 9, maxLen: 9 },
    { code: "+359", country: "Bulgaria", flag: "🇧🇬", minLen: 9, maxLen: 9 },
    { code: "+371", country: "Latvia", flag: "🇱🇻", minLen: 8, maxLen: 8 },
    { code: "+370", country: "Lithuania", flag: "🇱🇹", minLen: 8, maxLen: 8 },
    { code: "+372", country: "Estonia", flag: "🇪🇪", minLen: 7, maxLen: 8 },
    { code: "+375", country: "Belarus", flag: "🇧🇾", minLen: 9, maxLen: 9 },
    { code: "+389", country: "North Macedonia", flag: "🇲🇰", minLen: 8, maxLen: 8 },
    { code: "+387", country: "Bosnia & Herzegovina", flag: "🇧🇦", minLen: 8, maxLen: 8 },
    { code: "+382", country: "Montenegro", flag: "🇲🇪", minLen: 8, maxLen: 8 },
    { code: "+355", country: "Albania", flag: "🇦🇱", minLen: 9, maxLen: 9 },
    { code: "+352", country: "Luxembourg", flag: "🇱🇺", minLen: 9, maxLen: 9 },
    { code: "+377", country: "Monaco", flag: "🇲🇨", minLen: 8, maxLen: 9 },
    { code: "+356", country: "Malta", flag: "🇲🇹", minLen: 8, maxLen: 8 },
    { code: "+354", country: "Iceland", flag: "🇮🇸", minLen: 7, maxLen: 7 },
    { code: "+357", country: "Cyprus", flag: "🇨🇾", minLen: 8, maxLen: 8 },
    { code: "+373", country: "Moldova", flag: "🇲🇩", minLen: 8, maxLen: 8 },
  ],
  "Asia Pacific": [
    { code: "+86", country: "China", flag: "🇨🇳", minLen: 11, maxLen: 11 },
    { code: "+852", country: "Hong Kong", flag: "🇭🇰", minLen: 8, maxLen: 8 },
    { code: "+853", country: "Macau", flag: "🇲🇴", minLen: 8, maxLen: 8 },
    { code: "+91", country: "India", flag: "🇮🇳", minLen: 10, maxLen: 10 },
    { code: "+92", country: "Pakistan", flag: "🇵🇰", minLen: 10, maxLen: 10 },
    { code: "+880", country: "Bangladesh", flag: "🇧🇩", minLen: 10, maxLen: 10 },
    { code: "+94", country: "Sri Lanka", flag: "🇱🇰", minLen: 9, maxLen: 9 },
    { code: "+977", country: "Nepal", flag: "🇳🇵", minLen: 10, maxLen: 10 },
    { code: "+93", country: "Afghanistan", flag: "🇦🇫", minLen: 9, maxLen: 9 },
    { code: "+61", country: "Australia", flag: "🇦🇺", minLen: 9, maxLen: 9 },
    { code: "+64", country: "New Zealand", flag: "🇳🇿", minLen: 9, maxLen: 10 },
    { code: "+65", country: "Singapore", flag: "🇸🇬", minLen: 8, maxLen: 8 },
    { code: "+60", country: "Malaysia", flag: "🇲🇾", minLen: 9, maxLen: 10 },
    { code: "+63", country: "Philippines", flag: "🇵🇭", minLen: 10, maxLen: 10 },
    { code: "+62", country: "Indonesia", flag: "🇮🇩", minLen: 10, maxLen: 12 },
    { code: "+66", country: "Thailand", flag: "🇹🇭", minLen: 9, maxLen: 9 },
    { code: "+84", country: "Vietnam", flag: "🇻🇳", minLen: 9, maxLen: 10 },
    { code: "+81", country: "Japan", flag: "🇯🇵", minLen: 10, maxLen: 10 },
    { code: "+82", country: "South Korea", flag: "🇰🇷", minLen: 10, maxLen: 10 },
    { code: "+886", country: "Taiwan", flag: "🇹🇼", minLen: 9, maxLen: 9 },
    { code: "+855", country: "Cambodia", flag: "🇰🇭", minLen: 9, maxLen: 9 },
    { code: "+856", country: "Laos", flag: "🇱🇦", minLen: 9, maxLen: 10 },
    { code: "+95", country: "Myanmar", flag: "🇲🇲", minLen: 9, maxLen: 9 },
    { code: "+850", country: "North Korea", flag: "🇰🇵", minLen: 9, maxLen: 9 },
    { code: "+976", country: "Mongolia", flag: "🇲🇳", minLen: 8, maxLen: 8 },
    { code: "+673", country: "Brunei", flag: "🇧🇳", minLen: 7, maxLen: 7 },
    { code: "+960", country: "Maldives", flag: "🇲🇻", minLen: 7, maxLen: 7 },
    { code: "+975", country: "Bhutan", flag: "🇧🇹", minLen: 8, maxLen: 8 },
    { code: "+679", country: "Fiji", flag: "🇫🇯", minLen: 7, maxLen: 7 },
    { code: "+675", country: "Papua New Guinea", flag: "🇵🇬", minLen: 8, maxLen: 8 },
    { code: "+670", country: "Timor-Leste", flag: "🇹🇱", minLen: 7, maxLen: 8 },
  ],
  "Pacific Islands": [
    { code: "+676", country: "Tonga", flag: "🇹🇴", minLen: 5, maxLen: 7 },
    { code: "+677", country: "Solomon Islands", flag: "🇸🇧", minLen: 7, maxLen: 7 },
    { code: "+678", country: "Vanuatu", flag: "🇻🇺", minLen: 7, maxLen: 7 },
    { code: "+680", country: "Palau", flag: "🇵🇼", minLen: 7, maxLen: 7 },
    { code: "+681", country: "Wallis & Futuna", flag: "🇼🇫", minLen: 6, maxLen: 6 },
    { code: "+682", country: "Cook Islands", flag: "🇨🇰", minLen: 5, maxLen: 5 },
    { code: "+683", country: "Niue", flag: "🇳🇺", minLen: 4, maxLen: 4 },
    { code: "+685", country: "Samoa", flag: "🇼🇸", minLen: 5, maxLen: 7 },
    { code: "+686", country: "Kiribati", flag: "🇰🇮", minLen: 5, maxLen: 8 },
    { code: "+687", country: "New Caledonia", flag: "🇳🇨", minLen: 6, maxLen: 6 },
    { code: "+688", country: "Tuvalu", flag: "🇹🇻", minLen: 5, maxLen: 6 },
    { code: "+689", country: "French Polynesia", flag: "🇵🇫", minLen: 6, maxLen: 6 },
    { code: "+690", country: "Tokelau", flag: "🇹🇰", minLen: 4, maxLen: 4 },
    { code: "+691", country: "Micronesia", flag: "🇫🇲", minLen: 7, maxLen: 7 },
    { code: "+692", country: "Marshall Islands", flag: "🇲🇭", minLen: 7, maxLen: 7 },
    { code: "+1670", country: "Northern Mariana", flag: "🇲🇵", minLen: 7, maxLen: 7 },
    { code: "+1671", country: "Guam", flag: "🇬🇺", minLen: 7, maxLen: 7 },
    { code: "+1684", country: "American Samoa", flag: "🇦🇸", minLen: 7, maxLen: 7 },
  ],
  "Central Asia & Caucasus": [
    { code: "+994", country: "Azerbaijan", flag: "🇦🇿", minLen: 9, maxLen: 9 },
    { code: "+995", country: "Georgia", flag: "🇬🇪", minLen: 9, maxLen: 9 },
    { code: "+374", country: "Armenia", flag: "🇦🇲", minLen: 8, maxLen: 8 },
    { code: "+998", country: "Uzbekistan", flag: "🇺🇿", minLen: 9, maxLen: 9 },
    { code: "+996", country: "Kyrgyzstan", flag: "🇰🇬", minLen: 9, maxLen: 9 },
    { code: "+992", country: "Tajikistan", flag: "🇹🇯", minLen: 9, maxLen: 9 },
    { code: "+993", country: "Turkmenistan", flag: "🇹🇲", minLen: 8, maxLen: 8 },
  ],
  "Americas": [
    { code: "+1", country: "USA/Canada", flag: "🇺🇸", minLen: 10, maxLen: 10 },
    { code: "+52", country: "Mexico", flag: "🇲🇽", minLen: 10, maxLen: 10 },
    { code: "+55", country: "Brazil", flag: "🇧🇷", minLen: 10, maxLen: 11 },
    { code: "+54", country: "Argentina", flag: "🇦🇷", minLen: 10, maxLen: 10 },
    { code: "+56", country: "Chile", flag: "🇨🇱", minLen: 9, maxLen: 9 },
    { code: "+57", country: "Colombia", flag: "🇨🇴", minLen: 10, maxLen: 10 },
    { code: "+58", country: "Venezuela", flag: "🇻🇪", minLen: 10, maxLen: 10 },
    { code: "+51", country: "Peru", flag: "🇵🇪", minLen: 9, maxLen: 9 },
    { code: "+593", country: "Ecuador", flag: "🇪🇨", minLen: 9, maxLen: 9 },
    { code: "+591", country: "Bolivia", flag: "🇧🇴", minLen: 8, maxLen: 8 },
    { code: "+595", country: "Paraguay", flag: "🇵🇾", minLen: 9, maxLen: 9 },
    { code: "+598", country: "Uruguay", flag: "🇺🇾", minLen: 8, maxLen: 8 },
    { code: "+506", country: "Costa Rica", flag: "🇨🇷", minLen: 8, maxLen: 8 },
    { code: "+507", country: "Panama", flag: "🇵🇦", minLen: 8, maxLen: 8 },
    { code: "+502", country: "Guatemala", flag: "🇬🇹", minLen: 8, maxLen: 8 },
    { code: "+503", country: "El Salvador", flag: "🇸🇻", minLen: 8, maxLen: 8 },
    { code: "+504", country: "Honduras", flag: "🇭🇳", minLen: 8, maxLen: 8 },
    { code: "+505", country: "Nicaragua", flag: "🇳🇮", minLen: 8, maxLen: 8 },
    { code: "+53", country: "Cuba", flag: "🇨🇺", minLen: 8, maxLen: 8 },
    { code: "+509", country: "Haiti", flag: "🇭🇹", minLen: 8, maxLen: 8 },
    { code: "+592", country: "Guyana", flag: "🇬🇾", minLen: 7, maxLen: 7 },
    { code: "+597", country: "Suriname", flag: "🇸🇷", minLen: 7, maxLen: 7 },
  ],
  "Caribbean": [
    { code: "+1876", country: "Jamaica", flag: "🇯🇲", minLen: 7, maxLen: 7 },
    { code: "+1868", country: "Trinidad & Tobago", flag: "🇹🇹", minLen: 7, maxLen: 7 },
    { code: "+1809", country: "Dominican Republic", flag: "🇩🇴", minLen: 7, maxLen: 7 },
    { code: "+1787", country: "Puerto Rico", flag: "🇵🇷", minLen: 7, maxLen: 7 },
    { code: "+1246", country: "Barbados", flag: "🇧🇧", minLen: 7, maxLen: 7 },
    { code: "+1242", country: "Bahamas", flag: "🇧🇸", minLen: 7, maxLen: 7 },
    { code: "+1758", country: "Saint Lucia", flag: "🇱🇨", minLen: 7, maxLen: 7 },
    { code: "+1767", country: "Dominica", flag: "🇩🇲", minLen: 7, maxLen: 7 },
    { code: "+1473", country: "Grenada", flag: "🇬🇩", minLen: 7, maxLen: 7 },
    { code: "+1268", country: "Antigua & Barbuda", flag: "🇦🇬", minLen: 7, maxLen: 7 },
    { code: "+1784", country: "St Vincent", flag: "🇻🇨", minLen: 7, maxLen: 7 },
    { code: "+1869", country: "St Kitts & Nevis", flag: "🇰🇳", minLen: 7, maxLen: 7 },
  ],
  "Africa": [
    { code: "+27", country: "South Africa", flag: "🇿🇦", minLen: 9, maxLen: 9 },
    { code: "+234", country: "Nigeria", flag: "🇳🇬", minLen: 10, maxLen: 10 },
    { code: "+254", country: "Kenya", flag: "🇰🇪", minLen: 9, maxLen: 9 },
    { code: "+233", country: "Ghana", flag: "🇬🇭", minLen: 9, maxLen: 9 },
    { code: "+251", country: "Ethiopia", flag: "🇪🇹", minLen: 9, maxLen: 9 },
    { code: "+255", country: "Tanzania", flag: "🇹🇿", minLen: 9, maxLen: 9 },
    { code: "+256", country: "Uganda", flag: "🇺🇬", minLen: 9, maxLen: 9 },
    { code: "+263", country: "Zimbabwe", flag: "🇿🇼", minLen: 9, maxLen: 9 },
    { code: "+260", country: "Zambia", flag: "🇿🇲", minLen: 9, maxLen: 9 },
    { code: "+230", country: "Mauritius", flag: "🇲🇺", minLen: 8, maxLen: 8 },
    { code: "+225", country: "Ivory Coast", flag: "🇨🇮", minLen: 10, maxLen: 10 },
    { code: "+221", country: "Senegal", flag: "🇸🇳", minLen: 9, maxLen: 9 },
    { code: "+237", country: "Cameroon", flag: "🇨🇲", minLen: 9, maxLen: 9 },
    { code: "+243", country: "DR Congo", flag: "🇨🇩", minLen: 9, maxLen: 9 },
    { code: "+244", country: "Angola", flag: "🇦🇴", minLen: 9, maxLen: 9 },
    { code: "+258", country: "Mozambique", flag: "🇲🇿", minLen: 9, maxLen: 9 },
    { code: "+250", country: "Rwanda", flag: "🇷🇼", minLen: 9, maxLen: 9 },
    { code: "+257", country: "Burundi", flag: "🇧🇮", minLen: 8, maxLen: 8 },
    { code: "+267", country: "Botswana", flag: "🇧🇼", minLen: 8, maxLen: 8 },
    { code: "+264", country: "Namibia", flag: "🇳🇦", minLen: 9, maxLen: 9 },
    { code: "+266", country: "Lesotho", flag: "🇱🇸", minLen: 8, maxLen: 8 },
    { code: "+268", country: "Eswatini", flag: "🇸🇿", minLen: 8, maxLen: 8 },
    { code: "+261", country: "Madagascar", flag: "🇲🇬", minLen: 9, maxLen: 9 },
    { code: "+269", country: "Comoros", flag: "🇰🇲", minLen: 7, maxLen: 7 },
    { code: "+248", country: "Seychelles", flag: "🇸🇨", minLen: 7, maxLen: 7 },
    { code: "+252", country: "Somalia", flag: "🇸🇴", minLen: 9, maxLen: 9 },
    { code: "+253", country: "Djibouti", flag: "🇩🇯", minLen: 8, maxLen: 8 },
    { code: "+291", country: "Eritrea", flag: "🇪🇷", minLen: 7, maxLen: 7 },
    { code: "+211", country: "South Sudan", flag: "🇸🇸", minLen: 9, maxLen: 9 },
    { code: "+224", country: "Guinea", flag: "🇬🇳", minLen: 9, maxLen: 9 },
    { code: "+220", country: "Gambia", flag: "🇬🇲", minLen: 7, maxLen: 7 },
    { code: "+223", country: "Mali", flag: "🇲🇱", minLen: 8, maxLen: 8 },
    { code: "+226", country: "Burkina Faso", flag: "🇧🇫", minLen: 8, maxLen: 8 },
    { code: "+227", country: "Niger", flag: "🇳🇪", minLen: 8, maxLen: 8 },
    { code: "+228", country: "Togo", flag: "🇹🇬", minLen: 8, maxLen: 8 },
    { code: "+229", country: "Benin", flag: "🇧🇯", minLen: 8, maxLen: 8 },
    { code: "+231", country: "Liberia", flag: "🇱🇷", minLen: 8, maxLen: 9 },
    { code: "+232", country: "Sierra Leone", flag: "🇸🇱", minLen: 8, maxLen: 8 },
    { code: "+235", country: "Chad", flag: "🇹🇩", minLen: 8, maxLen: 8 },
    { code: "+236", country: "Central African Rep", flag: "🇨🇫", minLen: 8, maxLen: 8 },
    { code: "+238", country: "Cape Verde", flag: "🇨🇻", minLen: 7, maxLen: 7 },
    { code: "+239", country: "São Tomé", flag: "🇸🇹", minLen: 7, maxLen: 7 },
    { code: "+240", country: "Equatorial Guinea", flag: "🇬🇶", minLen: 9, maxLen: 9 },
    { code: "+241", country: "Gabon", flag: "🇬🇦", minLen: 8, maxLen: 8 },
    { code: "+242", country: "Congo", flag: "🇨🇬", minLen: 9, maxLen: 9 },
    { code: "+245", country: "Guinea-Bissau", flag: "🇬🇼", minLen: 9, maxLen: 9 },
    { code: "+246", country: "Diego Garcia", flag: "🇮🇴", minLen: 7, maxLen: 7 },
    { code: "+262", country: "Réunion", flag: "🇷🇪", minLen: 9, maxLen: 9 },
    { code: "+265", country: "Malawi", flag: "🇲🇼", minLen: 9, maxLen: 9 },
  ],
};

// Flat list for lookups - sorted by code length (longest first) to match longest code first
export const COUNTRY_CODES = Object.values(COUNTRY_CODES_BY_REGION)
  .flat()
  .sort((a, b) => b.code.length - a.code.length);

export type CountryCode = typeof COUNTRY_CODES[0];

// Get validation info for a phone number
export const getPhoneValidation = (phone: string): { isValid: boolean; message: string; country?: CountryCode } => {
  if (!phone || phone.length <= 5) return { isValid: false, message: "⚠️ This field is required." };
  
  // Find the matching country code (longest match first due to sorting)
  const countryCode = COUNTRY_CODES.find(c => phone.startsWith(c.code));
  if (!countryCode) return { isValid: false, message: "⚠️ Please enter a valid phone number including the full country code." };
  
  const localNumber = phone.replace(countryCode.code, '').replace(/\D/g, '');
  const digitCount = localNumber.length;
  
  if (digitCount < countryCode.minLen) {
    return { 
      isValid: false, 
      message: `⚠️ ${countryCode.country} numbers need ${countryCode.minLen === countryCode.maxLen ? countryCode.minLen : `${countryCode.minLen}-${countryCode.maxLen}`} digits (${digitCount} entered)`,
      country: countryCode
    };
  }
  
  if (digitCount > countryCode.maxLen) {
    return { 
      isValid: false, 
      message: `⚠️ ${countryCode.country} numbers have max ${countryCode.maxLen} digits`,
      country: countryCode
    };
  }
  
  return { isValid: true, message: "", country: countryCode };
};

// Format phone number for display (digits only, spaced)
export const formatLocalNumber = (value: string, maxLen: number = 10): string => {
  const digits = value.replace(/\D/g, '').slice(0, maxLen);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
};

export interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showValidation?: boolean;
  variant?: 'dark' | 'light';
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, placeholder, className, disabled = false, showValidation = true, variant = 'dark' }, ref) => {
    const [codeOpen, setCodeOpen] = useState(false);
    const [hasInitialized, setHasInitialized] = useState(false);
    
    // Detect and memoize the default country code
    const detectedCode = useMemo(() => detectCountryCode(), []);
    const detectedCountry = useMemo(
      () => COUNTRY_CODES.find(c => c.code === detectedCode) || COUNTRY_CODES[0],
      [detectedCode]
    );
    
    // Auto-set country code on mount if value is empty
    useEffect(() => {
      if (!hasInitialized && !value) {
        onChange(detectedCode);
        setHasInitialized(true);
      } else if (!hasInitialized) {
        setHasInitialized(true);
      }
    }, [hasInitialized, value, onChange, detectedCode]);
    
    // Extract country code and local number from value
    const currentCountry = COUNTRY_CODES.find(c => value?.startsWith(c.code)) || detectedCountry;
    const currentCode = currentCountry.code;
    const localNumber = value?.replace(currentCode, '').replace(/^\s+/, '') || '';
    const validation = getPhoneValidation(value || '');
    
    const handleCodeChange = (newCode: string) => {
      const newCountry = COUNTRY_CODES.find(c => c.code === newCode) || COUNTRY_CODES[0];
      const cleanLocal = localNumber.replace(/\D/g, '').slice(0, newCountry.maxLen);
      onChange(cleanLocal ? `${newCode} ${formatLocalNumber(cleanLocal, newCountry.maxLen)}` : newCode);
      setCodeOpen(false);
    };
    
    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/\D/g, '').slice(0, currentCountry.maxLen);
      const formatted = formatLocalNumber(digits, currentCountry.maxLen);
      onChange(digits ? `${currentCode} ${formatted}` : '');
    };

    // Theme-based styling - CHAMPAGNE gradient for light variant, GOLD borders
    const isLight = variant === 'light';
    const buttonStyles = isLight 
      ? "bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black hover:border-gold focus:border-gold"
      : "bg-zinc-900 border-2 border-gold/50 text-white hover:bg-zinc-800 hover:text-white hover:border-gold focus:border-gold";
    const inputStyles = isLight
      ? "bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black placeholder:text-zinc-500 focus:border-gold hover:border-gold"
      : "bg-zinc-900 border-2 border-gold/50 text-white placeholder:text-zinc-500 focus:border-gold hover:border-gold";
    const popoverStyles = isLight
      ? "bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/50"
      : "bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/50";
    const commandStyles = isLight
      ? "bg-transparent"
      : "bg-transparent";
    const commandInputStyles = isLight
      ? "text-black border-gold/40"
      : "text-black border-gold/40";
    const commandItemStyles = isLight
      ? "text-black hover:bg-gold/20 data-[selected=true]:bg-gold/30 data-[selected=true]:text-black"
      : "text-black hover:bg-gold/20 data-[selected=true]:bg-gold/30 data-[selected=true]:text-black";
    const commandEmptyStyles = isLight
      ? "text-zinc-600"
      : "text-zinc-600";
    const helperTextStyles = isLight
      ? "text-zinc-600"
      : "text-zinc-500";
    const countryNameStyles = isLight
      ? "text-gold font-medium"
      : "text-gold font-medium";

    return (
      <div className={cn("space-y-1.5 w-full", className)}>
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          {/* Country Code Selector - Responsive width */}
          <Popover open={codeOpen} onOpenChange={setCodeOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={codeOpen}
                disabled={disabled}
                className={cn("w-full sm:w-[160px] h-12 justify-between shrink-0", buttonStyles)}
              >
                <span className="flex items-center gap-2 truncate">
                  <span className="text-xl">{currentCountry.flag}</span>
                  <span className="font-medium">{currentCode}</span>
                </span>
                <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className={cn("w-[340px] p-0 z-[100]", popoverStyles)} 
              align="start"
              side="bottom"
              sideOffset={4}
              avoidCollisions={true}
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <Command className={commandStyles}>
                <CommandInput 
                  placeholder="Search country name or code..." 
                  className={cn("h-12 text-base", commandInputStyles)}
                />
                <CommandList className="max-h-[350px] overflow-y-auto overscroll-contain">
                  <CommandEmpty className={cn("text-sm py-6 text-center", commandEmptyStyles)}>
                    No country found. Try searching by name or code.
                  </CommandEmpty>
                  {Object.entries(COUNTRY_CODES_BY_REGION).map(([region, countries]) => (
                    <CommandGroup key={region} heading={region} className="text-gold text-xs font-semibold px-2 py-1">
                      {countries.map((country) => (
                        <CommandItem
                          key={`${country.code}-${country.country}`}
                          value={`${region} ${country.country} ${country.code} ${country.flag}`}
                          onSelect={() => handleCodeChange(country.code)}
                          className={cn("cursor-pointer py-2.5 px-2 rounded-md", commandItemStyles)}
                        >
                          <span className="flex items-center gap-3 w-full">
                            <span className="text-xl">{country.flag}</span>
                            <span className="font-semibold min-w-[65px]">{country.code}</span>
                            <span className={cn("text-sm truncate flex-1", countryNameStyles)}>{country.country}</span>
                          </span>
                          {currentCode === country.code && (
                            <CheckCircle className="h-5 w-5 text-gold ml-auto shrink-0" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          
          {/* Phone Number Input - Fills remaining space */}
          <div className="relative flex-1 w-full min-w-0">
            <Input 
              ref={ref}
              type="tel"
              value={localNumber}
              onChange={handleNumberChange}
              disabled={disabled}
              className={cn(
                "h-12 text-base pr-10 w-full pl-3",
                inputStyles,
                localNumber && validation.isValid && "border-green-500/50",
                localNumber && !validation.isValid && "border-amber-500/50"
              )}
              placeholder={placeholder || "Phone number"}
            />
            {showValidation && localNumber && validation.isValid && (
              <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
            )}
            {showValidation && localNumber && !validation.isValid && (
              <X className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-500" />
            )}
          </div>
        </div>
        {showValidation && localNumber && !validation.isValid && (
          <p className="text-amber-400 text-xs">{validation.message}</p>
        )}
        {!localNumber && (
          <p className={cn("text-xs", helperTextStyles)}>Select your country code, then enter your phone number</p>
        )}
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
