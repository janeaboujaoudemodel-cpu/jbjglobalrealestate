/**
 * AreasWeCover Component - Featured Photo Cards
 * 8 areas, 2 rows of 4, with full-bleed photos, trending/high-demand badges, property count
 */

import { Link } from "react-router-dom";
import { MapPin, ArrowRight, TrendingUp, Flame } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAreas } from "@/hooks/useAreas";

const AreasWeCover = () => {
  const { t } = useLanguage();
  const { data: areas, isLoading } = useAreas({ limit: 8 });

  const displayAreas = areas && areas.length > 0
    ? areas.map(a => ({
        slug: a.slug,
        name: a.name,
        propertyCount: a.property_count,
        imageUrl: a.image_url,
        isTrending: a.is_trending,
        isHighDemand: a.is_high_demand,
      }))
    : [];

  if (isLoading || displayAreas.length === 0) {
    return null;
  }

  return (
    <section className="bg-white pt-8 md:pt-12">
      <div className="jj-layer-2">
        {/* Section Header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-300 rounded-full text-xs uppercase tracking-[0.2em] font-semibold mb-4">
            <MapPin className="w-3.5 h-3.5 text-gray-600" />
            <span className="text-black">{t('areas.label', 'Explore Areas')}</span>
          </span>
          <h2
            className="text-2xl md:text-3xl font-bold text-black"
          >
            {t('areas.title', 'Areas We Cover')}
          </h2>
        </div>

        {/* Featured Photo Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {displayAreas.map((area, index) => (
            <div
              key={area.slug}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <Link
                to={`/area/${area.slug}`}
                className="group relative block h-[200px] md:h-[220px] rounded-xl overflow-hidden border border-gray-200 hover:border-gray-400 transition-all duration-300 hover:shadow-lg hover:-translate-y-1.5"
              >
                {/* Background photo or fallback */}
                {area.imageUrl ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url(${area.imageUrl})` }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                    <span
                      className="text-6xl font-black text-black select-none"
                      style={{ opacity: 0.1 }}
                    >
                      JBJ
                    </span>
                  </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                {/* Top-right badges */}
                <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                  {area.isTrending && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/80 text-white text-[9px] font-bold uppercase tracking-wider shadow-lg">
                      <TrendingUp className="w-2.5 h-2.5" />
                      Trending
                    </span>
                  )}
                  {area.isHighDemand && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-[9px] font-bold uppercase tracking-wider shadow-lg">
                      <Flame className="w-2.5 h-2.5" />
                      High Demand
                    </span>
                  )}
                </div>

                {/* Bottom content */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  {area.propertyCount != null && area.propertyCount > 0 && (
                    <span className="inline-block mb-1.5 px-2 py-0.5 rounded-full bg-black/60 text-white text-[9px] font-semibold tracking-wide border border-white/20">
                      {area.propertyCount} Projects
                    </span>
                  )}
                  <h3 className="text-white font-bold text-sm md:text-base leading-tight drop-shadow-lg group-hover:text-gray-200 transition-colors duration-300">
                    {area.name}
                  </h3>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* View All Areas CTA */}
        <div className="text-center mt-10 mb-14">
          <Link
            to="/areas"
            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white border border-gray-800 rounded-xl font-semibold text-sm hover:bg-gray-800 hover:-translate-y-0.5 transition-all duration-300 group"
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
