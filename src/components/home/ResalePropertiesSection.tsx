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
        .from("resale_listings_public")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!isLoading && (!listings || listings.length === 0)) return null;

  return (
    <section className="bg-[#FDFBF7]">
      <div className="jj-layer-2">
        <div className="bg-[#F7F2EA] border border-[#B89555]/30 rounded-2xl p-6 md:p-10 relative overflow-hidden">
          <div className="relative z-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div>
                <Badge className="bg-[#F7F2EA] text-[#1A1A1A]/70 border-[#B89555]/30 mb-3">
                  <Crown className="w-3 h-3 mr-1" />
                  Investor Network
                </Badge>
                <h2
                  className="text-2xl md:text-3xl font-bold text-[#0A0A0A]"
                >
                  Resale Properties
                </h2>
                <p className="text-sm text-[#1A1A1A]/70 mt-1.5 max-w-md">
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
                  <div key={i} className="h-64 rounded-2xl bg-[#F7F2EA] animate-pulse" />
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
                      <div className="rounded-2xl border border-[#B89555]/30 bg-[#FDFBF7] overflow-hidden hover:shadow-lg hover:border-[#B89555]/30 transition-all duration-300 hover:-translate-y-0.5">
                        {/* Image */}
                        <div className="h-40 bg-[#F7F2EA] flex items-center justify-center relative">
                          {listing.images?.[0] ? (
                            <img
                              src={listing.images[0]}
                              alt={listing.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                             decoding="async" />
                          ) : (
                            <Building2 className="w-10 h-10 text-[#1A1A1A]/70" />
                          )}
                          {listing.handover_status && (
                            <Badge className="absolute top-2 left-2 bg-[#1A1A1A] text-white text-[10px] font-semibold">
                              {listing.handover_status === "ready" ? "Ready" : "Under Construction"}
                            </Badge>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-3.5">
                          <h3 className="font-bold text-[#1A1A1A] text-sm mb-1 group-hover:text-[#1A1A1A] transition-colors line-clamp-1">
                            {listing.title}
                          </h3>
                          {listing.project_name && (
                            <p className="text-xs text-[#1A1A1A]/70 mb-2 line-clamp-1">{listing.project_name}</p>
                          )}
                          <div className="flex items-center gap-2.5 text-xs text-[#1A1A1A]/70 mb-2.5 flex-wrap">
                            {listing.area_name && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-[#1A1A1A]/70" />
                                {listing.area_name}
                              </span>
                            )}
                            {listing.bedrooms != null && (
                              <span className="flex items-center gap-1">
                                <BedDouble className="w-3 h-3 text-[#1A1A1A]/70" />
                                {listing.bedrooms === 0 ? "Studio" : `${listing.bedrooms} BR`}
                              </span>
                            )}
                            {listing.size_sqft && (
                              <span className="flex items-center gap-1">
                                <Maximize className="w-3 h-3 text-[#1A1A1A]/70" />
                                {Number(listing.size_sqft).toLocaleString()} sqft
                              </span>
                            )}
                          </div>
                          {listing.asking_price && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3.5 h-3.5 text-[#1A1A1A]/70" />
                              <span className="text-base font-bold text-[#1A1A1A]">
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
