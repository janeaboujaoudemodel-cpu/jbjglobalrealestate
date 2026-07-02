import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { isValidDeveloperLogoUrl } from "@/utils/developerLogo";
import { getDeveloperLogoOverride } from "@/utils/developerLogoOverrides";
import type { Developer } from "@/hooks/useProjects";

interface DeveloperCardProps {
  developer: Developer;
  projectCount?: number;
  index?: number;
  heroImageUrl?: string;
}


// Developer tier classification
const TIER_CONFIG: Record<string, { label: string; color: string }> = {
  ELITE: { label: "ELITE", color: "bg-gradient-to-r from-gold to-[#E8D5A3] text-[#1A1A1A]" },
  PREMIUM: { label: "PREMIUM", color: "bg-gradient-to-r from-amber-500 to-amber-400 text-[#1A1A1A]" },
  TOP_TIER: { label: "TOP TIER", color: "bg-gradient-to-r from-zinc-700 to-zinc-600 text-white" },
  ESTABLISHED: { label: "ESTABLISHED", color: "bg-gradient-to-r from-slate-600 to-slate-500 text-white" },
};

const ELITE_DEVELOPERS = ["emaar", "nakheel", "damac", "sobha", "meraas", "omniyat"];
const PREMIUM_DEVELOPERS = ["ellington", "aldar"];
const TOP_TIER_DEVELOPERS = ["binghatti", "majid-al-futtaim", "majid al futtaim"];
const ESTABLISHED_DEVELOPERS = ["danube", "azizi"];

function getDeveloperTier(slug: string): { label: string; color: string } | null {
  const normalizedSlug = slug.toLowerCase();
  if (ELITE_DEVELOPERS.some((d) => normalizedSlug.includes(d))) return TIER_CONFIG.ELITE;
  if (PREMIUM_DEVELOPERS.some((d) => normalizedSlug.includes(d))) return TIER_CONFIG.PREMIUM;
  if (TOP_TIER_DEVELOPERS.some((d) => normalizedSlug.includes(d))) return TIER_CONFIG.TOP_TIER;
  if (ESTABLISHED_DEVELOPERS.some((d) => normalizedSlug.includes(d))) return TIER_CONFIG.ESTABLISHED;
  return null;
}

/**
 * Reelly-style developer card.
 *
 * LOCKED layout (see mem://features/ui/developer-logo-standard-v8-locked):
 *  - Uniform-size rounded card, gold hairline, champagne content footer.
 *  - Top half = white logo plate, full-fit `object-contain`, no cropping,
 *    no project / feature photos. Logo IS the hero of the card.
 *  - Bottom half = developer name + 1-line description + stats row.
 *  - Hover = subtle lift + soft glow only. No color flips.
 */
const DeveloperCard = ({ developer, projectCount = 0, index = 99 }: DeveloperCardProps) => {
  const tier = getDeveloperTier(developer.slug || "");
  const isEager = index < 8;
  const override = getDeveloperLogoOverride(developer.name);

  return (
    <Link to={`/developer/${developer.slug}`} className="block h-full">
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="group rounded-2xl overflow-hidden cursor-pointer flex flex-col h-full bg-[#FDFBF7]"
        style={{
          border: "1px solid rgba(184,149,85,0.35)",
          boxShadow:
            "0 8px 24px rgba(200,167,102,0.18), 0 2px 6px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.5)",
        }}
      >
        {/* Logo plate — uniform white surface, full-fit logo, no crops */}
        <div className="relative aspect-[5/3] bg-white border-b border-[#B89555]/25 flex items-center justify-center p-8">
          {override.forceNameplate ? (
            <span className="text-[#1A1A1A] font-bold text-2xl md:text-3xl tracking-tight text-center px-2">
              {developer.name}
            </span>
          ) : isValidDeveloperLogoUrl(developer.logo_url) ? (
            <img
              src={developer.logo_url}
              alt={`${developer.name} logo`}
              loading={isEager ? "eager" : "lazy"}
              referrerPolicy="no-referrer"
              className="block max-h-full max-w-full w-auto h-auto object-contain transition-transform duration-300 group-hover:scale-[1.04]"
              style={{
                filter: override.invert
                  ? "invert(1) brightness(1)"
                  : "contrast(1.08) saturate(1.1)",
              }}
             decoding="async" />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2">
              <Building2 className="w-10 h-10 text-[#1A1A1A]/40" />
              <span className="text-[#1A1A1A] text-sm font-semibold tracking-wide text-center line-clamp-2 max-w-[220px]">
                {developer.name}
              </span>
            </div>
          )}

          {/* Tier Badge — top-right pill on the plate */}
          {tier && (
            <div className="absolute top-3 right-3 z-10">
              <Badge
                className={`${tier.color} px-2.5 py-0.5 text-[9px] font-bold tracking-wider shadow-md`}
                data-no-contrast-guard
              >
                {tier.label}
              </Badge>
            </div>
          )}
        </div>

        {/* Content section */}
        <div className="flex-1 p-4 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] flex flex-col">
          <h3 className="text-[#1A1A1A] font-bold text-base md:text-lg mb-1.5 line-clamp-1 group-hover:text-[#1A1A1A] transition-colors">
            {developer.name}
          </h3>

          <div className="flex-1 min-h-[36px]">
            {developer.description ? (
              <p className="text-[#1A1A1A]/70 text-xs line-clamp-2 leading-relaxed">
                {developer.description}
              </p>
            ) : (
              <p className="text-[#1A1A1A]/60 text-xs italic">
                Premier developer in the UAE market
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 text-[#1A1A1A]/75 text-xs mt-3 pt-3 border-t border-[#B89555]/20">
            {projectCount > 0 ? (
              <div className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-[#1A1A1A]" />
                <span>{projectCount} Projects</span>
              </div>
            ) : null}
            {developer.completed_projects && developer.completed_projects > 0 ? (
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-[#1A1A1A]" />
                <span>{developer.completed_projects.toLocaleString()}+ Delivered</span>
              </div>
            ) : null}
            {!projectCount && (!developer.completed_projects || developer.completed_projects === 0) && (
              <span className="text-[#1A1A1A]/60 text-xs">View developer portfolio</span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default DeveloperCard;
