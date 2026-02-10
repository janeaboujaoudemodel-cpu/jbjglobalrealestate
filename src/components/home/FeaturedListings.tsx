/**
 * FeaturedListings Component
 * Displays 8 featured project cards from elite developers
 * Emaar (2), ALDAR (2), Omniyat (1), Sobha Pinnacle (1), Binghatti Bugatti (1), Binghatti Mercedes (1)
 */

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, MapPin, ArrowRight, Building2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const ELITE_DEVELOPERS = ['Emaar', 'Omniyat', 'Sobha', 'ALDAR', 'Binghatti', 'Nakheel', 'Dubai Properties'];

const formatPrice = (price: number): string => {
  if (price >= 1000000) {
    return `AED ${(price / 1000000).toFixed(1)}M`;
  }
  return `AED ${price.toLocaleString()}`;
};

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
  images: { image_url: string }[];
  developer: { id: string; name: string; slug: string; logo_url: string | null } | null;
}

function useFeaturedProjects() {
  return useQuery({
    queryKey: ["featured-projects-elite-v2"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, slug, developer_name, price_from, area_name, location, cover_image_url, bedrooms_min, bedrooms_max, handover_date, images:project_images(image_url), developer:developers(id, name, slug, logo_url)")
        .in("developer_name", ELITE_DEVELOPERS)
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(60);

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

      // Helper to add first non-Mirage project from a developer
      const addOne = (devName: string, filter?: (p: FeaturedProject) => boolean) => {
        const devProjects = byDev[devName] || [];
        const filtered = filter ? devProjects.filter(filter) : devProjects;
        const nonMirage = filtered.find(p => !p.name.toLowerCase().includes('mirage'));
        if (nonMirage) result.push(nonMirage);
        else if (filtered[0]) result.push(filtered[0]);
      };

      // 1 Emaar
      addOne('Emaar');

      // 1 ALDAR
      addOne('ALDAR');

      // 1 Omniyat
      addOne('Omniyat');

      // 1 Sobha - only Pinnacle preferred
      const sobhaProjects = byDev['Sobha'] || [];
      const pinnacle = sobhaProjects.find(p => p.name.toLowerCase().includes('pinnacle'));
      if (pinnacle) {
        result.push(pinnacle);
      } else {
        addOne('Sobha');
      }

      // 1 Nakheel
      addOne('Nakheel');

      // 1 Dubai Properties
      addOne('Dubai Properties');

      // 1 Bugatti by Binghatti
      const binghattiProjects = byDev['Binghatti'] || [];
      const bugatti = binghattiProjects.find(p => p.name.toLowerCase().includes('bugatti'));
      if (bugatti) result.push(bugatti);

      // 1 Mercedes-Benz by Binghatti
      const mercedes = binghattiProjects.find(p => p.name.toLowerCase().includes('mercedes'));
      if (mercedes) result.push(mercedes);

      // Fill remaining slots if needed
      if (result.length < 8) {
        const usedIds = new Set(result.map(r => r.id));
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

const ProjectCard = ({ project }: { project: FeaturedProject }) => {
  const imageUrl = project.cover_image_url || project.images?.[0]?.image_url;
  const logoUrl = (project.developer as any)?.logo_url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="group"
    >
      <Link to={`/projects/${project.slug}`} className="block">
        <div className="flex flex-col h-full bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] rounded-xl overflow-hidden border-2 border-gold/30 hover:border-gold transition-all duration-300 hover:shadow-[0_8px_30px_rgba(200,167,102,0.4)] hover:-translate-y-1">
          {/* Image */}
          <div className="relative aspect-[4/3] overflow-hidden bg-gold/5">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={project.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 className="w-10 h-10 text-gold/30" />
              </div>
            )}

            {/* Developer Logo - Top Left */}
            {logoUrl ? (
              <div className="absolute top-3 left-3 z-10 w-10 h-10 rounded-lg bg-white shadow-lg border border-gold/30 overflow-hidden">
                <img
                  src={logoUrl}
                  alt={project.developer_name || ''}
                  className="w-full h-full object-fill"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-semibold bg-black/80 text-gold backdrop-blur-sm">
                  {project.developer_name}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 flex flex-col flex-grow">
            {/* Location */}
            {(project.area_name || project.location) && (
              <div className="flex items-center gap-1.5 text-zinc-600 text-xs mb-2">
                <MapPin className="w-3.5 h-3.5 text-gold" />
                <span>{project.area_name || project.location}</span>
              </div>
            )}

            {/* Title */}
            <h3 className="text-black font-semibold text-sm mb-2 line-clamp-2 group-hover:text-gold transition-colors" style={{ fontFamily: "Poppins, sans-serif" }}>
              {project.name}
            </h3>

            {/* Spacer to push bottom content down */}
            <div className="flex-grow" />

            {/* Developer + Price + Handover row */}
            <div className="flex items-end justify-between mt-2">
              <div>
                {project.developer_name && (
                  <span className="text-gold font-medium text-[10px] block">by {project.developer_name}</span>
                )}
                {project.price_from && (
                  <span className="text-black font-bold text-xs">
                    From {formatPrice(project.price_from)}
                  </span>
                )}
              </div>
              {project.handover_date && (
                <span className="text-zinc-500 text-[10px] font-medium">
                  {project.handover_date}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const FeaturedListings = () => {
  const { t } = useLanguage();
  const { data: projects, isLoading } = useFeaturedProjects();

  return (
    <section className="py-12 md:py-16 bg-black">
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
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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
            : projects?.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
          {!isLoading && (!projects || projects.length === 0) && (
            <div className="col-span-full text-center py-12">
              <Building2 className="w-10 h-10 text-gold/30 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">Featured projects coming soon</p>
            </div>
          )}
        </div>

        {/* View All CTA */}
        <div className="text-center mt-10">
          <Link
            to="/projects"
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
