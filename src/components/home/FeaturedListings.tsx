/**
 * FeaturedListings — "Handpicked For You"
 *
 * Renders the canonical <ProjectCard /> (same component used on /properties) so
 * the homepage section stays pixel-identical with the rest of the catalogue.
 * Results are personalized via useHandpickedProjects (interest form → favorites
 * → browsing history → mode-aware elite fallback).
 */
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Home, ArrowRight, Building2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import ProjectCard from "@/components/ProjectCard";
import { useHandpickedProjects } from "@/hooks/useHandpickedProjects";
import ContentTrack from "@/components/layout/ContentTrack";
import CardGrid from "@/components/layout/CardGrid";

/**
 * Phone-only carousel: auto-advances every 4s and stays fully swipeable.
 * Auto-scroll pauses while the user is touching/scrolling and resumes after
 * 6s of inactivity. Respects prefers-reduced-motion.
 */
const MobileHandpickedStrip = ({ projects }: { projects: any[] }) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const pausedUntil = useRef(0);

  useEffect(() => {
    if (projects.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const el = trackRef.current;
    if (!el) return;

    const pause = () => { pausedUntil.current = Date.now() + 6000; };
    el.addEventListener("touchstart", pause, { passive: true });
    el.addEventListener("pointerdown", pause, { passive: true });
    el.addEventListener("wheel", pause, { passive: true });

    const timer = window.setInterval(() => {
      if (Date.now() < pausedUntil.current) return;
      const node = trackRef.current;
      if (!node) return;
      const step = node.firstElementChild
        ? (node.firstElementChild as HTMLElement).offsetWidth + 16
        : node.clientWidth;
      const atEnd = node.scrollLeft + node.clientWidth >= node.scrollWidth - 8;
      node.scrollTo({ left: atEnd ? 0 : node.scrollLeft + step, behavior: "smooth" });
    }, 4000);

    return () => {
      window.clearInterval(timer);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("pointerdown", pause);
      el.removeEventListener("wheel", pause);
    };
  }, [projects.length]);

  return (
    <div
      ref={trackRef}
      className="sm:hidden -mx-[var(--jj-page-gutter,1rem)] flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      style={{
        WebkitOverflowScrolling: "touch",
        paddingInline: "var(--jj-page-gutter, 1rem)",
        scrollPaddingInline: "var(--jj-page-gutter, 1rem)",
      }}
      aria-label="Handpicked projects carousel"
    >
      {projects.map((project, idx) => (
        <div key={project.id} className="snap-center shrink-0 w-[82%] [&>*]:w-full [&>*]:h-full">
          <ProjectCard project={project as any} priority={idx < 2} />
        </div>

      ))}
    </div>
  );
};

const FeaturedListings = () => {
  const { t } = useLanguage();
  const { data, isLoading } = useHandpickedProjects();
  const allProjects = data?.projects ?? [];


  return (
    <section data-handpicked-section className="bg-[#FDFBF7] py-10 md:py-14">
      {/* Full-bleed container — edge to edge, no max-width constraint */}
      <ContentTrack>
        {/* Section Header */}
        <div className="text-center mb-8 md:mb-10">
          <h2 data-no-contrast-guard className="text-[#1A1A1A] text-2xl md:text-3xl font-bold">
            {t("featured.heading", "Handpicked For You")}
          </h2>
        </div>

        {/* Phone: auto-scrolling + swipeable strip */}
        {!isLoading && allProjects.length > 0 && (
          <MobileHandpickedStrip projects={allProjects.slice(0, 6)} />
        )}

        {/* Listings Grid — 3 per row on desktop, edge-to-edge full width.
            Increased gap for premium breathing room. */}
        <div className={isLoading ? "block" : "hidden sm:block"}>
        <CardGrid columns={3} className="jj-handpicked-grid items-stretch auto-rows-fr">

          {isLoading
            ? [1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  data-handpicked-card
                  className={`bg-[#FDFBF7] rounded-2xl overflow-hidden border border-[#B89555]/55 h-full flex-col ${i <= 2 ? 'flex' : i === 3 ? 'hidden sm:flex' : 'hidden lg:flex'}`}
                >
                  {/* Image — matches ProjectCard aspect-[16/10] */}
                  <Skeleton className="aspect-[16/10] rounded-none shrink-0" />
                  {/* Body — matches ProjectCard padding + row structure */}
                  <div className="p-4 flex-1 flex flex-col gap-3">
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-5 w-5/6" />
                    <Skeleton className="h-3 w-2/3" />
                    <div className="flex-1" />
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
                  // Phone: 2 cards. Tablet + desktop: show the full set with
                  // tablet showing 3 in one row and desktop showing 6 as 2x3.
                  data-handpicked-card
                  className={`h-full ${idx < 2 ? 'flex' : idx === 2 ? 'hidden sm:flex' : 'hidden lg:flex'} [&>*]:w-full [&>*]:h-full`}
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
        </div>


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
