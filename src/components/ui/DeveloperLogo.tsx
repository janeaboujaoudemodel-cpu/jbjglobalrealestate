import { useState } from "react";
import { cn } from "@/lib/utils";
import { isValidDeveloperLogoUrl } from "@/utils/developerLogo";

interface DeveloperLogoProps {
  src?: string | null;
  alt?: string;
  className?: string;
  loading?: "eager" | "lazy";
  onError?: () => void;
  /**
   * @deprecated Placeholder slots are no longer rendered anywhere on the site.
   * If a developer has no canonical `logo_url`, the component renders nothing.
   * Kept on the prop type only to avoid breaking call sites.
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
 *  - There is NO placeholder fallback. If no real logo exists,
 *    this component renders `null` and the slot collapses.
 *  - DO NOT MODIFY without explicit Founder authorization.
 */
export function DeveloperLogo({
  src,
  alt = "Developer",
  className,
  loading = "lazy",
  onError,
}: DeveloperLogoProps) {
  const [error, setError] = useState(false);

  const valid = isValidDeveloperLogoUrl(src) && !error;
  if (!valid) return null;

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
