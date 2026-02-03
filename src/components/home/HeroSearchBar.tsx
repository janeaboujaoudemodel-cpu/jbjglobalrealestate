/**
 * HeroSearchBar Component - Floating Search Bar for Hero Section
 * Clean, transparent design that floats directly on the hero video
 * No background, no overlay, no container layer - pure floating UI
 * Features: Area, Type, Location selectors + Currency + Area Unit + More Filters
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Home, Key, MapPin, Building2, SlidersHorizontal, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useLanguage } from "@/contexts/LanguageContext";
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

const topAreas = [
  { value: "any", label: "All Areas" },
  { value: "downtown-dubai", label: "Downtown Dubai" },
  { value: "dubai-marina", label: "Dubai Marina" },
  { value: "palm-jumeirah", label: "Palm Jumeirah" },
  { value: "business-bay", label: "Business Bay" },
  { value: "jbr", label: "JBR" },
  { value: "dubai-hills", label: "Dubai Hills" },
  { value: "emirates-hills", label: "Emirates Hills" },
];

const HeroSearchBar = () => {
  const [purpose, setPurpose] = useState<'buy' | 'rent'>('buy');
  const [area, setArea] = useState('any');
  const [propertyType, setPropertyType] = useState('all');
  const [bedrooms, setBedrooms] = useState('any');
  const [priceRange, setPriceRange] = useState('any');
  const [currency, setCurrency] = useState<'AED' | 'USD' | 'EUR'>('AED');
  const [areaUnit, setAreaUnit] = useState<'sqft' | 'sqm'>('sqft');
  const [sizeRange, setSizeRange] = useState('any');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  const navigate = useNavigate();
  const { t } = useLanguage();

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

  return (
    <div className="w-full">
      {/* Top Controls: Purpose Toggle + Currency + Area Unit */}
      <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 mb-3 md:mb-4">
        {/* Purpose Toggle - Buy/Rent */}
        <div className="flex items-center gap-1 md:gap-2">
          <button
            onClick={() => setPurpose('buy')}
            className={cn(
              "flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-full text-sm md:text-base font-semibold transition-all duration-300",
              purpose === 'buy'
                ? 'bg-gold text-black shadow-lg'
                : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm border border-white/20'
            )}
          >
            <Home className="w-4 h-4" />
            {t('search.buy', 'Buy')}
          </button>
          <button
            onClick={() => setPurpose('rent')}
            className={cn(
              "flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-full text-sm md:text-base font-semibold transition-all duration-300",
              purpose === 'rent'
                ? 'bg-gold text-black shadow-lg'
                : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm border border-white/20'
            )}
          >
            <Key className="w-4 h-4" />
            {t('search.rent', 'Rent')}
          </button>
        </div>

        {/* Currency Selector */}
        <div className="flex items-center gap-0.5 px-1.5 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
          {(['AED', 'USD', 'EUR'] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={cn(
                "px-2.5 md:px-3 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-medium transition-all",
                currency === c 
                  ? 'bg-gold text-black' 
                  : 'text-white/80 hover:text-white'
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Area Unit Toggle */}
        <div className="flex items-center gap-0.5 px-1.5 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
          <Ruler className="w-3.5 h-3.5 mx-1 text-white/60" />
          {(['sqft', 'sqm'] as const).map((u) => (
            <button
              key={u}
              onClick={() => setAreaUnit(u)}
              className={cn(
                "px-2.5 md:px-3 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-medium transition-all",
                areaUnit === u 
                  ? 'bg-gold text-black' 
                  : 'text-white/80 hover:text-white'
              )}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {/* Main Search Row - Floating boxes, NO background, NO labels */}
      <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
        {/* All Areas */}
        <Select value={area} onValueChange={setArea}>
          <SelectTrigger className="w-[130px] md:w-[160px] h-11 md:h-12 bg-white/10 backdrop-blur-md border border-white/30 text-white rounded-xl text-sm md:text-base font-medium hover:bg-white/20 transition-all">
            <MapPin className="w-4 h-4 mr-2 text-gold" />
            <SelectValue placeholder="All Areas" />
          </SelectTrigger>
          <SelectContent>
            {topAreas.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* All Types */}
        <Select value={propertyType} onValueChange={setPropertyType}>
          <SelectTrigger className="w-[130px] md:w-[160px] h-11 md:h-12 bg-white/10 backdrop-blur-md border border-white/30 text-white rounded-xl text-sm md:text-base font-medium hover:bg-white/20 transition-all">
            <Building2 className="w-4 h-4 mr-2 text-gold" />
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            {propertyTypes.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Anywhere / Location - shows area name if selected */}
        <Select value={area} onValueChange={setArea}>
          <SelectTrigger className="w-[130px] md:w-[160px] h-11 md:h-12 bg-white/10 backdrop-blur-md border border-white/30 text-white rounded-xl text-sm md:text-base font-medium hover:bg-white/20 transition-all">
            <MapPin className="w-4 h-4 mr-2 text-gold" />
            <SelectValue placeholder="Anywhere" />
          </SelectTrigger>
          <SelectContent>
            {topAreas.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* More Filters Button */}
        <Dialog open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <DialogTrigger asChild>
            <button className="h-11 md:h-12 px-4 bg-white/10 backdrop-blur-md border border-white/30 text-white rounded-xl text-sm md:text-base font-medium hover:bg-white/20 transition-all flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-gold" />
              <span className="hidden sm:inline">More Filters</span>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40">
            <DialogHeader>
              <DialogTitle className="text-black text-xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
                Advanced Filters
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Bedrooms */}
              <div>
                <label className="text-sm font-semibold text-zinc-700 mb-2 block">Bedrooms</label>
                <Select value={bedrooms} onValueChange={setBedrooms}>
                  <SelectTrigger className="h-12 bg-white border-gold/30">
                    <SelectValue placeholder="Any Beds" />
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
                <label className="text-sm font-semibold text-zinc-700 mb-2 block">Size ({areaUnit})</label>
                <Select value={sizeRange} onValueChange={setSizeRange}>
                  <SelectTrigger className="h-12 bg-white border-gold/30">
                    <SelectValue placeholder="Any Size" />
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
                <label className="text-sm font-semibold text-zinc-700 mb-2 block">Price ({currency})</label>
                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger className="h-12 bg-white border-gold/30">
                    <SelectValue placeholder="Any Price" />
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

              {/* Apply Filters Button */}
              <Button
                onClick={() => {
                  setIsFiltersOpen(false);
                  handleSearch();
                }}
                className="w-full h-12 bg-gold hover:bg-gold-dark text-black font-bold text-base rounded-xl mt-2"
              >
                Apply Filters
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Search Button */}
        <Button
          onClick={handleSearch}
          className="h-11 md:h-12 px-5 md:px-6 bg-gold hover:bg-gold-dark text-black font-bold text-sm md:text-base rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          <Search className="w-4 h-4 md:w-5 md:h-5 mr-1.5 md:mr-2" />
          {t('search.button', 'Search')}
        </Button>
      </div>
    </div>
  );
};

export default HeroSearchBar;