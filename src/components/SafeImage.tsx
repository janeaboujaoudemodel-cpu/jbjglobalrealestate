import * as React from "react";

type SafeImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  fallbackSrc?: string;
};

const APP_ASSET_URLS = import.meta.glob(
  "../assets/**/*.{png,jpg,jpeg,webp,avif,gif,svg}",
  { eager: true, import: "default" }
) as Record<string, string>;

function resolveAppAssetUrl(src?: string): string | undefined {
  if (!src) return src;

  // Database currently stores some images as "/src/assets/..." which is not a public URL.
  // Convert those paths into bundled asset URLs via Vite's import.meta.glob.
  if (src.startsWith("/src/assets/")) {
    const key = "../assets" + src.slice("/src/assets".length);
    return APP_ASSET_URLS[key] ?? src;
  }

  if (src.startsWith("src/assets/")) {
    const key = "../assets" + src.slice("src/assets".length);
    return APP_ASSET_URLS[key] ?? src;
  }

  return src;
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
