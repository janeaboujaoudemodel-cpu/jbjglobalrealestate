/**
 * FeaturedListings Component
 * Displays 8 featured project cards from elite developers
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { Home, MapPin, ArrowRight, Building2, ArrowUpRight, Heart, Star, Calendar } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/hooks/useCurrency";
import { getDeveloperLogoUrl } from "@/utils/developerLogo";
import { DeveloperLogo } from "@/components/ui/DeveloperLogo";
import { DeveloperLink } from "@/components/ui/developer-link";
import { deriveHandover, HANDOVER_FALLBACK } from "@/utils/handoverDerivation";
import { sanitizeForDisplay } from "@/utils/contentSanitizer";

const ELITE_DEVELOPERS = ['Emaar', 'Omniyat', 'Sobha', 'ALDAR', 'Binghatti', 'Nakheel', 'Dubai Properties', 'DAMAC', 'Meraas'];

interface FeaturedProject {
  id: string;
  name: string;
  slug: string;
  developer_name: string | null;
  price_from: number | null;
  area_name: string | null;
  location: string | null;
  cover_image_url: string | null;
  bedrooms_min: number | null;
  bedrooms_max: number | null;
  handover_date: string | null;
  payment_breakdown: any[] | null;
  images: { image_url: string }[];
  developer: { id: string; name: string; slug: string; logo_url: string | null } | null;
}

function useFeaturedProjects() {
  return useQuery({
    queryKey: ["featured-projects-elite-v4"],
    queryFn: async () => {
      const SELECT =
        "id, name, slug, developer_name, description, price_from, area_name, location, cover_image_url, bedrooms_min, bedrooms_max, handover_date, payment_breakdown, images:project_images(image_url), developer:developers(id, name, slug, logo_url)";

      const perDevResults = await Promise.all(
        ELITE_DEVELOPERS.map((dev) =>
          supabase
            .from("projects")
            .select(SELECT)
            .eq("developer_name", dev)
            .eq("is_published", true)
            .order("price_from", { ascending: false, nullsFirst: false })
            .limit(8)
            .then((r) => (r.error ? [] : (r.data || []))),
        ),
      );

      const data = perDevResults.flat();

      const all = data as FeaturedProject[];
      const byDev: Record<string, FeaturedProject[]> = {};
      for (const p of all) {
        const dev = p.developer_name || 'Unknown';
        if (!byDev[dev]) byDev[dev] = [];
        byDev[dev].push(p);
      }

      const result: FeaturedProject[] = [];
      const usedIds = new Set<string>();
      const usedDevs = new Set<string>();

      const hasPrice = (p: FeaturedProject) =>
        typeof p.price_from === 'number' && p.price_from > 0;

      const addOne = (devName: string, nameFilter?: string): boolean => {
        const devProjects = byDev[devName] || [];
        // Strong preference: a project that has a real price.
        const priced = devProjects.filter(hasPrice);
        const pool = priced.length > 0 ? priced : devProjects;

        let candidate: FeaturedProject | undefined;
        if (nameFilter) {
          candidate = pool.find(p => p.name.toLowerCase().includes(nameFilter) && !usedIds.has(p.id));
        }
        if (!candidate) {
          candidate = pool.find(p => !usedIds.has(p.id) && !p.name.toLowerCase().includes('mirage'));
        }
        if (!candidate) {
          candidate = pool.find(p => !usedIds.has(p.id));
        }
        if (candidate) {
          result.push(candidate);
          usedIds.add(candidate.id);
          usedDevs.add(devName);
          return true;
        }
        return false;
      };

      addOne('DAMAC', 'amra');
      addOne('Emaar');
      addOne('Nakheel');
      addOne('Sobha', 'pinnacle');
      addOne('Meraas');
      addOne('Binghatti', 'mercedes');
      addOne('ALDAR');
      addOne('Omniyat');

      // Fill remaining slots, still enforcing one card per developer and
      // preferring projects with a real price so the grid feels uniform.
      if (result.length < 8) {
        const sortedByPrice = [...all].sort((a, b) => {
          const ap = hasPrice(a) ? 0 : 1;
          const bp = hasPrice(b) ? 0 : 1;
          return ap - bp;
        });
        for (const p of sortedByPrice) {
          if (result.length >= 8) break;
          if (usedIds.has(p.id)) continue;
          const dev = p.developer_name || 'Unknown';
          if (usedDevs.has(dev)) continue;
          result.push(p);
          usedIds.add(p.id);
          usedDevs.add(dev);
        }
      }

      // Last-resort fill — STILL enforces unique developers (no repeats).
      if (result.length < 8) {
        for (const p of all) {
          if (result.length >= 8) break;
          if (usedIds.has(p.id)) continue;
          const dev = p.developer_name || 'Unknown';
          if (usedDevs.has(dev)) continue;
          result.push(p);
          usedIds.add(p.id);
          usedDevs.add(dev);
        }
      }

      return result.slice(0, 8);
    },
    staleTime: 300000,
  });
}

const prefetchProjectDetail = () => {
  import("../../pages/ProjectDetail");
};

const ProjectCard = ({ project, formatPrice, index = 0 }: { project: FeaturedProject; formatPrice: (price: number | null | undefined) => string; index?: number }) => {
  const isAboveFold = index < 4;
  const imageUrl = project.cover_image_url || project.images?.[0]?.image_url;
  const devName = project.developer_name || '';
  // LOCKED: canonical developer logo only. No hardcoded overrides, no monograms.
  const logoUrl = getDeveloperLogoUrl(project.developer);

  return (
    <div className="group h-full animate-fade-in-up">
      <Link to={`/project/${project.slug}`} className="block h-full" onMouseEnter={prefetchProjectDetail}>
        <div className="flex flex-col h-full bg-[#FDFBF7] rounded-xl overflow-hidden border border-[#B89555]/30 hover:border-[#B89555]/50 transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-1.5">
          {/* Image */}
          <div className="relative aspect-[4/3] overflow-hidden bg-[#F7F2EA]">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={project.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading={isAboveFold ? "eager" : "lazy"}
                fetchPriority={isAboveFold ? "high" : undefined}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 className="w-10 h-10 text-[#1A1A1A]/70" />
              </div>
            )}

            {/* Developer Logo — real logos only, full-fit overlay (no white frame) */}
            {logoUrl && (
              <div className="absolute top-3 left-3 z-20">
                <DeveloperLogo
                  src={logoUrl}
                  alt={devName}
                  loading={isAboveFold ? "eager" : "lazy"}
                  variant="bare"
                />
              </div>
            )}

            {/* Premium price label — square, transparent core, orange border + ink */}
            {typeof project.price_from === 'number' && project.price_from > 0 && (
              <div className="absolute bottom-3 right-3 z-20 price-pill-premium" data-price-badge data-no-contrast-guard>
                <span className="price-pill-eyebrow">From</span>
                <span className="price-pill-value">
                  {formatPrice(project.price_from)}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 flex flex-col flex-grow min-h-[140px]">
            <div className="min-h-[20px] mb-2">
              {(project.area_name || project.location) ? (
                <div className="flex items-center gap-1.5 text-[#1A1A1A]/70 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-[#1A1A1A]/70 flex-shrink-0" />
                  <span className="truncate">{project.area_name || project.location}</span>
                </div>
              ) : (
                <div className="h-[20px]" aria-hidden="true" />
              )}
            </div>

            <h3 className="text-[#1A1A1A] font-semibold text-sm mb-2 line-clamp-2 group-hover:text-[#1A1A1A] transition-colors min-h-[40px]">
              {project.name}
            </h3>
            {project.developer_name && (
              <DeveloperLink
                name={project.developer_name}
                slug={project.developer?.slug || null}
                className="text-xs mb-1 block"
                showPrefix={true}
              />
            )}

            {(project as any).description && (() => {
              const cleanDesc = sanitizeForDisplay((project as any).description);
              return cleanDesc ? (
                <p className="text-[#1A1A1A]/70 text-xs line-clamp-2 mb-2">{cleanDesc}</p>
              ) : null;
            })()}

            <hr className="border-[#B89555]/30 my-2" />
            <div className="flex-grow" />

            {/* Handover line — orange, matches the price label identity */}
            <div className="mt-2 min-h-[22px]">
              <div className="flex items-baseline gap-1.5 handover-orange" data-no-contrast-guard>
                <span className="handover-label text-[10px] uppercase tracking-[0.14em] font-medium">
                  Handover
                </span>
                <span className="font-semibold text-sm md:text-[15px] tabular-nums">
                  {deriveHandover(project) || HANDOVER_FALLBACK}
                </span>
              </div>
            </div>


          </div>
        </div>
      </Link>
    </div>
  );
};

