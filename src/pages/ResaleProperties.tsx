import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { Building2, MapPin, BedDouble, Maximize, DollarSign, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ResaleProperties = () => {
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: listings, isLoading } = useQuery({
    queryKey: ["resale-listings", areaFilter, typeFilter],
    queryFn: async () => {
      let query = supabase
        .from("resale_listings")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (areaFilter !== "all") query = query.eq("area_name", areaFilter);
      if (typeFilter !== "all") query = query.eq("property_type", typeFilter);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <>
      <SEOHead
        title="Resale Properties | JBJ Global Real Estate"
        description="Browse investor resale properties in Dubai. Premium properties at competitive prices from verified JBJ investors."
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <Badge className="bg-gold/20 text-gold border-gold/40 mb-4">JBJ Investor Network</Badge>
          <h1 className="text-3xl md:text-5xl font-bold text-black mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
            Resale Properties
          </h1>
          <p className="text-lg text-black/60 max-w-2xl mx-auto">
            Premium properties from our verified investors — ready for immediate purchase at competitive prices.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b border-gold/20 py-4 px-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center gap-4 flex-wrap">
          <Filter className="w-4 h-4 text-gold" />
          <Select value={areaFilter} onValueChange={setAreaFilter}>
            <SelectTrigger className="w-[180px] border-gold/30">
              <SelectValue placeholder="All Areas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Areas</SelectItem>
              <SelectItem value="Downtown Dubai">Downtown Dubai</SelectItem>
              <SelectItem value="Dubai Marina">Dubai Marina</SelectItem>
              <SelectItem value="Palm Jumeirah">Palm Jumeirah</SelectItem>
              <SelectItem value="Business Bay">Business Bay</SelectItem>
              <SelectItem value="JBR">JBR</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px] border-gold/30">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="apartment">Apartment</SelectItem>
              <SelectItem value="villa">Villa</SelectItem>
              <SelectItem value="townhouse">Townhouse</SelectItem>
              <SelectItem value="penthouse">Penthouse</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Listings Grid */}
      <section className="bg-[#FDFBF7] py-10 px-4 min-h-[60vh]">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-72 rounded-2xl bg-gold/10 animate-pulse" />
              ))}
            </div>
          ) : listings && listings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing: any) => (
                <div
                  key={listing.id}
                  className="rounded-2xl border border-gold/30 bg-white overflow-hidden hover:shadow-xl transition-shadow group"
                >
                  <div className="h-48 bg-gradient-to-br from-gold/10 to-gold/5 flex items-center justify-center">
                    {listing.images?.[0] ? (
                      <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-12 h-12 text-gold/30" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-black text-lg mb-1 group-hover:text-gold transition-colors">
                      {listing.title}
                    </h3>
                    {listing.project_name && (
                      <p className="text-sm text-black/50 mb-2">{listing.project_name}</p>
                    )}
                    <div className="flex items-center gap-3 text-sm text-black/60 mb-3">
                      {listing.area_name && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gold" />
                          {listing.area_name}
                        </span>
                      )}
                      {listing.bedrooms && (
                        <span className="flex items-center gap-1">
                          <BedDouble className="w-3.5 h-3.5 text-gold" />
                          {listing.bedrooms} BR
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
                          {listing.currency} {Number(listing.asking_price).toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="mt-3 flex items-center gap-2">
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
            <div className="text-center py-20">
              <Building2 className="w-16 h-16 text-gold/30 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-black mb-2">No Resale Properties Available</h3>
              <p className="text-black/50">Check back soon — our investors regularly list new properties.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default ResaleProperties;
