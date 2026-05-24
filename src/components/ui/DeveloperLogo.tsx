import { useState } from "react";
import { Building2 } from "lucide-react";
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
  variant?: "tile" | "bare" | "card" | "nameplate";
}

// Unified champagne plate — identical between `bare` and `nameplate`
// so every project card has an identical badge footprint.
const UNIFIED_PLATE =
  "h-14 w-24 inline-flex items-center justify-center overflow-hidden " +
  "rounded-xl bg-[#FDFBF7] border border-[#B89555]/45 " +
  "shadow-[0_4px_14px_rgba(0,0,0,0.18)] px-2 py-1.5";

export function DeveloperLogo({
  src,
  alt = "Developer",
  className,
  loading = "lazy",
  onError,
  renderFallback = false,
  name,
  variant = "tile",
}: DeveloperLogoProps) {
  const [error, setError] = useState(false);

  const override = getDeveloperLogoOverride(name ?? alt);
  const valid = isValidDeveloperLogoUrl(src) && !error;

  // ── Nameplate variant — champagne plate with developer NAME wordmark ──
  if (variant === "nameplate" || (variant === "bare" && override.forceNameplate)) {
    const label = (name || alt || "Developer").trim();
    // Auto-shrink so long names ("Expo City Development") fit fully on
    // two lines without ANY truncation/"…". Plate is h-14 → two lines OK.
    const sizeClass =
      label.length <= 8
        ? "text-[12px]"
        : label.length <= 12
        ? "text-[11px]"
        : label.length <= 16
        ? "text-[10px]"
        : label.length <= 20
        ? "text-[9px]"
        : "text-[8px]";
    return (
      <div
        className={cn(UNIFIED_PLATE, className)}
        aria-label={label}
        data-developer-nameplate
      >
        <span
          className={cn(
            "font-semibold tracking-tight leading-[1.05] text-center text-[#1A1A1A]",
            "whitespace-normal break-words",
            sizeClass,
          )}
        >
          {label}
        </span>
      </div>
    );
  }

  if (variant === "bare") {
    if (!valid) {
      if (!renderFallback) return null;
      return (
        <div
          className={cn(UNIFIED_PLATE, className)}
          aria-label={`${alt} (logo unavailable)`}
        >
          <Building2 className="w-6 h-6 text-[#1A1A1A]/70" />
        </div>
      );
    }
    return (
      <div className={cn(UNIFIED_PLATE, className)}>
        <img
          src={src as string}
          alt={alt}
          loading={loading}
          onError={() => {
            setError(true);
            onError?.();
          }}
          className="block w-full h-full object-contain"
          style={{
            // Strip foreign white/light backgrounds into our champagne plate.
            mixBlendMode: "multiply",
            // White-on-dark marks (e.g. Ritz-Carlton) → flip to solid ink.
            filter: override.invert ? "invert(1) brightness(0)" : undefined,
          }}
        />
      </div>
    );
  }


  // ── Card variant — Reelly-style hero plate (developer directory) ──
  if (variant === "card") {
    if (!valid) {
      return (
        <div
          className={cn(
            "w-full h-full rounded-2xl inline-flex items-center justify-center bg-white border border-[#B89555]/30 p-6",
            className,
          )}
          aria-label={`${alt} (logo unavailable)`}
        >
          <Building2 className="w-12 h-12 text-[#1A1A1A]/50" />
        </div>
      );
    }
    return (
      <div
        className={cn(
          "w-full h-full rounded-2xl inline-flex items-center justify-center bg-white border border-[#B89555]/30 p-6 overflow-hidden",
          className,
        )}
      >
        <img
          src={src as string}
          alt={alt}
          loading={loading}
          onError={() => {
            setError(true);
            onError?.();
          }}
          className="block max-h-full max-w-full w-auto h-auto object-contain"
        />
      </div>
    );
  }

  // ── Default tile variant (developer directory, dev-detail, area chips) ──
  if (!valid) {
    if (!renderFallback) return null;
    return (
      <div
        className={cn(
          "w-14 h-14 rounded-md shrink-0 inline-flex items-center justify-center bg-[#FDFBF7] p-1.5 shadow-sm border border-[#B89555]/30",
          className,
        )}
        aria-label={`${alt} (logo unavailable)`}
      >
        <Building2 className="w-6 h-6 text-[#1A1A1A]/70" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-14 h-14 rounded-md shrink-0 inline-flex items-center justify-center bg-[#FDFBF7] p-1.5 shadow-sm border border-[#B89555]/30 overflow-hidden",
        className,
      )}
    >
      <img
        src={src as string}
        alt={alt}
        loading={loading}
        onError={() => {
          setError(true);
          onError?.();
        }}
        className="block max-h-full max-w-full w-auto h-auto rounded-sm object-contain"
      />
    </div>
  );
}
