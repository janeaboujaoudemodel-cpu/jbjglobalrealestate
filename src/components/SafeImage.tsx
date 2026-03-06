import * as React from "react";

type SafeImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  fallbackSrc?: string;
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
  ({ fallbackSrc, onError, ...props }, ref) => {
    const resolvedSrc = typeof props.src === "string" ? resolveAppAssetUrl(props.src) : props.src;
    const resolvedFallback = resolveAppAssetUrl(fallbackSrc);

    return (
      <img
        ref={ref}
        {...props}
        src={resolvedSrc}
        loading={props.loading ?? "lazy"}
        decoding={props.decoding ?? "async"}
        referrerPolicy="strict-origin-when-cross-origin"
        onLoad={(e) => {
          // Detect broken images that load as 0x0
          const img = e.currentTarget;
          if (img.naturalWidth === 0 && resolvedFallback && img.src !== resolvedFallback) {
            img.src = resolvedFallback;
          }
        }}
        onError={(e) => {
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
