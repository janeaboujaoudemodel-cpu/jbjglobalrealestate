import { useState } from "react";
import { cn } from "@/lib/utils";
import { getWebsiteLogoFallbackUrl, isValidDeveloperLogoUrl } from "@/utils/developerLogo";
import { getDeveloperLogoOverride } from "@/utils/developerLogoOverrides";
import laraixTransparent from "@/assets/laraix-transparent.png.asset.json";
import abDevelopersTransparent from "@/assets/developer-logos/ab-developers-transparent.png";

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



export function DeveloperLogo({
  src,
  alt = "Developer",
  className,
  loading = "lazy",
  onError,
  name,
  websiteUrl,
  variant = "tile",
  embedded = false,
  "data-keep-gold": dataKeepGold,
}: DeveloperLogoProps) {
  const [error, setError] = useState(false);
  // Wide wordmarks (e.g. 233x29 SVGs) shrink to a hairline inside a square
  // plate. Detected on load so the plate widens instead of looking empty.
  const [wide, setWide] = useState(false);

  const override = getDeveloperLogoOverride(name ?? alt);
  const fallbackLogo = getWebsiteLogoFallbackUrl(websiteUrl);
  const isLaraix = /laraix/i.test(name || alt || "");
  const isAbDevelopers = /^ab(?:developers?)?(?:llc)?$/i.test(
    (name || alt || "").replace(/[^a-z0-9]+/gi, ""),
  );
  // The database's official AB artwork is a gold mark baked onto a black
  // square. Use the same official artwork with only that black field removed,
  // rather than relying on browser blend modes that can produce a blank tile.
  const resolvedSrc = isAbDevelopers
    ? abDevelopersTransparent
    : isLaraix
      ? laraixTransparent.url
      : (isValidDeveloperLogoUrl(src) ? src : fallbackLogo);
  const valid = isValidDeveloperLogoUrl(resolvedSrc) && !error && !override.forceNameplate;

  const needsDarkPlate = !dataKeepGold;

  const renderNameplate = (containerClass: string) => {
    const label = (name || alt || "Developer").trim();
    const display = label
      .replace(/\b(properties|property|developers?|developments?|real estate|llc|l\.l\.c\.?|group)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim() || label;

    return (
      <div
        className={cn(containerClass, !containerClass.includes("bg-") && !dataKeepGold && EMERALD_PLATE_SURFACE)}
        data-keep-gold={dataKeepGold}
        data-no-contrast-guard="true"
        data-developer-logo={embedded ? undefined : "nameplate"}
        data-developer-logo-content={embedded ? "true" : undefined}
        aria-label={`${label} logo pending`}
        title={label}
      >
        <span className="sr-only">{label}</span>
        <span
          aria-hidden="true"
          className="font-serif font-bold leading-tight text-center tracking-normal px-0.5"
          style={{ color: dataKeepGold ? "#3a2a08" : "#FFFFFF", WebkitTextFillColor: dataKeepGold ? "#3a2a08" : "#FFFFFF", fontSize: display.length > 14 ? "0.48rem" : display.length > 9 ? "0.56rem" : "0.68rem" }}
        >
          {display}
        </span>
      </div>
    );
  };

  const renderImage = (url: string, containerClass: string, scale: "compact" | "card" = "compact") => (
    <div
      className={cn(containerClass, wide && scale === "compact" && "!w-auto !aspect-auto min-w-[3.5rem] max-w-[9rem] px-2")}
      data-wide-logo={wide ? "true" : undefined}
      data-keep-gold={dataKeepGold}
      data-developer-logo={embedded ? undefined : "database"}
      data-developer-logo-content={embedded ? "true" : undefined}
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
          if (img.naturalWidth / img.naturalHeight >= 2.2) setWide(true);
        }}
        onError={() => {
          setError(true);
          onError?.();
        }}

        className={cn(
          "block w-full h-full object-contain",
          scale === "compact" ? "rounded-sm" : "rounded-md",
        )}
        style={{
          // Emerald plates: knock the artwork out to pure white so every
          // wordmark reads at full contrast. Gold hero plate keeps dark ink.
          filter: override.imageBlendMode
            ? (override.imageFilter ?? "none")
            : dataKeepGold
              ? (override.imageFilter ?? "none")
              : "brightness(0) invert(1)",
          mixBlendMode: override.imageBlendMode ?? "normal",
        }}
      />
    </div>
  );

  // ── Nameplate variant — if no valid logo exists, show the approved icon fallback ──
  if (variant === "nameplate") {
    if (!valid) return renderNameplate(cn(UNIFIED_PLATE, className));
    return renderImage(
      resolvedSrc as string,
      cn(UNIFIED_PLATE, className),
    );
  }

  if (variant === "bare") {
    if (!valid) {
      return renderNameplate(cn(
        "h-12 w-12 sm:h-14 sm:w-14 aspect-square inline-flex items-center justify-center overflow-hidden rounded-lg p-1.5",
        embedded ? "bg-transparent border-0 shadow-none" : logoPlateSurface(false),
        className,
      ));
    }
    return renderImage(resolvedSrc as string, cn(
      "h-12 w-12 sm:h-14 sm:w-14 aspect-square inline-flex items-center justify-center overflow-hidden rounded-lg p-1.5",
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
      return renderNameplate(cardContainer);
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
    return renderNameplate(tileContainer);
  }

  return renderImage(resolvedSrc as string, tileContainer);
}
