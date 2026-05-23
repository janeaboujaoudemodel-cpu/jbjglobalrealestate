import * as React from "react";
import { ImageOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { SafeImage } from "@/components/SafeImage";
import { getHighResImageUrl, isValidImageUrl } from "@/lib/imageUtils";

type VerifiedMediaProps = {
  src?: string | null;
  alt: string;
  className?: string;
  /** When true, uses eager loading (use sparingly). */
  priority?: boolean;
  /** If false, renders a minimal placeholder (no border / no card styling). */
  decorated?: boolean;
  placeholderLabel?: string;
  onError?: React.ReactEventHandler<HTMLImageElement>;
};

/**
 * VerifiedMedia
 * - If `src` exists: renders the image.
 * - If `src` is missing: renders a neutral, non-photo placeholder (no fake images).
 */
export function VerifiedMedia({
  src,
  alt,
  className,
  priority,
  decorated = true,
  placeholderLabel = "Media pending",
  onError,
}: VerifiedMediaProps) {
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => {
    setFailed(false);
  }, [src]);
  const safeSrc = src && (isValidImageUrl(src) || src.startsWith("/src/assets/") || src.startsWith("src/assets/")) ? src : null;

  if (!safeSrc || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "w-full h-full flex flex-col items-center justify-center gap-2 bg-[linear-gradient(135deg,#FDFBF7,#F7F2EA,#EFE6D6)]",
          decorated
            ? "rounded-md border border-[#B89555]/20 bg-champagne-light/40"
            : "bg-gradient-to-b from-premium-card to-premium-bg",
          className,
        )}
      >
        <ImageOff className="h-5 w-5 text-[#1A1A1A]" aria-hidden="true" />
        <span className="text-xs font-medium tracking-wide text-foreground/70">
          {placeholderLabel}
        </span>
      </div>
    );
  }

  return (
    <SafeImage
      src={getHighResImageUrl(safeSrc, "464x312")}
      alt={alt}
      className={cn("w-full h-full", className)}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      onError={onError}
      onErrorCapture={() => setFailed(true)}
    />
  );
}
