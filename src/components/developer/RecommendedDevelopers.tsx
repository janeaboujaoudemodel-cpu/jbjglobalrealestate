import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useDevelopers } from "@/hooks/useProjects";
import { useUserBrowsingContext } from "@/hooks/useUserBrowsingContext";
import { getHighResImageUrl } from "@/lib/imageUtils";
import { supabase } from "@/integrations/supabase/client";
import { DeveloperLogo } from "@/components/ui/DeveloperLogo";
import { getVerifiedDeveloperFlagship, isUsableDeveloperCover } from "@/utils/developerFlagshipMedia";

interface RecommendedDevelopersProps {
  currentDeveloperSlug: string;
  currentDeveloperEmirate?: string | null;
}

function RecommendedDeveloperPhoto({ urls, name }: { urls: string[]; name: string }) {
  const [index, setIndex] = useState(0);
  useEffect(() => setIndex(0), [name, urls.join("|")]);
  const url = urls[index];
  if (!url) return null;
  return <img src={getHighResImageUrl(url)} alt={`${name} featured development`} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" decoding="async" onError={() => setIndex((current) => Math.min(current + 1, urls.length))} />;
}

export default function RecommendedDevelopers({
  currentDeveloperSlug,
  currentDeveloperEmirate,
}: RecommendedDevelopersProps) {
  const { data: developers } = useDevelopers();
  const browsingContext = useUserBrowsingContext();

  const recommended = useMemo(() => {
    if (!developers || developers.length === 0) return [];

    const others = developers.filter(
      (d: any) => d.slug !== currentDeveloperSlug && d.is_active !== false
    );

    // Score each developer
    const scored = others.map((dev: any) => {
      let score = 0;

      // Boost developers with more projects
      const projectCount = dev.offplan_projects || dev.completed_projects || 0;
      score += Math.min(projectCount, 20);

      // Boost if developer has a logo (better presentation)
      if (dev.logo_url) score += 5;

      // Boost if user browsed areas that match developer's known locations
      if (browsingContext.hasData && browsingContext.recentAreas.length > 0) {
        const devSpec = (dev.specialization || "").toLowerCase();
        const devName = (dev.name || "").toLowerCase();
        if (
          browsingContext.recentAreas.some(
            (a) => devSpec.includes(a.toLowerCase()) || devName.includes(a.toLowerCase())
          )
        ) {
          score += 10;
        }
      }

      // Boost well-known developers with descriptions
      if (dev.description) score += 3;

      return { developer: dev, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((s) => s.developer);
  }, [developers, currentDeveloperSlug, browsingContext]);

  const recommendedIds = useMemo(
    () => recommended.map((d: any) => d.id).filter(Boolean),
    [recommended],
  );

  // Fetch one real project cover image per recommended developer, so cards
  // never fall back to a text/wordmark logo (e.g. "DPF") when feature_image_url
  // is missing. This hook MUST run unconditionally on every render to keep
  // hook order stable — the early-return guard below happens AFTER it.
  const { data: projectImageByDev } = useQuery({
    queryKey: ["recommended-dev-project-images", recommendedIds],
    enabled: recommendedIds.length > 0,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const map: Record<string, string[]> = {};
      const { data, error } = await supabase
        .from("projects")
        .select("developer_id, cover_image_url, card_image_url, gallery_start_image_url, is_featured, total_units")
        .in("developer_id", recommendedIds)
        .eq("is_published", true)
        .is("deleted_at", null)
        .order("is_featured", { ascending: false })
        .order("total_units", { ascending: false, nullsFirst: false })
        .limit(48);
      if (error) throw error;
      (data || []).forEach((row: any) => {
        if (!row.developer_id) return;
        const urls = [row.cover_image_url, row.card_image_url, row.gallery_start_image_url]
          .filter((url): url is string => typeof url === "string" && url.length > 0);
        map[row.developer_id] = [...new Set([...(map[row.developer_id] || []), ...urls])].slice(0, 12);
      });
      return map;
    },
  });

  if (recommended.length === 0) return null;



  return (
    <section
      className="py-14 jj-band"
      style={{
        background:
          "linear-gradient(135deg, #FDFBF7 0%, #F7F2EA 50%, #EFE6D6 100%)",
        borderTop: "1px solid rgba(184,149,85,0.55)",
        borderBottom: "1px solid rgba(184,149,85,0.55)",
      }}
    >
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <span className="jj-pill-emerald-metallic allow-white inline-flex items-center gap-2 px-4 py-2 border-0 rounded-full text-xs uppercase tracking-[0.2em] font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span className="text-white">Explore Developers</span>
            </span>
            <h2 className="text-[#1A1A1A] text-2xl md:text-3xl font-bold">
              Similar Developers
            </h2>
          </div>

          {/* Developer Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch max-w-6xl mx-auto">
            {recommended.map((dev: any, index: number) => {
              // Prefer a real project cover image. Never use the developer
              // logo/wordmark as the card hero — that's what produced the
              // "DPF" text placeholder on DAMAC.
              const rawProjectImages = projectImageByDev?.[dev.id];
              const projectImages = Array.isArray(rawProjectImages) ? rawProjectImages : rawProjectImages ? [rawProjectImages] : [];
              const cardImages = [...new Set([
                getVerifiedDeveloperFlagship(dev.name, dev.slug),
                ...projectImages,
                dev.feature_image_url,
              ].filter((url): url is string => Boolean(url) && isUsableDeveloperCover(url)))];
              return (
              <motion.div
                key={dev.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.07 }}
                whileHover={{ y: -6 }}
                className="h-full"
              >
                <Link
                  to={`/developer/${dev.slug}`}
                  className="group flex min-h-[290px] flex-col h-full rounded-xl border border-[#B89555]/60 hover:border-[#B89555] bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] transition-all duration-150 hover:shadow-[0_8px_30px_rgba(184,149,85,0.28)]"
                >
                  {/* Photo only when a real project cover exists — never a guessed fallback image. */}
                  <div className="relative">
                  <div className="h-44 relative overflow-hidden bg-[#F7F2EA] rounded-t-xl">
                    <RecommendedDeveloperPhoto urls={cardImages} name={dev.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                  </div>
                    <div className="absolute bottom-0 left-4 z-20 h-16 w-16 translate-y-1/2 rounded-lg border border-white/35 bg-[#042C1C] bg-[linear-gradient(155deg,#064E3B_0%,#042C1C_58%,#000000_100%)] p-1.5 shadow-[0_6px_18px_rgba(0,0,0,0.30)]">
                      <DeveloperLogo src={dev.logo_url} name={dev.name} alt={`${dev.name} logo`} variant="bare" embedded className="!h-full !w-full !border-0 !bg-transparent !shadow-none !p-1 !rounded-md" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="px-4 pb-4 pt-10 border-t border-[#B89555]/50 flex-1 flex flex-col justify-start">
                    <h3 className="text-[#1A1A1A] font-bold text-sm leading-snug group-hover:text-[#1A1A1A] transition-colors break-words">
                      {dev.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-[#1A1A1A]">
                      {dev.completed_projects != null && dev.completed_projects > 0 && (
                        <span>{Number(dev.completed_projects).toLocaleString()} Completed</span>
                      )}
                      {dev.offplan_projects != null && dev.offplan_projects > 0 && (
                        <span>{Number(dev.offplan_projects).toLocaleString()} Off-Plan</span>
                      )}
                    </div>
                    <span className="mt-auto pt-4 text-xs font-bold text-[#064E3B]">View developer portfolio</span>
                  </div>
                </Link>
              </motion.div>
              );
            })}
          </div>

          {/* View All CTA — gold border */}
          <div className="text-center mt-8">
            <Link
              to="/developers"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] border border-[#B89555]/80 rounded-xl text-[#1A1A1A] font-semibold text-sm hover:shadow-[0_4px_20px_rgba(184,149,85,0.28)] hover:-translate-y-0.5 transition-all duration-150 group"
              style={{
                boxShadow:
                  "0 6px 20px rgba(184,149,85,0.20), inset 0 2px 4px rgba(255,255,255,0.8)",
              }}
            >
              <span>View All Developers</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
