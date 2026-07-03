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
};

const ELITE_DEVELOPERS = ["emaar", "nakheel", "damac", "sobha", "meraas", "omniyat", "aldar", "dubai-properties", "dubai properties", "dubai-holding", "dubai holding"];
const PREMIUM_DEVELOPERS = ["ellington", "binghatti", "danube", "azizi", "select-group", "select group", "deyaar", "majid-al-futtaim", "majid al futtaim", "arada", "nshama", "wasl"];
const TOP_TIER_DEVELOPERS = ["imtiaz", "samana", "tiger", "beyond", "object", "rak-properties", "rak properties", "mag", "meydan", "reportage", "h&h", "h-h"];
const ESTABLISHED_DEVELOPERS = ["aark", "ab-developers", "radiant", "peace homes"];

// Curated signature-project / master-plan photography per developer.
// Every major UAE developer has a distinct, real, aerial-or-signature
// project photo (Omniyat-style concept the user approved). No generic
// stock, no cross-developer reuse. Photos are chosen to actually depict
// the developer's flagship community or a landmark they built.
const ICONIC_DEVELOPER_IMAGES: Record<string, string> = {
  // === ELITE — Dubai's Tier-1 masters ===
  emaar: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1600&q=80", // Downtown Dubai / Burj Khalifa
  nakheel: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1600&q=80", // Palm Jumeirah aerial
  omniyat: "https://images.unsplash.com/photo-1546412414-e1885259563a?w=1600&q=80", // Business Bay / The Opus district
  damac: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1600&q=80", // DAMAC Hills / signature tower
  aldar: "https://images.unsplash.com/photo-1523592121529-f6dde35f079e?w=1600&q=80", // Yas Island / Abu Dhabi waterfront
  sobha: "https://images.unsplash.com/photo-1512699355324-f07e3106dae5?w=1600&q=80", // Sobha Hartland
  meraas: "https://images.unsplash.com/photo-1582672060674-bc2bd808a8ce?w=1600&q=80", // Bluewaters / Ain Dubai
  "dubai properties": "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?w=1600&q=80", // Business Bay
  "dubai holding": "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1600&q=80", // Madinat Jumeirah aerial
  // === PREMIUM ===
  ellington: "https://ggfx-providentestate.s3.eu-west-2.amazonaws.com/i/mercer_house_feature_2f760d5712.jpg", // Mercer House
  wellington: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=80", // distinct — never Ellington
  binghatti: "https://ggfx-providentestate.s3.eu-west-2.amazonaws.com/i/Bugatti_Residences_featured_1141e882f9.jpg", // Bugatti Residences
  danube: "https://ggfx-providentestate.s3.eu-west-2.amazonaws.com/i/diamondz_feature_3847014a22.jpg", // Diamondz
  azizi: "https://ggfx-providentestate.s3.eu-west-2.amazonaws.com/i/azizi_venice_feature_1bf0181c07.jpg", // Azizi Venice
  "select group": "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=1600&q=80", // Dubai Marina
  deyaar: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=1600&q=80", // Business Bay tower
  "majid al futtaim": "https://ggfx-providentestate.s3.eu-west-2.amazonaws.com/i/Lacina_Residences_by_Majid_Al_Futtaim_a869016d98.jpg", // Lacina
  arada: "https://images.unsplash.com/photo-1567636788276-40a47795ba4d?w=1600&q=80", // Aljada / Sharjah community
  nshama: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80", // Town Square community
  wasl: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1600&q=80", // Dubai skyline
  // === TOP TIER ===
  imtiaz: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&q=80",
  samana: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1600&q=80",
  tiger: "https://images.unsplash.com/photo-1577415124269-fc1140a69e91?w=1600&q=80",
  beyond: "https://ggfx-providentestate.s3.eu-west-2.amazonaws.com/i/Passo_by_Beyond_at_Palm_Jumeirah_Luxury_Residences_955c20826b.jpg",
  object: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=1600&q=80",
  "rak properties": "https://images.unsplash.com/photo-1548013146-72479768bada?w=1600&q=80", // Mina Al Arab / RAK coast
  mag: "https://images.unsplash.com/photo-1519643381401-22c77e60520e?w=1600&q=80",
  meydan: "https://images.unsplash.com/photo-1517832606299-7ae9b720a186?w=1600&q=80", // Meydan district
  reportage: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1600&q=80",
  "h h": "https://a.storyblok.com/f/209096/1360x1020/62128e6c6b/sunrise-valley-by-h-h-in-nad-al-sheba.jpg",
  "sunrise valley": "https://a.storyblok.com/f/209096/1360x1020/62128e6c6b/sunrise-valley-by-h-h-in-nad-al-sheba.jpg",
  // === ESTABLISHED / OTHERS ===
  "ax capital": "https://fnst.axflare.com/community/WEBP/mnWCpcuCse.webp",
  aark: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1600&q=80",
  radiant: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1600&q=80",
  "peace homes": "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=1600&q=80",
};

// Match by matching *any* keyword token in the developer name/slug against
// the curated map keys. Keeps rules explicit and prevents accidental reuse
// (e.g. Wellington will never match `ellington` because we use word boundary).
function getIconicDeveloperImage(slug: string, name: string) {
  const combined = ` ${slug} ${name} `.toLowerCase().replace(/[-_]/g, " ");
  for (const key of Object.keys(ICONIC_DEVELOPER_IMAGES)) {
    const re = new RegExp(`(^|\\s)${key.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}(\\s|$)`);
    if (re.test(combined)) return ICONIC_DEVELOPER_IMAGES[key];
  }
  return undefined;
}


function getDeveloperTier(slug: string, name = "", rank?: number | null): { label: string; color: string } | null {
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
  // No generic "PARTNER" label — leave badgeless rather than mislabel.
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
const DeveloperCard = ({ developer, projectCount = 0, index = 99, heroImageUrl }: DeveloperCardProps) => {
  const tier = getDeveloperTier(developer.slug || "", developer.name || "", developer.rank);
  const isEager = index < 8;
  const override = getDeveloperLogoOverride(developer.name);
  // Prefer curated developer-specific photo, then fall back to the
  // caller-provided hero photo (e.g. their signature project cover from
  // the DB), and only then to logo/nameplate. This restores the
  // aerial/signature-project look the user approved on Omniyat while
  // still guarding against known-bad DB leaks via the curated map.
  const cardHeroImageUrl =
    getIconicDeveloperImage(developer.slug || "", developer.name || "") ||
    heroImageUrl ||
    undefined;

  const hasHero = !!cardHeroImageUrl;
  const logoValid = isValidDeveloperLogoUrl(developer.logo_url);

  return (
    <Link to={`/developer/${developer.slug}`} className="block h-full [perspective:1200px]">
      <motion.div
        whileHover={{ y: -8, scale: 1.015, boxShadow: "0 26px 54px -14px rgba(0,0,0,0.36), 0 14px 28px -12px rgba(6,78,59,0.34)" }}
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

