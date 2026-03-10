import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { useAreas } from "@/hooks/useAreas";
import { Building2, MapPin, BedDouble, Maximize, DollarSign, Search, Calendar, Crown, Bell, Mail, ArrowLeft, Sofa } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

  const { data: areas } = useAreas();

  const areasSorted = useMemo(() => {
    if (!areas) return [];
    return [...areas].sort((a, b) => a.name.localeCompare(b.name));
  }, [areas]);

  const { data: listings, isLoading } = useQuery({
    queryKey: ["resale-listings", areaFilter, typeFilter, bedroomFilter, handoverFilter, priceFilter, furnishingFilter],
    queryFn: async () => {
      let query = supabase
        .from("resale_listings")
        .select("*")
        .eq("status", "active")
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

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const filteredListings = useMemo(() => {
    if (!listings) return [];
    if (!searchQuery.trim()) return listings;
    const q = searchQuery.toLowerCase();
    return listings.filter((l: any) =>
      (l.title || "").toLowerCase().includes(q) ||
      (l.project_name || "").toLowerCase().includes(q) ||
      (l.area_name || "").toLowerCase().includes(q)
    );
  }, [listings, searchQuery]);

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
      <section className="relative bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] py-12 md:py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <Link to="/properties" className="inline-flex items-center gap-2 text-gold hover:underline text-sm mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Properties
          </Link>
          <Badge className="bg-gold/20 text-gold border-gold/40 mb-4 block w-fit mx-auto">Exclusive — JBJ Global Real Estate</Badge>
          <h1 className="text-3xl md:text-5xl font-bold text-black mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
            Exclusive Resale <span className="text-gold">Properties</span>
          </h1>
          <p className="text-lg text-black/60 max-w-2xl mx-auto">
            Exclusive investor resale portfolio curated by JBJ Global Real Estate — premium properties from verified investors at competitive prices, available for immediate purchase.
          </p>
        </div>
      </section>

      {/* Filters - Champagne bar connected to hero (no black gap) */}
      <section className="z-40 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] py-3 md:py-4 border-b border-gold/30 sticky top-0">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="bg-white/60 border border-gold/30 rounded-2xl p-4 sm:p-5 shadow-lg backdrop-blur-sm">
            {/* Search Bar */}
            <div className="relative w-full mb-3">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold" />
              <Input
                placeholder="Search by property name, project, area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 pl-12 pr-4 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black placeholder:text-zinc-500 focus:border-gold rounded-lg text-base shadow-sm w-full"
              />
            </div>

            {/* Filter Row */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Area */}
              <Select value={areaFilter} onValueChange={setAreaFilter}>
                <SelectTrigger className="w-[170px] h-11 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black rounded-xl text-sm shadow-sm">
                  <MapPin className="w-4 h-4 mr-2 text-gold flex-shrink-0" />
                  <span className="truncate text-left flex-1">{areaFilter === "all" ? "All Areas" : areaFilter}</span>
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="all">All Areas</SelectItem>
                  {areasSorted.map((area) => (
                    <SelectItem key={area.id} value={area.name}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Property Type */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px] h-11 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black rounded-xl text-sm shadow-sm">
                  <Building2 className="w-4 h-4 mr-2 text-gold flex-shrink-0" />
                  <span className="truncate text-left flex-1">{typeFilter === "all" ? "All Types" : typeFilter}</span>
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Bedrooms */}
              <Select value={bedroomFilter} onValueChange={setBedroomFilter}>
                <SelectTrigger className="w-[130px] h-11 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black rounded-xl text-sm shadow-sm">
                  <BedDouble className="w-4 h-4 mr-2 text-gold flex-shrink-0" />
                  <span className="truncate text-left flex-1">{BEDROOM_OPTIONS.find(b => b.value === bedroomFilter)?.label || "Any Beds"}</span>
                </SelectTrigger>
                <SelectContent>
                  {BEDROOM_OPTIONS.map((b) => (
                    <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Price */}
              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger className="w-[150px] h-11 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black rounded-xl text-sm shadow-sm">
                  <DollarSign className="w-4 h-4 mr-2 text-gold flex-shrink-0" />
                  <span className="truncate text-left flex-1">{PRICE_RANGES.find(p => p.value === priceFilter)?.label || "Any Price"}</span>
                </SelectTrigger>
                <SelectContent>
                  {PRICE_RANGES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Handover */}
              <Select value={handoverFilter} onValueChange={setHandoverFilter}>
                <SelectTrigger className="w-[160px] h-11 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black rounded-xl text-sm shadow-sm">
                  <Calendar className="w-4 h-4 mr-2 text-gold flex-shrink-0" />
                  <span className="truncate text-left flex-1">{HANDOVER_OPTIONS.find(h => h.value === handoverFilter)?.label || "All Status"}</span>
                </SelectTrigger>
                <SelectContent>
                  {HANDOVER_OPTIONS.map((h) => (
                    <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Clear */}
              {(areaFilter !== "all" || typeFilter !== "all" || bedroomFilter !== "all" || priceFilter !== "all" || handoverFilter !== "all" || furnishingFilter !== "all" || searchQuery) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAreaFilter("all");
                    setTypeFilter("all");
                    setBedroomFilter("all");
                    setPriceFilter("all");
                    setHandoverFilter("all");
                    setFurnishingFilter("all");
                    setSearchQuery("");
                  }}
                  className="h-11 px-4 border-gold/40 text-black hover:bg-gold/10 rounded-xl"
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Listings Grid */}
      <section className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] py-10 px-4 min-h-[60vh]">
        <div className="max-w-6xl mx-auto">
          {/* Results count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-black/50">
              {filteredListings.length} {filteredListings.length === 1 ? "property" : "properties"} found
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-72 rounded-2xl bg-gold/10 animate-pulse" />
              ))}
            </div>
          ) : filteredListings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map((listing: any) => (
                <div
                  key={listing.id}
                  className="rounded-2xl border border-gold/30 bg-white/80 backdrop-blur-sm overflow-hidden hover:shadow-xl transition-shadow group"
                >
                  <div className="h-48 bg-gradient-to-br from-gold/10 to-gold/5 flex items-center justify-center relative">
                    {listing.images?.[0] ? (
                      <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-12 h-12 text-gold/30" />
                    )}
                    {listing.is_premium && (
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-gold text-black text-xs font-bold">
                          <Crown className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-black text-lg mb-1 group-hover:text-gold transition-colors">
                      {listing.title}
                    </h3>
                    {listing.project_name && (
                      <p className="text-sm text-black/50 mb-2">{listing.project_name}</p>
                    )}
                    <div className="flex items-center gap-3 text-sm text-black/60 mb-3 flex-wrap">
                      {listing.area_name && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gold" />
                          {listing.area_name}
                        </span>
                      )}
                      {listing.bedrooms != null && (
                        <span className="flex items-center gap-1">
                          <BedDouble className="w-3.5 h-3.5 text-gold" />
                          {listing.bedrooms === 0 ? "Studio" : `${listing.bedrooms} BR`}
                        </span>
                      )}
                      {listing.size_sqft && (
                        <span className="flex items-center gap-1">
                          <Maximize className="w-3.5 h-3.5 text-gold" />
                          {Number(listing.size_sqft).toLocaleString()} sqft
                        </span>
                      )}
                    </div>
                    {listing.asking_price && (
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-gold" />
                        <span className="text-xl font-bold text-black">
                          {listing.currency || "AED"} {Number(listing.asking_price).toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <Badge className="bg-gold/10 text-gold border-gold/30 text-xs">
                        {listing.handover_status === 'ready' ? 'Ready' : 'Under Construction'}
                      </Badge>
                      {listing.property_type && (
                        <Badge variant="outline" className="text-xs border-gold/20 text-black/50">
                          {listing.property_type}
                        </Badge>
                      )}
                    </div>
                    <Button className="w-full mt-4 bg-gold hover:bg-gold/90 text-black font-semibold">
                      Register Interest
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State — Premium champagne design */
            <div className="max-w-xl mx-auto text-center py-16">
              <div className="w-20 h-20 rounded-2xl bg-gold/15 border border-gold/30 flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-10 h-10 text-gold" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-3" style={{ fontFamily: "Poppins, sans-serif" }}>
                Recently Sold Out
              </h3>
              <p className="text-black/60 mb-2">
                The latest resale properties from our investor network have been snapped up.
                Our verified investors regularly list new opportunities — don't miss the next one.
              </p>
              <p className="text-black/40 text-sm mb-8">
                Subscribe below to get notified when new resale properties become available.
              </p>

              {/* Subscribe CTA */}
              <div className="bg-white/80 border border-gold/30 rounded-2xl p-6 backdrop-blur-sm shadow-sm">
                <div className="flex items-center gap-2 justify-center mb-4">
                  <Bell className="w-5 h-5 text-gold" />
                  <h4 className="font-semibold text-black text-lg">Stay in the Loop</h4>
                </div>
                <p className="text-sm text-black/60 mb-4">
                  Get instant alerts when our investors list new resale properties. Be the first to know.
                </p>
                {subscribed ? (
                  <div className="flex items-center gap-2 justify-center text-emerald-600 font-semibold">
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
                      className="flex-1 h-11 border-gold/40 bg-gradient-to-br from-[#FDFBF7] to-[#EDE4D3] text-black"
                    />
                    <Button
                      onClick={handleSubscribe}
                      className="bg-gold hover:bg-gold/90 text-black font-semibold h-11 px-6"
                    >
                      Subscribe
                    </Button>
                  </div>
                )}
              </div>

              {/* Links */}
              <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
                <Link to="/properties">
                  <Button variant="outline" className="border-gold/40 text-gold hover:bg-gold/10">
                    Browse Off-Plan Properties
                  </Button>
                </Link>
                <Link to="/listing-portal">
                  <Button variant="outline" className="border-gold/40 text-gold hover:bg-gold/10">
                    List Your Property
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default ResaleProperties;
