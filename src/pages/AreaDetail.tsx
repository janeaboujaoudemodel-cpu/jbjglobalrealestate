/**
 * AreaDetail Component - Premium Area Detail Page
 * Full-screen hero, projects grid, developers, map, AI analyzer
 */

import { useState, useEffect } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, ArrowRight, Loader2, Phone, ArrowUpRight } from "lucide-react";
import jbjMonogram from "@/assets/jbj-monogram-light-bg.png";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { useAreaBySlug, useAreas } from "@/hooks/useAreas";
import { AreaHeroSection } from "@/components/area-detail/AreaHeroSection";
import { AreaAboutSection } from "@/components/area-detail/AreaAboutSection";
import { AreaProjectsGrid } from "@/components/area-detail/AreaProjectsGrid";
import { AreaDevelopersBar } from "@/components/area-detail/AreaDevelopersBar";
import { AreaMapSection } from "@/components/area-detail/AreaMapSection";
import { MapErrorBoundary } from "@/components/MapErrorBoundary";
import { AreaAIAnalyzer } from "@/components/area-detail/AreaAIAnalyzer";
import DLDMarketWidget from "@/components/shared/DLDMarketWidget";
import PropertiesVerticalNav from "@/components/navigation/PropertiesVerticalNav";

const AreaDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: area, isLoading } = useAreaBySlug(slug);
  const { data: allAreas } = useAreas({ limit: 20 });
  const [isFilterFixed, setIsFilterFixed] = useState(false);

  // Detect when AreaProjectsGrid sets filter-bar-fixed on body
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsFilterFixed(document.body.classList.contains('filter-bar-fixed'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

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
    <div className={`min-h-screen bg-black flex ${isFilterFixed ? '' : ''}`}>
      {/* Vertical Nav when filter bar replaces header */}
      {isFilterFixed && (
        <div className="hidden lg:block fixed left-0 top-0 h-screen z-[9997]">
          <PropertiesVerticalNav />
        </div>
      )}
      <div className={`flex-1 ${isFilterFixed ? 'lg:ml-[200px]' : ''} transition-all duration-200`}>
      <SEOHead 
        title={`${area.name} - Real Estate in ${area.emirate} | JBJ`}
        description={area.description || `Explore properties in ${area.name}, ${area.emirate}.`}
        keywords={`${area.name} properties, ${area.emirate} real estate`}
        canonicalPath={`/area/${area.slug}`}
      />

      {/* Full-Screen Hero with Real Photo */}
      <AreaHeroSection area={area as any} />

      {/* About This Area */}
      <AreaAboutSection area={area as any} />

      {/* Projects Grid */}
      <div id="projects-section">
        <AreaProjectsGrid areaName={area.name} areaSlug={area.slug} />
      </div>

      {/* Developers Bar */}
      <AreaDevelopersBar areaName={area.name} />

      {/* Interactive Map */}
      <MapErrorBoundary>
        <AreaMapSection areaName={area.name} areaLat={area.latitude} areaLng={area.longitude} />
      </MapErrorBoundary>

      {/* DLD Market Intelligence */}
      <DLDMarketWidget highlightArea={area.name} />

      {/* AI Area Intelligence */}
      <AreaAIAnalyzer areaName={area.name} emirate={area.emirate} />

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] relative overflow-hidden">
        {/* Ambient glow effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gold/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="max-w-4xl mx-auto text-center rounded-3xl p-10 md:p-14 border-2 border-gold/30 relative overflow-hidden bg-white/70 backdrop-blur-sm"
            style={{
              boxShadow: '0 30px 80px -20px rgba(200,167,102,0.15), 0 0 60px rgba(200,167,102,0.05)',
            }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {/* Gold accent line at top */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-16 h-16 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-gold to-transparent" />
              <div className="absolute top-0 left-0 h-full w-[2px] bg-gradient-to-b from-gold to-transparent" />
            </div>
            <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none">
              <div className="absolute top-0 right-0 w-full h-[2px] bg-gradient-to-l from-gold to-transparent" />
              <div className="absolute top-0 right-0 h-full w-[2px] bg-gradient-to-b from-gold to-transparent" />
            </div>
            
            <div className="w-14 h-14 rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-7 h-7 text-gold" />
            </div>
            <h2 className="text-black text-2xl md:text-3xl lg:text-4xl font-bold mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
              Explore Properties in {area.name}
            </h2>
            <p className="text-black/50 text-lg mb-10 max-w-2xl mx-auto">
              Browse our curated collection of verified properties in this premium neighborhood.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to={`/properties?area=${area.slug}`}>
                <Button className="px-8 py-6 text-base bg-black text-white font-bold border border-black hover:bg-black/80 hover:shadow-[0_0_30px_rgba(0,0,0,0.2)] hover:scale-105 transition-all duration-300 rounded-xl">
                  View Properties
                  <ArrowUpRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="secondary" className="border-2 border-black/20 text-black hover:bg-black hover:text-white px-8 py-6 text-base font-bold transition-all duration-300 rounded-xl bg-transparent">
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
        <section className="py-16 bg-gradient-to-b from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] relative overflow-hidden">
          {/* Subtle decorative elements */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
          <div className="absolute top-10 left-10 w-40 h-40 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-black text-2xl md:text-3xl font-bold mb-2 text-center" style={{ fontFamily: "Poppins, sans-serif" }}>
                Explore More Trending Areas
              </h2>
              <p className="text-black/50 text-center mb-8">Discover premium neighborhoods across {area.emirate}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                {relatedAreas.map((relatedArea) => (
                  <Link 
                    key={relatedArea.slug}
                    to={`/area/${relatedArea.slug}`}
                    className="group overflow-hidden rounded-xl border border-gold/30 hover:border-gold hover:shadow-xl transition-all flex flex-col h-full"
                  >
                    {relatedArea.image_url ? (
                      <img src={relatedArea.image_url} alt={relatedArea.name} className="w-full h-36 object-cover flex-shrink-0 transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                    ) : (
                      <div className="w-full h-36 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] flex items-center justify-center flex-shrink-0">
                        <img src={jbjMonogram} alt="" className="w-12 h-12 object-contain opacity-10" />
                      </div>
                    )}
                    <div className="p-3 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] flex-1 flex flex-col justify-center">
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
                <Link to="/areas" className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-full shadow-[0_4px_15px_rgba(200,167,102,0.3)] hover:shadow-[0_6px_25px_rgba(200,167,102,0.5)] hover:scale-105 transition-all duration-300 border border-gold/40">
                  View All Areas <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      )}
      </div>
    </div>
  );
};

export default AreaDetail;
