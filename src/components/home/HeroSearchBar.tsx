/**
 * HeroSearchBar Component - Premium Single-Line Search Bar
 * - Buy/Rent as dropdown box (matching AED/sqft style)
 * - Single dropdown for Currency selection
 * - Single dropdown for Area unit selection
 * - Emirates filter in advanced filters
 * - Comprehensive filters with all property types, developer, community, etc.
 */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, ChevronDown, SlidersHorizontal, Sparkles, DollarSign, Ruler, Home, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDevelopers, useCommunities } from "@/hooks/useProjects";
import { cn } from "@/lib/utils";

// Bedroom options - now up to 7+
const bedroomOptions = [
  { value: "any", label: "Any" },
  { value: "studio", label: "Studio" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6", label: "6" },
  { value: "7+", label: "7+" },
];

// All supported currencies - unified across the platform
export const SUPPORTED_CURRENCIES = [
  { code: 'AED', label: 'AED', flag: '🇦🇪', symbol: 'AED' },
  { code: 'USD', label: 'USD', flag: '🇺🇸', symbol: '$' },
  { code: 'EUR', label: 'EUR', flag: '🇪🇺', symbol: '€' },
  { code: 'GBP', label: 'GBP', flag: '🇬🇧', symbol: '£' },
  { code: 'INR', label: 'INR', flag: '🇮🇳', symbol: '₹' },
  { code: 'SAR', label: 'SAR', flag: '🇸🇦', symbol: 'SAR' },
  { code: 'CNY', label: 'CNY', flag: '🇨🇳', symbol: '¥' },
  { code: 'RUB', label: 'RUB', flag: '🇷🇺', symbol: '₽' },
  { code: 'CAD', label: 'CAD', flag: '🇨🇦', symbol: 'C$' },
  { code: 'AUD', label: 'AUD', flag: '🇦🇺', symbol: 'A$' },
] as const;

export type CurrencyCode = typeof SUPPORTED_CURRENCIES[number]['code'];

// Expanded property types including commercial
export const PROPERTY_TYPES = [
  { value: "all", label: "All Types" },
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "townhouse", label: "Townhouse" },
  { value: "penthouse", label: "Penthouse" },
  { value: "mansion", label: "Mansion" },
  { value: "duplex", label: "Duplex" },
  { value: "studio", label: "Studio" },
  { value: "plot", label: "Plot / Land" },
  { value: "commercial", label: "Commercial" },
  { value: "retail", label: "Retail" },
  { value: "office", label: "Office" },
];

// Property status options (Ready / Off-Plan)
const PROPERTY_STATUS = [
  { value: "all", label: "All Status" },
  { value: "ready", label: "Ready" },
  { value: "off-plan", label: "Off-Plan" },
];

// Sale status options with color-coded dots
const SALE_STATUS_OPTIONS = [
  { value: "all", label: "All Sale Statuses", color: "" },
  { value: "Announced", label: "Announced", color: "bg-pink-500" },
  { value: "Presale (EOI)", label: "Presale (EOI)", color: "bg-emerald-500" },
  { value: "Start of Sales", label: "Start of Sales", color: "bg-yellow-500" },
  { value: "On Sale", label: "On Sale", color: "bg-blue-500" },
  { value: "Sold Out", label: "Sold Out", color: "bg-red-500" },
];

// UAE Emirates + International priority countries
const UAE_EMIRATES = [
  { value: "all", label: "All Locations" },
  { value: "Dubai", label: "Dubai" },
  { value: "Abu Dhabi", label: "Abu Dhabi" },
  { value: "Sharjah", label: "Sharjah" },
  { value: "Ras Al Khaimah", label: "Ras Al Khaimah" },
  { value: "Ajman", label: "Ajman" },
  { value: "Fujairah", label: "Fujairah" },
  { value: "Umm Al Quwain", label: "Umm Al Quwain" },
  // International priority countries
  { value: "Cyprus", label: "Cyprus" },
  { value: "Indonesia", label: "Indonesia" },
  { value: "Oman", label: "Oman" },
  { value: "Thailand", label: "Thailand" },
];

// Sort options - Premium labels
const SORT_OPTIONS = [
  { value: "newest", label: "Recently Added" },
  { value: "oldest", label: "First Listed" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "size-large", label: "Size: Largest First" },
  { value: "size-small", label: "Size: Smallest First" },
];

