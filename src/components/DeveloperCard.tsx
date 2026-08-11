import { Link } from "react-router-dom";
import {memo, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Building2, Layers, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DeveloperLogo } from "@/components/ui/DeveloperLogo";
import { getSafeDeveloperDescription } from "@/utils/developerContent";
import { getDeveloperTier, TIER_LABELS } from "@/utils/developerTier";
import { getDeveloperLogoUrl, getKnownDeveloperLogoUrl } from "@/utils/developerLogo";
import { getVerifiedDeveloperFlagship, isUsableDeveloperCover } from "@/utils/developerFlagshipMedia";
import { buildResponsiveImage, CARD_IMAGE_SIZES, CARD_IMAGE_WIDTHS } from "@/lib/responsiveImage";
import type { Developer } from "@/hooks/useProjects";


interface DeveloperCardProps {
  developer: Developer;
  projectCount?: number;
  index?: number;
  heroImageUrl?: string;
  heroImageUrls?: string[];
  /** Number of cards rendered per row — the card rescales itself to stay premium. */
  density?: number;
  /**
   * LOCKED (no emerald blueprint): a developer without a verified cover photo is
   * archived out of the public directory and flagged in the owner Developer Hub
   * alerts. Only owner/backend views may render a card with no photograph.
   */
  allowMissingCover?: boolean;
}


/**
 * PASS 280 — DENSITY-ADAPTIVE DEVELOPER CARD (LOCKED)
 * The logo plate, type scale, paddings and blurb all rescale with the number of
 * cards per row (1–8). Nothing is ever left oversized, squeezed or clipped when
 * the owner switches density; the blurb is dropped rather than cropped once the
 * card is too narrow to hold two full lines.
 */
const DENSITY_SCALE = (columns: number) => {
  if (columns >= 7) {
    return {
      plate: "h-[42px] w-[92px] left-2.5",
      pad: "px-2.5 pb-3 pt-7",
      name: "text-[11px]",
      meta: "text-[9px] gap-x-2",
      metaIcon: "w-3 h-3",
      cta: "text-[8.5px]",
      badge: "px-2 py-0.5 text-[8px]",
      showBlurb: false,
      blurbMin: "min-h-0",
    };
  }
  if (columns >= 5) {
    return {
      plate: "h-[54px] w-[112px] left-3",
      pad: "px-3 pb-3.5 pt-9",
      name: "text-[12.5px]",
      meta: "text-[10px] gap-x-3",
      metaIcon: "w-3 h-3",
      cta: "text-[9px]",
      badge: "px-2.5 py-0.5 text-[9px]",
      showBlurb: false,
      blurbMin: "min-h-0",
    };
  }
  if (columns === 4) {
    return {
      plate: "h-[66px] w-[132px] left-4",
      pad: "px-4 pb-4 pt-11",
      name: "text-[14px]",
      meta: "text-[10.5px] gap-x-4",
      metaIcon: "w-3.5 h-3.5",
      cta: "text-[10px]",
      badge: "px-3 py-1 text-[10px]",
      showBlurb: true,
      blurbMin: "min-h-[44px]",
    };
  }
  return {
    plate: "h-[78px] w-[156px] left-5",
    pad: "px-5 pb-5 pt-14",
    name: "text-[17px]",
    meta: "text-[11px] gap-x-4",
    metaIcon: "w-4 h-4",
    cta: "text-[10px]",
    badge: "px-3 py-1 text-[10px]",
    showBlurb: true,
    blurbMin: "min-h-[52px]",
  };
};



const getPublicDeveloperName = (name: string) => {
  if (/^aizn\b/i.test(name)) return "AIZN Development";
  return name
    .replace(/\s*\((?:l\.?l\.?c\.?|pjsc)\)\s*$/i, "")
    .replace(/\s+(?:l\.?l\.?c\.?|pjsc)\s*$/i, "")
    .trim();
};

