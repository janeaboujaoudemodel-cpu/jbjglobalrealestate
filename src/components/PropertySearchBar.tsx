import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Building2, DollarSign, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContentDark,
  SelectItemDark,
  SelectTriggerDark,
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

  // Show ALL developers sorted by rank (top to lowest)
  const allDevelopersSorted = useMemo(() => {
    if (!developers) return [];
    return [...developers].sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
  }, [developers]);

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
        <Button onClick={handleSearch} variant="primary" className="h-10 px-4 rounded-lg">
          Search
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`bg-zinc-950/90 backdrop-blur-md border border-zinc-800/50 rounded-2xl p-4 md:p-6 ${className}`}
    >
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
        <Select value={location || "all"} onValueChange={(value) => setLocation(value === "all" ? null : value)}>
          <SelectTriggerDark className="w-[140px] h-12 rounded-lg">
            <MapPin className="w-4 h-4 mr-2 text-zinc-500" />
            <SelectValue placeholder="Location" />
          </SelectTriggerDark>
          <SelectContentDark>
            <SelectItemDark value="all">All Locations</SelectItemDark>
            <SelectItemDark value="Dubai">Dubai</SelectItemDark>
            <SelectItemDark value="Abu Dhabi">Abu Dhabi</SelectItemDark>
            <SelectItemDark value="Sharjah">Sharjah</SelectItemDark>
            <SelectItemDark value="Ras Al Khaimah">Ras Al Khaimah</SelectItemDark>
          </SelectContentDark>
        </Select>

        {/* Developer - All developers sorted by rank (top to lowest) */}
        <Select value={developerId || "all"} onValueChange={(value) => setDeveloperId(value === "all" ? null : value)}>
          <SelectTriggerDark className="w-[140px] h-12 rounded-lg">
            <Building2 className="w-4 h-4 mr-2 text-zinc-500" />
            <SelectValue placeholder="Developer" />
          </SelectTriggerDark>
          <SelectContentDark className="max-h-72">
            <SelectItemDark value="all">All Developers</SelectItemDark>
            {allDevelopersSorted.map((dev) => (
              <SelectItemDark key={dev.id} value={dev.id}>{dev.name}</SelectItemDark>
            ))}
          </SelectContentDark>
        </Select>

        {/* Price Range */}
        <Select value={priceRange || "all"} onValueChange={(value) => setPriceRange(value === "all" ? null : value)}>
          <SelectTriggerDark className="w-[140px] h-12 rounded-lg">
            <DollarSign className="w-4 h-4 mr-2 text-zinc-500" />
            <SelectValue placeholder="Price Range" />
          </SelectTriggerDark>
          <SelectContentDark>
            <SelectItemDark value="all">Any Price</SelectItemDark>
            <SelectItemDark value="0-1000000">Under 1M</SelectItemDark>
            <SelectItemDark value="1000000-3000000">1M - 3M</SelectItemDark>
            <SelectItemDark value="3000000-5000000">3M - 5M</SelectItemDark>
            <SelectItemDark value="5000000-10000000">5M - 10M</SelectItemDark>
            <SelectItemDark value="10000000-500000000">10M+</SelectItemDark>
          </SelectContentDark>
        </Select>

        {/* Size Unit */}
        <Select value={sizeUnit} onValueChange={(value) => setSizeUnit(value as "sqft" | "sqm")}>
          <SelectTriggerDark className="w-[90px] h-12 rounded-lg">
            <SelectValue />
          </SelectTriggerDark>
          <SelectContentDark>
            <SelectItemDark value="sqft">sq ft</SelectItemDark>
            <SelectItemDark value="sqm">sq m</SelectItemDark>
          </SelectContentDark>
        </Select>

        {/* Currency */}
        <Select value={currency} onValueChange={(value) => setCurrency(value)}>
          <SelectTriggerDark className="w-[90px] h-12 rounded-lg">
            <SelectValue />
          </SelectTriggerDark>
          <SelectContentDark>
            <SelectItemDark value="AED">AED</SelectItemDark>
            <SelectItemDark value="USD">USD</SelectItemDark>
            <SelectItemDark value="EUR">EUR</SelectItemDark>
            <SelectItemDark value="GBP">GBP</SelectItemDark>
            <SelectItemDark value="INR">INR</SelectItemDark>
          </SelectContentDark>
        </Select>

        {/* Advanced Filters Link */}
        <Button
          variant="outline"
          onClick={() => navigate("/properties")}
          className="h-12 px-4 bg-zinc-900/80 border-zinc-700/50 text-white hover:bg-zinc-800 hover:text-white rounded-lg"
        >
          <Filter className="w-4 h-4" />
        </Button>

        {/* Search Button - Gold Glow */}
        <Button 
          onClick={handleSearch} 
          className="h-12 px-8 rounded-lg bg-gradient-to-r from-gold to-gold-dark text-black font-bold hover:brightness-110 hover:shadow-[0_0_25px_rgba(200,167,102,0.6)] transition-all duration-300 shadow-[0_0_15px_rgba(200,167,102,0.4)] cursor-pointer"
        >
          SEARCH
        </Button>
      </div>
    </div>
  );
};

export default PropertySearchBar;

