/**
 * AreaDetail Component - Premium Area Detail Page
 * Full-screen hero, projects grid, developers, map, AI analyzer
 */

import { useParams, Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, ArrowRight, Loader2, Phone, ArrowUpRight } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { useAreaBySlug, useAreas } from "@/hooks/useAreas";
import { AreaHeroSection } from "@/components/area-detail/AreaHeroSection";
import { AreaProjectsGrid } from "@/components/area-detail/AreaProjectsGrid";
import { AreaDevelopersBar } from "@/components/area-detail/AreaDevelopersBar";
import { AreaMapSection } from "@/components/area-detail/AreaMapSection";
import { AreaAIAnalyzer } from "@/components/area-detail/AreaAIAnalyzer";

const AreaDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: area, isLoading } = useAreaBySlug(slug);
  const { data: allAreas } = useAreas({ limit: 20 });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-gold animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading area...</p>
        </div>
      </div>
    );
  }

  if (!area && !isLoading) {
    return <Navigate to="/areas" replace />;
  }

  if (!area) return null;

  const relatedAreas = allAreas?.filter(a => a.id !== area.id && a.emirate === area.emirate).slice(0, 4) || [];

  return (
    <div className="min-h-screen bg-black">
      <SEOHead 
        title={`${area.name} - Real Estate in ${area.emirate} | JBJ`}
        description={area.description || `Explore properties in ${area.name}, ${area.emirate}.`}
        keywords={`${area.name} properties, ${area.emirate} real estate`}
        canonicalPath={`/area/${area.slug}`}
      />

      {/* Full-Screen Hero with Real Photo */}
      <AreaHeroSection area={area as any} />

      {/* Projects Grid */}
      <AreaProjectsGrid areaName={area.name} areaSlug={area.slug} />

      {/* Developers Bar */}
      <AreaDevelopersBar areaName={area.name} />

      {/* Interactive Map */}
      <AreaMapSection areaName={area.name} areaLat={area.latitude} areaLng={area.longitude} />

      {/* AI Area Intelligence */}
      <AreaAIAnalyzer areaName={area.name} emirate={area.emirate} />

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
        <div className="container mx-auto px-4">
          <motion.div 
            className="max-w-4xl mx-auto text-center bg-white rounded-3xl p-10 md:p-12 border border-gold/30 shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-black text-2xl md:text-3xl font-bold mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
              Explore Properties in {area.name}
            </h2>
            <p className="text-zinc-600 text-lg mb-8 max-w-2xl mx-auto">
              Browse our collection of verified properties in this area.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to={`/properties?area=${area.slug}`}>
                <Button variant="dark" className="px-8 py-6 text-base">
                  View Properties
                  <ArrowUpRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="secondary" className="border-black text-black hover:bg-black hover:text-white px-8 py-6 text-base">
                  <Phone className="w-5 h-5 mr-2" />
                  Contact Us
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Related Areas */}
      {relatedAreas.length > 0 && (
        <section className="py-16 bg-black">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-white text-2xl md:text-3xl font-bold mb-8 text-center" style={{ fontFamily: "Poppins, sans-serif" }}>
                Other Areas in {area.emirate}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                {relatedAreas.map((relatedArea) => (
                  <Link 
                    key={relatedArea.slug}
                    to={`/area/${relatedArea.slug}`}
                    className="group overflow-hidden rounded-xl border border-gold/30 hover:border-gold hover:shadow-xl transition-all"
                  >
                    {relatedArea.image_url ? (
                      <img src={relatedArea.image_url} alt={relatedArea.name} className="w-full h-28 object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-28 bg-zinc-800 flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-gold/40" />
                      </div>
                    )}
                    <div className="p-3 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
                      <h3 className="text-black font-semibold text-sm group-hover:text-gold transition-colors">{relatedArea.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-zinc-500 mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>{relatedArea.emirate}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="text-center mt-8">
                <Link to="/areas" className="text-gold hover:text-gold-light transition-colors inline-flex items-center gap-2">
                  View All Areas <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      )}
    </div>
  );
};

export default AreaDetail;