const DeveloperCard = ({ developer, projectCount = 0, index = 99, heroImageUrl, heroImageUrls = [], density = 4, allowMissingCover = false }: DeveloperCardProps) => {
  const scale = DENSITY_SCALE(density);
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
      developerFeatureImage,
      ...(verifiedOnly ? [] : heroImageUrls),
      ...(verifiedOnly ? [] : [heroImageUrl]),
    ].filter((value): value is string =>
      Boolean(value) && value !== developerLogoUrl && isUsableDeveloperCover(value),
    ))];
  }, [heroImageUrl, heroImageUrls, officialFlagship, developerFeatureImage, developerLogoUrl, normalizedName, normalizedSlug]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroLoaded, setHeroLoaded] = useState(false);
  useEffect(() => setHeroIndex(0), [developer.id]);
  const cardHeroImageUrl = candidates[heroIndex];
  useEffect(() => setHeroLoaded(false), [cardHeroImageUrl]);
  const heroSources = useMemo(
    () => buildResponsiveImage(cardHeroImageUrl, { widths: CARD_IMAGE_WIDTHS, sizes: CARD_IMAGE_SIZES }),
    [cardHeroImageUrl],
  );

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
  // LOCKED (no duplicated metadata): the established year and project count are
  // rendered once, in the metadata row, so they are never repeated here.
  const factualDescription = useMemo(() => {
    const parts: string[] = [];
    if (developer.headquarters) parts.push(`Headquartered in ${developer.headquarters}`);
    if (developer.total_units_delivered && developer.total_units_delivered > 0)
      parts.push(`${developer.total_units_delivered.toLocaleString()} units delivered`);
    if (!parts.length) {
      const city = developer.headquarters || "the UAE";
      return `Registered real estate developer operating in ${city}.`;
    }
    const sentence = parts.join(", ");
    return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.`;
  }, [developer]);

  // Strip any leading "Established YYYY" clause so the metadata row above is
  // never echoed inside the blurb.
  const dedupedDescription = useMemo(
    () =>
      safeDescription
        .replace(/^(established|founded)\s+in?\s*\d{4}[,.\s-]*/i, "")
        .replace(/^\w/, (c) => c.toUpperCase())
        .trim(),
    [safeDescription],
  );

  const cardDescription = dedupedDescription || factualDescription;
  const rawDescriptionLength = (getSafeDeveloperDescription(developer) || "").trim().length;
  const isDescriptionTrimmed = Boolean(dedupedDescription) && rawDescriptionLength > safeDescription.length;


  // LOCKED (no emerald blueprint / no empty field): the public directory only
  // shows brands with a verified photograph. Everything else is archived and
  // flagged in the owner backend Developer Hub alerts.
  if (!hasHero && !allowMissingCover) return null;

  return (

    <Link to={`/developer/${developer.slug}`} data-developer-card="true" className="block h-full [perspective:1200px]">
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
                src={heroSources?.src ?? cardHeroImageUrl}
                srcSet={heroSources?.srcSet}
                sizes={heroSources?.srcSet ? CARD_IMAGE_SIZES : undefined}
                alt={`${developer.name} featured project`}
                width={928}
                height={557}
                loading={isEager ? "eager" : "lazy"}
                {...({ fetchpriority: isEager ? "high" : "low" } as any)}
                referrerPolicy="no-referrer"
                decoding="async"
                data-media-state={heroLoaded ? "ready" : "loading"}
                style={
                  heroLoaded
                    ? undefined
                    : {
                        backgroundImage:
                          "linear-gradient(135deg,#FDFBF7 0%,#F3EBDD 45%,#EFE6D6 100%)",
                        backgroundSize: "cover",
                      }
                }
                onError={() => setHeroIndex((current) =>
                  current + 1 < candidates.length ? current + 1 : candidates.length,
                )}
                onLoad={(event) => {
                  const image = event.currentTarget;
                  setHeroLoaded(true);
                  // Premium quality gate: skip low-resolution artwork, but
                  // only when a further candidate actually exists — never
                  // downgrade a card to the blueprint field for sharpness.
                  // NOTE: when a responsive srcset is in play the browser may
                  // legitimately pick a 320w variant on mobile, so the
                  // resolution gate only applies to non-responsive sources.
                  const tooSmall = image.naturalWidth < 40 || image.naturalHeight < 40;
                  const lowRes = !heroSources?.srcSet && image.naturalWidth < 600;
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
          {tierKey !== "other" && density <= 5 && (
            <div className="absolute top-3 right-3 z-10">
              <Badge
                className={`jj-pill-emerald-metallic allow-white text-white border-0 ${scale.badge} font-bold tracking-[0.14em] shadow-[0_6px_16px_rgba(4,31,24,0.35)] rounded-full`}
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
            whether or not verified project photography exists.
            LOCKED (PASS 280): the plate rescales with card density. */}
        <div className={`absolute bottom-0 z-20 translate-y-1/2 ${scale.plate}`}>
          <DeveloperLogo
            variant="bare"
            src={developerLogoUrl}
            name={developer.name}
            alt={`${developer.name} logo`}
            websiteUrl={(developer as { website_url?: string | null }).website_url}
            needsInvert={(developer as { logo_needs_invert?: boolean | null }).logo_needs_invert}
            loading="eager"
            size={density >= 7 ? "sm" : density >= 5 ? "sm" : "md"}
            className="!h-full !w-full !p-0 !rounded-lg"
          />
        </div>

        </div>

        {/* Content section — white surface with black text & icons.
            LOCKED: developer name in gold directly under the emerald plate
            (essential for monogram-only marks), then exactly ONE metadata row. */}
        <div className={`flex-1 bg-white flex flex-col ${scale.pad}`}>

          <h3 className={`developer-name-shine !text-[#B89555] ${scale.name} font-bold leading-snug tracking-[-0.01em] mb-1.5`}>
            {getPublicDeveloperName(developer.name)}
          </h3>

          <div className={`flex flex-wrap items-center ${scale.meta} gap-y-1 text-[#0A0A0A] font-semibold tracking-[0.08em] uppercase mb-2`}>
            {developer.founded_year ? (
              <span className="flex items-center gap-1.5">
                <Building2 className={`${scale.metaIcon} text-[#B89555]`} />
                Established {developer.founded_year}
              </span>
            ) : null}
            {projectCount > 0 ? (
              <span className="flex items-center gap-1.5">
                <Layers className={`${scale.metaIcon} text-[#B89555]`} />
                {projectCount} live {projectCount === 1 ? "project" : "projects"} listed
              </span>
            ) : developer.completed_projects && developer.completed_projects > 0 ? (
              <span className="flex items-center gap-1.5">
                <TrendingUp className={`${scale.metaIcon} text-[#B89555]`} />
                {developer.completed_projects.toLocaleString()}+ Delivered
              </span>
            ) : null}
          </div>


          <div className={`flex-1 ${scale.blurbMin}`}>
            {scale.showBlurb && cardDescription ? (
              <p className="text-[#0A0A0A]/75 text-xs leading-relaxed">
                {cardDescription}
                {isDescriptionTrimmed ? (
                  <span className="ml-1 text-[#B89555] font-semibold whitespace-nowrap">Read more</span>
                ) : null}
              </p>
            ) : null}
          </div>

          <div className={`${density >= 5 ? "mt-2 pt-2" : "mt-3 pt-3"} border-t border-[#B89555]/30`}>
            <span className={`flex items-center justify-between gap-2 text-[#8A6D2F] ${scale.cta} font-semibold tracking-[0.10em] uppercase whitespace-nowrap transition-colors duration-300 group-hover:text-[#B89555]`}>
              {density >= 7 ? "View portfolio" : "View developer portfolio"}
              <ArrowRight className="w-3.5 h-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </div>


        </div>

      </motion.div>
    </Link>
  );
};

export default memo(DeveloperCard);

