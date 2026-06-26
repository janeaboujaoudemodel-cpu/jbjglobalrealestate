import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { useAreas } from "@/hooks/useAreas";
import { useAreaUnit } from "@/hooks/useAreaUnit";
import { Building2, MapPin, BedDouble, Maximize, DollarSign, Search, Calendar, Crown, Bell, Mail, ArrowLeft, ArrowRight, Sofa, ArrowUpDown, Ruler, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmiratesMultiSelect } from "@/components/filters/EmiratesMultiSelect";
import {
  filterPillBase,
  filterPillInactiveLight,
  filterPillActive,
  filterSearchPillWrapper,
  filterSearchPillInput,
  filterDivider,
  resetAllPill,
} from "@/components/filters/filterStyles";
import { cn } from "@/lib/utils";

const PROPERTY_TYPES = [
  { value: "all", label: "All Types" },
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "townhouse", label: "Townhouse" },
  { value: "penthouse", label: "Penthouse" },
  { value: "duplex", label: "Duplex" },
  { value: "studio", label: "Studio" },
  { value: "commercial", label: "Commercial" },
  { value: "plot", label: "Plot" },
  { value: "retail", label: "Retail" },
  { value: "offices", label: "Offices" },
];

const BEDROOM_OPTIONS = [
  { value: "all", label: "Any Beds" },
  { value: "0", label: "Studio" },
  { value: "1", label: "1 BR" },
  { value: "2", label: "2 BR" },
  { value: "3", label: "3 BR" },
  { value: "4", label: "4 BR" },
  { value: "5", label: "5 BR" },
  { value: "6", label: "6 BR" },
  { value: "7", label: "7+ BR" },
];

const HANDOVER_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "ready", label: "Ready to Move" },
  { value: "under_construction", label: "Under Construction" },
];

const FURNISHING_OPTIONS = [
  { value: "all", label: "Any Furnishing" },
  { value: "furnished", label: "Furnished" },
  { value: "unfurnished", label: "Unfurnished" },
  { value: "semi-furnished", label: "Semi-Furnished" },
];

const PRICE_RANGES = [
  { value: "all", label: "Any Price" },
  { value: "0-1000000", label: "Under AED 1M" },
  { value: "1000000-3000000", label: "AED 1M - 3M" },
  { value: "3000000-5000000", label: "AED 3M - 5M" },
  { value: "5000000-10000000", label: "AED 5M - 10M" },
  { value: "10000000-999999999", label: "AED 10M+" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "size_asc", label: "Size: Small → Large" },
  { value: "size_desc", label: "Size: Large → Small" },
];

const VIEW_OPTIONS = [
  { value: "all", label: "Any View" },
  { value: "sea", label: "Sea View" },
  { value: "city", label: "City View" },
  { value: "garden", label: "Garden View" },
  { value: "canal", label: "Canal View" },
  { value: "golf", label: "Golf View" },
  { value: "pool", label: "Pool View" },
  { value: "landmark", label: "Landmark View" },
];

