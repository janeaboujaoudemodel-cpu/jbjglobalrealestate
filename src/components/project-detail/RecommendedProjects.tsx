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
      const hd = p.handover_date;
      if (hd) {
        const hLower = hd.toLowerCase();
        if (!hLower.includes("ready")) {
          const yearMatch = hd.match(/\b(20\d{2})\b/);
          if (yearMatch && parseInt(yearMatch[1]) < 2026) return false;
        }
      }
      return true;
    });

    // If user has browsing context, use behavior-aware scoring
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
    <section className="py-12 mx-4 md:mx-8 rounded-3xl bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-[#B89555]/15 shadow-sm">
      <div className="container mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-[#1A1A1A]" />
            <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">Recommended Projects</h2>
          </div>
          <Link
            to="/properties"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] border border-[#B89555]/60 text-[#1A1A1A] font-semibold text-sm shadow-md hover:shadow-lg hover:border-[#B89555] transition-all"
          >
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Projects Grid — items-stretch ensures equal height columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
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

                  {/* Developer Logo — TOP-LEFT (moved up from where "On Sale" used to be) */}
                  <div className="absolute top-3 left-3 z-20">
                    {devLogo ? (
                      <DeveloperLogo
                        src={devLogo}
                        alt={project.developer?.name || "Developer"}
                        loading="eager"
                      />
                    ) : project.developer?.name ? (
                      <span className="inline-flex items-center rounded-md bg-[#F7F2EA] border border-[#B89555]/60 px-2 py-1 text-[11px] font-semibold text-[#1A1A1A] shadow-sm">
                        {project.developer.name}
                      </span>
                    ) : null}
                  </div>

                  {/* Sale Status — BOTTOM-RIGHT (moved down from where Handover used to be) */}
                  <div className="absolute bottom-3 right-3 z-20">
                    <span
                      data-no-contrast-guard
                      className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-bold shadow-sm allow-white ${
                        saleStatus.toLowerCase().includes("sold")
                          ? "bg-red-500 text-white"
                          : "bg-emerald-500 text-white"
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
                      <div className="price-pill-premium max-w-full min-w-0 shrink" data-price-badge data-no-contrast-guard>
                        <span className="price-pill-eyebrow">From</span>
                        <span className="price-pill-value truncate">{formatPrice(project.price_from)}</span>
                      </div>
                    ) : (
                      <div className="price-pill-premium max-w-full min-w-0 shrink" data-price-badge data-no-contrast-guard>
                        <span className="price-pill-value truncate">Price on request</span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-1.5 min-w-0 shrink justify-end">
                      {paymentLabel && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1A1A1A] bg-[#EFE6D6]/10 border border-[#B89555]/30 rounded-full px-2 py-0.5 whitespace-nowrap shrink-0">
                          <CreditCard className="w-3 h-3" />
                          {paymentLabel}
                        </span>
                      )}
                      <HandoverPill value={project.handover_date} />
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
