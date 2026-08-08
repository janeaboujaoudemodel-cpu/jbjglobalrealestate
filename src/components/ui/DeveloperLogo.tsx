import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { getKnownDeveloperLogoUrl, getWebsiteLogoFallbackUrl, isValidDeveloperLogoUrl } from "@/utils/developerLogo";
import { getDeveloperLogoOverride } from "@/utils/developerLogoOverrides";
import { getVerifiedWhiteLogo } from "@/utils/verifiedWhiteLogos";
import { useLogoArtworkGuard } from "@/hooks/useLogoArtworkGuard";

import laraixTransparent from "@/assets/laraix-transparent.png.asset.json";
import abDevelopersTransparent from "@/assets/developer-logos/ab-developers-white.png";
import agPropertiesWhite from "@/assets/developer-logos/ag-properties-white.png";
import dubaiSouthWhite from "@/assets/developer-logos/dubai-south-white.png.asset.json";
import agVerifiedWhite from "@/assets/developer-logos/verified-local/ag-white.png";

const isOpaqueRaster = (url?: string | null) => !!url && /\.(jpe?g)(\?|$)/i.test(url);

interface DeveloperLogoProps {
  src?: string | null;
  alt?: string;
  className?: string;
  loading?: "eager" | "lazy";
  onError?: () => void;
  renderFallback?: boolean;
  name?: string | null;
  websiteUrl?: string | null;
  variant?: "tile" | "bare" | "card" | "nameplate";
  /** Semantic identity size. Call sites must not invent per-developer dimensions. */
  size?: "micro" | "sm" | "md" | "lg";
  /** false = artwork is already light (render as-is); true/undefined = dark artwork needing a white knockout. */
  needsInvert?: boolean | null;
  embedded?: boolean;
  "data-keep-gold"?: boolean | string;
}

// Unified emerald-bordered plate. Padding is deliberate so wordmarks never
// touch/crop against the frame (object-contain enforced). White
// backgrounds baked into raster logos are visually knocked out with
// mix-blend-mode: multiply against the plate's white surface, so PNG/JPG
// logos look transparent without any server-side background removal.
// LOCKED STANDARD (PASS 273): every developer logo plate is the emerald pair
// gradient (#064E3B -> #042C1C -> black) with the wordmark knocked out to pure
// white for guaranteed contrast. The animated gold plate survives ONLY on the
// main developer identity card (developer page / project page hero), which
// opts in with data-keep-gold + .jj-developer-logo-metallic.
const EMERALD_PLATE_SURFACE =
  "bg-[#042C1C] bg-[linear-gradient(155deg,#064E3B_0%,#042C1C_58%,#000000_100%)] " +
  "border border-white/35 shadow-[0_6px_18px_rgba(0,0,0,0.30)]";

const UNIFIED_PLATE =
  "h-12 w-12 sm:h-14 sm:w-14 aspect-square inline-flex items-center justify-center overflow-hidden " +
  "rounded-lg p-1.5 " + EMERALD_PLATE_SURFACE;

const logoPlateSurface = (_darkPlate?: boolean) => EMERALD_PLATE_SURFACE;

/**
 * STYLING GUARD (single source of truth for logo paint).
 * Rules that must never regress:
 *  - Artwork that is already white/light (curated knockouts, gold identity
 *    plates, or needsInvert === false) is rendered as-is: no invert filter and
 *    no screen blend. Inverting light artwork produced black-on-emerald or an
 *    erased (blank) plate.
 *  - Only unknown/dark artwork gets the `brightness(0) invert(1)` + `screen`
 *    knockout, which cannot produce a white block because screen blending
 *    removes the artwork's own white canvas.
 *  - An explicit override always wins so curated per-developer paint is honored.
 */
export function getLogoPaintStyle(opts: {
  isLightArtwork?: boolean | null;
  keepGold?: boolean | string;
  needsInvert?: boolean | null;
  overrideFilter?: string;
  overrideBlendMode?: string;
}): { filter: string; mixBlendMode: "normal" | "screen" } {
  const alreadyWhite =
    !!opts.isLightArtwork || !!opts.keepGold || opts.needsInvert === false;
  return {
    filter: opts.overrideFilter ?? (alreadyWhite ? "none" : "brightness(0) invert(1)"),
    mixBlendMode:
      (opts.overrideBlendMode as "normal" | "screen") ??
      (alreadyWhite ? "normal" : "screen"),
  };
}





