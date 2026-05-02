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
   * returning null if no valid logo is available. Use this when the caller
   * wants a guaranteed slot (e.g. for layout stability).
   */
  renderFallback?: boolean;
}

/**
 * LOCKED — Unified developer logo component.
 *
 * RULES (globally enforced, see src/utils/developerLogo.ts):
 *  - Only canonical `logo_url` values pass through.
 *  - Project photos, screenshots, WhatsApp images, initials,
 *    or any other substitute is forbidden and will be rejected.
 *  - The only approved fallback is the `Building2` icon.
 *  - DO NOT MODIFY without explicit Founder authorization.
 */
export function DeveloperLogo({
  src,
  alt = "Developer",
  className,
  loading = "lazy",
  onError,
  renderFallback = false,
}: DeveloperLogoProps) {
  const [error, setError] = useState(false);

  const valid = isValidDeveloperLogoUrl(src) && !error;

  if (!valid) {
    if (!renderFallback) return null;
    return (
      <div
        className={cn(
          "w-14 h-14 rounded-md shrink-0 inline-flex items-center justify-center bg-[#FDFBF7] p-2.5 shadow-sm border border-[#B89555]/30",
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
        "w-14 h-14 rounded-md shrink-0 inline-flex items-center justify-center bg-[#FDFBF7] p-2.5 shadow-sm border border-[#B89555]/30",
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
        className="block h-full w-full rounded-md object-contain"
      />
    </div>
  );
}
