import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Building2, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DeveloperLogo } from "@/components/ui/DeveloperLogo";
import { getSafeDeveloperDescription } from "@/utils/developerContent";
import { getDeveloperTier, TIER_LABELS } from "@/utils/developerTier";
import { getDeveloperLogoUrl, getKnownDeveloperLogoUrl } from "@/utils/developerLogo";
import { getDeveloperLogoOverride } from "@/utils/developerLogoOverrides";
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
  const isEager = index < 8;
  const normalizedSlug = (developer.slug || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  const normalizedName = (developer.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  const officialFlagship = getVerifiedDeveloperFlagship(developer.name, developer.slug);
  const developerFeatureImage = (developer as { feature_image_url?: string | null }).feature_image_url || undefined;
  const candidates = useMemo(() => {
    const verifiedOnly = normalizedSlug.includes("alfahadholding") || normalizedName.includes("alfahadholding");
    return [...new Set([
      officialFlagship,
      ...(verifiedOnly ? [] : heroImageUrls),
      ...(verifiedOnly ? [] : [heroImageUrl, developerFeatureImage]),
    ].filter((value): value is string => Boolean(value) && isUsableDeveloperCover(value)))];
  }, [heroImageUrl, heroImageUrls, officialFlagship, developerFeatureImage, normalizedName, normalizedSlug]);
  const [heroIndex, setHeroIndex] = useState(0);
  useEffect(() => setHeroIndex(0), [developer.id]);
  const cardHeroImageUrl = candidates[heroIndex];
  const developerLogoUrl = getDeveloperLogoUrl(developer) || getKnownDeveloperLogoUrl(developer.name);
  const logoOverride = getDeveloperLogoOverride(developer.name);

  const hasHero = !!cardHeroImageUrl;
  const isVisuallyPublishable = hasHero && Boolean(developerLogoUrl) && !logoOverride.forceNameplate;
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

  return (
    <Link to={`/developer/${developer.slug}`} className="block h-full [perspective:1200px]">
      <motion.div
        whileHover={{ y: -8, scale: 1.015, boxShadow: "0 26px 54px -14px rgba(0,0,0,0.36), 0 14px 28px -12px rgba(6,78,59,0.34)" }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        data-developer-card={isVisuallyPublishable ? "true" : undefined}
        aria-hidden={isVisuallyPublishable ? undefined : true}
        className="group relative rounded-2xl cursor-pointer flex flex-col h-full bg-[#FDFBF7]"
        style={{
          boxShadow: "0 6px 16px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)",
          display: isVisuallyPublishable ? undefined : "none",
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
                onError={() => setHeroIndex((current) => Math.min(current + 1, candidates.length))}
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
          ) : (
            /* No verified project photography on file yet: render a silent
               architectural blueprint field. Never a status message, never a
               logo substituted for real estate media. */
            <div
              aria-hidden
              className="absolute inset-0 bg-[#042C1C] bg-[linear-gradient(155deg,#064E3B_0%,#042C1C_58%,#000000_100%)]"
            >
              <div
                className="absolute inset-0 opacity-[0.22]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.30) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.30) 1px, transparent 1px)",
                  backgroundSize: "34px 34px",
                }}
              />
              <div
                className="absolute inset-0 opacity-[0.16]"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, transparent 46%, rgba(184,149,85,0.9) 47%, rgba(184,149,85,0.9) 48%, transparent 49%)",
                  backgroundSize: "120px 120px",
                }}
              />
              <div className="absolute inset-x-6 bottom-6 h-[38%] border border-white/25 rounded-sm" />
              <div className="absolute left-10 bottom-6 h-[58%] w-[26%] border border-white/20 rounded-sm" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
            </div>
          )}



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
        <div className="absolute bottom-0 left-4 z-20 h-[72px] w-32 translate-y-1/2">
          {developerLogoUrl ? (
            <DeveloperLogo
              variant="bare"
              src={developerLogoUrl}
              name={developer.name}
              alt={`${developer.name} logo`}
              websiteUrl={(developer as { website_url?: string | null }).website_url}
              needsInvert={(developer as { logo_needs_invert?: boolean | null }).logo_needs_invert}
              loading="eager"
              size="md"
              className="!h-full !w-full !p-1.5 !rounded-lg"
            />
          ) : null}
        </div>

        </div>

        {/* Content section — white surface with black text & icons */}
        <div className="flex-1 px-4 pb-4 bg-white flex flex-col pt-10">

          <h3 className="text-[#0A0A0A] font-bold text-base md:text-lg mb-1.5 break-words">
            {getPublicDeveloperName(developer.name)}
          </h3>

          <div className="flex-1 min-h-[36px]">
            {safeDescription ? (
              <p className="text-[#0A0A0A]/75 text-xs leading-relaxed">
                {safeDescription}
              </p>
            ) : (
              <p className="text-[#0A0A0A]/60 text-xs italic">
                Premier developer in the UAE market
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 text-[#0A0A0A]/80 text-xs mt-3 pt-3 border-t border-[#0A0A0A]/10">
            {projectCount > 0 ? (
              <div className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-[#0A0A0A]" />
                <span>{projectCount} Projects</span>
              </div>
            ) : null}
            {developer.completed_projects && developer.completed_projects > 0 ? (
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-[#0A0A0A]" />
                <span>{developer.completed_projects.toLocaleString()}+ Delivered</span>
              </div>
            ) : null}
            {!projectCount && (!developer.completed_projects || developer.completed_projects === 0) && (
              <span className="text-[#0A0A0A]/70 text-xs">View developer portfolio</span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default DeveloperCard;

