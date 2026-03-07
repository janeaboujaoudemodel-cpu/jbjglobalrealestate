/**
 * FeaturedListings Component
 * Displays 8 featured project cards from elite developers
 * Strict 1-per-developer from elite developers
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { Home, MapPin, ArrowRight, Building2, ArrowUpRight, CreditCard, Heart, Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/hooks/useCurrency";

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
    queryKey: ["featured-projects-elite-v3"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, slug, developer_name, price_from, area_name, location, cover_image_url, bedrooms_min, bedrooms_max, handover_date, payment_breakdown, images:project_images(image_url), developer:developers(id, name, slug, logo_url)")
        .in("developer_name", ELITE_DEVELOPERS)
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(40);

      if (error) throw error;

      const all = data as FeaturedProject[];

      // Group by developer
      const byDev: Record<string, FeaturedProject[]> = {};
      for (const p of all) {
        const dev = p.developer_name || 'Unknown';
        if (!byDev[dev]) byDev[dev] = [];
        byDev[dev].push(p);
      }

      const result: FeaturedProject[] = [];
      const usedIds = new Set<string>();
      const usedDevs = new Set<string>();

      // Helper: add exactly 1 project from a developer, with optional name filter
      const addOne = (devName: string, nameFilter?: string): boolean => {
        const devProjects = byDev[devName] || [];
        let candidate: FeaturedProject | undefined;

        if (nameFilter) {
          candidate = devProjects.find(p => p.name.toLowerCase().includes(nameFilter) && !usedIds.has(p.id));
        }
        // Fallback: any project from this developer not already used
        if (!candidate) {
          candidate = devProjects.find(p => !usedIds.has(p.id) && !p.name.toLowerCase().includes('mirage'));
        }
        if (!candidate) {
          candidate = devProjects.find(p => !usedIds.has(p.id));
        }

        if (candidate) {
          result.push(candidate);
          usedIds.add(candidate.id);
          usedDevs.add(devName);
          return true;
        }
        return false;
      };

      // Strict order: Amra first, then Emaar, Nakheel, Sobha, Meraas, Binghatti, DAMAC
      addOne('DAMAC', 'amra');        // Amra by DAMAC first
      addOne('Emaar');
      addOne('Nakheel');
      addOne('Sobha', 'pinnacle');
      addOne('Meraas');
      addOne('Binghatti', 'mercedes');
      addOne('ALDAR');

      // Fill remaining slots ONLY from developers NOT already represented
      if (result.length < 8) {
        for (const p of all) {
          if (result.length >= 8) break;
          if (usedIds.has(p.id)) continue;
          const dev = p.developer_name || 'Unknown';
          // Skip developers that already have a card (except Binghatti which already has its 2)
          if (usedDevs.has(dev)) continue;
          result.push(p);
          usedIds.add(p.id);
          usedDevs.add(dev);
        }
      }

      // If still under 8 (unlikely), allow second picks but still no duplicates
      if (result.length < 8) {
        for (const p of all) {
          if (result.length >= 8) break;
          if (!usedIds.has(p.id)) {
            result.push(p);
            usedIds.add(p.id);
          }
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
  // Binghatti logo is locked to the canonical webp per branding policy
  const rawLogoUrl = (project.developer as any)?.logo_url;
  const logoUrl = devName.toLowerCase().includes('binghatti')
    ? '/developers/logos/binghatti-logo.webp'
    : rawLogoUrl;
  const [logoError, setLogoError] = useState(false);

  return (
    <div className="group h-full animate-fade-in-up">
      <Link to={`/project/${project.slug}`} className="block h-full" onMouseEnter={prefetchProjectDetail}>
        <div className="flex flex-col h-full bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] rounded-xl overflow-hidden border-2 border-gold/30 hover:border-gold transition-all duration-300 hover:shadow-[0_8px_30px_rgba(200,167,102,0.4)] hover:-translate-y-1">
          {/* Image */}
          <div className="relative aspect-[4/3] overflow-hidden bg-gold/5">
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
                <Building2 className="w-10 h-10 text-gold/30" />
              </div>
            )}

            {/* Developer Logo - Top Left */}
            {logoUrl && !logoError ? (
              <div className="absolute top-3 left-3 z-10">
              <div className="w-12 h-12 rounded-lg shadow-lg overflow-hidden bg-white">
                  <img
                    src={logoUrl}
                    alt={devName}
                    className="w-full h-full object-contain"
                    loading={isAboveFold ? "eager" : "lazy"}
                    onError={() => setLogoError(true)}
                  />
                </div>
              </div>
            ) : (
              <div className="absolute top-3 left-3 z-10">
                <div className="w-12 h-12 rounded-lg bg-black/80 shadow-lg border border-gold/40 flex items-center justify-center backdrop-blur-sm">
                  <span className="text-gold font-bold text-lg" style={{ fontFamily: "serif" }}>
                    {devName.charAt(0)}
                  </span>
                </div>
              </div>
            )}

            {/* Price badge - Bottom Right of photo, premium styling */}
            {project.price_from && (
              <div className="absolute bottom-3 right-3 z-10 px-3 py-1.5 rounded-lg bg-gradient-to-br from-black/90 via-black/80 to-gold/20 backdrop-blur-md border border-gold/50 shadow-lg">
                <span className="text-gold font-bold text-xs tracking-wide">
                  From {formatPrice(project.price_from)}
                </span>
              </div>
            )}
          </div>

          {/* Content - fixed height for consistency */}
          <div className="p-4 flex flex-col flex-grow min-h-[140px]">
            {/* Location - fixed height row */}
            <div className="min-h-[20px] mb-2">
              {(project.area_name || project.location) ? (
                <div className="flex items-center gap-1.5 text-zinc-600 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                  <span className="truncate">{project.area_name || project.location}</span>
                </div>
              ) : (
                <div className="h-[20px]" aria-hidden="true" />
              )}
            </div>

            {/* Title */}
            <h3 className="text-black font-semibold text-sm mb-2 line-clamp-2 group-hover:text-gold transition-colors min-h-[40px]" style={{ fontFamily: "Poppins, sans-serif" }}>
              {project.name}
            </h3>
            {/* Developer name - gold, clickable */}
            {project.developer?.slug ? (
              <span className="text-xs mb-1 block">
                <span className="text-black font-medium">by </span>
                <Link
                  to={`/developer/${project.developer.slug}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-gold font-medium hover:text-gold/70 hover:underline transition-colors"
                >
                  {project.developer_name}
                </Link>
              </span>
            ) : project.developer_name ? (
              <span className="text-xs font-medium mb-1 block"><span className="text-black">by </span><span className="text-gold">{project.developer_name}</span></span>
            ) : null}

            {/* Description - 2 lines with ...more */}

            {/* Spacer to push bottom content down */}
            <div className="flex-grow" />

            {/* Handover + Payment Plan row */}
            <div className="flex items-end justify-between mt-2 min-h-[36px]">
              {/* Payment Plan - Left */}
              {(() => {
                const breakdown = project.payment_breakdown;
                if (!breakdown || !Array.isArray(breakdown) || breakdown.length === 0) return <span />;
                const percentages = breakdown.map((b: any) => b.percentage).filter((p: any) => typeof p === 'number');
                if (percentages.length === 0) return <span />;
                return (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-gold bg-gold/10 border border-gold/30 rounded-full px-2 py-0.5">
                    <CreditCard className="w-3 h-3" />
                    {percentages.join('/')}
                  </span>
                );
              })()}
              {/* Handover - Right */}
              {project.handover_date ? (
                <span className="text-orange-500 text-xs font-bold whitespace-nowrap">
                  {project.handover_date}
                </span>
              ) : (
                <span className="text-transparent text-xs" aria-hidden="true">—</span>
              )}
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
    <section className="bg-black">
      <div className="jj-layer-2">
        {/* Section Header */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold rounded-full text-xs uppercase tracking-[0.2em] font-semibold mb-4">
            <Home className="w-3.5 h-3.5 text-gold" />
            <span className="text-black">{t('featured.title', 'Featured Properties')}</span>
          </span>
          <h2
            className="text-2xl md:text-3xl font-bold text-black"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {t('featured.heading', 'Handpicked For You')}
          </h2>

          {/* My Favorites & My Shortlist Tabs */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <Link
              to="/favorites"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-500/15 to-pink-500/15 border border-rose-500/30 text-rose-400 hover:border-rose-400 hover:bg-rose-500/20 transition-all text-sm font-medium"
            >
              <Heart className="w-4 h-4" />
              {t('featured.myFavorites', 'My Favorites')}
            </Link>
            <Link
              to="/compare"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 text-amber-400 hover:border-amber-400 hover:bg-amber-500/20 transition-all text-sm font-medium"
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
                <div key={i} className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] rounded-xl overflow-hidden border-2 border-gold/40">
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
              <Building2 className="w-10 h-10 text-gold/30 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">Featured projects coming soon</p>
            </div>
          )}
        </div>

        {/* View All CTA */}
        <div className="text-center mt-10 mb-6">
          <Link
            to="/properties"
            className="relative inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold rounded-xl transition-all duration-300 bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/50 hover:scale-[1.02] transform active:scale-95 group"
            style={{
              boxShadow: `
                0 10px 30px rgba(200,167,102,0.4),
                0 6px 15px rgba(0,0,0,0.2),
                inset 0 2px 4px rgba(255,255,255,0.9),
                inset 0 -2px 4px rgba(200,167,102,0.2),
                0 0 20px rgba(200,167,102,0.3)
              `,
            }}
          >
            <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />
            <span className="absolute inset-x-0 bottom-0 h-1/3 rounded-b-xl bg-gradient-to-t from-gold/10 to-transparent pointer-events-none" />
            <span className="relative flex items-center gap-2">
              <span className="text-black">{t('featured.viewAll', 'View All Projects')}</span>
              <ArrowRight className="w-4 h-4 text-gold group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedListings;
