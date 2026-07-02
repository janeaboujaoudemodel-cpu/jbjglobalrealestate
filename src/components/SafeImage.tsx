import * as React from "react";
import { logImageFailure } from "@/utils/imageLoadLogger";
import { buildChampagneInitialsDataUri } from "@/utils/champagneInitialsFallback";

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
  ({ fallbackSrc, onError, loggerComponent, loggerContext, fetchPriority: explicitFetchPriority, ...props }, ref) => {
    const resolvedSrc = typeof props.src === "string" ? resolveAppAssetUrl(props.src) : props.src;
    const resolvedFallback = resolveAppAssetUrl(fallbackSrc);
    const component = loggerComponent || "SafeImage";
    const baseContext = { ...loggerContext, alt: props.alt };

    const loadingAttr = props.loading ?? "lazy";
    const fetchPriority = explicitFetchPriority ?? (loadingAttr === "eager" ? "high" : undefined);
    const fetchPriorityProps = fetchPriority
      ? ({ fetchpriority: fetchPriority } as any)
      : {};

    const champagneFor = (img: HTMLImageElement) =>
      buildChampagneInitialsDataUri({
        alt: typeof props.alt === "string" ? props.alt : "",
        width: img.clientWidth || img.naturalWidth || 400,
        height: img.clientHeight || img.naturalHeight || 300,
      });

    return (
      <img
        ref={ref}
        {...props}
        src={resolvedSrc}
        loading={loadingAttr}
        decoding={props.decoding ?? "async"}
        {...fetchPriorityProps}
        referrerPolicy="strict-origin-when-cross-origin"
        onLoad={(e) => {
          const img = e.currentTarget;
          if (img.naturalWidth === 0) {
            logImageFailure({ src: img.src, component, reason: "zero-dimensions", context: baseContext });
            if (resolvedFallback && img.src !== resolvedFallback) {
              img.src = resolvedFallback;
            } else if (img.getAttribute("data-img-recovered") !== "initials" && !img.hasAttribute("data-no-fallback")) {
              img.setAttribute("data-img-recovered", "initials");
              img.src = champagneFor(img);
            }
          }
        }}
        onError={(e) => {
          const failedSrc = e.currentTarget.src;
          logImageFailure({ src: failedSrc, component, reason: "onerror", context: baseContext });
          const img = e.currentTarget;
          if (resolvedFallback && img.src !== resolvedFallback) {
            img.src = resolvedFallback;
          } else if (img.getAttribute("data-img-recovered") !== "initials" && !img.hasAttribute("data-no-fallback")) {
            img.setAttribute("data-img-recovered", "initials");
            img.src = champagneFor(img);
          }
          onError?.(e);
        }}
      />
    );
  }
);
SafeImage.displayName = "SafeImage";
