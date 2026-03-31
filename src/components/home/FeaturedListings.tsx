/**
 * FeaturedListings Component
 * Displays 8 featured project cards from elite developers
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { Home, MapPin, ArrowRight, Building2, ArrowUpRight, CreditCard, Heart, Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/hooks/useCurrency";
import { getDeveloperLogoUrl } from "@/utils/developerLogo";

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
        .select("id, name, slug, developer_name, description, price_from, area_name, location, cover_image_url, bedrooms_min, bedrooms_max, handover_date, payment_breakdown, images:project_images(image_url), developer:developers(id, name, slug, logo_url)")
        .in("developer_name", ELITE_DEVELOPERS)
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(40);

      if (error) throw error;

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

      const addOne = (devName: string, nameFilter?: string): boolean => {
        const devProjects = byDev[devName] || [];
        let candidate: FeaturedProject | undefined;
        if (nameFilter) {
          candidate = devProjects.find(p => p.name.toLowerCase().includes(nameFilter) && !usedIds.has(p.id));
        }
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

      addOne('DAMAC', 'amra');
      addOne('Emaar');
      addOne('Nakheel');
      addOne('Sobha', 'pinnacle');
      addOne('Meraas');
      addOne('Binghatti', 'mercedes');
      addOne('ALDAR');
      addOne('Omniyat');

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
  const rawLogoUrl = getDeveloperLogoUrl(project.developer);
  const logoUrl = devName.toLowerCase().includes('binghatti')
    ? '/developers/logos/binghatti-logo.webp'
    : rawLogoUrl;
  const [logoError, setLogoError] = useState(false);

  return (
    <div className="group h-full animate-fade-in-up">
      <Link to={`/project/${project.slug}`} className="block h-full" onMouseEnter={prefetchProjectDetail}>
        <div className="flex flex-col h-full bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-gray-400 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          {/* Image */}
          <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
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
                <Building2 className="w-10 h-10 text-gray-600" />
              </div>
            )}

            {/* Developer Logo */}
            {logoUrl && !logoError ? (
              <div className="absolute top-3 left-3 z-10">
                <div className="w-12 h-12 rounded-lg shadow-lg overflow-hidden p-1.5 bg-black/40 backdrop-blur-sm">
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
                <div className="w-12 h-12 rounded-lg bg-black/80 shadow-lg border border-gray-600 flex items-center justify-center backdrop-blur-sm">
                  <span className="text-white font-bold text-lg" style={{ fontFamily: "serif" }}>
                    {devName.charAt(0)}
                  </span>
                </div>
              </div>
            )}

            {/* Price badge */}
            {project.price_from && (
              <div className="absolute bottom-3 right-3 z-10 px-3 py-1.5 rounded-lg bg-black/90 backdrop-blur-md border border-gray-700 shadow-lg">
                <span className="text-white font-bold text-xs tracking-wide">
                  From {formatPrice(project.price_from)}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 flex flex-col flex-grow min-h-[140px]">
            <div className="min-h-[20px] mb-2">
              {(project.area_name || project.location) ? (
                <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                  <span className="truncate">{project.area_name || project.location}</span>
                </div>
              ) : (
                <div className="h-[20px]" aria-hidden="true" />
              )}
            </div>

            <h3 className="text-black font-semibold text-sm mb-2 line-clamp-2 group-hover:text-gray-700 transition-colors min-h-[40px]">
              {project.name}
            </h3>
            {project.developer?.slug ? (
              <span className="text-xs mb-1 block">
                <span className="text-gray-600 font-medium">by </span>
                <Link
                  to={`/developer/${project.developer.slug}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-black font-medium hover:text-gray-600 hover:underline transition-colors"
                >
                  {project.developer_name}
                </Link>
              </span>
            ) : project.developer_name ? (
              <span className="text-xs font-medium mb-1 block"><span className="text-gray-600">by </span><span className="text-black">{project.developer_name}</span></span>
            ) : null}

            {(project as any).description && (
              <p className="text-gray-600 text-xs line-clamp-2 mb-2">{(project as any).description}</p>
            )}

            <hr className="border-gray-200 my-2" />
            <div className="flex-grow" />

            <div className="flex items-end justify-between mt-2 min-h-[36px]">
              {(() => {
                const breakdown = project.payment_breakdown;
                if (!breakdown || !Array.isArray(breakdown) || breakdown.length === 0) return <span />;
                const percentages = breakdown.map((b: any) => b.percentage).filter((p: any) => typeof p === 'number');
                if (percentages.length === 0) return <span />;
                return (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-300 rounded-full px-2 py-0.5">
                    <CreditCard className="w-3 h-3" />
                    {percentages.join('/')}
                  </span>
                );
              })()}
              {project.handover_date ? (
                <span className="text-gray-600 text-xs font-bold whitespace-nowrap">
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
    <section className="bg-white">
      <div className="jj-layer-2">
        {/* Section Header */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-300 rounded-full text-xs uppercase tracking-[0.2em] font-semibold mb-4">
            <Home className="w-3.5 h-3.5 text-gray-600" />
            <span className="text-black">{t('featured.title', 'Featured Properties')}</span>
          </span>
          <h2
            className="text-2xl md:text-3xl font-bold text-black"
          >
            {t('featured.heading', 'Handpicked For You')}
          </h2>

          {/* My Favorites & My Shortlist Tabs */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <Link
              to="/favorites"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gray-100 border border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-200 transition-all text-sm font-medium"
            >
              <Heart className="w-4 h-4" />
              {t('featured.myFavorites', 'My Favorites')}
            </Link>
            <Link
              to="/compare"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gray-100 border border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-200 transition-all text-sm font-medium"
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
                <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-200">
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
              <Building2 className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-600 text-sm">Featured projects coming soon</p>
            </div>
          )}
        </div>

        {/* View All CTA */}
        <div className="text-center mt-10 mb-6">
          <Link
            to="/properties"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold rounded-xl transition-all duration-300 bg-black text-white border border-gray-800 hover:bg-gray-800 hover:scale-[1.02] transform active:scale-95 group"
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