// Comprehensive UAE Developer List - All major developers
export const UAE_DEVELOPERS = [
  // Tier 1 - Elite
  { id: "emaar", name: "Emaar Properties" },
  { id: "nakheel", name: "Nakheel" },
  { id: "damac", name: "DAMAC Properties" },
  { id: "sobha", name: "Sobha Realty" },
  { id: "meraas", name: "Meraas" },
  { id: "aldar", name: "Aldar Properties" },
  { id: "omniyat", name: "Omniyat" },
  // Tier 2 - Premium
  { id: "ellington", name: "Ellington Properties" },
  { id: "select-group", name: "Select Group" },
  { id: "dubai-properties", name: "Dubai Properties" },
  { id: "wasl", name: "Wasl" },
  // Tier 3 - Top Tier
  { id: "binghatti", name: "Binghatti Developers" },
  { id: "majid-al-futtaim", name: "Majid Al Futtaim" },
  { id: "deyaar", name: "Deyaar Development" },
  { id: "dubai-holding", name: "Dubai Holding" },
  // Tier 4 - Established
  { id: "danube", name: "Danube Properties" },
  { id: "azizi", name: "Azizi Developments" },
  { id: "samana", name: "Samana Developers" },
  { id: "reportage", name: "Reportage Properties" },
  { id: "vincitore", name: "Vincitore" },
  // Additional Major Developers
  { id: "object-one", name: "Object One" },
  { id: "tiger", name: "Tiger Group" },
  { id: "seven-tides", name: "Seven Tides" },
  { id: "imtiaz", name: "Imtiaz Developments" },
  { id: "mag", name: "MAG Property Development" },
  { id: "bloom", name: "Bloom Holding" },
  { id: "meydan", name: "Meydan Group" },
  { id: "arada", name: "Arada" },
  { id: "eagle-hills", name: "Eagle Hills" },
  { id: "esnaad", name: "Esnaad" },
  { id: "rak-properties", name: "RAK Properties" },
  { id: "sharjah-holding", name: "Sharjah Holding" },
  { id: "aljada", name: "Aljada" },
  { id: "tilal", name: "Tilal Properties" },
  { id: "palace", name: "Palace Group" },
  { id: "prestige", name: "Prestige One" },
  { id: "iman", name: "Iman Developers" },
  { id: "oasis", name: "Oasis Real Estate" },
  { id: "bayanat", name: "Bayanat Properties" },
  { id: "h&h", name: "H&H Development" },
  { id: "object-one", name: "Object One" },
  { id: "dar-al-arkan", name: "Dar Al Arkan" },
  { id: "first-group", name: "First Group" },
  { id: "cayan", name: "Cayan Group" },
  { id: "dubai-investments", name: "Dubai Investments" },
  { id: "oia", name: "OIA" },
  { id: "range-international", name: "Range International" },
  { id: "serenity", name: "Serenity Developers" },
  { id: "fam", name: "FAM Properties" },
  { id: "aark", name: "AARK Developers" },
  { id: "dhg", name: "Dubai Hills Group" },
  { id: "sobha-hartland", name: "Sobha Hartland" },
  { id: "district-one", name: "District One" },
  { id: "mina-rashid", name: "Mina Rashid" },
  { id: "jvc", name: "JVC Properties" },
  { id: "haven", name: "Haven Real Estate" },
  { id: "ipa", name: "IPA Properties" },
  { id: "noble", name: "Noble International" },
  { id: "luxe", name: "Luxe Developers" },
  { id: "dhabi", name: "Dhabi Group" },
  { id: "al-habtoor", name: "Al Habtoor Group" },
  { id: "burj-jumeirah", name: "Burj Jumeirah" },
  { id: "aqua", name: "Aqua Properties" },
  { id: "koa", name: "KOA" },
  { id: "aston-martini", name: "Aston Martin Residences" },
];

