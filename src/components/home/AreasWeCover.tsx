/**
 * AreasWeCover — Top Areas in Dubai
 * 3-per-row featured photo cards with high-contrast captions, premium hover,
 * and two CTAs: "Read Area Guides" + "Explore All Areas".
 */
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPin, ArrowRight, TrendingUp, Flame, BookOpen, Compass } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAreas } from "@/hooks/useAreas";
import { PearlButton } from "@/components/ui/pearl-button";
import ContentTrack from "@/components/layout/ContentTrack";
import CardGrid from "@/components/layout/CardGrid";

const AreasWeCover = () => {
  const { t } = useLanguage();
  const { data: areas, isLoading } = useAreas({ limit: 12 });

  useEffect(() => {
    if (window.location.hash !== "#top-areas-dubai") return;
    requestAnimationFrame(() => {
      document.getElementById("top-areas-dubai")?.scrollIntoView({ block: "start" });
    });
  }, [isLoading]);

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
    <section id="top-areas-dubai" className="py-12 md:py-20">
      <ContentTrack>
        <div className="jj-home-area-panel relative w-full mx-auto rounded-[28px] p-6 md:p-10 lg:p-12">
          <span aria-hidden className="jj-home-area-corner pointer-events-none absolute top-0 left-0 h-12 w-12 border-t border-l rounded-tl-[28px]" />
          <span aria-hidden className="jj-home-area-corner pointer-events-none absolute top-0 right-0 h-12 w-12 border-t border-r rounded-tr-[28px]" />
          <span aria-hidden className="jj-home-area-corner pointer-events-none absolute bottom-0 left-0 h-12 w-12 border-b border-l rounded-bl-[28px]" />
          <span aria-hidden className="jj-home-area-corner pointer-events-none absolute bottom-0 right-0 h-12 w-12 border-b border-r rounded-br-[28px]" />

          <div className="relative text-center mb-8 md:mb-10">
            <h2 data-no-contrast-guard className="text-[#1A1A1A] text-2xl md:text-4xl font-bold tracking-tight">
              {t("areas.topTitle", "Top Areas in Dubai")}
            </h2>
          </div>



          <CardGrid columns={3} className="relative">

          {displayAreas.map((area) => (
            <Link
              key={area.slug}
              to={`/area/${area.slug}`}
              className="jj-home-area-card group relative block h-[240px] md:h-[260px] rounded-2xl overflow-hidden transform-gpu will-change-transform transition-shadow duration-300"
              style={{ contain: "layout paint" }}
            >
              {area.imageUrl ? (
                <img
                  src={area.imageUrl}
                  alt={area.name || ""}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  width={520}
                  height={260}
                  className="absolute inset-0 w-full h-full object-cover transform-gpu will-change-transform transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-7xl font-black text-[#1A1A1A]/10 select-none">JBJ</span>
                </div>
              )}

              {/* Subtle top gradient so badges read clearly without darkening the image */}
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />

              {/* Badges — emerald ombre + white */}
              <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                {area.isTrending && (
                  <span data-no-contrast-guard className="jj-emerald-chip jj-area-status-chip">
                    <TrendingUp className="w-2.5 h-2.5" />
                    Trending
                  </span>
                )}
                {area.isHighDemand && (
                  <span data-no-contrast-guard className="jj-emerald-chip jj-area-status-chip">
                    <Flame className="w-2.5 h-2.5" />
                    High Demand
                  </span>
                )}
              </div>


              <div className="jj-home-area-caption absolute bottom-0 left-0 right-0 px-4 py-3">
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <h3 data-no-contrast-guard className="text-[#1A1A1A] font-extrabold text-lg md:text-xl leading-tight tracking-tight truncate">
                      {area.name}
                    </h3>
                    <p data-no-contrast-guard className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#1A1A1A]">
                      {(area.propertyCount ?? 0).toLocaleString()} {(area.propertyCount ?? 0) === 1 ? "project" : "projects"} available
                    </p>
                  </div>

                  <span
                    className="jj-area-explore-pill shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] transition-all group-hover:translate-y-[-1px]"
                    data-on-dark
                    data-no-contrast-guard
                  >
                    <span className="allow-white" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Explore</span>
                    <ArrowRight className="allow-white w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                  </span>
                </div>
              </div>

            </Link>
          ))}
          </CardGrid>

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
            className="jj-explore-all-areas-button"
            leadingIcon={<Compass strokeWidth={2.2} />}
            trailingIcon={<ArrowRight strokeWidth={2.2} />}
          >
            {t("areas.exploreAll", "Explore All Areas")}
          </PearlButton>
        </div>

        </div>
      </ContentTrack>
    </section>

  );
};

export default AreasWeCover;
