import { useState } from "react";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { isValidDeveloperLogoUrl } from "@/utils/developerLogo";

interface DeveloperLogoProps {
  src?: string | null;
  alt?: string;
  className?: string;
  loading?: "eager" | "lazy";
  onError?: () => void;
  /**
   * When true, render the approved Building2 icon fallback instead of
   * returning null if no valid logo is available.
   * NOTE: Building2 fallback is reserved for internal CRM/admin surfaces
   * only — never on public project listings.
   */
  renderFallback?: boolean;
  /**
   * Developer name. Used by the `nameplate` variant (and as a last-resort
   * label for the `bare` variant when the image fails to load) so the
   * client always knows which developer built the project.
   */
  name?: string | null;
  /**
   * Visual variant.
   *  - "tile" (default): champagne tile with gold hairline, used in
   *    developer directories, area chips, dev detail cards.
   *  - "bare": no border, no background, no inner padding. Used as an
   *    overlay on project-card photos so the logo reads as a clean,
   *    full-fit brand mark with a soft drop-shadow for legibility.
   *  - "card": Reelly-style hero plate. Uniform-size white rounded plate
   *    used on the developer directory and per-developer header tiles.
   *    Logo renders `object-contain` with generous padding so wordmark
   *    and colored marks always read fully without cropping.
   *  - "nameplate": champagne plate matching `bare` dimensions that
   *    renders the developer name as an Inter wordmark. Used on project
   *    cards as the public-safe fallback when no valid logo image is
   *    available, so the developer is ALWAYS identifiable.
   */
  variant?: "tile" | "bare" | "card" | "nameplate";
}

/**
 * LOCKED — Unified developer logo component.
 *
 * RULES (globally enforced, see src/utils/developerLogo.ts):
 *  - Only canonical `logo_url` values pass through.
 *  - Project photos, screenshots, WhatsApp images, initials,
 *    or any other substitute is forbidden and will be rejected.
 *  - The Building2 fallback is reserved for internal/admin tiles
 *    where layout stability matters — public listings must never
 *    show a fake icon.
 *  - DO NOT MODIFY without explicit Founder authorization.
 */
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

  const valid = isValidDeveloperLogoUrl(src) && !error;

  // ── Nameplate variant — champagne plate with developer NAME wordmark ──
  // Used as the public-safe fallback on project cards when no logo image
  // exists, so the developer is always attributable. Matches `bare`
  // dimensions to keep card layouts stable.
  if (variant === "nameplate") {
    const label = (name || alt || "Developer").trim();
    // Auto-fit text size by character length so longer names still read.
    const sizeClass =
      label.length <= 8
        ? "text-[11px]"
        : label.length <= 14
        ? "text-[10px]"
        : "text-[9px]";
    return (
      <div
        className={cn(
          "h-12 w-16 inline-flex items-center justify-center overflow-hidden",
          "rounded-xl bg-[#FDFBF7]/95 backdrop-blur-sm",
          "border border-[#B89555]/45 px-1.5 py-1",
          "shadow-[0_2px_10px_rgba(0,0,0,0.18)]",
          className,
        )}
        aria-label={label}
        data-developer-nameplate
      >
        <span
          className={cn(
            "font-semibold tracking-tight leading-tight text-center text-[#1A1A1A]",
            "line-clamp-2 break-words",
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
      // No fake icon on public listings — render nothing so the photo stays clean.
      if (!renderFallback) return null;
      return (
        <div
          className={cn(
            "h-12 w-16 inline-flex items-center justify-center",
            className,
          )}
          aria-label={`${alt} (logo unavailable)`}
        >
          <Building2 className="w-6 h-6 text-[#FDFBF7]/85 drop-shadow" />
        </div>
      );
    }
    return (
      <div
        className={cn(
          // Clean public overlay: no visible plate or padding gap. The logo itself
          // fills the available box and relies on shadow/contrast instead of a frame.
          "h-12 w-20 inline-flex items-center justify-center overflow-hidden",
          "bg-transparent p-0 drop-shadow-[0_2px_8px_rgba(0,0,0,0.32)]",
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
          className="block w-full h-full object-contain"
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