const priceRanges = {
  buy: {
    AED: [
      { value: "any", label: "Any Price" },
      { value: "0-1000000", label: "Under 1M" },
      { value: "1000000-2000000", label: "1M - 2M" },
      { value: "2000000-5000000", label: "2M - 5M" },
      { value: "5000000-10000000", label: "5M - 10M" },
      { value: "10000000+", label: "10M+" },
    ],
    USD: [
      { value: "any", label: "Any Price" },
      { value: "0-275000", label: "Under $275K" },
      { value: "275000-550000", label: "$275K - $550K" },
      { value: "550000-1400000", label: "$550K - $1.4M" },
      { value: "1400000-2750000", label: "$1.4M - $2.75M" },
      { value: "2750000+", label: "$2.75M+" },
    ],
    EUR: [
      { value: "any", label: "Any Price" },
      { value: "0-250000", label: "Under €250K" },
      { value: "250000-500000", label: "€250K - €500K" },
      { value: "500000-1250000", label: "€500K - €1.25M" },
      { value: "1250000-2500000", label: "€1.25M - €2.5M" },
      { value: "2500000+", label: "€2.5M+" },
    ],
    GBP: [
      { value: "any", label: "Any Price" },
      { value: "0-220000", label: "Under £220K" },
      { value: "220000-440000", label: "£220K - £440K" },
      { value: "440000-1100000", label: "£440K - £1.1M" },
      { value: "1100000-2200000", label: "£1.1M - £2.2M" },
      { value: "2200000+", label: "£2.2M+" },
    ],
    INR: [
      { value: "any", label: "Any Price" },
      { value: "0-23000000", label: "Under ₹2.3Cr" },
      { value: "23000000-46000000", label: "₹2.3Cr - ₹4.6Cr" },
      { value: "46000000-115000000", label: "₹4.6Cr - ₹11.5Cr" },
      { value: "115000000-230000000", label: "₹11.5Cr - ₹23Cr" },
      { value: "230000000+", label: "₹23Cr+" },
    ],
    SAR: [
      { value: "any", label: "Any Price" },
      { value: "0-1020000", label: "Under 1M SAR" },
      { value: "1020000-2040000", label: "1M - 2M SAR" },
      { value: "2040000-5100000", label: "2M - 5M SAR" },
      { value: "5100000-10200000", label: "5M - 10M SAR" },
      { value: "10200000+", label: "10M+ SAR" },
    ],
    CNY: [
      { value: "any", label: "Any Price" },
      { value: "0-2000000", label: "Under ¥200万" },
      { value: "2000000-4000000", label: "¥200万 - ¥400万" },
      { value: "4000000-10000000", label: "¥400万 - ¥1000万" },
      { value: "10000000-20000000", label: "¥1000万 - ¥2000万" },
      { value: "20000000+", label: "¥2000万+" },
    ],
    RUB: [
      { value: "any", label: "Any Price" },
      { value: "0-25000000", label: "Under 25M ₽" },
      { value: "25000000-50000000", label: "25M - 50M ₽" },
      { value: "50000000-125000000", label: "50M - 125M ₽" },
      { value: "125000000-250000000", label: "125M - 250M ₽" },
      { value: "250000000+", label: "250M+ ₽" },
    ],
    CAD: [
      { value: "any", label: "Any Price" },
      { value: "0-375000", label: "Under $375K CAD" },
      { value: "375000-750000", label: "$375K - $750K CAD" },
      { value: "750000-1875000", label: "$750K - $1.875M CAD" },
      { value: "1875000-3750000", label: "$1.875M - $3.75M CAD" },
      { value: "3750000+", label: "$3.75M+ CAD" },
    ],
    AUD: [
      { value: "any", label: "Any Price" },
      { value: "0-420000", label: "Under $420K AUD" },
      { value: "420000-840000", label: "$420K - $840K AUD" },
      { value: "840000-2100000", label: "$840K - $2.1M AUD" },
      { value: "2100000-4200000", label: "$2.1M - $4.2M AUD" },
      { value: "4200000+", label: "$4.2M+ AUD" },
    ],
  },
  rent: {
    AED: [
      { value: "any", label: "Any Price" },
      { value: "0-50000", label: "Under 50K" },
      { value: "50000-100000", label: "50K - 100K" },
      { value: "100000-200000", label: "100K - 200K" },
      { value: "200000-500000", label: "200K - 500K" },
      { value: "500000+", label: "500K+" },
    ],
    USD: [
      { value: "any", label: "Any Price" },
      { value: "0-14000", label: "Under $14K" },
      { value: "14000-27000", label: "$14K - $27K" },
      { value: "27000-55000", label: "$27K - $55K" },
      { value: "55000-136000", label: "$55K - $136K" },
      { value: "136000+", label: "$136K+" },
    ],
    EUR: [
      { value: "any", label: "Any Price" },
      { value: "0-12500", label: "Under €12.5K" },
      { value: "12500-25000", label: "€12.5K - €25K" },
      { value: "25000-50000", label: "€25K - €50K" },
      { value: "50000-125000", label: "€50K - €125K" },
      { value: "125000+", label: "€125K+" },
    ],
    GBP: [
      { value: "any", label: "Any Price" },
      { value: "0-11000", label: "Under £11K" },
      { value: "11000-22000", label: "£11K - £22K" },
      { value: "22000-44000", label: "£22K - £44K" },
      { value: "44000-110000", label: "£44K - £110K" },
      { value: "110000+", label: "£110K+" },
    ],
    INR: [
      { value: "any", label: "Any Price" },
      { value: "0-1150000", label: "Under ₹11.5L" },
      { value: "1150000-2300000", label: "₹11.5L - ₹23L" },
      { value: "2300000-4600000", label: "₹23L - ₹46L" },
      { value: "4600000-11500000", label: "₹46L - ₹1.15Cr" },
      { value: "11500000+", label: "₹1.15Cr+" },
    ],
    SAR: [
      { value: "any", label: "Any Price" },
      { value: "0-51000", label: "Under 51K SAR" },
      { value: "51000-102000", label: "51K - 102K SAR" },
      { value: "102000-204000", label: "102K - 204K SAR" },
      { value: "204000-510000", label: "204K - 510K SAR" },
      { value: "510000+", label: "510K+ SAR" },
    ],
    CNY: [
      { value: "any", label: "Any Price" },
      { value: "0-100000", label: "Under ¥10万" },
      { value: "100000-200000", label: "¥10万 - ¥20万" },
      { value: "200000-400000", label: "¥20万 - ¥40万" },
      { value: "400000-1000000", label: "¥40万 - ¥100万" },
      { value: "1000000+", label: "¥100万+" },
    ],
    RUB: [
      { value: "any", label: "Any Price" },
      { value: "0-1250000", label: "Under 1.25M ₽" },
      { value: "1250000-2500000", label: "1.25M - 2.5M ₽" },
      { value: "2500000-5000000", label: "2.5M - 5M ₽" },
      { value: "5000000-12500000", label: "5M - 12.5M ₽" },
      { value: "12500000+", label: "12.5M+ ₽" },
    ],
    CAD: [
      { value: "any", label: "Any Price" },
      { value: "0-19000", label: "Under $19K CAD" },
      { value: "19000-38000", label: "$19K - $38K CAD" },
      { value: "38000-75000", label: "$38K - $75K CAD" },
      { value: "75000-188000", label: "$75K - $188K CAD" },
      { value: "188000+", label: "$188K+ CAD" },
    ],
    AUD: [
      { value: "any", label: "Any Price" },
      { value: "0-21000", label: "Under $21K AUD" },
      { value: "21000-42000", label: "$21K - $42K AUD" },
      { value: "42000-84000", label: "$42K - $84K AUD" },
      { value: "84000-210000", label: "$84K - $210K AUD" },
      { value: "210000+", label: "$210K+ AUD" },
    ],
  },
};

