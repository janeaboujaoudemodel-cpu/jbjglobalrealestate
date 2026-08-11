import * as React from "react";
import { ImageOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { SafeImage } from "@/components/SafeImage";
import { getHighResImageUrl, isValidImageUrl, optimizeStorageImageUrl } from "@/lib/imageUtils";
import { buildResponsiveImage, CARD_IMAGE_SIZES, CARD_IMAGE_WIDTHS } from "@/lib/responsiveImage";

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
  /** Responsive `sizes` hint. Defaults to the card-grid preset. */
  sizes?: string;
  /** Candidate widths for `srcset`. Defaults to the card-grid preset. */
  widths?: number[];
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
  sizes,
  widths,
}: VerifiedMediaProps) {
  const [failed, setFailed] = React.useState(false);
  // ONE stable loading state per card (LOCKED): the <img> keeps a champagne
  // shimmer painted on its own background until the bitmap is decoded, so a
  // card can never flash skeleton -> empty box -> photo. The element and its
  // box are identical before/after load, so this costs zero layout shift.
  const [loaded, setLoaded] = React.useState(false);
  React.useEffect(() => {
    setFailed(false);
    setLoaded(false);
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

  const optimizedSrc = optimizeStorageImageUrl(getHighResImageUrl(safeSrc, "464x312"), priority ? 928 : 464, priority ? 72 : 68) || safeSrc;
  // Responsive delivery: mobile must not download a desktop-width bitmap for a
  // card. Only providers with a guaranteed width transform get a srcset.
  const responsive = buildResponsiveImage(safeSrc, {
    widths: widths ?? CARD_IMAGE_WIDTHS,
    sizes: sizes ?? CARD_IMAGE_SIZES,
    quality: priority ? 72 : 68,
  });

  return (
    <SafeImage
      src={responsive?.srcSet ? responsive.src : optimizedSrc}
      srcSet={responsive?.srcSet}
      sizes={responsive?.srcSet ? (sizes ?? CARD_IMAGE_SIZES) : undefined}
      alt={alt}
      width={928}
      height={580}
      className={cn("w-full h-full", className)}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "low"}
      decoding="async"
      data-media-state={loaded ? "ready" : "loading"}
      style={
        loaded
          ? undefined
          : {
              backgroundImage:
                "linear-gradient(135deg,#FDFBF7 0%,#F3EBDD 45%,#EFE6D6 100%)",
              backgroundSize: "cover",
            }
      }
      onLoad={() => setLoaded(true)}
      onError={onError}
      onErrorCapture={() => setFailed(true)}
      loggerComponent={loggerComponent || "VerifiedMedia"}
      loggerContext={{ ...loggerContext, originalSrc: safeSrc }}
    />
  );
}

