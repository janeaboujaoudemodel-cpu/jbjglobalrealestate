/**
 * AreasWeCover Component - Master Blueprint Specification
 * 12 area links auto-populated grid from database
 */

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAreas } from "@/hooks/useAreas";

const AreasWeCover = () => {
  const { t } = useLanguage();
  const { data: areas, isLoading } = useAreas({ limit: 12 });

  // Only show areas if we have data from the database - no static fallbacks
  const displayAreas = areas && areas.length > 0 
    ? areas.map(a => ({ slug: a.slug, name: a.name, propertyCount: a.property_count }))
    : [];

  // Don't render anything if no database areas
  if (isLoading || displayAreas.length === 0) {
    return null;
  }

  return (
    <section className="bg-black">
      <div className="jj-layer-2">
        {/* Section Header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold rounded-full text-xs uppercase tracking-[0.2em] font-semibold mb-4">
            <MapPin className="w-3.5 h-3.5 text-gold" />
            <span className="text-black">{t('areas.label', 'Explore Dubai')}</span>
          </span>
          <h2 
            className="text-2xl md:text-3xl font-bold text-black"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {t('areas.title', 'Areas We Cover')}
          </h2>
        </div>

        {/* Areas Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
          {displayAreas.map((area, index) => (
            <motion.div
              key={area.slug}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Link
                to={`/area/${area.slug}`}
                className="group flex items-center justify-center min-h-[72px] p-4 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] rounded-xl border-2 border-gold/20 hover:border-gold transition-all duration-300 hover:shadow-[0_4px_20px_rgba(200,167,102,0.3)] hover:-translate-y-0.5 text-center"
              >
                <h3 className="text-black font-semibold text-sm group-hover:text-gold transition-colors line-clamp-2">
                  {area.name}
                </h3>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* View All Areas CTA - Premium Button Style */}
        <div className="text-center mt-8">
          <Link
            to="/areas"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold rounded-xl text-black font-semibold text-sm hover:shadow-[0_4px_20px_rgba(200,167,102,0.4)] hover:-translate-y-0.5 transition-all duration-300 group"
            style={{
              boxShadow: `
                0 6px 20px rgba(200,167,102,0.3),
                0 4px 10px rgba(0,0,0,0.15),
                inset 0 2px 4px rgba(255,255,255,0.8)
              `,
            }}
          >
            <span>{t('areas.viewAll', 'View All Areas')}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AreasWeCover;