const FeaturedListings = () => {
  const { t } = useLanguage();
  const { data: projects, isLoading } = useFeaturedProjects();
  const { formatPrice } = useCurrency();

  return (
    <section className="bg-[#FDFBF7]">
      <div className="jj-layer-2">
        {/* Section Header */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#F7F2EA] border border-[#B89555]/30 rounded-full text-xs uppercase tracking-[0.2em] font-semibold mb-4">
            <Home className="w-3.5 h-3.5 text-[#1A1A1A]/70" />
            <span className="text-[#1A1A1A]">{t('featured.title', 'Featured Properties')}</span>
          </span>
          <h2
            className="text-2xl md:text-3xl font-bold text-[#1A1A1A]"
          >
            {t('featured.heading', 'Handpicked For You')}
          </h2>

          {/* My Favorites & My Shortlist Tabs */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <Link
              to="/favorites"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#F7F2EA] border border-[#B89555]/30 text-[#1A1A1A]/70 hover:border-[#B89555]/30 hover:bg-[#EFE6D6] transition-all text-sm font-medium"
            >
              <Heart className="w-4 h-4" />
              {t('featured.myFavorites', 'My Favorites')}
            </Link>
            <Link
              to="/compare"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#F7F2EA] border border-[#B89555]/30 text-[#1A1A1A]/70 hover:border-[#B89555]/30 hover:bg-[#EFE6D6] transition-all text-sm font-medium"
            >
              <Star className="w-4 h-4" />
              {t('featured.myShortlist', 'My Shortlist')}
            </Link>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {isLoading
            ? [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-[#FDFBF7] rounded-xl overflow-hidden border border-[#B89555]/30">
                  <Skeleton className="aspect-[4/3] rounded-none" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))
            : projects?.map((project, idx) => (
                <ProjectCard key={project.id} project={project} formatPrice={formatPrice} index={idx} />
              ))}
          {!isLoading && (!projects || projects.length === 0) && (
            <div className="col-span-full text-center py-12">
              <Building2 className="w-10 h-10 text-[#1A1A1A]/70 mx-auto mb-3" />
              <p className="text-[#1A1A1A]/70 text-sm">Featured projects coming soon</p>
            </div>
          )}
        </div>

        {/* View All CTA */}
        <div className="text-center mt-10 mb-6">
          <Link
            to="/properties"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold rounded-xl transition-all duration-300 bg-[#1A1A1A] text-white border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:scale-[1.02] transform active:scale-95 group"
          >
            <span>{t('featured.viewAll', 'View All Projects')}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedListings;
