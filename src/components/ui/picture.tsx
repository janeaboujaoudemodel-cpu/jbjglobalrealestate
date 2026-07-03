import * as React from "react";

/**
 * <Picture> — responsive image with AVIF/WebP fallbacks.
 *
 * Usage:
 *   <Picture
 *     src="/hero.jpg"          // baseline fallback (jpg/png)
 *     webp="/hero.webp"        // optional; auto-derived if omitted
 *     avif="/hero.avif"        // optional
 *     alt="Hero"
 *     width={1600} height={900}
 *     priority                 // true → eager + high fetchpriority + no lazy
 *   />
 *
 * The component intentionally forwards width/height to prevent CLS and adds
 * decoding="async" plus lazy loading by default. Pass `priority` for LCP
 * images (adds fetchpriority="high" and loading="eager").
 */
export type PictureProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "srcSet"> & {
  src: string;
  webp?: string;
  avif?: string;
  priority?: boolean;
  /** Extra sources; each rendered before the fallback <img>. */
  sources?: Array<{ srcSet: string; type?: string; media?: string; sizes?: string }>;
};

function swapExt(src: string, ext: string): string | undefined {
  const m = src.match(/^(.+)\.(png|jpe?g|webp|avif)(\?.*)?$/i);
  if (!m) return undefined;
  return `${m[1]}.${ext}${m[3] ?? ""}`;
}

export const Picture = React.forwardRef<HTMLImageElement, PictureProps>(function Picture(
  { src, webp, avif, priority, sources, alt = "", loading, decoding, ...rest },
  ref,
) {
  const webpSrc = webp ?? swapExt(src, "webp");
  const avifSrc = avif ?? undefined; // don't auto-derive avif — file may not exist

  const imgLoading = priority ? "eager" : loading ?? "lazy";
  const imgDecoding = decoding ?? "async";
  const fetchPriorityProps = priority ? ({ fetchpriority: "high" } as any) : {};

  return (
    <picture>
      {avifSrc && <source srcSet={avifSrc} type="image/avif" />}
      {webpSrc && <source srcSet={webpSrc} type="image/webp" />}
      {sources?.map((s, i) => (
        <source key={i} srcSet={s.srcSet} type={s.type} media={s.media} sizes={s.sizes} />
      ))}
      <img
        ref={ref}
        src={src}
        alt={alt}
        loading={imgLoading}
        decoding={imgDecoding}
        {...fetchPriorityProps}
        {...rest}
      />
    </picture>
  );
});
