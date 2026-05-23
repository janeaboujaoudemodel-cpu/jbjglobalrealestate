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
  /** Name of the parent component (for image failure logging). */
  loggerComponent?: string;
  /** Extra context attached to image failure logs. */
  loggerContext?: Record<string, unknown>;
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
  loggerComponent,
  loggerContext,
}: VerifiedMediaProps) {
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => {
    setFailed(false);
  }, [src]);
  const rawSrc: string = typeof src === "string" ? src.trim() : "";
  const isLocalAsset = rawSrc.indexOf("/src/assets/") === 0 || rawSrc.indexOf("src/assets/") === 0;
  const safeSrc = rawSrc && (isValidImageUrl(rawSrc) || isLocalAsset) ? rawSrc : null;

  if (!safeSrc || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        data-surface="champagne"
        className={cn(
          "w-full h-full flex flex-col items-center justify-center gap-2 bg-[linear-gradient(135deg,#FDFBF7,#F7F2EA,#EFE6D6)] text-[#1A1A1A]",
          decorated ? "rounded-md border border-[#B89555]/20" : "",
          className,
        )}
      >
        <ImageOff className="h-5 w-5 text-[#1A1A1A]" aria-hidden="true" />
        {placeholderLabel ? (
          <span className="text-xs font-medium tracking-wide text-[#1A1A1A]/70">
            {placeholderLabel}
          </span>
        ) : null}
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
      loggerComponent={loggerComponent || "VerifiedMedia"}
      loggerContext={{ ...loggerContext, originalSrc: safeSrc }}
    />
  );
}
