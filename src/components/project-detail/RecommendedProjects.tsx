import { Link } from "react-router-dom";
import { Sparkles, ChevronRight, CreditCard } from "lucide-react";
import { useProjectsListing } from "@/hooks/useProjects";
import { SafeImage } from "@/components/SafeImage";
import { DeveloperLink } from "@/components/ui/developer-link";
import { useMemo } from "react";
import { useCurrency } from "@/hooks/useCurrency";
import { useUserBrowsingContext } from "@/hooks/useUserBrowsingContext";
import { getDeveloperLogoUrl } from "@/utils/developerLogo";
import { DeveloperLogo } from "@/components/ui/DeveloperLogo";
import { HandoverPill } from "@/components/ui/HandoverPill";
import { stripHtmlTags } from "@/utils/contentSanitizer";

interface RecommendedProjectsProps {
  currentProjectId: string;
  currentDeveloperId?: string | null;
  currentLocation?: string | null;
  currentEmirate?: string | null;
}

export default function RecommendedProjects({
  currentProjectId,
  currentDeveloperId,
  currentLocation,
  currentEmirate,
}: RecommendedProjectsProps) {
  const { data: projects } = useProjectsListing();
  const { formatPrice } = useCurrency();
  const browsingContext = useUserBrowsingContext();

  const recommendedProjects = useMemo(() => {
    if (!projects || projects.length === 0) return [];
    
    // Filter out current project, sold/expired, and incomplete stubs
    const otherProjects = projects.filter((p) => {
      if (p.id === currentProjectId) return false;
      // Quality gate: require description and developer
      const desc = (p as any).description;
      if (!desc || desc.length < 50) return false;
      if (!(p as any).developer_name && !p.developer?.name) return false;
      // Skip already-viewed projects from recent searches
      if (browsingContext.recentProjectIds.includes(p.id)) return false;
      const status = ((p as any).sale_status || "").toLowerCase();
      if (status.includes("sold")) return false;
      // Prefer off-plan: exclude Ready/Completed by default.
      // (Memory: off-plan recommendation rule.)
      const hd = (p.handover_date || "").toString();
      const hLower = hd.toLowerCase();
      if (hLower.includes("ready") || hLower.includes("completed") || hLower.includes("handed over")) {
        return false;
      }
      if (hd) {
        const yearMatch = hd.match(/\b(20\d{2})\b/);
        if (yearMatch && parseInt(yearMatch[1]) < 2026) return false;
      }
      return true;
    });

    // PRIMARY: prefer other projects in THE SAME AREA as the project being
    // viewed (e.g. viewing Vindera → show other "The Valley" projects).
    if (currentLocation) {
      const areaKey = currentLocation.toLowerCase();
      const sameArea = otherProjects.filter((p) =>
        p.location?.toLowerCase().includes(areaKey),
      );
      if (sameArea.length >= 3) {
        const withPrice = sameArea
          .filter((p) => p.price_from && p.price_from > 0)
          .sort((a, b) => (a.price_from || 0) - (b.price_from || 0));
        if (withPrice.length >= 3) {
          const lowIdx = 0;
          const midIdx = Math.floor(withPrice.length / 2);
          const highIdx = withPrice.length - 1;
          return [withPrice[highIdx], withPrice[midIdx], withPrice[lowIdx]];
        }
        return sameArea.slice(0, 3);
      }
    }

    // SECONDARY: behavior-aware scoring using browsing dominant area.
    if (browsingContext.hasData && browsingContext.dominantArea) {
      const userArea = browsingContext.dominantArea.toLowerCase();
      
      // Filter to user's area of interest
      let areaMatched = otherProjects.filter((p) =>
        p.location?.toLowerCase().includes(userArea)
      );

      // If budget context exists, further filter to budget band
      if (browsingContext.budgetMin && browsingContext.budgetMax && areaMatched.length > 3) {
        const budgetFiltered = areaMatched.filter((p) => {
          const price = p.price_from || 0;
          return price >= browsingContext.budgetMin! && price <= browsingContext.budgetMax!;
        });
        // Only use budget filter if it leaves enough results
        if (budgetFiltered.length >= 3) areaMatched = budgetFiltered;
      }

      // If we have enough area-matched results, pick 3 tiers by price
      if (areaMatched.length >= 3) {
        const withPrice = areaMatched
          .filter((p) => p.price_from && p.price_from > 0)
          .sort((a, b) => (a.price_from || 0) - (b.price_from || 0));

        if (withPrice.length >= 3) {
          const lowIdx = 0;
          const midIdx = Math.floor(withPrice.length / 2);
          const highIdx = withPrice.length - 1;
          return [withPrice[highIdx], withPrice[midIdx], withPrice[lowIdx]];
        }
        // Not enough priced ones, just return top 3 area-matched
        return areaMatched.slice(0, 3);
      }
    }

    // Fallback: enhanced scoring logic
    const scored = otherProjects.map((p) => {
      let score = 0;
      if ((p as any).import_source === 'manual') score += 50;
      if (currentDeveloperId && p.developer?.id === currentDeveloperId) score += 10;
      if (currentLocation && p.location?.toLowerCase().includes(currentLocation.toLowerCase())) score += 5;
      if (currentEmirate && p.emirate === currentEmirate) score += 3;
      // Boost for user's browsed areas
      if (browsingContext.hasData && browsingContext.recentAreas.length > 0) {
        const loc = p.location?.toLowerCase() || "";
        if (browsingContext.recentAreas.some((a) => loc.includes(a.toLowerCase()))) score += 8;
      }
      // Boost for budget-range match
      if (browsingContext.budgetMin && browsingContext.budgetMax && p.price_from) {
        if (p.price_from >= browsingContext.budgetMin && p.price_from <= browsingContext.budgetMax) score += 12;
      }
      if (p.images && p.images.length > 0) score += 2;
      if (p.price_from) score += 1;
      return { project: p, score };
    });
    return scored.sort((a, b) => b.score - a.score).slice(0, 3).map((s) => s.project);
  }, [projects, currentProjectId, currentDeveloperId, currentLocation, currentEmirate, browsingContext]);

  if (recommendedProjects.length === 0) return null;

  return (
    <section className="py-10 sm:py-12 rounded-3xl bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-[#B89555]/15 shadow-sm overflow-hidden">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full jj-pill-emerald-metallic" data-no-contrast-guard style={{ color: '#FFFFFF' }}>
              <Sparkles className="w-5 h-5" style={{ color: '#FFFFFF' }} />
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">Recommended Projects</h2>
          </div>
          <Link
            to="/properties"
            data-no-contrast-guard
            className="jj-pill-emerald-metallic inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md transition-all"
            style={{ color: '#FFFFFF' }}
          >
            <span style={{ color: '#FFFFFF' }}>View All</span>
            <ChevronRight className="w-4 h-4" style={{ color: '#FFFFFF' }} />
          </Link>
        </div>

        {/* Projects Grid — items-stretch ensures equal height columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6 items-stretch">
          {recommendedProjects.map((project) => {
            const breakdown = (project as any).payment_breakdown;
            const percentages = breakdown && Array.isArray(breakdown)
              ? breakdown.map((b: any) => b.percentage).filter((p: any) => typeof p === 'number')
              : [];
            const paymentLabel = percentages.length > 0 ? percentages.join('/') : null;
            const saleStatus = (project as any).sale_status || "On Sale";
            const devLogo = getDeveloperLogoUrl(project.developer);
            const description = (project as any).description;

            // Location fallback
            const displayLocation =
              (project as any).location ||
              (project as any).area_name ||
              (project as any).emirate ||
              null;

            // Strip HTML/markdown then truncate to ~140 chars
            const cleanDescription = description ? stripHtmlTags(String(description)).replace(/\s+/g, " ").trim() : "";
            const shortDescription = cleanDescription
              ? cleanDescription.length > 140
                ? cleanDescription.substring(0, 140).replace(/\s+\S*$/, "") + "…"
                : cleanDescription
              : null;

            return (
              <Link
                key={project.id}
                to={`/project/${project.slug}`}
                className="group relative overflow-hidden rounded-xl border border-[#B89555]/30 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] hover:border-[#B89555]/60 transition-all shadow-sm flex flex-col h-full"
              >
                {/* Image */}
                <div className="aspect-[16/10] overflow-hidden relative flex-shrink-0">
                  <SafeImage
                    src={(project as any).cover_image_url || project.images?.[0]?.image_url}
                    alt={project.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="eager"
                  />

                  {/* Developer Logo — TOP-LEFT (unified square plate, no rectangular text fallback) */}
                  <div className="absolute top-3 left-3 z-20">
                    <DeveloperLogo
                      src={devLogo}
                      alt={project.developer?.name || "Developer"}
                      name={project.developer?.name}
                      variant="bare"
                      renderFallback
                      loading="eager"
                    />
                  </div>

                  {/* Sale Status — BOTTOM-RIGHT — champagne+gold treatment (no orange/red/emerald fills) */}
                  <div className="absolute bottom-3 right-3 z-20">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-semibold shadow-sm border ${
                        saleStatus.toLowerCase().includes("sold")
                          ? "bg-[#FDFBF7] text-[#1A1A1A] border-[#B89555]/70"
                          : "bg-[#F7F2EA] text-[#1A1A1A] border-[#B89555]/70"
                      }`}
                    >
                      {saleStatus}
                    </span>
                  </div>
                </div>

                {/* Content — flex-col flex-1 so it fills remaining card height */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-lg font-semibold text-[#1A1A1A] group-hover:text-[#1A1A1A] transition-colors whitespace-normal break-words leading-tight mb-1">
                    {project.name}
                  </h3>

                  {project.developer && (
                    <DeveloperLink
                      name={project.developer.name}
                      slug={project.developer.slug}
                      className="text-sm mb-1"
                    />
                  )}

                  {/* Location */}
                  {displayLocation && (
                    <p className="text-[#1A1A1A]/70 text-sm truncate mt-0.5">
                      {displayLocation}
                    </p>
                  )}

                  {/* Description — HTML stripped */}
                  {shortDescription && (
                    <p className="text-[#1A1A1A]/70 text-xs leading-relaxed mt-2 line-clamp-2">
                      {shortDescription}
                    </p>
                  )}

                  {/* Spacer to push price row to bottom */}
                  <div className="flex-1 min-h-[8px]" />

                  {/* Divider + Price (LEFT) + Handover (RIGHT) — pinned to bottom, same line */}
                  <div className="border-t border-[#B89555]/20 pt-3 mt-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-2 min-w-0">
                    {project.price_from ? (
                      <div data-emerald-action="true" className="jj-emerald-action inline-flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-semibold max-w-full min-w-0 shrink">
                        <span className="text-[10px] uppercase tracking-wider opacity-90">From</span>
                        <span className="truncate font-bold">{formatPrice(project.price_from)}</span>
                      </div>
                    ) : (
                      <div data-emerald-action="true" className="jj-emerald-action inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold max-w-full min-w-0 shrink">
                        <span className="truncate">Price on request</span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-1.5 min-w-0 shrink justify-end">
                      {paymentLabel && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1A1A1A] bg-[#EFE6D6]/10 border border-[#B89555]/30 rounded-full px-2 py-0.5 whitespace-nowrap shrink-0">
                          <CreditCard className="w-3 h-3" />
                          {paymentLabel}
                        </span>
                      )}
                      {project.handover_date && (
                        <span data-emerald-action="true" className="jj-emerald-action inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0">
                          {project.handover_date}
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
