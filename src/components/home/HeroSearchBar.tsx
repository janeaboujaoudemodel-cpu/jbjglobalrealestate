/**
 * HeroSearchBar Component - Premium Single-Line Search Bar
 * Provident-style clean design: Location input + Beds + Price + Search button
 * Buy/Rent/Off Plan toggles moved to bottom-left as small pills
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Home, Key, Building, ChevronDown, SlidersHorizontal, Ruler } from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const bedroomOptions = [
  { value: "any", label: "Any" },
  { value: "studio", label: "Studio" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5+", label: "5+" },
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

const propertyTypes = [
  { value: "all", label: "All Types" },
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "townhouse", label: "Townhouse" },
  { value: "penthouse", label: "Penthouse" },
  { value: "plot", label: "Plot" },
];

const HeroSearchBar = () => {
  const [purpose, setPurpose] = useState<'buy' | 'rent' | 'offplan'>('buy');
  const [locationSearch, setLocationSearch] = useState('');
  const [bedrooms, setBedrooms] = useState('any');
  const [priceRange, setPriceRange] = useState('any');
  const [currency, setCurrency] = useState<'AED' | 'USD' | 'EUR'>('AED');
  const [areaUnit, setAreaUnit] = useState<'sqft' | 'sqm'>('sqft');
  const [sizeRange, setSizeRange] = useState('any');
  const [propertyType, setPropertyType] = useState('all');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleSearch = () => {
    const params = new URLSearchParams();
    
    // Map offplan to buy with offplan filter
    const transactionType = purpose === 'offplan' ? 'buy' : purpose;
    params.set('transaction', transactionType);
    if (purpose === 'offplan') params.set('offplan', 'true');
    
    if (locationSearch.trim()) params.set('search', locationSearch.trim());
    if (bedrooms !== 'any') params.set('beds', bedrooms);
    if (propertyType !== 'all') params.set('type', propertyType);
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
        price_range: priceRange,
        currency,
        size_range: sizeRange,
        area_unit: areaUnit,
      });
    }

    navigate(`/properties?${params.toString()}`);
  };

  const getPriceLabel = () => {
    if (priceRange === 'any') return 'Price Range';
    const purposeKey = purpose === 'offplan' ? 'buy' : purpose;
    const range = priceRanges[purposeKey][currency].find(r => r.value === priceRange);
    return range?.label || 'Price Range';
  };

  const getBedsLabel = () => {
    if (bedrooms === 'any') return 'Beds';
    const bed = bedroomOptions.find(b => b.value === bedrooms);
    return bed?.label || 'Beds';
  };

  return (
    <div className="w-full">
      {/* Main Search Bar - Single Line Premium Design */}
      <div className="flex items-center justify-center">
        <div className="flex items-center bg-white/10 backdrop-blur-md border border-white/30 rounded-xl overflow-hidden w-full max-w-4xl">
          {/* Location Search Input */}
          <div className="flex-1 flex items-center px-4 border-r border-white/20">
            <Search className="w-5 h-5 text-gold shrink-0" />
            <input
              type="text"
              placeholder="Area, project or community"
              value={locationSearch}
              onChange={(e) => setLocationSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/60 px-3 py-3.5 text-base font-medium"
            />
          </div>

          {/* Beds Dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1.5 px-4 py-3.5 text-white font-medium text-sm hover:bg-white/10 transition-colors border-r border-white/20 whitespace-nowrap">
                {getBedsLabel()}
                <ChevronDown className="w-4 h-4 text-gold" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-2 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/30">
              {bedroomOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setBedrooms(option.value)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    bedrooms === option.value 
                      ? "bg-gold/20 text-gold font-semibold" 
                      : "text-black hover:bg-gold/10"
                  )}
                >
                  {option.label} {option.value !== 'any' && option.value !== 'studio' && 'Bed'}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {/* Price Range Dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1.5 px-4 py-3.5 text-white font-medium text-sm hover:bg-white/10 transition-colors border-r border-white/20 whitespace-nowrap">
                {getPriceLabel()}
                <ChevronDown className="w-4 h-4 text-gold" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/30">
              {priceRanges[purpose === 'offplan' ? 'buy' : purpose][currency].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPriceRange(option.value)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    priceRange === option.value 
                      ? "bg-gold/20 text-gold font-semibold" 
                      : "text-black hover:bg-gold/10"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {/* More Filters Button */}
          <Dialog open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-1.5 px-4 py-3.5 text-white font-medium text-sm hover:bg-white/10 transition-colors border-r border-white/20">
                <SlidersHorizontal className="w-4 h-4 text-gold" />
                <span className="hidden sm:inline">Filters</span>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40">
              <DialogHeader>
                <DialogTitle className="text-black text-xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
                  More Filters
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Property Type */}
                <div>
                  <label className="text-sm font-semibold text-zinc-700 mb-2 block">Property Type</label>
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger className="h-12 bg-white border-gold/30">
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
                </div>

                {/* Currency */}
                <div>
                  <label className="text-sm font-semibold text-zinc-700 mb-2 block">Currency</label>
                  <div className="flex gap-2">
                    {(['AED', 'USD', 'EUR'] as const).map((c) => (
                      <button
                        key={c}
                        onClick={() => setCurrency(c)}
                        className={cn(
                          "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all",
                          currency === c 
                            ? 'bg-gold text-black shadow-md' 
                            : 'bg-white border border-gold/30 text-zinc-600 hover:border-gold'
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Area Unit */}
                <div>
                  <label className="text-sm font-semibold text-zinc-700 mb-2 block">Area Unit</label>
                  <div className="flex gap-2">
                    {(['sqft', 'sqm'] as const).map((u) => (
                      <button
                        key={u}
                        onClick={() => setAreaUnit(u)}
                        className={cn(
                          "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all",
                          areaUnit === u 
                            ? 'bg-gold text-black shadow-md' 
                            : 'bg-white border border-gold/30 text-zinc-600 hover:border-gold'
                        )}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
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
            className="h-full px-6 py-3.5 bg-gold hover:bg-gold-dark text-black font-bold text-base rounded-none rounded-r-xl transition-all duration-300"
          >
            <Search className="w-5 h-5 mr-2" />
            Search
          </Button>
        </div>
      </div>

      {/* Purpose Toggle Pills - Bottom Left */}
      <div className="flex items-center justify-start gap-2 mt-4">
        <button
          onClick={() => setPurpose('buy')}
          className={cn(
            "px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300",
            purpose === 'buy'
              ? 'bg-gold text-black shadow-lg'
              : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm border border-white/20'
          )}
        >
          Buy
        </button>
        <button
          onClick={() => setPurpose('rent')}
          className={cn(
            "px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300",
            purpose === 'rent'
              ? 'bg-gold text-black shadow-lg'
              : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm border border-white/20'
          )}
        >
          Rent
        </button>
        <button
          onClick={() => setPurpose('offplan')}
          className={cn(
            "px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300",
            purpose === 'offplan'
              ? 'bg-gold text-black shadow-lg'
              : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm border border-white/20'
          )}
        >
          Off Plan
        </button>
      </div>
    </div>
  );
};

export default HeroSearchBar;
