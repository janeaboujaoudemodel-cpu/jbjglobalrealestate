export type CrmCategory =
  | "investor" | "buyer" | "seller" | "broker" | "developer"
  | "landlord" | "tenant" | "partner" | "service_provider" | "media" | "other";

export const CATEGORIES: { value: CrmCategory; label: string; description: string }[] = [
  { value: "investor", label: "Investor", description: "Grow capital across UAE real estate" },
  { value: "buyer", label: "Property Buyer", description: "Find your next home or investment" },
  { value: "seller", label: "Property Seller", description: "Sell or list your property" },
  { value: "broker", label: "Broker / Agency", description: "Represent buyers, sellers or tenants" },
  { value: "developer", label: "Developer", description: "Bring projects to the market" },
  { value: "landlord", label: "Landlord", description: "Manage & lease your portfolio" },
  { value: "tenant", label: "Tenant", description: "Rent a home or office" },
  { value: "partner", label: "Partner", description: "Institutional & channel partnerships" },
  { value: "service_provider", label: "Service Provider", description: "Legal, finance, design, moving…" },
  { value: "media", label: "Media / Press", description: "Editorial & press access" },
  { value: "other", label: "Other", description: "Tell us how we can help" },
];

export const DEVELOPER_POSITIONS = [
  "Chairman","Vice Chairman","CEO","COO","CFO","CMO","Managing Director",
  "Executive Director","VP","AVP","Head of Sales","Sales Director","Sales Manager",
  "Relationship Manager","Channel Partner Manager","Business Development Manager",
  "Marketing Manager","HR","Finance","Legal","CRM","Admin","Executive Assistant",
  "Personal Assistant","Customer Service","Other",
];

export const BROKER_POSITIONS = [
  "Founder","Owner","Chairman","CEO","General Manager","Sales Director","Team Leader",
  "Senior Property Consultant","Property Consultant","Leasing Consultant",
  "Off-Plan Specialist","Secondary Specialist","Marketing","HR","Admin","Other",
];

export const SERVICES = [
  "Buy Property","Sell Property","Rent Property","List My Property",
  "Off-Plan Projects","Property Management","Investment Advisory",
  "Golden Visa","Mortgage Support","Interior Design","Company Setup",
];

export const LANGUAGES = ["English","Arabic","French","Russian","Hindi","Chinese","Spanish","Other"];
export const CONTACT_METHODS = ["WhatsApp","Phone Call","Email","In-Person Meeting"];
export const CONTACT_TIMES = ["Morning (9am-12pm)","Afternoon (12pm-5pm)","Evening (5pm-9pm)","Any Time"];

export const INVESTMENT_INTERESTS = [
  "Off Plan","Ready","Residential","Commercial","Luxury","Holiday Homes",
  "Land","Hotel","Mixed Use",
];
export const INVESTMENT_TIMELINE = [
  "Immediately","Within 30 Days","1–3 Months","3–6 Months","Just Exploring",
];
export const SELLING_TIMELINE = [
  "Immediately","Within 30 Days","Within 3 Months","Just Checking the Market",
];
export const BUYING_FOR = ["Personal Use","Investment","Family","Holiday Home"];
export const READY_OFF_PLAN = ["Ready","Off-Plan","Either"];
export const CASH_MORTGAGE = ["Cash","Mortgage","Either"];
export const BEDROOMS = ["Studio","1","2","3","4","5+"];
export const PROPERTY_TYPES = ["Apartment","Villa","Townhouse","Penthouse","Land","Commercial","Hotel Apartment"];

export const BUDGET_RANGES = [
  "Under 1M AED","1M – 3M AED","3M – 5M AED","5M – 10M AED",
  "10M – 25M AED","25M – 50M AED","50M+ AED",
];

export const DUBAI_COMMUNITIES = [
  "Downtown Dubai","Dubai Marina","Palm Jumeirah","Business Bay","JVC","JLT",
  "Arabian Ranches","Emirates Hills","Dubai Hills Estate","MBR City","Damac Hills",
  "Dubai Creek Harbour","Bluewaters","City Walk","DIFC","Al Barsha","The Meadows",
  "The Springs","Jumeirah Golf Estates","Tilal Al Ghaf","Dubai South","Al Furjan",
];
