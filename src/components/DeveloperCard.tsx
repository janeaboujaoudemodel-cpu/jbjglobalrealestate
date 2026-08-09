import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Building2, Layers, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DeveloperLogo } from "@/components/ui/DeveloperLogo";
import { getSafeDeveloperDescription } from "@/utils/developerContent";
import { getDeveloperTier, TIER_LABELS } from "@/utils/developerTier";
import { getDeveloperLogoUrl, getKnownDeveloperLogoUrl } from "@/utils/developerLogo";
import { getVerifiedDeveloperFlagship, isUsableDeveloperCover } from "@/utils/developerFlagshipMedia";
import type { Developer } from "@/hooks/useProjects";


interface DeveloperCardProps {
  developer: Developer;
  projectCount?: number;
  index?: number;
  heroImageUrl?: string;
  heroImageUrls?: string[];
}


const getPublicDeveloperName = (name: string) => {
  if (/^aizn\b/i.test(name)) return "AIZN Development";
  return name
    .replace(/\s*\((?:l\.?l\.?c\.?|pjsc)\)\s*$/i, "")
    .replace(/\s+(?:l\.?l\.?c\.?|pjsc)\s*$/i, "")
    .trim();
};

const DeveloperCard = ({ developer, projectCount = 0, index = 99, heroImageUrl, heroImageUrls = [] }: DeveloperCardProps) => {
  const tierKey = getDeveloperTier(developer.slug || "", developer.name || "", developer.rank);
  const tierLabel = TIER_LABELS[tierKey];
  // The directory paginates to 24 cards, so every visible cover belongs to the
  // current viewport workload. Lazy-loading the lower rows left large beige
  // fields in screenshots and during normal scrolling; eagerly decode the
  // complete page instead of presenting the card before its media.
  const isEager = index < 24;
  const normalizedSlug = (developer.slug || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  const normalizedName = (developer.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  const officialFlagship = getVerifiedDeveloperFlagship(developer.name, developer.slug);
  const developerFeatureImage = (developer as { feature_image_url?: string | null }).feature_image_url || undefined;
  const developerLogoUrl = getDeveloperLogoUrl(developer) || getKnownDeveloperLogoUrl(developer.name);
  const candidates = useMemo(() => {
    const verifiedOnly = normalizedSlug.includes("alfahadholding") || normalizedName.includes("alfahadholding");
    return [...new Set([
      officialFlagship,
      ...(verifiedOnly ? [] : heroImageUrls),
      ...(verifiedOnly ? [] : [heroImageUrl, developerFeatureImage]),
    ].filter((value): value is string =>
      Boolean(value) && value !== developerLogoUrl && isUsableDeveloperCover(value),
    ))];
  }, [heroImageUrl, heroImageUrls, officialFlagship, developerFeatureImage, developerLogoUrl, normalizedName, normalizedSlug]);
  const [heroIndex, setHeroIndex] = useState(0);
  useEffect(() => setHeroIndex(0), [developer.id]);
  const cardHeroImageUrl = candidates[heroIndex];
  const hasHero = !!cardHeroImageUrl;
  // LOCKED (no cropped text): never render an ellipsis. The blurb is trimmed on
  // a word boundary so the two-line slot always holds a complete phrase.
  const safeDescription = useMemo(() => {
    const raw = (getSafeDeveloperDescription(developer) || "").trim();
    if (raw.length <= 92) return raw;
    const cut = raw.slice(0, 92);
    const lastStop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf(", "));
    if (lastStop > 48) return cut.slice(0, lastStop + 1).replace(/,$/, "");
    return cut
      .slice(0, cut.lastIndexOf(" "))
      .replace(/[,;:]$/, "")
      .replace(/\s+(and|or|with|the|a|an|of|in|to|for|by|is|are)$/i, "")
      .trim();
  }, [developer]);

  // Factual fallback built only from stored data — never marketing filler.
  const factualDescription = useMemo(() => {
    const parts: string[] = [];
    if (developer.founded_year) parts.push(`Established ${developer.founded_year}`);
    if (developer.headquarters) parts.push(`headquartered in ${developer.headquarters}`);
    if (projectCount > 0) parts.push(`${projectCount} live ${projectCount === 1 ? "project" : "projects"} listed`);
    else if (developer.offplan_projects && developer.offplan_projects > 0)
      parts.push(`${developer.offplan_projects} off-plan developments`);
    if (!parts.length) {
      // Never leave a card blank: fall back to a factual DLD-registry line.
      const city = developer.headquarters || "the UAE";
      return `Registered real estate developer operating in ${city}.`;
    }
    const sentence = parts.join(", ");
    return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.`;
  }, [developer, projectCount]);

  const cardDescription = safeDescription || factualDescription;
  const rawDescriptionLength = (getSafeDeveloperDescription(developer) || "").trim().length;
  const isDescriptionTrimmed = Boolean(safeDescription) && rawDescriptionLength > safeDescription.length;



  return (
    <Link to={`/developer/${developer.slug}`} className="block h-full [perspective:1200px]">
      <motion.div
        whileHover={{ y: -8, scale: 1.015, boxShadow: "0 26px 54px -14px rgba(0,0,0,0.36), 0 14px 28px -12px rgba(6,78,59,0.34)" }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        data-developer-card="true"
        data-developer-name={developer.name}
        className="group relative rounded-2xl cursor-pointer flex flex-col h-full bg-[#FDFBF7]"
        style={{
          boxShadow: "0 6px 16px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)",
        }}
      >

        {/* Hero — verified project photo only. Never replace real estate media
            with initials, wordmarks, or generated artwork. */}
        <div className="relative">
        <div className="relative aspect-[5/3] bg-[#F5F0E6] flex items-center justify-center overflow-hidden rounded-t-2xl">
          {hasHero ? (
            <>
              <img
                src={cardHeroImageUrl}
                alt={`${developer.name} featured project`}
                loading={isEager ? "eager" : "lazy"}
                referrerPolicy="no-referrer"
                decoding="async"
                onError={() => setHeroIndex((current) =>
                  current + 1 < candidates.length ? current + 1 : candidates.length,
                )}
                onLoad={(event) => {
                  const image = event.currentTarget;
                  // Premium quality gate: skip low-resolution artwork, but
                  // only when a further candidate actually exists — never
                  // downgrade a card to the blueprint field for sharpness.
                  const tooSmall = image.naturalWidth < 40 || image.naturalHeight < 40;
                  const lowRes = image.naturalWidth < 600;
                  if (tooSmall || lowRes) {
                    setHeroIndex((current) =>
                      current + 1 < candidates.length ? current + 1 : current,
                    );
                  }
                }}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
              {/* LOCKED: the developer logo is never dropped when a signature
                  project photo is used as the card hero. It always rides on the
                  photo as a plate, with automatic light/dark plate contrast. */}
            </>
          ) : null}



          {/* Tier Badge — unified emerald metallic pill, white text, always present */}
          {tierKey !== "other" && (
            <div className="absolute top-3 right-3 z-10">
              <Badge
                className="jj-pill-emerald-metallic allow-white text-white border-0 px-3 py-1 text-[10px] font-bold tracking-[0.14em] shadow-[0_6px_16px_rgba(4,31,24,0.35)] rounded-full"
                data-no-contrast-guard
                data-allow-white
              >
                <span className="text-white">{tierLabel}</span>
              </Badge>
            </div>
          )}
        </div>
        {/* LOCKED (PASS 273): the rectangular logo plate always straddles the
            photo seam and sits ABOVE the card — present on every developer card
            whether or not verified project photography exists. */}
        <div className="absolute bottom-0 left-4 z-20 h-[72px] w-36 translate-y-1/2">
          <DeveloperLogo
            variant="bare"
            src={developerLogoUrl}
            name={developer.name}
            alt={`${developer.name} logo`}
            websiteUrl={(developer as { website_url?: string | null }).website_url}
            needsInvert={(developer as { logo_needs_invert?: boolean | null }).logo_needs_invert}
            loading="eager"
            size="md"
            className="!h-full !w-full !p-0 !rounded-lg"
          />
        </div>

        </div>

        {/* Content section — white surface with black text & icons.
            The developer name is intentionally NOT repeated here: the logo
            plate above already identifies the brand. */}
        <div className="flex-1 px-4 pb-4 bg-white flex flex-col pt-12">

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[#0A0A0A] text-[11px] font-semibold tracking-[0.08em] uppercase mb-2 min-h-[16px]">
            {projectCount > 0 ? (
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#B89555]" />
                {projectCount} {projectCount === 1 ? "Project" : "Projects"}
              </span>
            ) : null}
            {developer.completed_projects && developer.completed_projects > 0 ? (
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#B89555]" />
                {developer.completed_projects.toLocaleString()}+ Delivered
              </span>
            ) : null}
            {developer.total_units_delivered && developer.total_units_delivered > 0 ? (
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#B89555]" />
                {developer.total_units_delivered.toLocaleString()} Units
              </span>
            ) : null}
            {!projectCount &&
            !developer.completed_projects &&
            !developer.total_units_delivered &&
            developer.founded_year ? (
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#B89555]" />
                Established {developer.founded_year}
              </span>
            ) : null}
          </div>

          <div className="flex-1 min-h-[48px]">
            {cardDescription ? (
              <p className="text-[#0A0A0A]/75 text-xs leading-relaxed">
                {cardDescription}
                {isDescriptionTrimmed ? (
                  <span className="ml-1 text-[#B89555] font-semibold whitespace-nowrap">Read more</span>
                ) : null}
              </p>
            ) : null}
          </div>

          <div className="mt-3 pt-3 border-t border-[#B89555]/30">
            <span className="flex items-center justify-between gap-2 text-[#8A6D2F] text-[10px] font-semibold tracking-[0.10em] uppercase whitespace-nowrap transition-colors duration-300 group-hover:text-[#B89555]">
              View developer portfolio
              <ArrowRight className="w-3.5 h-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </div>

        </div>

      </motion.div>
    </Link>
  );
};

export default DeveloperCard;

