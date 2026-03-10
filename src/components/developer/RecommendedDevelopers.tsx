import { Link } from "react-router-dom";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Building, ArrowRight, Sparkles } from "lucide-react";
import { useDevelopers } from "@/hooks/useProjects";
import { SafeImage } from "@/components/SafeImage";
import { useUserBrowsingContext } from "@/hooks/useUserBrowsingContext";

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
    <section className="py-12 bg-black">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold rounded-full text-xs uppercase tracking-[0.2em] font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              <span className="text-black">Explore Developers</span>
            </span>
            <h2
              className="text-white text-2xl md:text-3xl font-bold"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
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
                  className="group block rounded-xl border-2 border-gold/20 hover:border-gold/60 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgba(200,167,102,0.3)]"
                >
                  {/* Logo */}
                  <div className="h-28 flex items-center justify-center p-4 bg-white/50">
                    {dev.logo_url ? (
                      <SafeImage
                        src={dev.logo_url}
                        alt={dev.name}
                        className="max-h-16 max-w-[120px] object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <Building className="w-10 h-10 text-gold/30" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3 border-t border-gold/20">
                    <h3 className="text-black font-bold text-sm leading-tight group-hover:text-gold transition-colors line-clamp-1">
                      {dev.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-black/50">
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
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold rounded-xl text-black font-semibold text-sm hover:shadow-[0_4px_20px_rgba(200,167,102,0.4)] hover:-translate-y-0.5 transition-all duration-300 group"
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
