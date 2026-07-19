import { useState } from "react";
import { cn } from "@/lib/utils";
import { isValidDeveloperLogoUrl } from "@/utils/developerLogo";
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
  name,
  variant = "tile",
  "data-keep-gold": dataKeepGold,
}: DeveloperLogoProps) {
  const [error, setError] = useState(false);

  const override = getDeveloperLogoOverride(name ?? alt);
  const valid = isValidDeveloperLogoUrl(src) && !error;

  const renderImage = (url: string, containerClass: string, scale: "compact" | "card" = "compact") => (
    <div className={containerClass} data-keep-gold={dataKeepGold} data-developer-logo="database">
      <img
        src={url}
        alt={alt}
        loading={loading}
        data-no-fallback
        onError={() => {
          setError(true);
          onError?.();
        }}
        className={cn(
          "block w-full h-full object-contain",
          scale === "compact" ? "rounded-sm" : "rounded-md",
          !override.invert && "[mix-blend-mode:multiply]",
        )}
        style={{
          filter: override.invert
            ? "invert(1) brightness(1)"
            : "contrast(1.08) saturate(1.1)",
        }}
      />
    </div>
  );

  // ── Nameplate variant — if no valid logo exists, show the approved icon fallback ──
  if (variant === "nameplate") {
    if (!valid) return null;
    return renderImage(src as string, cn(UNIFIED_PLATE, className));
  }

  if (variant === "bare") {
    if (!valid) {
      return null;
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
      return null;
    }
    return renderImage(src as string, cardContainer, "card");
  }

  // ── Default tile variant (developer directory, dev-detail, area chips) ──
  const tileContainer = cn(
    "w-14 h-14 rounded-md shrink-0 inline-flex items-center justify-center bg-white p-1.5 shadow-sm border border-[#B89555]/70 overflow-hidden",
    className,
  );

  if (!valid) {
    return null;
  }

  return renderImage(src as string, tileContainer);
}
