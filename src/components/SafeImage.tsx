import * as React from "react";
import { logImageFailure } from "@/utils/imageLoadLogger";

type SafeImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  fallbackSrc?: string;
  /** Name of the rendering component, used for failure logs. */
  loggerComponent?: string;
  /** Free-form context attached to failure logs (slug, projectId…). */
  loggerContext?: Record<string, unknown>;
};

const APP_ASSET_URLS = import.meta.glob(
  "../assets/**/*.{png,jpg,jpeg,webp,avif,gif,svg}",
  { eager: true, import: "default" }
) as Record<string, string>;

/** Unwrap /_next/image proxy URLs to extract the original image URL */
function unwrapNextImageProxy(src: string): string {
  if (src.includes("/_next/image")) {
    try {
      const parsed = new URL(src);
      const inner = parsed.searchParams.get("url");
      if (inner) {
        const decoded = decodeURIComponent(inner);
        // If inner is absolute, use it directly; otherwise skip
        if (decoded.startsWith("http")) return decoded;
      }
    } catch { /* use original */ }
  }
  return src;
}

function resolveAppAssetUrl(src?: string): string | undefined {
  if (!src) return src;

  // Unwrap /_next/image proxy URLs
  let resolved = unwrapNextImageProxy(src);

  // Database currently stores some images as "/src/assets/..." which is not a public URL.
  // Convert those paths into bundled asset URLs via Vite's import.meta.glob.
  if (resolved.startsWith("/src/assets/")) {
    const key = "../assets" + resolved.slice("/src/assets".length);
    return APP_ASSET_URLS[key] ?? resolved;
  }

  if (resolved.startsWith("src/assets/")) {
    const key = "../assets" + resolved.slice("src/assets".length);
    return APP_ASSET_URLS[key] ?? resolved;
  }

  return resolved;
}

export const SafeImage = React.forwardRef<HTMLImageElement, SafeImageProps>(
  ({ fallbackSrc, onError, loggerComponent, loggerContext, ...props }, ref) => {
    const resolvedSrc = typeof props.src === "string" ? resolveAppAssetUrl(props.src) : props.src;
    const resolvedFallback = resolveAppAssetUrl(fallbackSrc);
    const component = loggerComponent || "SafeImage";
    const baseContext = { ...loggerContext, alt: props.alt };

    // If loading is explicitly set to "eager", respect it (for hero/first gallery images)
    const loadingAttr = props.loading ?? "lazy";
    // Add fetchpriority="high" for eager-loaded images
    const fetchPriority = loadingAttr === "eager" ? "high" : undefined;

    return (
      <img
        ref={ref}
        {...props}
        src={resolvedSrc}
        loading={loadingAttr}
        decoding={props.decoding ?? "async"}
        // @ts-ignore - fetchpriority is a valid HTML attribute
        fetchpriority={fetchPriority}
        referrerPolicy="strict-origin-when-cross-origin"
        onLoad={(e) => {
          // Detect broken images that load as 0x0
          const img = e.currentTarget;
          if (img.naturalWidth === 0 && resolvedFallback && img.src !== resolvedFallback) {
            logImageFailure({
              src: img.src,
              component,
              reason: "zero-dimensions",
              context: baseContext,
            });
            img.src = resolvedFallback;
          } else if (img.naturalWidth === 0) {
            logImageFailure({
              src: img.src,
              component,
              reason: "zero-dimensions",
              context: baseContext,
            });
            onError?.(e as unknown as React.SyntheticEvent<HTMLImageElement, Event>);
          }
        }}
        onError={(e) => {
          const failedSrc = e.currentTarget.src;
          logImageFailure({
            src: failedSrc,
            component,
            reason: "onerror",
            context: baseContext,
          });
          if (resolvedFallback && e.currentTarget.src !== resolvedFallback) {
            e.currentTarget.src = resolvedFallback;
          }
          onError?.(e);
        }}
      />
    );
  }
);
SafeImage.displayName = "SafeImage";
