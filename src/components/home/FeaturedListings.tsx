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

const FeaturedListings = () => {
  const { t } = useLanguage();
  const { data, isLoading } = useHandpickedProjects();
  // Detect phone portrait via media query (no JS state for SSR safety — Tailwind hides extras).
  const allProjects = data?.projects ?? [];

  return (
    <section className="bg-[#FDFBF7] py-10 md:py-14">
      {/* Full-bleed container — edge to edge, no max-width constraint */}
      <div className="w-full px-3 sm:px-5 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-8 md:mb-10">
          <span
            data-surface="dark"
            data-on-dark
            data-no-contrast-guard
            data-allow-dark-cta
            className="allow-white inline-flex items-center gap-2 px-4 py-2 bg-[#102540] hover:bg-[#1a3d63] border border-[#B89555]/50 rounded-full text-xs uppercase tracking-[0.2em] font-semibold mb-4 transition-colors"
            style={{ color: "#FFFFFF" }}
          >
            <Home className="w-3.5 h-3.5 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
            <span className="allow-white" style={{ color: "#FFFFFF" }}>{t("featured.title", "Featured Properties")}</span>
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-[#102540]">
            {t("featured.heading", "Handpicked For You")}
          </h2>
        </div>

        {/* Listings Grid — 3 per row on desktop, edge-to-edge full width.
            Increased gap for premium breathing room. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-7 items-stretch auto-rows-fr">
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
                  <ProjectCard project={project as any} />
                </div>
              ))}
          {!isLoading && allProjects.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Building2 className="w-10 h-10 text-[#1A1A1A]/70 mx-auto mb-3" />
              <p className="text-[#1A1A1A]/70 text-sm">Featured projects coming soon</p>
            </div>
          )}
        </div>

        {/* View All CTA — navy blue, white text + icon */}
        <div className="text-center mt-10 md:mt-12">
          <Link
            to="/properties"
            data-surface="dark"
            data-on-dark
            data-no-contrast-guard
            data-allow-dark-cta
            className="allow-white inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-[#102540] hover:bg-[#1a3d63] border border-[#B89555]/55 text-white text-sm font-bold tracking-wide transition-colors shadow-[0_10px_30px_-12px_rgba(16,37,64,0.55)]"
            style={{ color: "#FFFFFF" }}
          >
            <span className="allow-white" style={{ color: "#FFFFFF" }}>
              {t("featured.viewAll", "View All Projects")}
            </span>
            <ArrowRight className="w-4 h-4 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedListings;