export function DeveloperLogo({
  src,
  alt = "Developer",
  className,
  loading = "lazy",
  onError,
  name,
  websiteUrl,
  variant = "tile",
  size = "md",
  needsInvert,
  embedded = false,
  "data-keep-gold": dataKeepGold,
}: DeveloperLogoProps) {
  const [error, setError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const override = getDeveloperLogoOverride(name ?? alt);
  // Curated official artwork keyed by developer name always wins over an
  // empty/blocked database URL, so no card falls back to a bare wordmark when
  // we already ship the real logo.
  const curatedLogo = getKnownDeveloperLogoUrl(name ?? alt);
  const fallbackLogo = getWebsiteLogoFallbackUrl(websiteUrl);
  const isLaraix = /laraix/i.test(name || alt || "");
  const isAbDevelopers = /^ab(?:developers?)?(?:llc)?$/i.test(
    (name || alt || "").replace(/[^a-z0-9]+/gi, ""),
  );
  const isAgProperties = /^agproperties(?:llc)?$/i.test(
    (name || alt || "").replace(/[^a-z0-9]+/gi, ""),
  );
  // Single source of truth for curated pure-white official marks.
  const verifiedWhiteLogo = getVerifiedWhiteLogo(name || alt);
  const isDubaiSouth = /^dubaisouth(?:properties)?$/i.test(
    (name || alt || "").replace(/[^a-z0-9]+/gi, ""),
  );
  // Curated pure-white knockouts. The database artwork for these developers is
  // baked on an opaque dark field, which browser blend modes turn into a blank
  // white block, so the official mark is shipped pre-knocked-out instead.
  const resolvedSrc = verifiedWhiteLogo
    ? verifiedWhiteLogo
    : isDubaiSouth
    ? dubaiSouthWhite.url
    : isAgProperties
    ? agVerifiedWhite || agPropertiesWhite
    : isAbDevelopers
    ? abDevelopersTransparent
    : isLaraix
      ? laraixTransparent.url
      : (curatedLogo ?? (isValidDeveloperLogoUrl(src) ? src : fallbackLogo));
  useEffect(() => {
    setError(false);
    setImageLoaded(false);
  }, [resolvedSrc]);
  // Every curated asset above is shipped pre-knocked-out to pure white, so it
  // must render as-is (no invert, no screen blend).
  const isCuratedWhiteArtwork =
    !!verifiedWhiteLogo || isDubaiSouth || isAgProperties || isAbDevelopers;

  // Real canonical/website artwork always wins; typed substitutes are forbidden.
  const hasCuratedArtwork =
    !!verifiedWhiteLogo || isDubaiSouth || isAgProperties || isAbDevelopers || isLaraix || !!curatedLogo;
  // White-block guard: opaque slab artwork is rejected outright (never painted
  // as a blank rectangle on the plate).
  const artworkVerdict = useLogoArtworkGuard(
    hasCuratedArtwork ? null : (resolvedSrc as string | null),
  );
  // Never optimistically paint an unverified raster. That was the root cause
  // of the visible white rectangle: the plate rendered the image while the
  // async artwork audit was still `unknown` (and third-party CORS failures
  // stayed unknown forever). Curated assets are trusted; every other image is
  // shown only after the guard proves it has usable transparency. Until then,
  // retain the developer identity as a readable white wordmark.
  const valid =
    isValidDeveloperLogoUrl(resolvedSrc) &&
    !error &&
    (hasCuratedArtwork || artworkVerdict === "ok");


  const needsDarkPlate = !dataKeepGold;
  const compactPlate = {
    micro: "h-8 w-16",
    sm: "h-10 w-20",
    md: "h-[72px] w-36",
    lg: "h-[88px] w-44",
  }[size];

  // LOCKED: never fabricate a developer logo from typed text or initials.
  // Unresolved identities remain in the catalogue as an explicit audit failure.
  const renderEmptyPlate = (containerClass: string) => {
    return (
      <div
        className={cn(containerClass)}
        role="img"
        aria-label={`${name || alt || "Developer"} official logo unavailable`}
        data-keep-gold={dataKeepGold}
        data-developer-logo={embedded ? undefined : "unresolved"}
        data-developer-logo-content={embedded ? "true" : undefined}
        data-logo-loaded="false"
      />
    );
  };


  const renderImage = (url: string, containerClass: string, scale: "compact" | "card" = "compact") => (
    <div
      className={cn(
        containerClass,
        // The surface and artwork reveal as one atomic identity plate. This
        // prevents the emerald rectangle painting first while a lazy logo is
        // still downloading.
        imageLoaded ? "opacity-100" : "opacity-0",
      )}
      data-keep-gold={dataKeepGold}
      data-developer-logo={embedded ? undefined : "database"}
      data-developer-logo-content={embedded ? "true" : undefined}
      data-logo-loaded={imageLoaded ? "true" : "false"}
    >
      <img
        src={url}
        alt={alt}
        loading={loading}
        data-no-fallback
        onLoad={(e) => {
          // Some CDN logos resolve to an empty/zero-size or 1px response, which
          // rendered as a blank white plate on the card. Treat those as a
          // failure so the branded nameplate fallback takes over.
          const img = e.currentTarget;
          if (img.naturalWidth < 4 || img.naturalHeight < 4) {
            setError(true);
            onError?.();
            return;
          }
          setImageLoaded(true);
        }}
        onError={() => {
          setError(true);
          onError?.();
        }}

        className={cn(
          "block w-full h-full object-contain",
          scale === "compact" ? "rounded-sm p-0" : "rounded-md p-0",
          "scale-100",
        )}
        style={{
          // Paint rules live in getLogoPaintStyle (see STYLING GUARD above) and
          // are covered by src/test/developer-logo-paint.regression.test.tsx.
          ...getLogoPaintStyle({
            isLightArtwork: isCuratedWhiteArtwork,
            keepGold: dataKeepGold,
            needsInvert,
            overrideFilter: override.imageFilter,
            overrideBlendMode: override.imageBlendMode,
          }),
        }}

      />
    </div>
  );

  // ── Nameplate variant — if no valid logo exists, show the approved icon fallback ──
  if (variant === "nameplate") {
    if (!valid) return renderEmptyPlate(cn(UNIFIED_PLATE, className));
    return renderImage(
      resolvedSrc as string,
      cn(UNIFIED_PLATE, className),
    );
  }

  if (variant === "bare") {
    if (!valid) {
      return renderEmptyPlate(cn(
        compactPlate,
        "inline-flex items-center justify-center overflow-hidden rounded-lg p-1.5",
        embedded ? "bg-transparent border-0 shadow-none" : logoPlateSurface(false),
        className,
      ));
    }
    return renderImage(resolvedSrc as string, cn(
      compactPlate,
      "inline-flex items-center justify-center overflow-hidden rounded-lg p-1.5",
      embedded ? "bg-transparent border-0 shadow-none" : logoPlateSurface(needsDarkPlate),
      className,
    ));
  }


  // ── Card variant — Reelly-style hero plate (developer directory) ──
  if (variant === "card") {
    const cardContainer = cn(
      "w-full h-full rounded-2xl inline-flex items-center justify-center p-3 overflow-hidden",
      logoPlateSurface(needsDarkPlate),
      className,
    );

    if (!valid) {
      return renderEmptyPlate(cardContainer);
    }
    return renderImage(resolvedSrc as string, cardContainer, "card");
  }

  // ── Default tile variant (developer directory, dev-detail, area chips) ──
  const tileContainer = cn(
    "w-14 h-14 rounded-md shrink-0 inline-flex items-center justify-center p-1.5 overflow-hidden",
    logoPlateSurface(needsDarkPlate),
    className,
  );

  if (!valid) {
    return renderEmptyPlate(tileContainer);
  }

  return renderImage(resolvedSrc as string, tileContainer);
}
