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

const logoPlateSurface = (darkPlate?: boolean) =>
  darkPlate
    ? "bg-[#042C1C] border border-[#D8B46A]/85 shadow-[0_4px_14px_rgba(0,0,0,0.24)]"
    : "bg-white border border-[#B89555]/80 shadow-[0_3px_10px_rgba(0,0,0,0.16)]";



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
  const valid = isValidDeveloperLogoUrl(src) && !error && !override.forceNameplate;

  const renderNameplate = (containerClass: string) => {
    const label = (name || alt || "Developer").trim();
    const display = label
      .replace(/\b(properties|property|developers?|developments?|real estate|llc|l\.l\.c\.?|group)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim() || label;

    return (
      <div
        className={cn(containerClass, "bg-[#F7F2EA]")}
        data-keep-gold={dataKeepGold}
        data-developer-logo="nameplate"
        aria-label={`${label} logo pending`}
        title={label}
      >
        <span className="sr-only">{label}</span>
        <span
          aria-hidden="true"
          className="font-serif font-bold leading-tight text-center tracking-normal px-0.5"
          style={{ color: "#064E3B", WebkitTextFillColor: "#064E3B", fontSize: display.length > 14 ? "0.48rem" : display.length > 9 ? "0.56rem" : "0.68rem" }}
        >
          {display}
        </span>
      </div>
    );
  };

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
          !override.invert && !override.darkPlate && "[mix-blend-mode:multiply]",
        )}
        style={{
          filter: override.imageFilter ?? (override.invert
            ? "invert(1) brightness(1)"
            : "contrast(1.08) saturate(1.1)"),
        }}
      />
    </div>
  );

  // ── Nameplate variant — if no valid logo exists, show the approved icon fallback ──
  if (variant === "nameplate") {
    if (!valid) return renderNameplate(cn(UNIFIED_PLATE, className));
    return renderImage(src as string, cn(UNIFIED_PLATE, className));
  }

  if (variant === "bare") {
    if (!valid) {
      return renderNameplate(cn(
        "h-12 w-12 sm:h-14 sm:w-14 aspect-square inline-flex items-center justify-center overflow-hidden rounded-lg p-1.5",
        logoPlateSurface(false),
        className,
      ));
    }
    return renderImage(src as string, cn(
      "h-12 w-12 sm:h-14 sm:w-14 aspect-square inline-flex items-center justify-center overflow-hidden rounded-lg p-1.5",
      logoPlateSurface(override.darkPlate),
      className,
    ));
  }


  // ── Card variant — Reelly-style hero plate (developer directory) ──
  if (variant === "card") {
    const cardContainer = cn(
      "w-full h-full rounded-2xl inline-flex items-center justify-center p-3 overflow-hidden",
      logoPlateSurface(override.darkPlate),
      className,
    );

    if (!valid) {
      return renderNameplate(cardContainer);
    }
    return renderImage(src as string, cardContainer, "card");
  }

  // ── Default tile variant (developer directory, dev-detail, area chips) ──
  const tileContainer = cn(
    "w-14 h-14 rounded-md shrink-0 inline-flex items-center justify-center p-1.5 overflow-hidden",
    logoPlateSurface(override.darkPlate),
    className,
  );

  if (!valid) {
    return renderNameplate(tileContainer);
  }

  return renderImage(src as string, tileContainer);
}
