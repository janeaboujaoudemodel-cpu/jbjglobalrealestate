/**
 * FeaturedListings — "Handpicked For You"
 *
 * Renders the canonical <ProjectCard /> (same component used on /properties) so
 * the homepage section stays pixel-identical with the rest of the catalogue.
 * Results are personalized via useHandpickedProjects (interest form → favorites
 * → browsing history → mode-aware elite fallback).
 */
import { Link } from "react-router-dom";
import { Home, ArrowRight, Building2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import ProjectCard from "@/components/ProjectCard";
import { useHandpickedProjects } from "@/hooks/useHandpickedProjects";
import ContentTrack from "@/components/layout/ContentTrack";
import CardGrid from "@/components/layout/CardGrid";

const FeaturedListings = () => {
  const { t } = useLanguage();
  const { data, isLoading } = useHandpickedProjects();
  // Detect phone portrait via media query (no JS state for SSR safety — Tailwind hides extras).
  const allProjects = data?.projects ?? [];

  return (
    <section className="bg-[#FDFBF7] py-10 md:py-14">
      {/* Full-bleed container — edge to edge, no max-width constraint */}
      <ContentTrack>
        {/* Section Header */}
        <div className="text-center mb-8 md:mb-10">
          <span
            data-surface="dark"
            data-on-dark
            data-no-contrast-guard
            data-allow-dark-cta
            data-cta="dark"
            className="allow-white inline-flex items-center gap-2 px-4 py-2 border rounded-full text-xs uppercase tracking-[0.2em] font-semibold mb-4 transition-colors"
            style={{ backgroundColor: "#0A0A0A", borderColor: "rgba(184,149,85,0.5)", color: "#FFFFFF" }}
          >
            <Home className="w-3.5 h-3.5 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
            <span className="allow-white" style={{ color: "#FFFFFF" }}>{t("featured.title", "Featured Properties")}</span>
          </span>
          <h2 data-no-contrast-guard className="text-[#1A1A1A] text-2xl md:text-3xl font-bold">
            {t("featured.heading", "Handpicked For You")}
          </h2>
        </div>

        {/* Listings Grid — 3 per row on desktop, edge-to-edge full width.
            Increased gap for premium breathing room. */}
        <CardGrid columns={3} className="items-stretch auto-rows-fr">
          {isLoading
            ? [1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className={`bg-[#FDFBF7] rounded-2xl overflow-hidden border border-[#B89555]/30 h-full flex flex-col ${i > 3 ? 'hidden sm:flex' : ''}`}
                >
                  {/* Image — matches ProjectCard aspect-[16/10] */}
                  <Skeleton className="aspect-[16/10] rounded-none shrink-0" />
                  {/* Body — matches ProjectCard padding + row structure */}
                  <div className="p-4 flex-1 flex flex-col gap-3">
                    {/* developer "by Xxx" line */}
                    <Skeleton className="h-3 w-1/3" />
                    {/* title */}
                    <Skeleton className="h-5 w-5/6" />
                    {/* location */}
                    <Skeleton className="h-3 w-2/3" />
                    {/* spacer pushes bottom row down so heights align */}
                    <div className="flex-1" />
                    {/* bottom row: price pill left, handover right */}
                    <div className="flex items-center justify-between pt-1">
                      <Skeleton className="h-7 w-24 rounded-full" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </div>
                </div>
              ))
            : allProjects.slice(0, 6).map((project, idx) => (
                <div
                  key={project.id}
                  // On phone portrait, render only first 3 cards (idx 0..2); hidden on >=sm.
                  className={`h-full flex ${idx >= 3 ? 'hidden sm:flex' : ''} [&>*]:w-full [&>*]:h-full`}
                >
                  <ProjectCard project={project as any} priority={idx < 3} />
                </div>
              ))}
          {!isLoading && allProjects.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Building2 className="w-10 h-10 text-[#1A1A1A]/70 mx-auto mb-3" />
              <p className="text-[#1A1A1A]/70 text-sm">Featured projects coming soon</p>
            </div>
          )}
        </CardGrid>

        {/* View All CTA — navy blue, white text + icon */}
        <div className="text-center mt-10 md:mt-12">
          <Link
            to="/properties"
            data-surface="dark"
            data-on-dark
            data-no-contrast-guard
            data-allow-dark-cta
            className="jj-cta-float allow-white inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-[#0A0A0A] hover:bg-[#1F1F1F] border border-[#047857]/55 text-white text-sm font-bold tracking-wide"
            style={{ color: "#FFFFFF" }}
          >
            <span className="allow-white" style={{ color: "#FFFFFF" }}>
              {t("featured.viewAll", "View All Projects")}
            </span>
            <ArrowRight className="w-4 h-4 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} strokeWidth={2.5} />
          </Link>
        </div>
      </ContentTrack>
    </section>
  );
};

export default FeaturedListings;
