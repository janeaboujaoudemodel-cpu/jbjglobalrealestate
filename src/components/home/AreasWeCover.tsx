/**
 * AreasWeCover — Top Areas in Dubai
 * 3-per-row featured photo cards with high-contrast captions, premium hover,
 * and two CTAs: "Read Area Guides" + "Explore All Areas".
 */
import { Link } from "react-router-dom";
import { MapPin, ArrowRight, TrendingUp, Flame, BookOpen, Compass } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAreas } from "@/hooks/useAreas";
import { PearlButton } from "@/components/ui/pearl-button";

const AreasWeCover = () => {
  const { t } = useLanguage();
  const { data: areas, isLoading } = useAreas({ limit: 12 });

  const displayAreas = (areas ?? [])
    .slice()
    .sort((a, b) => {
      const score = (x: typeof a) =>
        (x.is_trending ? 2 : 0) + (x.is_high_demand ? 1 : 0);
      const diff = score(b) - score(a);
      if (diff !== 0) return diff;
      return (b.property_count ?? 0) - (a.property_count ?? 0);
    })
    .slice(0, 3)
    .map((a) => ({
      slug: a.slug,
      name: a.name,
      propertyCount: a.property_count,
      imageUrl: a.image_url,
      isTrending: a.is_trending,
      isHighDemand: a.is_high_demand,
    }));

  if (isLoading || displayAreas.length === 0) {
    return null;
  }

  return (
    <section className="bg-[#FDFBF7] pt-10 md:pt-14 pb-12 md:pb-16">
      <div className="jj-layer-2">
        <div className="text-center mb-8 md:mb-10">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#F7F2EA] border border-[#B89555]/30 rounded-full text-[10px] md:text-xs uppercase tracking-[0.2em] font-semibold mb-4">
            <MapPin className="w-3.5 h-3.5 text-[#1A1A1A]/70" />
            <span className="text-[#1A1A1A]">{t("areas.topLabel", "Top Areas")}</span>
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">
            {t("areas.topTitle", "Top Areas in Dubai")}
          </h2>
          <p className="mt-3 text-sm text-[#1A1A1A]/70 max-w-xl mx-auto">
            {t(
              "areas.topSubtitle",
              "The most trending and high-demand neighbourhoods our investors are watching right now."
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {displayAreas.map((area) => (
            <Link
              key={area.slug}
              to={`/area/${area.slug}`}
              className="group relative block h-[240px] md:h-[260px] rounded-2xl overflow-hidden border border-[#B89555]/30 bg-[#F7F2EA] transform-gpu will-change-transform transition-shadow duration-300 hover:shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
              style={{ contain: "layout paint" }}
            >
              {area.imageUrl ? (
                <div
                  className="absolute inset-0 bg-cover bg-center transform-gpu will-change-transform transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                  style={{ backgroundImage: `url(${area.imageUrl})` }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-7xl font-black text-[#1A1A1A]/10 select-none">JBJ</span>
                </div>
              )}

              {/* Soft top gradient so badges read clearly */}
              <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/55 to-transparent pointer-events-none" />

              {/* Badges — cream + ink + thin gold border (No-Gold-Fills rule) */}
              <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                {area.isTrending && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EFE6D6] text-[#1A1A1A] text-[10px] font-bold uppercase tracking-wider border border-[#B89555]/60 shadow-sm">
                    <TrendingUp className="w-2.5 h-2.5" />
                    Trending
                  </span>
                )}
                {area.isHighDemand && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EFE6D6] text-[#1A1A1A] text-[10px] font-bold uppercase tracking-wider border border-[#B89555]/60 shadow-sm">
                    <Flame className="w-2.5 h-2.5" />
                    High Demand
                  </span>
                )}
              </div>

              {/* Solid ink caption bar — maximum legibility for area name + count */}
              <div className="absolute bottom-0 left-0 right-0 bg-[#1A1A1A]/92 backdrop-blur-[2px] border-t border-[#B89555]/40 px-4 py-3">
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-[#FDFBF7] font-extrabold text-lg md:text-xl leading-tight tracking-tight truncate">
                      {area.name}
                    </h3>
                    <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B89555]">
                      {(area.propertyCount ?? 0).toLocaleString()} {(area.propertyCount ?? 0) === 1 ? "project" : "projects"} available
                    </p>
                  </div>
                  <span
                    data-no-contrast-guard
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#1A1A1A] transition-all group-hover:translate-y-[-1px]"
                    style={{
                      background: 'linear-gradient(145deg, #F7F1E6 0%, #E8D6AE 50%, #C8A766 100%)',
                      border: '1px solid #B89555',
                      boxShadow:
                        'inset 0 1px 0 rgba(255,255,255,0.85), inset 0 -1px 0 rgba(120,90,30,0.35), 0 4px 10px rgba(120,90,30,0.45), 0 0 0 1px rgba(184,149,85,0.35)',
                    }}
                  >
                    Explore
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Dual CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10 md:mt-12">
          <Link
            to="/area-guides"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1A1A1A] text-white rounded-xl font-semibold text-sm hover:bg-[#1A1A1A]/90 transition-colors border border-[#1A1A1A]"
          >
            <BookOpen className="w-4 h-4" />
            <span>{t("areas.readGuides", "Read Area Guides")}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/areas"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#FDFBF7] text-[#1A1A1A] border border-[#B89555]/40 rounded-xl font-semibold text-sm hover:bg-[#F7F2EA] transition-colors"
          >
            <Compass className="w-4 h-4" />
            <span>{t("areas.exploreAll", "Explore All Areas")}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AreasWeCover;
