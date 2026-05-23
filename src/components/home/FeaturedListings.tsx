/**
 * FeaturedListings — "Handpicked For You"
 *
 * Renders the canonical <ProjectCard /> (same component used on /properties) so
 * the homepage section stays pixel-identical with the rest of the catalogue.
 * Results are personalized via useHandpickedProjects (interest form → favorites
 * → browsing history → mode-aware elite fallback).
 */
import { Home, ArrowRight, Building2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { PearlButton } from "@/components/ui/pearl-button";
import ProjectCard from "@/components/ProjectCard";
import { useHandpickedProjects } from "@/hooks/useHandpickedProjects";

const FeaturedListings = () => {
  const { t } = useLanguage();
  const { data, isLoading } = useHandpickedProjects();
  const projects = data?.projects ?? [];

  return (
    <section className="bg-[#FDFBF7]">
      <div className="jj-layer-2">
        {/* Section Header */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#F7F2EA] border border-[#B89555]/30 rounded-full text-xs uppercase tracking-[0.2em] font-semibold mb-4">
            <Home className="w-3.5 h-3.5 text-[#1A1A1A]/70" />
            <span className="text-[#1A1A1A]">{t("featured.title", "Featured Properties")}</span>
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">
            {t("featured.heading", "Handpicked For You")}
          </h2>
        </div>

        {/* Listings Grid — canonical ProjectCard, no duplicates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {isLoading
            ? [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="bg-[#FDFBF7] rounded-2xl overflow-hidden border border-[#B89555]/30"
                >
                  <Skeleton className="aspect-[16/10] rounded-none" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))
            : projects.map((project) => (
                <ProjectCard key={project.id} project={project as any} />
              ))}
          {!isLoading && projects.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Building2 className="w-10 h-10 text-[#1A1A1A]/70 mx-auto mb-3" />
              <p className="text-[#1A1A1A]/70 text-sm">Featured projects coming soon</p>
            </div>
          )}
        </div>

        {/* View All CTA — premium pearl */}
        <div className="text-center mt-10 mb-6">
          <PearlButton to="/properties" size="lg" trailingIcon={<ArrowRight strokeWidth={2.5} />}>
            {t("featured.viewAll", "View All Projects")}
          </PearlButton>
        </div>
      </div>
    </section>
  );
};

export default FeaturedListings;