const ResaleProperties = () => {
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [bedroomFilter, setBedroomFilter] = useState<string>("all");
  const [handoverFilter, setHandoverFilter] = useState<string>("all");
  const [priceFilter, setPriceFilter] = useState<string>("all");
  const [furnishingFilter, setFurnishingFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [emiratesFilter, setEmiratesFilter] = useState<string[]>([]);
  const [developerFilter, setDeveloperFilter] = useState<string>("all");
  const [sizeMin, setSizeMin] = useState("");
  const [sizeMax, setSizeMax] = useState("");
  const [viewFilter, setViewFilter] = useState<string>("all");

  const { formatSize, unitLabel } = useAreaUnit();

  const { data: areas } = useAreas();

  const areasSorted = useMemo(() => {
    if (!areas) return [];
    return [...areas].sort((a, b) => a.name.localeCompare(b.name));
  }, [areas]);

  // Fetch distinct developers for the filter
  const { data: developers } = useQuery({
    queryKey: ["resale-developers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resale_listings_public")
        .select("developer_name");
      if (error) throw error;
      const names = [...new Set((data || []).map((d: any) => d.developer_name).filter(Boolean))].sort();
      return names as string[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: listings, isLoading } = useQuery({
    queryKey: ["resale-listings", areaFilter, typeFilter, bedroomFilter, handoverFilter, priceFilter, furnishingFilter, developerFilter],
    queryFn: async () => {
      let query: any = supabase
        .from("resale_listings_public")
        .select("*")
        .order("created_at", { ascending: false });

      if (areaFilter !== "all") query = query.eq("area_name", areaFilter);
      if (typeFilter !== "all") query = query.eq("property_type", typeFilter);
      if (bedroomFilter !== "all") {
        const beds = parseInt(bedroomFilter);
        if (beds >= 5) {
          query = query.gte("bedrooms", 5);
        } else {
          query = query.eq("bedrooms", beds);
        }
      }
      if (handoverFilter !== "all") query = query.eq("handover_status", handoverFilter);
      if (furnishingFilter !== "all") query = query.eq("furnishing", furnishingFilter);
      if (priceFilter !== "all") {
        const [min, max] = priceFilter.split("-").map(Number);
        query = query.gte("asking_price", min).lte("asking_price", max);
      }
      if (developerFilter !== "all") query = query.eq("developer_name", developerFilter);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const filteredListings = useMemo(() => {
    if (!listings) return [];
    let result = [...listings];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((l: any) =>
        (l.title || "").toLowerCase().includes(q) ||
        (l.project_name || "").toLowerCase().includes(q) ||
        (l.area_name || "").toLowerCase().includes(q) ||
        (l.developer_name || "").toLowerCase().includes(q)
      );
    }

    // Emirates filter
    if (emiratesFilter.length > 0) {
      result = result.filter((l: any) => {
        const emirate = (l.emirate || l.location_emirate || "").toLowerCase();
        return emiratesFilter.some(e => emirate.includes(e.toLowerCase()));
      });
    }

    // Size filter
    if (sizeMin) {
      const min = Number(sizeMin);
      if (!isNaN(min)) result = result.filter((l: any) => (l.size_sqft || 0) >= min);
    }
    if (sizeMax) {
      const max = Number(sizeMax);
      if (!isNaN(max)) result = result.filter((l: any) => (l.size_sqft || Infinity) <= max);
    }

    // View filter
    if (viewFilter !== "all") {
      result = result.filter((l: any) => {
        const views = (l.views || l.view || "").toLowerCase();
        return views.includes(viewFilter.toLowerCase());
      });
    }

    // Sorting
    if (sortBy === "newest") {
      result.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    } else if (sortBy === "price_asc") {
      result.sort((a: any, b: any) => (a.asking_price || 0) - (b.asking_price || 0));
    } else if (sortBy === "price_desc") {
      result.sort((a: any, b: any) => (b.asking_price || 0) - (a.asking_price || 0));
    } else if (sortBy === "size_asc") {
      result.sort((a: any, b: any) => (a.size_sqft || 0) - (b.size_sqft || 0));
    } else if (sortBy === "size_desc") {
      result.sort((a: any, b: any) => (b.size_sqft || 0) - (a.size_sqft || 0));
    }

    return result;
  }, [listings, searchQuery, emiratesFilter, sizeMin, sizeMax, viewFilter, sortBy]);

  const handleSubscribe = async () => {
    if (!subscribeEmail || !subscribeEmail.includes("@")) return;
    setSubscribed(true);
    // Could wire to a DB table later
  };

  return (
    <>
      <SEOHead
        title="Resale Properties | JBJ Global Real Estate"
        description="Browse investor resale properties in Dubai. Premium properties at competitive prices from verified JBJ investors."
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] py-12 md:py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <Link to="/properties" className="inline-flex items-center gap-2 text-[#1A1A1A] hover:underline text-sm mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Properties
          </Link>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] uppercase tracking-[0.18em] font-semibold mb-4 bg-[#FDFBF7] text-[#1A1A1A] border border-[#B89555]/50">
            Exclusive — JBJ Global Real Estate
          </span>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 text-[#1A1A1A]">
            Exclusive Resale <span className="text-[#0A0A0A]">Properties</span>
          </h1>
          <p className="text-lg max-w-2xl mx-auto font-medium text-[#1A1A1A]/80">
            Exclusive investor resale portfolio curated by JBJ Global Real Estate — premium properties from verified investors at competitive prices, available for immediate purchase.
          </p>
        </div>
      </section>

      {/* Premium sticky filter bar — clears 88px fixed header */}
      <section className="z-30 bg-[#F7F2EA]/95 backdrop-blur-md py-3 md:py-4 sticky top-[88px] border-y border-[#B89555]/25 shadow-[0_8px_24px_rgba(10,10,10,0.06)]">
        <div className="w-full px-3 sm:px-4">
          <div className="relative bg-[#EFE6D6] border border-[#B89555]/40 rounded-2xl px-3 py-3 sm:px-4 sm:py-3.5">

            {/* Navy left accent bar */}
            <span aria-hidden className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-[#0A0A0A]" />

            {/* Row 1: prominent search input */}
            <div className="flex items-center gap-2 mb-2.5 pl-2">
              <div className={cn(filterSearchPillWrapper, "h-11 flex-1 !bg-transparent border-[#B89555]/40")}>
                <Search className="w-4 h-4 mr-2 text-[#0A0A0A] flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search by property name, project, area, developer…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(filterSearchPillInput, "text-[#1A1A1A] placeholder:text-[#1A1A1A]/55")}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="ml-1 text-[11px] font-semibold text-[#1A1A1A]/70 hover:text-[#1A1A1A]"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>


            {/* Row 2: Filter pills (chips) */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {/* Area */}
              <Select value={areaFilter} onValueChange={setAreaFilter}>
                <SelectTrigger className={cn(filterPillBase, areaFilter !== "all" ? filterPillActive : filterPillInactiveLight, "h-8 max-w-[200px] [&>svg:last-child]:hidden")}>
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{areaFilter === "all" ? "Area" : areaFilter}</span>
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="all">All Areas</SelectItem>
                  {areasSorted.map((area) => (
                    <SelectItem key={area.id} value={area.name}>{area.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Property Type */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className={cn(filterPillBase, typeFilter !== "all" ? filterPillActive : filterPillInactiveLight, "h-8 [&>svg:last-child]:hidden")}>
                  <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{typeFilter === "all" ? "Type" : PROPERTY_TYPES.find(t => t.value === typeFilter)?.label}</span>
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Bedrooms */}
              <Select value={bedroomFilter} onValueChange={setBedroomFilter}>
                <SelectTrigger className={cn(filterPillBase, bedroomFilter !== "all" ? filterPillActive : filterPillInactiveLight, "h-8 [&>svg:last-child]:hidden")}>
                  <BedDouble className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{BEDROOM_OPTIONS.find(b => b.value === bedroomFilter)?.label || "Beds"}</span>
                </SelectTrigger>
                <SelectContent>
                  {BEDROOM_OPTIONS.map((b) => (
                    <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Price */}
              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger className={cn(filterPillBase, priceFilter !== "all" ? filterPillActive : filterPillInactiveLight, "h-8 [&>svg:last-child]:hidden")}>
                  <DollarSign className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{PRICE_RANGES.find(p => p.value === priceFilter)?.label || "Price"}</span>
                </SelectTrigger>
                <SelectContent>
                  {PRICE_RANGES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Handover */}
              <Select value={handoverFilter} onValueChange={setHandoverFilter}>
                <SelectTrigger className={cn(filterPillBase, handoverFilter !== "all" ? filterPillActive : filterPillInactiveLight, "h-8 [&>svg:last-child]:hidden")}>
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{HANDOVER_OPTIONS.find(h => h.value === handoverFilter)?.label || "Status"}</span>
                </SelectTrigger>
                <SelectContent>
                  {HANDOVER_OPTIONS.map((h) => (
                    <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Furnishing */}
              <Select value={furnishingFilter} onValueChange={setFurnishingFilter}>
                <SelectTrigger className={cn(filterPillBase, furnishingFilter !== "all" ? filterPillActive : filterPillInactiveLight, "h-8 [&>svg:last-child]:hidden")}>
                  <Sofa className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{FURNISHING_OPTIONS.find(f => f.value === furnishingFilter)?.label || "Furnishing"}</span>
                </SelectTrigger>
                <SelectContent>
                  {FURNISHING_OPTIONS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Developer */}
              <Select value={developerFilter} onValueChange={setDeveloperFilter}>
                <SelectTrigger className={cn(filterPillBase, developerFilter !== "all" ? filterPillActive : filterPillInactiveLight, "h-auto min-h-8 max-w-[260px] [&>svg:last-child]:hidden")}>
                  <Users className="w-3.5 h-3.5 flex-shrink-0" />
                  <span data-developer-name className="min-w-0 whitespace-normal break-words [overflow-wrap:anywhere] leading-tight text-left">{developerFilter === "all" ? "Developer" : developerFilter}</span>
                </SelectTrigger>
                <SelectContent className="max-h-60 w-[320px]">
                  <SelectItem value="all">All Developers</SelectItem>
                  {(developers || []).map((dev) => (
                    <SelectItem key={dev} value={dev}>
                      <span data-developer-name className="block min-w-0 max-w-full whitespace-normal break-words [overflow-wrap:anywhere] leading-snug overflow-visible">
                        {dev}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* View */}
              <Select value={viewFilter} onValueChange={setViewFilter}>
                <SelectTrigger className={cn(filterPillBase, viewFilter !== "all" ? filterPillActive : filterPillInactiveLight, "h-8 [&>svg:last-child]:hidden")}>
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{VIEW_OPTIONS.find(v => v.value === viewFilter)?.label || "View"}</span>
                </SelectTrigger>
                <SelectContent>
                  {VIEW_OPTIONS.map((v) => (
                    <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Emirates (multi) */}
              <EmiratesMultiSelect value={emiratesFilter} onChange={setEmiratesFilter} variant="light" />

              {/* Size Range */}
              <div className={cn(filterPillBase, (sizeMin || sizeMax) ? filterPillActive : cn(filterPillInactiveLight, "!bg-transparent"), "h-8 gap-1 px-2.5")}>
                <Ruler className="w-3.5 h-3.5 flex-shrink-0" />
                <input
                  type="number"
                  placeholder={`Min ${unitLabel}`}
                  value={sizeMin}
                  onChange={(e) => setSizeMin(e.target.value)}
                  className="w-[68px] bg-transparent outline-none text-[12px] placeholder:text-current/70"
                />
                <span className="opacity-60">–</span>
                <input
                  type="number"
                  placeholder={`Max`}
                  value={sizeMax}
                  onChange={(e) => setSizeMax(e.target.value)}
                  className="w-[58px] bg-transparent outline-none text-[12px] placeholder:text-current/70"
                />
              </div>

              <span className={filterDivider} />

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className={cn(filterPillBase, sortBy !== "newest" ? filterPillActive : filterPillInactiveLight, "h-8 [&>svg:last-child]:hidden")}>
                  <ArrowUpDown className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{SORT_OPTIONS.find(s => s.value === sortBy)?.label || "Sort"}</span>
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Reset All */}
              {(areaFilter !== "all" || typeFilter !== "all" || bedroomFilter !== "all" || priceFilter !== "all" || handoverFilter !== "all" || furnishingFilter !== "all" || developerFilter !== "all" || viewFilter !== "all" || emiratesFilter.length > 0 || sizeMin || sizeMax || searchQuery || sortBy !== "newest") && (
                <button
                  type="button"
                  onClick={() => {
                    setAreaFilter("all");
                    setTypeFilter("all");
                    setBedroomFilter("all");
                    setPriceFilter("all");
                    setHandoverFilter("all");
                    setFurnishingFilter("all");
                    setDeveloperFilter("all");
                    setViewFilter("all");
                    setEmiratesFilter([]);
                    setSizeMin("");
                    setSizeMax("");
                    setSortBy("newest");
                    setSearchQuery("");
                  }}
                  className={cn(resetAllPill, "h-8")}
                >
                  Reset all
                </button>
              )}
            </div>
          </div>
        </div>
      </section>


      {/* Listings Grid */}
      <section className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] py-10 px-4 min-h-[60vh]">
        <div className="max-w-6xl mx-auto">
          {/* Results count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm font-semibold text-[#1A1A1A]">
              {filteredListings.length} {filteredListings.length === 1 ? "property" : "properties"} found
            </p>
          </div>


          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-72 rounded-2xl bg-[#EFE6D6]/10 animate-pulse" />
              ))}
            </div>
          ) : filteredListings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map((listing: any) => (
                <div
                  key={listing.id}
                  className="rounded-2xl border border-[#B89555]/30 bg-[#FDFBF7]/80 backdrop-blur-sm overflow-hidden hover:shadow-xl transition-shadow group"
                >
                  <div className="h-48 bg-[#EFE6D6] flex items-center justify-center relative">
                    {listing.images?.[0] ? (
                      <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-12 h-12 text-[#1A1A1A]/70" />
                    )}
                    {listing.is_premium && (
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-[#FDFBF7] text-[#1A1A1A] border border-[#B89555]/50 text-xs font-bold">
                          <Crown className="w-3 h-3 mr-1 text-[#B89555]" />
                          Premium
                        </Badge>
                      </div>

                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-[#1A1A1A] text-lg mb-1 group-hover:text-[#1A1A1A] transition-colors">
                      {listing.title}
                    </h3>
                    {listing.project_name && (
                      <p className="text-sm text-[#1A1A1A]/50 mb-2">{listing.project_name}</p>
                    )}
                    <div className="flex items-center gap-3 text-sm text-[#1A1A1A]/60 mb-3 flex-wrap">
                      {listing.area_name && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#1A1A1A]" />
                          {listing.area_name}
                        </span>
                      )}
                      {listing.bedrooms != null && (
                        <span className="flex items-center gap-1">
                          <BedDouble className="w-3.5 h-3.5 text-[#1A1A1A]" />
                          {listing.bedrooms === 0 ? "Studio" : `${listing.bedrooms} BR`}
                        </span>
                      )}
                      {listing.size_sqft && (
                        <span className="flex items-center gap-1">
                          <Maximize className="w-3.5 h-3.5 text-[#1A1A1A]" />
                          {Number(listing.size_sqft).toLocaleString()} sqft
                        </span>
                      )}
                    </div>
                    {listing.asking_price && (
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-[#1A1A1A]" />
                        <span className="text-xl font-bold text-[#1A1A1A]">
                          {listing.currency || "AED"} {Number(listing.asking_price).toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <Badge className="bg-[#FDFBF7] text-[#1A1A1A] border border-[#B89555]/40 text-xs">
                        {listing.handover_status === 'ready' ? 'Ready' : 'Under Construction'}
                      </Badge>
                      {listing.property_type && (
                        <Badge variant="outline" className="text-xs border-[#B89555]/40 text-[#1A1A1A]/70">
                          {listing.property_type}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      data-cta="dark"
                      data-allow-dark-cta
                      style={{ backgroundColor: "#0A0A0A", color: "#FFFFFF" }}
                      className="allow-white jj-cta-dark w-full mt-4 h-10 font-semibold rounded-xl"
                    >
                      Register Interest
                    </Button>


                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State — Premium navy + champagne + gold */
            <div className="max-w-5xl mx-auto text-center py-14 px-8 sm:px-14 md:px-20 rounded-2xl bg-[#FDFBF7] border border-[#B89555]/40 shadow-[0_8px_24px_rgba(10,10,10,0.06)]">
              <div className="w-20 h-20 rounded-2xl bg-[#EFE6D6] flex items-center justify-center mx-auto mb-6 border border-[#B89555]/40">
                <Building2 className="w-10 h-10 text-[#0A0A0A]" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-[#1A1A1A]">
                Recently Sold Out
              </h3>
              <p className="mb-2 font-medium text-[#1A1A1A]/80">
                The latest resale properties from our investor network have been snapped up.
                Our verified investors regularly list new opportunities — don't miss the next one.
              </p>
              <p className="text-sm mb-8 font-semibold text-[#1A1A1A]/70">
                Subscribe below to get notified when new resale properties become available.
              </p>

              {/* Subscribe CTA */}
              <div className="bg-[#EFE6D6] rounded-2xl p-6 border border-[#B89555]/40">
                <div className="flex items-center gap-2 justify-center mb-4">
                  <Bell className="w-5 h-5 text-[#0A0A0A]" />
                  <h4 className="font-semibold text-lg text-[#1A1A1A]">Stay in the Loop</h4>
                </div>
                <p className="text-sm mb-4 text-[#1A1A1A]/70">
                  Get instant alerts when our investors list new resale properties. Be the first to know.
                </p>
                {subscribed ? (
                  <div className="flex items-center gap-2 justify-center text-[color:var(--emerald-1)] font-semibold">
                    <Mail className="w-5 h-5" />
                    You're subscribed! We'll notify you of new listings.
                  </div>
                ) : (
                  <div className="flex gap-2 max-w-sm mx-auto">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={subscribeEmail}
                      onChange={(e) => setSubscribeEmail(e.target.value)}
                      className="flex-1 h-11 bg-[#FDFBF7] text-[#1A1A1A] border border-[#B89555]/40"
                    />
                    <Button
                      onClick={handleSubscribe}
                      variant="ghost"
                      data-cta="dark"
                      data-allow-dark-cta
                      style={{ backgroundColor: "#0A0A0A", color: "#FFFFFF" }}
                      className="allow-white jj-cta-dark font-semibold h-11 px-6 rounded-xl"
                    >
                      Subscribe
                    </Button>
                  </div>
                )}
              </div>

              {/* Links */}
              <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
                <Link to="/properties">
                  <Button
                    variant="ghost"
                    data-cta="dark"
                    data-allow-dark-cta
                    style={{ backgroundColor: "#0A0A0A", color: "#FFFFFF" }}
                    className="allow-white jj-cta-dark font-semibold h-11 px-6 rounded-xl"
                  >
                    Browse Off-Plan Properties
                  </Button>
                </Link>
                <Link to="/list-property?purpose=sale">
                  <Button
                    variant="outline"
                    className="jj-cta-outline font-semibold h-11 px-6 rounded-xl"
                    data-cta="outline"
                  >
                    List Your Property
                  </Button>
                </Link>
              </div>
            </div>

          )}
        </div>
      </section>

      {/* List Your Resale CTA band — connects /resale-properties → /list-property */}
      <section className="px-4 sm:px-6 md:px-10 py-10 md:py-14 bg-[#F7F2EA]">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl p-6 sm:p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5 bg-[#FDFBF7] border border-[#B89555]/40 shadow-[0_8px_24px_rgba(10,10,10,0.06)]">
            <div className="flex-1">
              <span
                data-allow-dark-cta
                data-no-contrast-guard
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] uppercase tracking-[0.18em] font-semibold mb-3 bg-[#0A0A0A] text-white border border-[#B89555]/40 allow-white"
              >
                Investor Resale
              </span>
              <h3 className="text-xl sm:text-2xl font-bold mb-2 text-[#1A1A1A]">
                Have a property to resell?
              </h3>
              <p className="text-sm sm:text-base text-[#1A1A1A]/70">
                List your property on JBJ's investor network — premium reach,
                transparent approval, and live status tracking in your dashboard.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Link to="/list-property?purpose=sale&mode=manual">
                <Button
                  variant="ghost"
                  data-cta="dark"
                  data-allow-dark-cta
                  style={{ backgroundColor: "#0A0A0A", color: "#FFFFFF" }}
                  className="allow-white jj-cta-dark font-semibold h-11 px-6 w-full sm:w-auto rounded-xl"
                >
                  List my property
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/list-property?purpose=sale&mode=ai">
                <Button
                  variant="outline"
                  data-cta="outline"
                  className="jj-cta-outline font-semibold h-11 px-6 w-full sm:w-auto rounded-xl"
                >
                  List with AI
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </>
  );
};

export default ResaleProperties;
