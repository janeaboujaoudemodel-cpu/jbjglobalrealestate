/**
 * SearchModule Component - Master Blueprint Specification
 * Hero search bar: Purpose, Area, Property Type, Beds, Price Range
 * Enhanced with: sqm/sqft toggle, currency selector (AED/USD/EUR), full-width
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Home, Key, MapPin, Building2, Bed, DollarSign, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAreas } from "@/hooks/useAreas";
import { cn } from "@/lib/utils";

const propertyTypes = [
  { value: "all", label: "All Types" },
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "townhouse", label: "Townhouse" },
  { value: "penthouse", label: "Penthouse" },
  { value: "plot", label: "Plot" },
];

const bedroomOptions = [
  { value: "any", label: "Any Beds" },
  { value: "studio", label: "Studio" },
  { value: "1", label: "1 Bed" },
  { value: "2", label: "2 Beds" },
  { value: "3", label: "3 Beds" },
  { value: "4", label: "4 Beds" },
  { value: "5+", label: "5+ Beds" },
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

interface SearchModuleProps {
  variant?: 'hero' | 'compact';
  className?: string;
}

const SearchModule = ({ variant = 'hero', className = '' }: SearchModuleProps) => {
  const [purpose, setPurpose] = useState<'buy' | 'rent'>('buy');
  const [area, setArea] = useState('any');
  const [propertyType, setPropertyType] = useState('all');
  const [bedrooms, setBedrooms] = useState('any');
  const [priceRange, setPriceRange] = useState('any');
  const [currency, setCurrency] = useState<'AED' | 'USD' | 'EUR'>('AED');
  const [areaUnit, setAreaUnit] = useState<'sqft' | 'sqm'>('sqft');
  const [sizeRange, setSizeRange] = useState('any');
  
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  // Fetch areas from database (top 20 by property count)
  const { data: dbAreas } = useAreas({ limit: 20 });
  
  // Build area options from database areas
  const areaOptions = useMemo(() => {
    const options = [{ value: "any", label: "All Areas" }];
    if (dbAreas && dbAreas.length > 0) {
      dbAreas.forEach((a) => {
        options.push({ value: a.slug, label: a.name });
      });
    }
    return options;
  }, [dbAreas]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    
    params.set('transaction', purpose);
    if (area !== 'any') params.set('area', area);
    if (propertyType !== 'all') params.set('type', propertyType);
    if (bedrooms !== 'any') params.set('beds', bedrooms);
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
        area,
        property_type: propertyType,
        bedrooms,
        price_range: priceRange,
        currency,
        size_range: sizeRange,
        area_unit: areaUnit,
      });
    }

    navigate(`/properties?${params.toString()}`);
  };

  const isHero = variant === 'hero';

  return (
    <div className={cn("w-full", className)}>
      {/* Top Row: Purpose Toggle + Currency + Area Unit */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
        {/* Purpose Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPurpose('buy')}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-full text-base font-semibold transition-all duration-300",
              purpose === 'buy'
                ? 'bg-[#EFE6D6] text-[#1A1A1A] shadow-lg'
                : isHero 
                  ? 'bg-[#FDFBF7]/10 text-white hover:bg-[#FDFBF7]/20 backdrop-blur-sm' 
                  : 'bg-[#1A1A1A]/5 text-[#1A1A1A] hover:bg-[#1A1A1A]/10'
            )}
          >
            <Home className="w-5 h-5" />
            {t('search.buy', 'Buy')}
          </button>
          <button
            onClick={() => setPurpose('rent')}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-full text-base font-semibold transition-all duration-300",
              purpose === 'rent'
                ? 'bg-[#EFE6D6] text-[#1A1A1A] shadow-lg'
                : isHero 
                  ? 'bg-[#FDFBF7]/10 text-white hover:bg-[#FDFBF7]/20 backdrop-blur-sm' 
                  : 'bg-[#1A1A1A]/5 text-[#1A1A1A] hover:bg-[#1A1A1A]/10'
            )}
          >
            <Key className="w-5 h-5" />
            {t('search.rent', 'Rent')}
          </button>
        </div>

        {/* Currency Selector */}
        <div className={cn(
          "flex items-center gap-1 px-2 py-1.5 rounded-full",
          isHero ? 'bg-[#FDFBF7]/10 backdrop-blur-sm' : 'bg-[#1A1A1A]/5'
        )}>
          {(['AED', 'USD', 'EUR'] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                currency === c 
                  ? 'bg-[#EFE6D6] text-[#1A1A1A]' 
                  : isHero ? 'text-white/80 hover:text-white' : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Area Unit Toggle */}
        <div className={cn(
          "flex items-center gap-1 px-2 py-1.5 rounded-full",
          isHero ? 'bg-[#FDFBF7]/10 backdrop-blur-sm' : 'bg-[#1A1A1A]/5'
        )}>
          <Ruler className={cn("w-4 h-4 mx-1", isHero ? 'text-white/90' : 'text-[#1A1A1A]/50')} />
          {(['sqft', 'sqm'] as const).map((u) => (
            <button
              key={u}
              onClick={() => setAreaUnit(u)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                areaUnit === u 
                  ? 'bg-[#EFE6D6] text-[#1A1A1A]' 
                  : isHero ? 'text-white/80 hover:text-white' : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
              )}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {/* Search Fields - Full Width */}
      <div className={cn(
        "w-full",
        isHero 
          ? 'bg-[#1A1A1A]/40 backdrop-blur-md border border-white/20 rounded-2xl p-5' 
          : 'bg-[#FDFBF7] border-2 border-[#B89555]/30 rounded-xl p-5'
      )}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Area */}
          <div>
            <label className={cn("text-xs font-semibold mb-2 block", isHero ? 'text-white/80' : 'text-[#1A1A1A]/70')}>
              <MapPin className="w-3.5 h-3.5 inline mr-1.5" />
              {t('search.area', 'Area')}
            </label>
            <Select value={area} onValueChange={setArea}>
              <SelectTrigger className={cn("h-12 text-base", isHero ? 'bg-[#FDFBF7]/10 border-white/20 text-white' : 'bg-[#FDFBF7] border-[#B89555]/30')}>
                <SelectValue placeholder="Select area" />
              </SelectTrigger>
              <SelectContent className="max-h-64 overflow-y-auto">
                {areaOptions.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Property Type */}
          <div>
            <label className={cn("text-xs font-semibold mb-2 block", isHero ? 'text-white/80' : 'text-[#1A1A1A]/70')}>
              <Building2 className="w-3.5 h-3.5 inline mr-1.5" />
              {t('search.propertyType', 'Type')}
            </label>
            <Select value={propertyType} onValueChange={setPropertyType}>
              <SelectTrigger className={cn("h-12 text-base", isHero ? 'bg-[#FDFBF7]/10 border-white/20 text-white' : 'bg-[#FDFBF7] border-[#B89555]/30')}>
                <SelectValue placeholder="Property type" />
              </SelectTrigger>
              <SelectContent>
                {propertyTypes.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bedrooms */}
          <div>
            <label className={cn("text-xs font-semibold mb-2 block", isHero ? 'text-white/80' : 'text-[#1A1A1A]/70')}>
              <Bed className="w-3.5 h-3.5 inline mr-1.5" />
              {t('search.bedrooms', 'Beds')}
            </label>
            <Select value={bedrooms} onValueChange={setBedrooms}>
              <SelectTrigger className={cn("h-12 text-base", isHero ? 'bg-[#FDFBF7]/10 border-white/20 text-white' : 'bg-[#FDFBF7] border-[#B89555]/30')}>
                <SelectValue placeholder="Bedrooms" />
              </SelectTrigger>
              <SelectContent>
                {bedroomOptions.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Size Range */}
          <div>
            <label className={cn("text-xs font-semibold mb-2 block", isHero ? 'text-white/80' : 'text-[#1A1A1A]/70')}>
              <Ruler className="w-3.5 h-3.5 inline mr-1.5" />
              Size ({areaUnit})
            </label>
            <Select value={sizeRange} onValueChange={setSizeRange}>
              <SelectTrigger className={cn("h-12 text-base", isHero ? 'bg-[#FDFBF7]/10 border-white/20 text-white' : 'bg-[#FDFBF7] border-[#B89555]/30')}>
                <SelectValue placeholder="Size" />
              </SelectTrigger>
              <SelectContent>
                {areaRanges[areaUnit].map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price Range */}
          <div>
            <label className={cn("text-xs font-semibold mb-2 block", isHero ? 'text-white/80' : 'text-[#1A1A1A]/70')}>
              <DollarSign className="w-3.5 h-3.5 inline mr-1.5" />
              Price ({currency})
            </label>
            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className={cn("h-12 text-base", isHero ? 'bg-[#FDFBF7]/10 border-white/20 text-white' : 'bg-[#FDFBF7] border-[#B89555]/30')}>
                <SelectValue placeholder="Price" />
              </SelectTrigger>
              <SelectContent>
                {priceRanges[purpose][currency].map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search Button */}
          <div className="flex items-end">
            <Button
              onClick={handleSearch}
              className="w-full h-12 bg-[#EFE6D6] hover:bg-[#EFE6D6]-dark text-[#1A1A1A] font-bold text-base rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Search className="w-5 h-5 mr-2" />
              {t('search.button', 'Search')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModule;
