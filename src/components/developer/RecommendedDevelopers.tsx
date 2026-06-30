import { Link } from "react-router-dom";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Building, ArrowRight, Sparkles } from "lucide-react";
import { useDevelopers } from "@/hooks/useProjects";
import { useUserBrowsingContext } from "@/hooks/useUserBrowsingContext";
import { getDeveloperLogoOverride } from "@/utils/developerLogoOverrides";

interface RecommendedDevelopersProps {
  currentDeveloperSlug: string;
  currentDeveloperEmirate?: string | null;
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

  if (recommended.length === 0) return null;

  return (
    <section
      className="py-14 jj-band"
      style={{
        background:
          "linear-gradient(135deg, #FDFBF7 0%, #F7F2EA 50%, #EFE6D6 100%)",
        borderTop: "1px solid rgba(184,149,85,0.25)",
        borderBottom: "1px solid rgba(184,149,85,0.25)",
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
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#FDFBF7] border border-[#B89555]/60 rounded-full text-xs uppercase tracking-[0.2em] font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5 text-[#1A1A1A]" />
              <span className="text-[#1A1A1A]">Explore Developers</span>
            </span>
            <h2 className="text-[#1A1A1A] text-2xl md:text-3xl font-bold">
              Similar Developers
            </h2>
          </div>

          {/* Developer Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {recommended.map((dev: any, index: number) => (
              <motion.div
                key={dev.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.07 }}
                whileHover={{ y: -6 }}
              >
                <Link
                  to={`/developer/${dev.slug}`}
                  className="group block rounded-xl border-2 border-[#B89555]/20 hover:border-[#B89555]/60 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgba(200,167,102,0.3)]"
                >
                  {/* Logo — full-fit, real logo only; name fallback when missing */}
                  <div className="h-28 flex items-center justify-center p-4 bg-white text-[#1A1A1A]">
                    {getDeveloperLogoOverride(dev.name).forceNameplate ? (
                      <span className="text-[#1A1A1A] font-bold text-lg tracking-tight text-center px-2">
                        {dev.name}
                      </span>
                    ) : dev.logo_url ? (
                      <img
                        src={dev.logo_url}
                        alt={`${dev.name} logo`}
                        loading="lazy"
                        className="block max-h-full max-w-full w-auto h-auto object-contain"
                        style={{
                          filter: getDeveloperLogoOverride(dev.name).invert
                            ? "invert(1) brightness(1)"
                            : "contrast(1.08) saturate(1.1)",
                        }}
                       decoding="async" />
                    ) : (
                      <span className="text-[#1A1A1A] font-bold text-base text-center px-2">
                        {dev.name}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3 border-t border-[#B89555]/20">
                    <h3 className="text-[#1A1A1A] font-bold text-sm leading-tight group-hover:text-[#1A1A1A] transition-colors line-clamp-1">
                      {dev.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-[#1A1A1A]">
                      {dev.completed_projects != null && dev.completed_projects > 0 && (
                        <span>{dev.completed_projects} Completed</span>
                      )}
                      {dev.offplan_projects != null && dev.offplan_projects > 0 && (
                        <span>{dev.offplan_projects} Off-Plan</span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* View All CTA */}
          <div className="text-center mt-8">
            <Link
              to="/developers"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] border-2 border-[#B89555] rounded-xl text-[#1A1A1A] font-semibold text-sm hover:shadow-[0_4px_20px_rgba(200,167,102,0.4)] hover:-translate-y-0.5 transition-all duration-300 group"
              style={{
                boxShadow:
                  "0 6px 20px rgba(200,167,102,0.3), inset 0 2px 4px rgba(255,255,255,0.8)",
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
