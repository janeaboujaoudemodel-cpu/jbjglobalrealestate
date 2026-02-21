// Countries, nationalities, languages, and cities data with flag emojis

export interface CountryData {
  name: string;
  code: string;
  flag: string;
  nationality: string;
  cities: string[];
}

export interface LanguageData {
  code: string;
  name: string;
  flag: string;
}

export const COUNTRIES: CountryData[] = [
  { name: "United Arab Emirates", code: "AE", flag: "🇦🇪", nationality: "Emirati", cities: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain", "Al Ain"] },
  { name: "United Kingdom", code: "GB", flag: "🇬🇧", nationality: "British", cities: ["London", "Manchester", "Birmingham", "Liverpool", "Edinburgh", "Glasgow", "Bristol", "Leeds"] },
  { name: "United States", code: "US", flag: "🇺🇸", nationality: "American", cities: ["New York", "Los Angeles", "Chicago", "Houston", "Miami", "San Francisco", "Seattle", "Boston"] },
  { name: "India", code: "IN", flag: "🇮🇳", nationality: "Indian", cities: ["Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad", "Kolkata", "Pune", "Ahmedabad"] },
  { name: "Pakistan", code: "PK", flag: "🇵🇰", nationality: "Pakistani", cities: ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Peshawar", "Multan"] },
  { name: "Saudi Arabia", code: "SA", flag: "🇸🇦", nationality: "Saudi", cities: ["Riyadh", "Jeddah", "Makkah", "Madinah", "Dammam", "Khobar", "Dhahran"] },
  { name: "Russia", code: "RU", flag: "🇷🇺", nationality: "Russian", cities: ["Moscow", "Saint Petersburg", "Kazan", "Sochi", "Novosibirsk", "Yekaterinburg"] },
  { name: "China", code: "CN", flag: "🇨🇳", nationality: "Chinese", cities: ["Beijing", "Shanghai", "Guangzhou", "Shenzhen", "Chengdu", "Hangzhou", "Wuhan"] },
  { name: "France", code: "FR", flag: "🇫🇷", nationality: "French", cities: ["Paris", "Lyon", "Marseille", "Nice", "Bordeaux", "Toulouse", "Strasbourg"] },
  { name: "Germany", code: "DE", flag: "🇩🇪", nationality: "German", cities: ["Berlin", "Munich", "Frankfurt", "Hamburg", "Düsseldorf", "Cologne", "Stuttgart"] },
  { name: "Italy", code: "IT", flag: "🇮🇹", nationality: "Italian", cities: ["Rome", "Milan", "Florence", "Naples", "Venice", "Turin", "Bologna"] },
  { name: "Spain", code: "ES", flag: "🇪🇸", nationality: "Spanish", cities: ["Madrid", "Barcelona", "Valencia", "Seville", "Málaga", "Bilbao"] },
  { name: "Canada", code: "CA", flag: "🇨🇦", nationality: "Canadian", cities: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa", "Edmonton"] },
  { name: "Australia", code: "AU", flag: "🇦🇺", nationality: "Australian", cities: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast"] },
  { name: "Japan", code: "JP", flag: "🇯🇵", nationality: "Japanese", cities: ["Tokyo", "Osaka", "Kyoto", "Yokohama", "Nagoya", "Sapporo"] },
  { name: "South Korea", code: "KR", flag: "🇰🇷", nationality: "South Korean", cities: ["Seoul", "Busan", "Incheon", "Daegu", "Daejeon"] },
  { name: "Egypt", code: "EG", flag: "🇪🇬", nationality: "Egyptian", cities: ["Cairo", "Alexandria", "Giza", "Sharm El Sheikh", "Hurghada", "Luxor"] },
  { name: "Lebanon", code: "LB", flag: "🇱🇧", nationality: "Lebanese", cities: ["Beirut", "Tripoli", "Sidon", "Jounieh", "Baalbek"] },
  { name: "Jordan", code: "JO", flag: "🇯🇴", nationality: "Jordanian", cities: ["Amman", "Aqaba", "Irbid", "Zarqa", "Jerash"] },
  { name: "Iraq", code: "IQ", flag: "🇮🇶", nationality: "Iraqi", cities: ["Baghdad", "Erbil", "Basra", "Sulaymaniyah", "Mosul"] },
  { name: "Kuwait", code: "KW", flag: "🇰🇼", nationality: "Kuwaiti", cities: ["Kuwait City", "Hawalli", "Salmiya", "Jahra"] },
  { name: "Qatar", code: "QA", flag: "🇶🇦", nationality: "Qatari", cities: ["Doha", "Al Wakrah", "Al Khor", "Lusail"] },
  { name: "Bahrain", code: "BH", flag: "🇧🇭", nationality: "Bahraini", cities: ["Manama", "Muharraq", "Riffa", "Hamad Town"] },
  { name: "Oman", code: "OM", flag: "🇴🇲", nationality: "Omani", cities: ["Muscat", "Salalah", "Sohar", "Nizwa", "Sur"] },
  { name: "Iran", code: "IR", flag: "🇮🇷", nationality: "Iranian", cities: ["Tehran", "Isfahan", "Shiraz", "Tabriz", "Mashhad"] },
  { name: "Turkey", code: "TR", flag: "🇹🇷", nationality: "Turkish", cities: ["Istanbul", "Ankara", "Antalya", "Izmir", "Bursa"] },
  { name: "Nigeria", code: "NG", flag: "🇳🇬", nationality: "Nigerian", cities: ["Lagos", "Abuja", "Port Harcourt", "Kano", "Ibadan"] },
  { name: "South Africa", code: "ZA", flag: "🇿🇦", nationality: "South African", cities: ["Johannesburg", "Cape Town", "Durban", "Pretoria"] },
  { name: "Kenya", code: "KE", flag: "🇰🇪", nationality: "Kenyan", cities: ["Nairobi", "Mombasa", "Kisumu", "Nakuru"] },
  { name: "Brazil", code: "BR", flag: "🇧🇷", nationality: "Brazilian", cities: ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Belo Horizonte"] },
  { name: "Mexico", code: "MX", flag: "🇲🇽", nationality: "Mexican", cities: ["Mexico City", "Guadalajara", "Monterrey", "Cancún", "Puebla"] },
  { name: "Philippines", code: "PH", flag: "🇵🇭", nationality: "Filipino", cities: ["Manila", "Quezon City", "Cebu", "Davao", "Makati"] },
  { name: "Bangladesh", code: "BD", flag: "🇧🇩", nationality: "Bangladeshi", cities: ["Dhaka", "Chittagong", "Sylhet", "Khulna"] },
  { name: "Sri Lanka", code: "LK", flag: "🇱🇰", nationality: "Sri Lankan", cities: ["Colombo", "Kandy", "Galle", "Jaffna"] },
  { name: "Nepal", code: "NP", flag: "🇳🇵", nationality: "Nepalese", cities: ["Kathmandu", "Pokhara", "Lalitpur", "Biratnagar"] },
  { name: "Malaysia", code: "MY", flag: "🇲🇾", nationality: "Malaysian", cities: ["Kuala Lumpur", "Penang", "Johor Bahru", "Kota Kinabalu"] },
  { name: "Singapore", code: "SG", flag: "🇸🇬", nationality: "Singaporean", cities: ["Singapore"] },
  { name: "Indonesia", code: "ID", flag: "🇮🇩", nationality: "Indonesian", cities: ["Jakarta", "Bali", "Surabaya", "Bandung", "Medan"] },
  { name: "Thailand", code: "TH", flag: "🇹🇭", nationality: "Thai", cities: ["Bangkok", "Chiang Mai", "Phuket", "Pattaya"] },
  { name: "Vietnam", code: "VN", flag: "🇻🇳", nationality: "Vietnamese", cities: ["Ho Chi Minh City", "Hanoi", "Da Nang", "Nha Trang"] },
  { name: "Morocco", code: "MA", flag: "🇲🇦", nationality: "Moroccan", cities: ["Casablanca", "Marrakech", "Rabat", "Tangier", "Fez"] },
  { name: "Tunisia", code: "TN", flag: "🇹🇳", nationality: "Tunisian", cities: ["Tunis", "Sfax", "Sousse", "Hammamet"] },
  { name: "Algeria", code: "DZ", flag: "🇩🇿", nationality: "Algerian", cities: ["Algiers", "Oran", "Constantine", "Annaba"] },
  { name: "Syria", code: "SY", flag: "🇸🇾", nationality: "Syrian", cities: ["Damascus", "Aleppo", "Homs", "Latakia"] },
  { name: "Palestine", code: "PS", flag: "🇵🇸", nationality: "Palestinian", cities: ["Jerusalem", "Ramallah", "Gaza", "Bethlehem", "Nablus"] },
  { name: "Yemen", code: "YE", flag: "🇾🇪", nationality: "Yemeni", cities: ["Sana'a", "Aden", "Taiz", "Hodeidah"] },
  { name: "Libya", code: "LY", flag: "🇱🇾", nationality: "Libyan", cities: ["Tripoli", "Benghazi", "Misrata"] },
  { name: "Sudan", code: "SD", flag: "🇸🇩", nationality: "Sudanese", cities: ["Khartoum", "Omdurman", "Port Sudan"] },
  { name: "Afghanistan", code: "AF", flag: "🇦🇫", nationality: "Afghan", cities: ["Kabul", "Herat", "Mazar-i-Sharif", "Kandahar"] },
  { name: "Uzbekistan", code: "UZ", flag: "🇺🇿", nationality: "Uzbek", cities: ["Tashkent", "Samarkand", "Bukhara"] },
  { name: "Kazakhstan", code: "KZ", flag: "🇰🇿", nationality: "Kazakh", cities: ["Almaty", "Astana", "Shymkent"] },
  { name: "Ukraine", code: "UA", flag: "🇺🇦", nationality: "Ukrainian", cities: ["Kyiv", "Lviv", "Odesa", "Kharkiv"] },
  { name: "Poland", code: "PL", flag: "🇵🇱", nationality: "Polish", cities: ["Warsaw", "Kraków", "Wrocław", "Gdańsk"] },
  { name: "Netherlands", code: "NL", flag: "🇳🇱", nationality: "Dutch", cities: ["Amsterdam", "Rotterdam", "The Hague", "Utrecht"] },
  { name: "Belgium", code: "BE", flag: "🇧🇪", nationality: "Belgian", cities: ["Brussels", "Antwerp", "Ghent", "Bruges"] },
  { name: "Switzerland", code: "CH", flag: "🇨🇭", nationality: "Swiss", cities: ["Zurich", "Geneva", "Basel", "Bern", "Lausanne"] },
  { name: "Austria", code: "AT", flag: "🇦🇹", nationality: "Austrian", cities: ["Vienna", "Salzburg", "Innsbruck", "Graz"] },
  { name: "Sweden", code: "SE", flag: "🇸🇪", nationality: "Swedish", cities: ["Stockholm", "Gothenburg", "Malmö", "Uppsala"] },
  { name: "Norway", code: "NO", flag: "🇳🇴", nationality: "Norwegian", cities: ["Oslo", "Bergen", "Trondheim", "Stavanger"] },
  { name: "Denmark", code: "DK", flag: "🇩🇰", nationality: "Danish", cities: ["Copenhagen", "Aarhus", "Odense"] },
  { name: "Finland", code: "FI", flag: "🇫🇮", nationality: "Finnish", cities: ["Helsinki", "Tampere", "Turku", "Espoo"] },
  { name: "Portugal", code: "PT", flag: "🇵🇹", nationality: "Portuguese", cities: ["Lisbon", "Porto", "Faro", "Braga"] },
  { name: "Greece", code: "GR", flag: "🇬🇷", nationality: "Greek", cities: ["Athens", "Thessaloniki", "Patras", "Heraklion"] },
  { name: "Ireland", code: "IE", flag: "🇮🇪", nationality: "Irish", cities: ["Dublin", "Cork", "Galway", "Limerick"] },
  { name: "New Zealand", code: "NZ", flag: "🇳🇿", nationality: "New Zealander", cities: ["Auckland", "Wellington", "Christchurch", "Queenstown"] },
  { name: "Argentina", code: "AR", flag: "🇦🇷", nationality: "Argentine", cities: ["Buenos Aires", "Córdoba", "Rosario", "Mendoza"] },
  { name: "Colombia", code: "CO", flag: "🇨🇴", nationality: "Colombian", cities: ["Bogotá", "Medellín", "Cali", "Cartagena"] },
  { name: "Ghana", code: "GH", flag: "🇬🇭", nationality: "Ghanaian", cities: ["Accra", "Kumasi", "Tamale", "Tema"] },
  { name: "Ethiopia", code: "ET", flag: "🇪🇹", nationality: "Ethiopian", cities: ["Addis Ababa", "Dire Dawa", "Mekelle"] },
  { name: "Tanzania", code: "TZ", flag: "🇹🇿", nationality: "Tanzanian", cities: ["Dar es Salaam", "Dodoma", "Zanzibar", "Arusha"] },
  { name: "Uganda", code: "UG", flag: "🇺🇬", nationality: "Ugandan", cities: ["Kampala", "Entebbe", "Jinja"] },
  { name: "Rwanda", code: "RW", flag: "🇷🇼", nationality: "Rwandan", cities: ["Kigali", "Butare", "Gisenyi"] },
  { name: "Mauritius", code: "MU", flag: "🇲🇺", nationality: "Mauritian", cities: ["Port Louis", "Curepipe", "Quatre Bornes"] },
  { name: "Maldives", code: "MV", flag: "🇲🇻", nationality: "Maldivian", cities: ["Malé", "Addu City", "Fuvahmulah"] },
  { name: "Georgia", code: "GE", flag: "🇬🇪", nationality: "Georgian", cities: ["Tbilisi", "Batumi", "Kutaisi"] },
  { name: "Azerbaijan", code: "AZ", flag: "🇦🇿", nationality: "Azerbaijani", cities: ["Baku", "Ganja", "Sumqayit"] },
  { name: "Armenia", code: "AM", flag: "🇦🇲", nationality: "Armenian", cities: ["Yerevan", "Gyumri", "Vanadzor"] },
  { name: "Czech Republic", code: "CZ", flag: "🇨🇿", nationality: "Czech", cities: ["Prague", "Brno", "Ostrava"] },
  { name: "Romania", code: "RO", flag: "🇷🇴", nationality: "Romanian", cities: ["Bucharest", "Cluj-Napoca", "Timișoara"] },
  { name: "Hungary", code: "HU", flag: "🇭🇺", nationality: "Hungarian", cities: ["Budapest", "Debrecen", "Szeged"] },
  { name: "Serbia", code: "RS", flag: "🇷🇸", nationality: "Serbian", cities: ["Belgrade", "Novi Sad", "Niš"] },
  { name: "Croatia", code: "HR", flag: "🇭🇷", nationality: "Croatian", cities: ["Zagreb", "Split", "Dubrovnik", "Rijeka"] },
  { name: "Bulgaria", code: "BG", flag: "🇧🇬", nationality: "Bulgarian", cities: ["Sofia", "Plovdiv", "Varna"] },
  { name: "Somalia", code: "SO", flag: "🇸🇴", nationality: "Somali", cities: ["Mogadishu", "Hargeisa", "Kismayo"] },
  { name: "Eritrea", code: "ER", flag: "🇪🇷", nationality: "Eritrean", cities: ["Asmara", "Keren", "Massawa"] },
  { name: "Djibouti", code: "DJ", flag: "🇩🇯", nationality: "Djiboutian", cities: ["Djibouti City", "Ali Sabieh"] },
  { name: "Comoros", code: "KM", flag: "🇰🇲", nationality: "Comorian", cities: ["Moroni", "Mutsamudu"] },
  { name: "Seychelles", code: "SC", flag: "🇸🇨", nationality: "Seychellois", cities: ["Victoria", "Anse Royale"] },
  { name: "Monaco", code: "MC", flag: "🇲🇨", nationality: "Monégasque", cities: ["Monaco", "Monte Carlo"] },
  { name: "Luxembourg", code: "LU", flag: "🇱🇺", nationality: "Luxembourgish", cities: ["Luxembourg City", "Esch-sur-Alzette"] },
];

export const LANGUAGES_WITH_FLAGS: LanguageData[] = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fa", name: "Farsi", flag: "🇮🇷" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "tr", name: "Turkish", flag: "🇹🇷" },
  { code: "ur", name: "Urdu", flag: "🇵🇰" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "nl", name: "Dutch", flag: "🇳🇱" },
  { code: "pl", name: "Polish", flag: "🇵🇱" },
  { code: "uk", name: "Ukrainian", flag: "🇺🇦" },
  { code: "sv", name: "Swedish", flag: "🇸🇪" },
  { code: "th", name: "Thai", flag: "🇹🇭" },
  { code: "vi", name: "Vietnamese", flag: "🇻🇳" },
  { code: "id", name: "Indonesian", flag: "🇮🇩" },
  { code: "ms", name: "Malay", flag: "🇲🇾" },
  { code: "tl", name: "Filipino", flag: "🇵🇭" },
  { code: "bn", name: "Bengali", flag: "🇧🇩" },
  { code: "sw", name: "Swahili", flag: "🇰🇪" },
  { code: "am", name: "Amharic", flag: "🇪🇹" },
  { code: "so", name: "Somali", flag: "🇸🇴" },
  { code: "he", name: "Hebrew", flag: "🇮🇱" },
  { code: "el", name: "Greek", flag: "🇬🇷" },
  { code: "ro", name: "Romanian", flag: "🇷🇴" },
  { code: "hu", name: "Hungarian", flag: "🇭🇺" },
  { code: "cs", name: "Czech", flag: "🇨🇿" },
];

// Helper to get all nationalities sorted
export const ALL_NATIONALITIES = COUNTRIES
  .map(c => ({ nationality: c.nationality, flag: c.flag, country: c.name }))
  .sort((a, b) => a.nationality.localeCompare(b.nationality));

// Helper to get cities for a country
export const getCitiesForCountry = (countryName: string): string[] => {
  const country = COUNTRIES.find(c => c.name === countryName);
  return country?.cities || [];
};
