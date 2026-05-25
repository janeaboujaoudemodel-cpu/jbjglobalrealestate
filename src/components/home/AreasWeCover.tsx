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
    <section className="bg-[#FDFBF7] py-12 md:py-20">
      <div className="w-full px-4 md:px-8">
        {/* Premium navy frame */}
        <div className="relative max-w-[1400px] mx-auto rounded-[28px] border border-[#102540] bg-gradient-to-b from-[#FDFBF7] to-[#F7F2EA] p-6 md:p-10 lg:p-12 shadow-[0_30px_80px_-40px_rgba(16,37,64,0.45)]">
          {/* Inner hairline (gold) for double-frame depth */}
          <div className="pointer-events-none absolute inset-2 rounded-[22px] border border-[#B89555]/35" aria-hidden="true" />
          {/* Corner accents */}
          <span className="pointer-events-none absolute -top-px left-10 right-10 h-px bg-gradient-to-r from-transparent via-[#B89555]/60 to-transparent" aria-hidden="true" />

          <div className="relative text-center mb-8 md:mb-10">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#102540] rounded-full text-[10px] md:text-xs uppercase tracking-[0.22em] font-semibold mb-4 border border-[#B89555]/40 allow-white" data-no-contrast-guard>
              <MapPin className="w-3.5 h-3.5 text-white" />
              <span className="text-white">{t("areas.topLabel", "Top Areas")}</span>
            </span>
            <h2 className="text-2xl md:text-4xl font-bold text-[#102540] tracking-tight">
              {t("areas.topTitle", "Top Areas in Dubai")}
            </h2>
            <div className="mx-auto mt-3 h-px w-16 bg-[#102540]/30" />
            <p className="mt-4 text-sm md:text-base text-[#1A1A1A]/70 max-w-xl mx-auto">
              {t(
                "areas.topSubtitle",
                "The most trending and high-demand neighbourhoods our investors are watching right now."
              )}
            </p>
          </div>


          <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">

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

              {/* Subtle top gradient so badges read clearly without darkening the image */}
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />

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

              {/* Champagne caption bar — ink text, gold hairline (no dark fills) */}
              <div className="absolute bottom-0 left-0 right-0 bg-[#FDFBF7]/95 backdrop-blur-md border-t border-[#B89555]/40 px-4 py-3">
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-[#1A1A1A] font-extrabold text-lg md:text-xl leading-tight tracking-tight truncate">
                      {area.name}
                    </h3>
                    <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#1A1A1A]/70">
                      {(area.propertyCount ?? 0).toLocaleString()} {(area.propertyCount ?? 0) === 1 ? "project" : "projects"} available
                    </p>
                  </div>

                  <span
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#1A1A1A] bg-[#EFE6D6] border border-[#B89555]/60 transition-all group-hover:translate-y-[-1px] group-hover:bg-[#F7F2EA]"
                  >
                    Explore
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>

            </Link>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10 md:mt-12">
          <PearlButton
            to="/area-guides"
            size="md"
            leadingIcon={<BookOpen strokeWidth={2.2} />}
            trailingIcon={<ArrowRight strokeWidth={2.2} />}
          >
            {t("areas.readGuides", "Read Area Guides")}
          </PearlButton>
          <PearlButton
            to="/areas"
            size="md"
            variant="secondary"
            leadingIcon={<Compass strokeWidth={2.2} />}
            trailingIcon={<ArrowRight strokeWidth={2.2} />}
          >
            {t("areas.exploreAll", "Explore All Areas")}
          </PearlButton>
        </div>

        </div>
      </div>
    </section>

  );
};

export default AreasWeCover;
