import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2, MapPin, BedDouble, Maximize, DollarSign, ArrowRight, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const ResalePropertiesSection = () => {
  const { data: listings, isLoading } = useQuery({
    queryKey: ["resale-listings-homepage"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resale_listings")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Don't render section if no listings
  if (!isLoading && (!listings || listings.length === 0)) return null;

  return (
    <section className="bg-black">
      <div className="jj-layer-2">
        <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/40 md:border-2 rounded-xl md:rounded-3xl p-6 md:p-10 shadow-xl relative overflow-hidden">
          {/* Ambient glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div>
                <Badge className="bg-gold/20 text-gold border-gold/40 mb-3">
                  <Crown className="w-3 h-3 mr-1" />
                  Investor Network
                </Badge>
                <h2
                  className="text-2xl md:text-3xl font-bold text-black"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  Resale <span className="text-gold">Properties</span>
                </h2>
                <p className="text-sm text-black/60 mt-1.5 max-w-md">
                  Premium properties from verified JBJ investors — ready for immediate purchase.
                </p>
              </div>
              <Link to="/resale-properties">
                <Button variant="secondary" className="gap-2 whitespace-nowrap">
                  View All <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {/* Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-64 rounded-2xl bg-gold/10 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {listings!.slice(0, 6).map((listing, idx) => (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: idx * 0.08 }}
                  >
                    <Link to="/resale-properties" className="block group">
                      <div className="rounded-2xl border border-gold/30 bg-white/80 backdrop-blur-sm overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                        {/* Image */}
                        <div className="h-40 bg-gradient-to-br from-gold/10 to-gold/5 flex items-center justify-center relative">
                          {listing.images?.[0] ? (
                            <img
                              src={listing.images[0]}
                              alt={listing.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <Building2 className="w-10 h-10 text-gold/30" />
                          )}
                          {listing.handover_status && (
                            <Badge className="absolute top-2 left-2 bg-gold/90 text-black text-[10px] font-semibold">
                              {listing.handover_status === "ready" ? "Ready" : "Under Construction"}
                            </Badge>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-3.5">
                          <h3 className="font-bold text-black text-sm mb-1 group-hover:text-gold transition-colors line-clamp-1">
                            {listing.title}
                          </h3>
                          {listing.project_name && (
                            <p className="text-xs text-black/50 mb-2 line-clamp-1">{listing.project_name}</p>
                          )}
                          <div className="flex items-center gap-2.5 text-xs text-black/60 mb-2.5 flex-wrap">
                            {listing.area_name && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-gold" />
                                {listing.area_name}
                              </span>
                            )}
                            {listing.bedrooms != null && (
                              <span className="flex items-center gap-1">
                                <BedDouble className="w-3 h-3 text-gold" />
                                {listing.bedrooms === 0 ? "Studio" : `${listing.bedrooms} BR`}
                              </span>
                            )}
                            {listing.size_sqft && (
                              <span className="flex items-center gap-1">
                                <Maximize className="w-3 h-3 text-gold" />
                                {Number(listing.size_sqft).toLocaleString()} sqft
                              </span>
                            )}
                          </div>
                          {listing.asking_price && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3.5 h-3.5 text-gold" />
                              <span className="text-base font-bold text-black">
                                {listing.currency || "AED"} {Number(listing.asking_price).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Bottom CTA */}
            <div className="text-center mt-8">
              <Link to="/resale-properties">
                <Button variant="primary" size="lg" className="gap-2 px-8">
                  Browse All Resale Properties
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResalePropertiesSection;
