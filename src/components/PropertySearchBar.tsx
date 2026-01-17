import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Building2, DollarSign, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDevelopers } from "@/hooks/useProjects";

interface PropertySearchBarProps {
  className?: string;
  compact?: boolean;
}

const PropertySearchBar = ({ className = "", compact = false }: PropertySearchBarProps) => {
  const navigate = useNavigate();
  const { data: developers } = useDevelopers();
  
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState<string | null>(null);
  const [developerId, setDeveloperId] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<string | null>(null);
  const [sizeUnit, setSizeUnit] = useState<"sqft" | "sqm">("sqft");
  const [currency, setCurrency] = useState<string>("AED");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (keyword) params.append("q", keyword);
    if (location) params.append("emirate", location);
    if (developerId) params.append("developer", developerId);
    if (priceRange) {
      const [min, max] = priceRange.split("-");
      if (min) params.append("priceMin", min);
      if (max && max !== "500000000") params.append("priceMax", max);
    }
    params.append("sizeUnit", sizeUnit);
    params.append("currency", currency);
    
    navigate(`/properties?${params.toString()}`);
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Search properties..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9 h-10 bg-zinc-900/80 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-gold rounded-lg"
          />
        </div>
        <Button 
          onClick={handleSearch}
          variant="primary"
          className="h-10 px-4 rounded-lg"
        >
          Search
        </Button>
      </div>
    );
  }

  return (
    <div className={`bg-zinc-950/90 backdrop-blur-md border border-zinc-800/50 rounded-2xl p-4 md:p-6 ${className}`}>
      <div className="flex flex-wrap items-center gap-3">
        {/* Keyword Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Keyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10 h-12 bg-zinc-900/80 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-gold rounded-lg"
          />
        </div>

        {/* Location */}
        <Select
          value={location || "all"}
          onValueChange={(value) => setLocation(value === "all" ? null : value)}
        >
          <SelectTrigger className="w-[140px] h-12 bg-zinc-900/80 border-zinc-700/50 text-white rounded-lg">
            <MapPin className="w-4 h-4 mr-2 text-zinc-500" />
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700">
            <SelectItem value="all" className="text-white hover:bg-zinc-800">All Locations</SelectItem>
            <SelectItem value="Dubai" className="text-white hover:bg-zinc-800">Dubai</SelectItem>
            <SelectItem value="Abu Dhabi" className="text-white hover:bg-zinc-800">Abu Dhabi</SelectItem>
            <SelectItem value="Sharjah" className="text-white hover:bg-zinc-800">Sharjah</SelectItem>
            <SelectItem value="Ras Al Khaimah" className="text-white hover:bg-zinc-800">Ras Al Khaimah</SelectItem>
          </SelectContent>
        </Select>

        {/* Developer */}
        <Select
          value={developerId || "all"}
          onValueChange={(value) => setDeveloperId(value === "all" ? null : value)}
        >
          <SelectTrigger className="w-[140px] h-12 bg-zinc-900/80 border-zinc-700/50 text-white rounded-lg">
            <Building2 className="w-4 h-4 mr-2 text-zinc-500" />
            <SelectValue placeholder="Developer" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700 max-h-60">
            <SelectItem value="all" className="text-white hover:bg-zinc-800">All Developers</SelectItem>
            {developers?.slice(0, 10).map((dev) => (
              <SelectItem key={dev.id} value={dev.id} className="text-white hover:bg-zinc-800">
                {dev.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Price Range */}
        <Select
          value={priceRange || "all"}
          onValueChange={(value) => setPriceRange(value === "all" ? null : value)}
        >
          <SelectTrigger className="w-[140px] h-12 bg-zinc-900/80 border-zinc-700/50 text-white rounded-lg">
            <DollarSign className="w-4 h-4 mr-2 text-zinc-500" />
            <SelectValue placeholder="Price Range" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700">
            <SelectItem value="all" className="text-white hover:bg-zinc-800">Any Price</SelectItem>
            <SelectItem value="0-1000000" className="text-white hover:bg-zinc-800">Under 1M</SelectItem>
            <SelectItem value="1000000-3000000" className="text-white hover:bg-zinc-800">1M - 3M</SelectItem>
            <SelectItem value="3000000-5000000" className="text-white hover:bg-zinc-800">3M - 5M</SelectItem>
            <SelectItem value="5000000-10000000" className="text-white hover:bg-zinc-800">5M - 10M</SelectItem>
            <SelectItem value="10000000-500000000" className="text-white hover:bg-zinc-800">10M+</SelectItem>
          </SelectContent>
        </Select>

        {/* Size Unit */}
        <Select
          value={sizeUnit}
          onValueChange={(value) => setSizeUnit(value as "sqft" | "sqm")}
        >
          <SelectTrigger className="w-[90px] h-12 bg-zinc-900/80 border-zinc-700/50 text-white rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700">
            <SelectItem value="sqft" className="text-white hover:bg-zinc-800">sq ft</SelectItem>
            <SelectItem value="sqm" className="text-white hover:bg-zinc-800">sq m</SelectItem>
          </SelectContent>
        </Select>

        {/* Currency */}
        <Select
          value={currency}
          onValueChange={(value) => setCurrency(value)}
        >
          <SelectTrigger className="w-[90px] h-12 bg-zinc-900/80 border-zinc-700/50 text-white rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700">
            <SelectItem value="AED" className="text-white hover:bg-zinc-800">AED</SelectItem>
            <SelectItem value="USD" className="text-white hover:bg-zinc-800">USD</SelectItem>
            <SelectItem value="EUR" className="text-white hover:bg-zinc-800">EUR</SelectItem>
            <SelectItem value="GBP" className="text-white hover:bg-zinc-800">GBP</SelectItem>
            <SelectItem value="INR" className="text-white hover:bg-zinc-800">INR</SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced Filters Link */}
        <Button 
          variant="outline" 
          onClick={() => navigate("/properties")}
          className="h-12 px-4 bg-zinc-900/80 border-zinc-700/50 text-white hover:bg-zinc-800 hover:text-white rounded-lg"
        >
          <Filter className="w-4 h-4" />
        </Button>

        {/* Search Button */}
        <Button 
          onClick={handleSearch}
          variant="primary"
          className="h-12 px-8 rounded-lg"
        >
          SEARCH
        </Button>
      </div>
    </div>
  );
};

export default PropertySearchBar;