const areaRanges = {
  sqft: [
    { value: "any", label: "Any Size" },
    { value: "0-500", label: "Under 500 sqft" },
    { value: "500-1000", label: "500 - 1,000 sqft" },
    { value: "1000-2000", label: "1,000 - 2,000 sqft" },
    { value: "2000-5000", label: "2,000 - 5,000 sqft" },
    { value: "5000+", label: "5,000+ sqft" },
  ],
  sqm: [
    { value: "any", label: "Any Size" },
    { value: "0-50", label: "Under 50 sqm" },
    { value: "50-100", label: "50 - 100 sqm" },
    { value: "100-200", label: "100 - 200 sqm" },
    { value: "200-500", label: "200 - 500 sqm" },
    { value: "500+", label: "500+ sqm" },
  ],
};

const HeroSearchBar = () => {
  const [purpose, setPurpose] = useState<'buy' | 'rent'>('buy');
  const [locationSearch, setLocationSearch] = useState('');
  const [bedrooms, setBedrooms] = useState('any');
  const [priceRange, setPriceRange] = useState('any');
  const [currency, setCurrency] = useState<CurrencyCode>('AED');
  const [areaUnit, setAreaUnit] = useState<'sqft' | 'sqm'>('sqft');
  const [sizeRange, setSizeRange] = useState('any');
  const [propertyType, setPropertyType] = useState('all');
  const [propertyStatus, setPropertyStatus] = useState('all');
  const [saleStatus, setSaleStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [developerId, setDeveloperId] = useState('all');
  const [communityId, setCommunityId] = useState('all');
  const [emirate, setEmirate] = useState('all');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  // Advanced filters
  const [paymentPlan, setPaymentPlan] = useState(0);
  const [handoverYear, setHandoverYear] = useState('all');

  const { data: developers } = useDevelopers();
  const { data: communities } = useCommunities();
  
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Combine DB developers with static list, removing duplicates
  const allDevelopers = (() => {
    const dbDevs = developers || [];
    const staticDevs = UAE_DEVELOPERS;
    const combined = [...dbDevs];
    
    // Add static developers that aren't already in DB
    staticDevs.forEach(staticDev => {
      const exists = dbDevs.some(dbDev => 
        dbDev.name.toLowerCase().includes(staticDev.name.toLowerCase()) ||
        staticDev.name.toLowerCase().includes(dbDev.name.toLowerCase())
      );
      if (!exists) {
        combined.push({ id: staticDev.id, name: staticDev.name, rank: 999 } as any);
      }
    });
    
    return combined.sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
  })();

  const handleSearch = () => {
    setIsSearching(true);
    const params = new URLSearchParams();
    
    params.set('transaction', purpose);
    
    if (locationSearch.trim()) params.set('search', locationSearch.trim());
    if (bedrooms !== 'any') params.set('beds', bedrooms);
    if (propertyType !== 'all') params.set('type', propertyType);
    if (propertyStatus !== 'all') params.set('status', propertyStatus);
    if (saleStatus !== 'all') params.set('saleStatus', saleStatus);
    if (sortBy !== 'newest') params.set('sort', sortBy);
    if (developerId !== 'all') params.set('developer', developerId);
    if (communityId !== 'all') params.set('community', communityId);
    if (emirate !== 'all') params.set('emirate', emirate);
    
    if (priceRange !== 'any') {
      const [min, max] = priceRange.split('-');
      if (min) params.set('priceMin', min.replace('+', ''));
      if (max) params.set('priceMax', max);
    }
    if (sizeRange !== 'any') {
      const [min, max] = sizeRange.split('-');
      if (min) params.set('sizeMin', min.replace('+', ''));
      if (max) params.set('sizeMax', max);
      params.set('sizeUnit', areaUnit);
    }
    params.set('currency', currency);

    // Track event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'home_search_submit', {
        purpose,
        location_search: locationSearch,
        bedrooms,
        property_type: propertyType,
        property_status: propertyStatus,
        price_range: priceRange,
        currency,
        size_range: sizeRange,
        area_unit: areaUnit,
        sort_by: sortBy,
        emirate,
      });
    }

    // Navigate with slight delay for visual feedback
    setTimeout(() => {
      navigate(`/properties?${params.toString()}`);
      setIsSearching(false);
    }, 100);
  };

  // Get price ranges for current currency (fallback to AED if not available)
  const getCurrentPriceRanges = () => {
    return priceRanges[purpose][currency] || priceRanges[purpose]['AED'];
  };

  const getPriceLabel = () => {
    if (priceRange === 'any') return 'Price Range';
    const range = getCurrentPriceRanges().find(r => r.value === priceRange);
    return range?.label || 'Price Range';
  };

  const getBedsLabel = () => {
    if (bedrooms === 'any') return 'Beds';
    const bed = bedroomOptions.find(b => b.value === bedrooms);
    return bed?.label || 'Beds';
  };

  const currentCurrency = SUPPORTED_CURRENCIES.find(c => c.code === currency) || SUPPORTED_CURRENCIES[0];

  return (
    <div className="w-full">
      {/* Top Row: Buy/Rent, Currency, Area Unit - All as dropdown boxes in same style */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {/* Buy/Rent Dropdown - Opens upward */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/20 backdrop-blur-md border border-white/40 text-white hover:bg-white/30 transition-all text-sm font-semibold shadow-lg">
              <Home className="w-4 h-4 text-gold" />
              <span className="font-semibold">{purpose === 'buy' ? 'Buy' : 'Rent'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-white/80" />
            </button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-32 p-2 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 z-[9999]"
            side="top"
            align="start"
            sideOffset={4}
            avoidCollisions={false}
          >
            <div className="text-xs font-semibold text-black/60 px-3 py-1.5 uppercase tracking-wider">Purpose</div>
            {(['buy', 'rent'] as const).map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPurpose(p);
                  setPriceRange('any');
                }}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors capitalize",
                  purpose === p 
                    ? "bg-gold/20 text-black font-semibold border border-gold/40" 
                    : "text-black hover:bg-white/50"
                )}
              >
                {p}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        {/* Currency Dropdown - Opens upward with scroll */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all text-sm">
              <DollarSign className="w-3.5 h-3.5 text-gold" />
              <span className="font-medium">{currentCurrency.code}</span>
              <ChevronDown className="w-3 h-3 text-white/60" />
            </button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-48 p-2 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 z-[9999] max-h-60 overflow-y-auto overscroll-contain"
            side="top"
            align="start"
            sideOffset={8}
            avoidCollisions={false}
            collisionPadding={0}
            onWheelCapture={(e) => e.stopPropagation()}
            onPointerDownOutside={(e) => e.preventDefault()}
          >
            <div className="text-xs font-semibold text-black/60 px-3 py-1.5 uppercase tracking-wider">Currency</div>
            {SUPPORTED_CURRENCIES.map((c) => (
              <button
                key={c.code}
                onClick={() => {
                  setCurrency(c.code);
                  setPriceRange('any');
                }}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2",
                  currency === c.code 
                    ? "bg-gold/20 text-black font-semibold border border-gold/40" 
                    : "text-black hover:bg-white/50"
                )}
              >
                <span>{c.flag}</span>
                <span>{c.label}</span>
                <span className="text-black/50 ml-auto text-xs">{c.symbol}</span>
              </button>
            ))}
          </PopoverContent>
        </Popover>

        {/* Area Unit Dropdown - Opens upward */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all text-sm">
              <Ruler className="w-3.5 h-3.5 text-gold" />
              <span className="font-medium">{areaUnit}</span>
              <ChevronDown className="w-3 h-3 text-white/60" />
            </button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-44 p-2 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 z-[9999]"
            side="top"
            align="start"
            sideOffset={4}
            avoidCollisions={false}
          >
            <div className="text-xs font-semibold text-black/60 px-3 py-1.5 uppercase tracking-wider">Size Unit</div>
            {(['sqft', 'sqm'] as const).map((u) => (
              <button
                key={u}
                onClick={() => {
                  setAreaUnit(u);
                  setSizeRange('any');
                }}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                  areaUnit === u 
                    ? "bg-gold/20 text-black font-semibold border border-gold/40" 
                    : "text-black hover:bg-white/50"
                )}
              >
                {u === 'sqft' ? 'Square Feet (sqft)' : 'Square Meters (sqm)'}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      </div>

      {/* Main Search Bar - Responsive: Stack on mobile, single line on desktop */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-0 w-full max-w-4xl">
        {/* Unified connected bar on desktop */}
        <div className="hidden sm:flex items-center w-full bg-white/[0.07] backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] min-h-[52px]">
          {/* Location Search Input */}
          <div className="flex items-center flex-1 px-4">
            <Search className="w-5 h-5 text-gold shrink-0" style={{ filter: 'drop-shadow(0 0 4px rgba(200,167,102,0.5))' }} />
            <input
              type="text"
              placeholder="Area, project or community"
              value={locationSearch}
              onChange={(e) => setLocationSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/50 px-3 text-sm font-medium min-w-0 w-full"
            />
          </div>
          {/* Premium Gradient Divider */}
          <div className="h-8 w-px bg-gradient-to-b from-transparent via-white/40 to-transparent" />

          {/* Beds Dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1 px-3 h-12 text-white font-medium text-sm hover:bg-white/10 transition-colors whitespace-nowrap">
                {getBedsLabel()}
                <ChevronDown className="w-3.5 h-3.5 text-gold" />
              </button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-36 p-2 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 z-[9999]"
              side="bottom"
              align="start"
              sideOffset={4}
            >
              {bedroomOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setBedrooms(option.value)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    bedrooms === option.value 
                      ? "bg-white/90 text-black font-semibold" 
                      : "text-black hover:bg-white/50"
                  )}
                >
                  {option.label} {option.value !== 'any' && option.value !== 'studio' && 'Bed'}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {/* Premium Gradient Divider */}
          <div className="h-8 w-px bg-gradient-to-b from-transparent via-white/40 to-transparent" />

          {/* Price Range Dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1 px-3 h-12 text-white font-medium text-sm hover:bg-white/10 transition-colors whitespace-nowrap">
                {getPriceLabel()}
                <ChevronDown className="w-3.5 h-3.5 text-gold" />
              </button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-44 p-2 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 z-[9999]"
              side="bottom"
              align="start"
              sideOffset={4}
            >
              {getCurrentPriceRanges().map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPriceRange(option.value)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    priceRange === option.value 
                      ? "bg-white/90 text-black font-semibold" 
                      : "text-black hover:bg-white/50"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {/* Premium Gradient Divider */}
          <div className="h-8 w-px bg-gradient-to-b from-transparent via-white/40 to-transparent" />

          {/* More Filters Button */}
          <Dialog open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-1 px-3 h-12 text-white font-medium text-sm hover:bg-white/10 transition-colors">
                <SlidersHorizontal className="w-3.5 h-3.5 text-gold" />
                <span className="hidden sm:inline">Filters</span>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40">
              <DialogHeader>
                <DialogTitle className="text-black text-xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
                  Advanced Filters
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Row 1: Property Type & Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-black/80 mb-2 block">Property Type</label>
                    <Select value={propertyType} onValueChange={setPropertyType}>
                      <SelectTrigger className="h-11 bg-white border-gold/30">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent className="z-[10000]">
                        {PROPERTY_TYPES.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-black/80 mb-2 block">Status</label>
                    <Select value={propertyStatus} onValueChange={setPropertyStatus}>
                      <SelectTrigger className="h-11 bg-white border-gold/30">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent className="z-[10000]">
                        {PROPERTY_STATUS.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 2: Sale Status with color dots */}
                <div>
                  <label className="text-sm font-semibold text-black/80 mb-2 block">Sale Status</label>
                  <Select value={saleStatus} onValueChange={setSaleStatus}>
                    <SelectTrigger className="h-11 bg-white border-gold/30">
                      <SelectValue placeholder="All Sale Statuses" />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      {SALE_STATUS_OPTIONS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          <div className="flex items-center gap-2">
                            {item.color && (
                              <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                            )}
                            <span>{item.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Row 3: Emirates Filter */}
                <div>
                  <label className="text-sm font-semibold text-black/80 mb-2 block flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gold" />
                    Emirate
                  </label>
                  <Select value={emirate} onValueChange={setEmirate}>
                    <SelectTrigger className="h-11 bg-white border-gold/30">
                      <SelectValue placeholder="All Emirates" />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      {UAE_EMIRATES.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment Plan Slider */}
                <div>
                  <label className="text-sm font-semibold text-black/80 mb-2 block">
                    Down Payment (Min %)
                  </label>
                  <div className="flex items-center gap-4 px-1">
                    <Slider
                      value={[paymentPlan]}
                      onValueChange={(v) => setPaymentPlan(v[0])}
                      min={0}
                      max={100}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-sm font-bold text-black min-w-[3.5rem] text-right bg-white/80 px-2 py-1 rounded-lg border border-gold/30">
                      {paymentPlan}%
                    </span>
                  </div>
                  <p className="text-xs text-black/50 mt-1.5">
                    Filter projects by minimum down payment requirement
                  </p>
                </div>

                {/* Handover Year */}
                <div>
                  <label className="text-sm font-semibold text-black/80 mb-2 block flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gold" />
                    Handover Year
                  </label>
                  <Select value={handoverYear} onValueChange={setHandoverYear}>
                    <SelectTrigger className="h-11 bg-white border-gold/30">
                      <SelectValue placeholder="Any Year" />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="all">Any Year</SelectItem>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2027">2027</SelectItem>
                      <SelectItem value="2028">2028</SelectItem>
                      <SelectItem value="2029">2029</SelectItem>
                      <SelectItem value="2030+">2030+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Row 3: Price Range (From - To) & Size Range (From - To) & Sort */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm font-semibold text-black/80 mb-2 block">Price Range</label>
                      <Select value={priceRange} onValueChange={setPriceRange}>
                        <SelectTrigger className="h-11 bg-white border-gold/30">
                          <SelectValue placeholder="Any Price" />
                        </SelectTrigger>
                        <SelectContent className="z-[10000]">
                          {getCurrentPriceRanges().map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-black/80 mb-2 block">Size ({areaUnit})</label>
                      <Select value={sizeRange} onValueChange={setSizeRange}>
                        <SelectTrigger className="h-11 bg-white border-gold/30">
                          <SelectValue placeholder="Any Size" />
                        </SelectTrigger>
                        <SelectContent className="z-[10000]">
                          {areaRanges[areaUnit].map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-black/80 mb-2 block">Sort By</label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="h-11 bg-white border-gold/30">
                          <SelectValue placeholder="Newest First" />
                        </SelectTrigger>
                        <SelectContent className="z-[10000]">
                          {SORT_OPTIONS.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Row 4: Developer */}
                <div>
                  <label className="text-sm font-semibold text-black/80 mb-2 block">Developer</label>
                  <Select value={developerId} onValueChange={setDeveloperId}>
                    <SelectTrigger className="h-11 bg-white border-gold/30">
                      <SelectValue placeholder="All Developers" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 z-[10000]">
                      <SelectItem value="all">All Developers</SelectItem>
                      {allDevelopers.map((dev) => (
                        <SelectItem key={dev.id} value={dev.id}>
                          {dev.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Row 5: Community / Area */}
                <div>
                  <label className="text-sm font-semibold text-black/80 mb-2 block">Community / Area</label>
                  <Select value={communityId} onValueChange={setCommunityId}>
                    <SelectTrigger className="h-11 bg-white border-gold/30">
                      <SelectValue placeholder="All Areas" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 z-[10000]">
                      <SelectItem value="all">All Areas</SelectItem>
                      {communities?.sort((a, b) => a.name.localeCompare(b.name)).map((comm) => (
                        <SelectItem key={comm.id} value={comm.id}>
                          {comm.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* AI Home Finder Link - Enhanced 3D visibility */}
                <Link
                  to="/ai-hub"
                  className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-500/25 to-purple-600/15 border-2 border-purple-400/50 hover:border-purple-400 transition-all group shadow-[0_4px_20px_rgba(147,51,234,0.25)] hover:shadow-[0_6px_30px_rgba(147,51,234,0.4)] hover:-translate-y-0.5"
                  onClick={() => setIsFiltersOpen(false)}
                >
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500/30 to-purple-600/20 border border-purple-400/40 flex items-center justify-center shadow-[0_0_15px_rgba(147,51,234,0.3)] group-hover:shadow-[0_0_25px_rgba(147,51,234,0.5)] transition-all">
                    <Sparkles className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors" />
                  </div>
                  <div className="flex-1">
                    <p className="text-black font-bold text-sm">Not sure what you're looking for?</p>
                    <p className="text-black/70 text-xs">Try our AI Home Matchmaker for personalized recommendations</p>
                  </div>
                  <ChevronDown className="w-5 h-5 text-purple-400 -rotate-90 group-hover:translate-x-1 transition-transform" />
                </Link>

                {/* Apply Filters Button */}
                <Button
                  onClick={() => {
                    setIsFiltersOpen(false);
                    handleSearch();
                  }}
                  variant="primary"
                  className="w-full h-11 text-base rounded-xl mt-2"
                >
                  Apply Filters
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Search Button */}
          <Button
            onClick={handleSearch}
            disabled={isSearching}
            className="h-[52px] px-7 bg-gradient-to-r from-gold to-gold-dark hover:brightness-110 text-black font-bold text-sm rounded-none rounded-r-2xl transition-all duration-300 shadow-[0_0_20px_rgba(200,167,102,0.3)] hover:shadow-[0_0_30px_rgba(200,167,102,0.5)] disabled:opacity-70 border-0"
          >
            {isSearching ? (
              <div className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin mr-1.5" />
            ) : (
              <Search className="w-4 h-4 mr-1.5" />
            )}
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {/* Mobile-only: Search input */}
        <div className="flex sm:hidden items-center bg-white/[0.07] backdrop-blur-xl border border-white/20 rounded-2xl px-4 py-3 min-h-[48px]">
          <Search className="w-5 h-5 text-gold shrink-0" style={{ filter: 'drop-shadow(0 0 4px rgba(200,167,102,0.5))' }} />
          <input
            type="text"
            placeholder="Area, project or community"
            value={locationSearch}
            onChange={(e) => setLocationSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/50 px-3 text-sm font-medium min-w-0 w-full"
          />
        </div>

        {/* Mobile-only: Filters + Search buttons side by side */}
        <div className="flex sm:hidden items-center gap-2 w-full">
          <button
            onClick={() => setIsFiltersOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 min-h-[48px] bg-white/10 backdrop-blur-md border border-white/30 rounded-xl text-white text-sm font-medium hover:bg-white/20 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4 text-gold" />
            Filters
          </button>
          <Button
            onClick={handleSearch}
            disabled={isSearching}
            className="flex-1 min-h-[48px] bg-gold hover:bg-gold-dark text-black font-bold rounded-xl shadow-lg disabled:opacity-70"
          >
            {isSearching ? (
              <div className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin mr-2" />
            ) : (
              <Search className="w-4 h-4 mr-2" />
            )}
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HeroSearchBar;
