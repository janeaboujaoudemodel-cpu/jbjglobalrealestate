import { useState } from "react";
import { cn } from "@/lib/utils";
import { getWebsiteLogoFallbackUrl, isValidDeveloperLogoUrl } from "@/utils/developerLogo";
import { getDeveloperLogoOverride } from "@/utils/developerLogoOverrides";

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
  "data-keep-gold"?: boolean | string;
}

// Unified emerald-bordered plate. Padding is deliberate so wordmarks never
// touch/crop against the frame (object-contain enforced). White
// backgrounds baked into raster logos are visually knocked out with
// mix-blend-mode: multiply against the plate's white surface, so PNG/JPG
// logos look transparent without any server-side background removal.
const UNIFIED_PLATE =
  "h-12 w-12 sm:h-14 sm:w-14 aspect-square inline-flex items-center justify-center overflow-hidden " +
  "rounded-lg bg-white border border-[#B89555]/80 " +
  "shadow-[0_3px_10px_rgba(0,0,0,0.16)] p-1.5";



export function DeveloperLogo({
  src,
  alt = "Developer",
  className,
  loading = "lazy",
  onError,
  renderFallback = false,
  name,
  websiteUrl,
  variant = "tile",
  "data-keep-gold": dataKeepGold,
}: DeveloperLogoProps) {
  const [error, setError] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);

  const override = getDeveloperLogoOverride(name ?? alt);
  const valid = isValidDeveloperLogoUrl(src) && !error;
  const websiteFallbackUrl = getWebsiteLogoFallbackUrl(websiteUrl);
  const hasWebsiteFallback = Boolean(websiteFallbackUrl && !fallbackError);

  // Text mark renderer used only when no real website/database logo exists.
  // It keeps the slot filled and branded without using building icons or photos.
  const renderNameLabel = (containerClass: string, textTone = "text-[#1A1A1A]", scale: "compact" | "card" = "compact") => {
    const raw = (name || alt || "Developer").trim();
    const SUFFIX = /\b(developments?|developers?|properties|property|realty|real\s*estate|holdings?|holding|group|llc|fz-?llc|pjsc|psc|inc|co|company|international|investments?)\b/gi;
    const cleaned = raw.replace(SUFFIX, "").replace(/\s{2,}/g, " ").trim() || raw;
    const displayName = cleaned.toUpperCase();
    const initials = displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 3)
      .map((part) => part.charAt(0))
      .join("") || displayName.slice(0, 2) || "DEV";
    const displayText = scale === "compact"
      ? initials
      : displayName.split(/\s+/).slice(0, 3).join(" ");
    const compactLength = displayName.replace(/\s+/g, "").length;
    const sizeClass = scale === "card"
      ? compactLength <= 6 ? "text-4xl"
        : compactLength <= 10 ? "text-3xl"
        : compactLength <= 16 ? "text-2xl"
        : compactLength <= 24 ? "text-xl"
        : "text-lg"
      : compactLength <= 4 ? "text-[11px]"
        : compactLength <= 6 ? "text-[9.5px]"
        : compactLength <= 9 ? "text-[7.5px]"
        : compactLength <= 14 ? "text-[6.25px]"
        : compactLength <= 20 ? "text-[5.5px]"
        : "text-[5px]";
    return (
      <div
        className={cn(containerClass, "[container-type:size]", scale === "compact" && "min-w-10")}
        aria-label={raw}
        title={raw}
        data-developer-nameplate
      >
        <span
          className={cn(
            "block w-full max-w-full max-h-full overflow-hidden font-bold leading-none text-center uppercase [writing-mode:horizontal-tb] [text-orientation:mixed] [word-break:normal] [overflow-wrap:normal] [hyphens:none]",
            scale === "compact" ? "whitespace-nowrap tracking-[0]" : "whitespace-normal [text-wrap:balance] tracking-[0]",
            textTone,
            sizeClass,
          )}
          data-developer-name
        >
          {displayText}
        </span>
      </div>
    );
  };

  const renderImage = (url: string, containerClass: string, scale: "compact" | "card" = "compact", isFallback = false) => (
    <div className={containerClass} data-keep-gold={dataKeepGold} data-developer-logo={isFallback ? "website" : "database"}>
      <img
        src={url}
        alt={alt}
        loading={loading}
        data-no-fallback
        onError={() => {
          if (isFallback) setFallbackError(true);
          else setError(true);
          onError?.();
        }}
        className={cn(
          "block w-full h-full object-contain",
          scale === "compact" ? "rounded-sm" : "rounded-md",
          "[mix-blend-mode:multiply]",
        )}
        style={{
          filter: override.invert
            ? "invert(1) brightness(1)"
            : "contrast(1.08) saturate(1.1)",
        }}
      />
    </div>
  );

  const renderMissingLogo = (containerClass: string, scale: "compact" | "card" = "compact") => {
    if (hasWebsiteFallback && websiteFallbackUrl) {
      return renderImage(websiteFallbackUrl, containerClass, scale, true);
    }
    return renderNameLabel(containerClass, "text-[#1A1A1A]", scale);
  };

  // ── Nameplate variant — if no valid logo exists, show the approved icon fallback ──
  if (variant === "nameplate") {
    if (!valid) return renderMissingLogo(cn(UNIFIED_PLATE, className));
    return renderNameLabel(cn(UNIFIED_PLATE, className));
  }

  if (variant === "bare") {
    if (!valid) {
      if (!renderFallback && !(name || alt)) return null;
      return renderMissingLogo(cn(UNIFIED_PLATE, className));
    }
    return renderImage(src as string, cn(
      "h-12 w-12 sm:h-14 sm:w-14 aspect-square inline-flex items-center justify-center overflow-hidden rounded-lg bg-white shadow-[0_3px_10px_rgba(0,0,0,0.16)] p-1.5",
      className,
    ));
  }


  // ── Card variant — Reelly-style hero plate (developer directory) ──
  if (variant === "card") {
    const cardContainer = cn(
      "w-full h-full rounded-2xl inline-flex items-center justify-center bg-white border border-[#B89555]/70 p-3 overflow-hidden",
      className,
    );

    if (!valid) {
      return renderMissingLogo(cardContainer, "card");
    }
    return renderImage(src as string, cardContainer, "card");
  }

  // ── Default tile variant (developer directory, dev-detail, area chips) ──
  const tileContainer = cn(
    "w-14 h-14 rounded-md shrink-0 inline-flex items-center justify-center bg-white p-1.5 shadow-sm border border-[#B89555]/70 overflow-hidden",
    className,
  );

  if (!valid) {
    if (!renderFallback && !(name || alt)) return null;
    return renderMissingLogo(tileContainer);
  }

  return renderImage(src as string, tileContainer);
}
