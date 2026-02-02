/**
 * SearchModule Component - Master Blueprint Specification
 * Hero search bar: Purpose, Area, Property Type, Beds, Price Range
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Home, Key, MapPin, Building2, Bed, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";

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
  buy: [
    { value: "any", label: "Any Price" },
    { value: "0-1000000", label: "Under 1M" },
    { value: "1000000-2000000", label: "1M - 2M" },
    { value: "2000000-5000000", label: "2M - 5M" },
    { value: "5000000-10000000", label: "5M - 10M" },
    { value: "10000000+", label: "10M+" },
  ],
  rent: [
    { value: "any", label: "Any Price" },
    { value: "0-50000", label: "Under 50K" },
    { value: "50000-100000", label: "50K - 100K" },
    { value: "100000-200000", label: "100K - 200K" },
    { value: "200000-500000", label: "200K - 500K" },
    { value: "500000+", label: "500K+" },
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

    // Track event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'home_search_submit', {
        purpose,
        area,
        property_type: propertyType,
        bedrooms,
        price_range: priceRange,
      });
    }

    navigate(`/properties?${params.toString()}`);
  };

  const isHero = variant === 'hero';

  return (
    <div className={`${className}`}>
      {/* Purpose Toggle */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <button
          onClick={() => setPurpose('buy')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
            purpose === 'buy'
              ? 'bg-gold text-black shadow-lg'
              : isHero 
                ? 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm' 
                : 'bg-black/5 text-black hover:bg-black/10'
          }`}
        >
          <Home className="w-4 h-4" />
          {t('search.buy', 'Buy')}
        </button>
        <button
          onClick={() => setPurpose('rent')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
            purpose === 'rent'
              ? 'bg-gold text-black shadow-lg'
              : isHero 
                ? 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm' 
                : 'bg-black/5 text-black hover:bg-black/10'
          }`}
        >
          <Key className="w-4 h-4" />
          {t('search.rent', 'Rent')}
        </button>
      </div>

      {/* Search Fields */}
      <div className={`
        ${isHero 
          ? 'bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl p-4' 
          : 'bg-white border border-gold/30 rounded-xl p-4'
        }
      `}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Area */}
          <div>
            <label className={`text-xs font-medium mb-1.5 block ${isHero ? 'text-white/70' : 'text-zinc-500'}`}>
              <MapPin className="w-3 h-3 inline mr-1" />
              {t('search.area', 'Area')}
            </label>
            <Select value={area} onValueChange={setArea}>
              <SelectTrigger className={`${isHero ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gold/30'}`}>
                <SelectValue placeholder="Select area" />
              </SelectTrigger>
              <SelectContent>
                {topAreas.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Property Type */}
          <div>
            <label className={`text-xs font-medium mb-1.5 block ${isHero ? 'text-white/70' : 'text-zinc-500'}`}>
              <Building2 className="w-3 h-3 inline mr-1" />
              {t('search.propertyType', 'Property Type')}
            </label>
            <Select value={propertyType} onValueChange={setPropertyType}>
              <SelectTrigger className={`${isHero ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gold/30'}`}>
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
            <label className={`text-xs font-medium mb-1.5 block ${isHero ? 'text-white/70' : 'text-zinc-500'}`}>
              <Bed className="w-3 h-3 inline mr-1" />
              {t('search.bedrooms', 'Bedrooms')}
            </label>
            <Select value={bedrooms} onValueChange={setBedrooms}>
              <SelectTrigger className={`${isHero ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gold/30'}`}>
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

          {/* Price Range */}
          <div>
            <label className={`text-xs font-medium mb-1.5 block ${isHero ? 'text-white/70' : 'text-zinc-500'}`}>
              <DollarSign className="w-3 h-3 inline mr-1" />
              {t('search.priceRange', 'Price Range')}
            </label>
            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className={`${isHero ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gold/30'}`}>
                <SelectValue placeholder="Price" />
              </SelectTrigger>
              <SelectContent>
                {priceRanges[purpose].map((item) => (
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
              className="w-full bg-gold hover:bg-gold-dark text-black font-medium py-2.5 rounded-lg transition-all duration-300"
            >
              <Search className="w-4 h-4 mr-2" />
              {t('search.button', 'Search')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModule;
