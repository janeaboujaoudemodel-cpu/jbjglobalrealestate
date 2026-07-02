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


// Developer tier — every card gets a unified emerald metallic pill with pure
// white text. No black-on-emerald, no missing badges, one readable style.
const TIER_PILL = "jj-pill-emerald-metallic allow-white text-white border-0";
const TIER_CONFIG: Record<string, { label: string; color: string }> = {
  ELITE:       { label: "ELITE",       color: TIER_PILL },
  PREMIUM:     { label: "PREMIUM",     color: TIER_PILL },
  TOP_TIER:    { label: "TOP TIER",    color: TIER_PILL },
  ESTABLISHED: { label: "ESTABLISHED", color: TIER_PILL },
  PARTNER:     { label: "PARTNER",     color: TIER_PILL },
};

const ELITE_DEVELOPERS = ["emaar", "nakheel", "damac", "sobha", "meraas", "omniyat", "aldar", "dubai-properties", "dubai properties", "dubai-holding", "dubai holding"];
const PREMIUM_DEVELOPERS = ["ellington", "binghatti", "danube", "azizi", "select-group", "select group", "deyaar", "majid-al-futtaim", "majid al futtaim", "arada", "nshama", "wasl"];
const TOP_TIER_DEVELOPERS = ["imtiaz", "samana", "tiger", "beyond", "object", "rak-properties", "rak properties", "mag", "meydan", "reportage", "h&h", "h-h"];
const ESTABLISHED_DEVELOPERS = ["aark", "ab-developers", "radiant", "peace homes"];

function getDeveloperTier(slug: string, name = "", rank?: number | null): { label: string; color: string } {
  const normalized = `${slug} ${name}`.toLowerCase();
  if (ELITE_DEVELOPERS.some((d) => normalized.includes(d))) return TIER_CONFIG.ELITE;
  if (PREMIUM_DEVELOPERS.some((d) => normalized.includes(d))) return TIER_CONFIG.PREMIUM;
  if (TOP_TIER_DEVELOPERS.some((d) => normalized.includes(d))) return TIER_CONFIG.TOP_TIER;
  if (ESTABLISHED_DEVELOPERS.some((d) => normalized.includes(d))) return TIER_CONFIG.ESTABLISHED;
  if (rank && rank > 0) {
    if (rank <= 10) return TIER_CONFIG.ELITE;
    if (rank <= 30) return TIER_CONFIG.PREMIUM;
    if (rank <= 80) return TIER_CONFIG.TOP_TIER;
  }
  return TIER_CONFIG.PARTNER; // universal fallback so every card has a badge
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
const DeveloperCard = ({ developer, projectCount = 0, index = 99, heroImageUrl }: DeveloperCardProps) => {
  const tier = getDeveloperTier(developer.slug || "", developer.name || "", developer.rank);
  const isEager = index < 8;
  const override = getDeveloperLogoOverride(developer.name);
  const cardHeroImageUrl = developer.feature_image_url || heroImageUrl;
  const hasHero = !!cardHeroImageUrl;
  const logoValid = isValidDeveloperLogoUrl(developer.logo_url);

  return (
    <Link to={`/developer/${developer.slug}`} className="block h-full [perspective:1200px]">
      <motion.div
        whileHover={{ y: -8, scale: 1.015, boxShadow: "0 24px 48px -12px rgba(0,0,0,0.28), 0 12px 24px -8px rgba(184,149,85,0.25)" }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="group relative rounded-2xl overflow-hidden cursor-pointer flex flex-col h-full bg-[#FDFBF7]"
        style={{
          boxShadow: "0 6px 16px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)",
        }}
      >

        {/* Hero — project photo (preferred) with logo/name fallback */}
        <div className="relative aspect-[5/3] bg-[#F5F0E6] flex items-center justify-center overflow-hidden">
          {hasHero ? (
            <>
              <img
                src={cardHeroImageUrl}
                alt={`${developer.name} featured project`}
                loading={isEager ? "eager" : "lazy"}
                referrerPolicy="no-referrer"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
            </>
          ) : override.forceNameplate ? (
            <span className="text-[#1A1A1A] font-bold text-2xl md:text-3xl tracking-tight text-center px-2">
              {developer.name}
            </span>
          ) : logoValid ? (
            <img
              src={developer.logo_url}
              alt={`${developer.name} logo`}
              loading={isEager ? "eager" : "lazy"}
              referrerPolicy="no-referrer"
              decoding="async"
              className="block max-h-[70%] max-w-[80%] w-auto h-auto object-contain"
              style={{
                filter: override.invert ? "invert(1) brightness(1)" : "contrast(1.08) saturate(1.1)",
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2">
              <Building2 className="w-10 h-10 text-[#1A1A1A]/40" />
              <span className="text-[#1A1A1A] text-sm font-semibold tracking-wide text-center line-clamp-2 max-w-[220px]">
                {developer.name}
              </span>
            </div>
          )}

          {/* Tier Badge — unified emerald metallic pill, white text, always present */}
          {tier && (
            <div className="absolute top-3 right-3 z-10">
              <Badge
                className={`${tier.color} px-3 py-1 text-[10px] font-bold tracking-[0.14em] shadow-[0_6px_16px_rgba(4,31,24,0.35)] rounded-full`}
                data-no-contrast-guard
                data-allow-white
              >
                <span className="text-white">{tier.label}</span>
              </Badge>
            </div>
          )}
        </div>

        {/* Content section */}
        <div className="flex-1 p-4 bg-[#FDFBF7] flex flex-col">
          <h3 className="text-[#1A1A1A] font-bold text-base md:text-lg mb-1.5 line-clamp-1">
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

          <div className="flex items-center gap-3 text-[#1A1A1A]/75 text-xs mt-3 pt-3 border-t border-black/5">
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

