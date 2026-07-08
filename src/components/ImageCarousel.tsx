import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, Download, Maximize2, X } from "lucide-react";
import { getHighResImageUrl } from "@/lib/imageUtils";
import { SafeImage } from "@/components/SafeImage";
import { Button } from "@/components/ui/button";
import { SUPABASE_URL } from "@/config/backend";

interface ImageCarouselProps {
  images: {
    id: string;
    image_url: string;
    alt_text: string | null;
  }[];
  projectName?: string;
}

/* ------------------------------------------------------------------ */
/* De-duplication                                                      */
/* ------------------------------------------------------------------ */

/** Normalise a CDN URL into a stable key so the same photo at different
 *  resolutions / crops / query-string transforms collapses to a single entry. */
const dedupeKey = (rawUrl: string): string => {
  let u = (rawUrl || "").toLowerCase().split("?")[0].split("#")[0];

  // Cloudinary / Imgix style segments: /w_400/, /c_fill,w_800/, /q_80/ …
  u = u.replace(/\/(w|h|c|q|f|s|t|fit|crop|dpr|ar|g|e|fl|l|o|r|x|y|z)_[a-z0-9,_.:%-]+\//g, "/");

  // CloudFront / Strapi /x/{w}x{h}/ size segment
  u = u.replace(/\/x\/\d+x\d*\//g, "/x/");

  // WordPress / generic: -150x150 before extension
  u = u.replace(/-\d{2,4}x\d{2,4}(?=\.[a-z]+$)/g, "");

  // Suffixes: _thumb, _small, _medium, _large, _xl, _xxl, _hd, _hires, _lowres, _preview, _tn,
  // and numeric size suffixes _400, _800, _1200
  u = u.replace(/_(thumb|thumbs|small|sm|med|medium|large|lg|xl|xxl|hd|hires|lowres|preview|tn|orig|original|max|maxres|full)(?=\.[a-z]+$)/g, "");
  u = u.replace(/_\d{2,4}(?=\.[a-z]+$)/g, "");

  // Path segments: /thumb/, /thumbnails/, /small/, /medium/, /large/, /preview/
  u = u.replace(/\/(thumb|thumbs|thumbnail|thumbnails|small|sm|medium|med|large|lg|xl|preview|tn|cache|resized?|scaled?)\//g, "/");

  // Trailing slashes, double slashes
  u = u.replace(/\/{2,}/g, "/").replace(/\/+$/g, "");

  // Final fingerprint: last 3 path segments (catches CDNs that hash dirs)
  const parts = u.split("/").filter(Boolean);
  const fingerprint = parts.slice(-3).join("/");
  return fingerprint || u;
};

/** Aggressive fallback dedupe by basename only (no folder/host). Catches the
 *  case where the SAME image is uploaded twice — once via Supabase Storage,
 *  once via the developer CDN — under different folder paths but identical
 *  filename. We only collapse via this when basename has a meaningful length. */
const UUID_PREFIX_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i;
const LEADING_TIMESTAMP_RE = /^\d{10,}-\d+-/;

const basenameKey = (rawUrl: string): string => {
  try {
    const clean = (rawUrl || "").toLowerCase().split("?")[0].split("#")[0];
    let last = clean.split("/").filter(Boolean).pop() || "";
    // Strip Supabase Storage upload prefixes: {uuid}-{filename} and {timestamp}-{idx}-{filename}
    last = last.replace(UUID_PREFIX_RE, "").replace(LEADING_TIMESTAMP_RE, "");
    // Strip CDN size suffixes from basename too
    const stripped = last
      .replace(/-\d{2,4}x\d{2,4}(?=\.[a-z]+$)/g, "")
      .replace(/_(thumb|thumbs|small|sm|med|medium|large|lg|xl|xxl|hd|hires|lowres|preview|tn|orig|original|max|maxres|full)(?=\.[a-z]+$)/g, "")
      .replace(/_\d{2,4}(?=\.[a-z]+$)/g, "");
    // Ignore short / generic basenames like "1.jpg", "image.jpg" that
    // would collapse unrelated photos.
    if (stripped.replace(/\.[a-z]+$/, "").length < 6) return "";
    return stripped;
  } catch {
    return "";
  }
};


const sizeScore = (rawUrl: string): number => {
  const url = rawUrl || "";
  const m = url.match(/(\d{3,4})x(\d{3,4})/);
  if (m) return parseInt(m[1], 10) * parseInt(m[2], 10);
  const w = url.match(/[?&/](?:w|width)[=_](\d{3,4})/i);
  if (w) return parseInt(w[1], 10) * parseInt(w[1], 10);
  if (/thumb|small|preview|tn|lowres|_sm|_xs|_150|_200|_300|_400/i.test(url)) return 100 * 100;
  if (/large|_xl|_xxl|_hd|hires|original|orig|maxres|_1600|_1920|_2048|_2400|full/i.test(url)) return 1920 * 1080;
  if (/_800|_1024|_1200/i.test(url)) return 1200 * 900;
  return 1024 * 768;
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

const ImageCarousel = ({ images: rawImages, projectName = "project" }: ImageCarouselProps) => {
  // Independent indices: the inline carousel must NOT move when the user browses
  // the fullscreen gallery, and vice-versa.
  const [pageIndex, setPageIndex] = useState(0);
  const [fsIndex, setFsIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Filter out map/location thumbs AND collapse duplicates (keep highest-res variant)
  const images = useMemo(() => {
    const filtered = (rawImages || []).filter((img) => {
      const url = img.image_url?.toLowerCase() || "";
      if (!url) return false;
      if (url.includes("map") && !url.includes("maptype=satellite")) return false;
      if (url.includes("location") && url.includes("thumbnail")) return false;
      if (url.includes("google.com/maps")) return false;
      return true;
    });
    // Pass 1: collapse by CDN-aware path fingerprint
    const best = new Map<string, typeof filtered[number]>();
    for (const img of filtered) {
      const key = dedupeKey(img.image_url);
      const existing = best.get(key);
      if (!existing || sizeScore(img.image_url) > sizeScore(existing.image_url)) {
        best.set(key, img);
      }
    }
    // Pass 2: aggressive same-basename fallback so a duplicate uploaded to
    // two CDNs (Supabase + developer site) collapses to the higher-res copy.
    const byBase = new Map<string, typeof filtered[number]>();
    const noBaseKey: typeof filtered = [];
    for (const img of best.values()) {
      const bk = basenameKey(img.image_url);
      if (!bk) { noBaseKey.push(img); continue; }
      const existing = byBase.get(bk);
      if (!existing || sizeScore(img.image_url) > sizeScore(existing.image_url)) {
        byBase.set(bk, img);
      }
    }
    return [...byBase.values(), ...noBaseKey];
  }, [rawImages]);


  const total = images.length;
  const hasMultiple = total > 1;

  // Clamp indices if image set shrinks
  useEffect(() => {
    if (pageIndex >= total) setPageIndex(0);
    if (fsIndex >= total) setFsIndex(0);
  }, [total, pageIndex, fsIndex]);

  /* ---------- Inline carousel navigation ---------- */
  const pagePrev = () => hasMultiple && setPageIndex((i) => (i === 0 ? total - 1 : i - 1));
  const pageNext = () => hasMultiple && setPageIndex((i) => (i === total - 1 ? 0 : i + 1));

  /* ---------- Fullscreen navigation ---------- */
  const fsPrev = useCallback(() => {
    if (!hasMultiple) return;
    setFsIndex((i) => (i === 0 ? total - 1 : i - 1));
  }, [hasMultiple, total]);
  const fsNext = useCallback(() => {
    if (!hasMultiple) return;
    setFsIndex((i) => (i === total - 1 ? 0 : i + 1));
  }, [hasMultiple, total]);

  const openFullscreen = (startAt: number) => {
    setFsIndex(Math.max(0, Math.min(total - 1, startAt)));
    setIsFullscreen(true);
  };
  const closeFullscreen = () => setIsFullscreen(false);

  /* ---------- Keyboard, wheel, swipe inside fullscreen ---------- */
  const wheelAccumRef = useRef(0);
  const wheelLastRef = useRef(0);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isFullscreen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeFullscreen();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        fsPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        fsNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isFullscreen, fsPrev, fsNext]);

  const onWheel = (e: React.WheelEvent) => {
    // Two-finger trackpad / mouse wheel → advance photos.
    // Velocity-aware: a strong gesture skips multiple photos.
    e.preventDefault();
    const now = Date.now();
    const dt = now - wheelLastRef.current;
    wheelLastRef.current = now;
    // Reset accumulator on idle so a fresh gesture starts clean
    if (dt > 250) wheelAccumRef.current = 0;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    wheelAccumRef.current += delta;
    const STEP = 80;
    while (wheelAccumRef.current >= STEP) {
      fsNext();
      wheelAccumRef.current -= STEP;
    }
    while (wheelAccumRef.current <= -STEP) {
      fsPrev();
      wheelAccumRef.current += STEP;
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const sx = touchStartXRef.current;
    const sy = touchStartYRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    if (sx == null || sy == null) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - sx;
    const dy = t.clientY - sy;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) fsNext();
    else fsPrev();
  };

  /* ---------- Downloads ---------- */
  const handleDownload = async (imageUrl: string, index: number) => {
    const filename = `${projectName.replace(/\s+/g, "-").toLowerCase()}-${index + 1}.jpg`;
    const supabaseUrl = SUPABASE_URL;
    if (supabaseUrl) {
      const proxyUrl = new URL(`${supabaseUrl}/functions/v1/download-file`);
      proxyUrl.searchParams.set("url", imageUrl);
      proxyUrl.searchParams.set("filename", filename);
      const link = document.createElement("a");
      link.href = proxyUrl.toString();
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(imageUrl, "_blank");
    }
  };
  const handleDownloadAll = async () => {
    for (let i = 0; i < images.length; i++) {
      await handleDownload(images[i].image_url, i);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  };

  /* ---------- Empty state ---------- */
  if (!images || images.length === 0) {
    return (
      <div className="aspect-[16/9] bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">No images available</p>
      </div>
    );
  }

  /* ---------- Render ---------- */
  return (
    <>
      <div className="relative">
        {/* Inline carousel — uses pageIndex, completely independent of fullscreen */}
        <div className="aspect-[16/9] rounded-lg overflow-hidden bg-gradient-to-br from-muted via-muted/80 to-muted/60 relative group flex items-center justify-center">
          <SafeImage
            src={getHighResImageUrl(images[pageIndex].image_url)}
            alt={images[pageIndex].alt_text || "Project image"}
            className="w-full h-full object-cover"
            loading="eager"
           decoding="async" />

          {/* Top-right controls */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              className="h-11 w-11 rounded-xl border border-border bg-background/70 backdrop-blur-sm shadow-lg transition-transform duration-200 hover:scale-105 flex items-center justify-center"
              onClick={() => handleDownload(images[pageIndex].image_url, pageIndex)}
              title="Download this image"
              type="button"
            >
              <Download className="w-5 h-5 text-foreground" />
            </button>
            <button
              className="h-11 w-11 rounded-xl border border-border bg-background/70 backdrop-blur-sm shadow-lg transition-transform duration-200 hover:scale-105 flex items-center justify-center"
              onClick={() => openFullscreen(pageIndex)}
              title="View fullscreen"
              type="button"
            >
              <Maximize2 className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={pagePrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full border border-border bg-background/70 backdrop-blur-sm shadow-lg transition-all hover:bg-background/85 hover:shadow-xl flex items-center justify-center"
                aria-label="Previous image"
              >
                <ArrowLeft className="h-5 w-5 text-foreground" />
              </button>
              <button
                type="button"
                onClick={pageNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full border border-border bg-background/70 backdrop-blur-sm shadow-lg transition-all hover:bg-background/85 hover:shadow-xl flex items-center justify-center"
                aria-label="Next image"
              >
                <ArrowRight className="h-5 w-5 text-foreground" />
              </button>
            </>
          )}

          <div className="absolute bottom-4 right-4 bg-background/70 backdrop-blur-sm px-3 py-1 rounded-full text-foreground text-sm border border-border">
            {pageIndex + 1} / {total}
          </div>
        </div>

        {/* Thumbnails */}
        {total > 1 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground text-sm">{total} Photos</span>
              <button
                type="button"
                onClick={handleDownloadAll}
                data-emerald-action="true"
                className="jj-emerald-action inline-flex items-center gap-2 h-9 rounded-md px-4 text-sm font-semibold transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Download All Photos</span>
              </button>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {images.slice(0, 6).map((image, index) => {
                const isOverflowTile = index === 5 && total > 6;
                return (
                  <button
                    key={image.id}
                    onClick={() => {
                      if (isOverflowTile) {
                        // Open the full gallery from the very first photo so the
                        // user immediately sees the complete filmstrip of ALL
                        // photos (not just the hidden remainder).
                        openFullscreen(0);
                      } else {
                        setPageIndex(index);
                      }
                    }}

                    className={`aspect-[4/3] rounded overflow-hidden border-2 transition-colors relative ${
                      index === pageIndex && !isOverflowTile ? "border-primary" : "border-transparent hover:border-border"
                    }`}
                    type="button"
                    aria-label={isOverflowTile ? `View all ${total} photos` : `View photo ${index + 1}`}
                  >
                    <SafeImage
                      src={getHighResImageUrl(image.image_url, "464x312")}
                      alt={image.alt_text || `Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                     decoding="async" />
                    {isOverflowTile && (
                      <div className="absolute inset-0 bg-[#1A1A1A]/70 backdrop-blur-sm flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">+{total - 6}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Full-screen viewport overlay (portal so it escapes any modal/transform parent) */}
      {isFullscreen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Image gallery — ${projectName}`}
            className="fixed inset-0 z-[9999] bg-[#F7F2EA] flex flex-col select-none"
            style={{ width: "100dvw", height: "100dvh" }}
            onWheel={onWheel}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            data-no-contrast-guard
          >
            {/* Top bar — champagne with gold hairline. shrink-0 so it never collapses. */}
            <div className="shrink-0 flex items-center justify-between gap-3 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 bg-[#FDFBF7] border-b border-[#B89555]/40">
              <div className="min-w-0 text-[#1A1A1A] text-sm md:text-base font-semibold truncate">
                {projectName}
                <span className="ml-3 text-[#1A1A1A]/60 font-normal tabular-nums">
                  {fsIndex + 1} / {total}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownload(images[fsIndex].image_url, fsIndex)}
                  className="h-10 w-10 md:h-11 md:w-11 rounded-full bg-[#FDFBF7] hover:bg-[#EFE6D6] border border-[#B89555] flex items-center justify-center transition-colors shadow-sm"
                  aria-label="Download image"
                  title="Download"
                >
                  <Download className="w-5 h-5 text-[#B89555]" />
                </button>
                <button
                  type="button"
                  onClick={closeFullscreen}
                  className="h-10 w-10 md:h-11 md:w-11 rounded-full bg-[#FDFBF7] hover:bg-[#EFE6D6] border border-[#B89555] flex items-center justify-center transition-colors shadow-sm"
                  aria-label="Close gallery"
                  title="Close"
                >
                  <X className="w-5 h-5 text-[#B89555]" />
                </button>
              </div>
            </div>

            {/* Stage — image fills available space. min-h-0 / min-w-0 lets flex child actually shrink. */}
            <div className="relative flex-1 min-h-0 min-w-0 flex items-center justify-center overflow-hidden bg-[#F7F2EA] p-2 md:p-4">
              <SafeImage
                key={images[fsIndex].id}
                src={getHighResImageUrl(images[fsIndex].image_url)}
                alt={images[fsIndex].alt_text || `Photo ${fsIndex + 1}`}
                className="max-w-full max-h-full w-auto h-auto object-contain"
                draggable={false}
               loading="lazy" decoding="async" />

              {hasMultiple && (
                <>
                  <button
                    type="button"
                    onClick={fsPrev}
                    className="absolute left-2 sm:left-3 md:left-6 top-1/2 -translate-y-1/2 h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-full bg-[#FDFBF7] hover:bg-[#EFE6D6] border border-[#B89555] flex items-center justify-center transition-colors shadow-md"
                    aria-label="Previous photo"
                  >
                    <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-[#1A1A1A]" />
                  </button>
                  <button
                    type="button"
                    onClick={fsNext}
                    className="absolute right-2 sm:right-3 md:right-6 top-1/2 -translate-y-1/2 h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-full bg-[#FDFBF7] hover:bg-[#EFE6D6] border border-[#B89555] flex items-center justify-center transition-colors shadow-md"
                    aria-label="Next photo"
                  >
                    <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-[#1A1A1A]" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail filmstrip — champagne tone. shrink-0 so it never eats the stage. */}
            {hasMultiple && (
              <div className="shrink-0 bg-[#FDFBF7] border-t border-[#B89555]/40 px-3 md:px-6 py-2.5 md:py-3 overflow-x-auto">
                <div className="flex gap-2 min-w-min">
                  {images.map((img, i) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setFsIndex(i)}
                      className={`relative h-12 sm:h-14 md:h-16 aspect-[4/3] rounded overflow-hidden border-2 flex-shrink-0 transition-all ${
                        i === fsIndex ? "border-[#B89555] scale-105" : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                      aria-label={`Go to photo ${i + 1}`}
                    >
                      <SafeImage
                        src={getHighResImageUrl(img.image_url, "200x150")}
                        alt={img.alt_text || `Thumbnail ${i + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                       decoding="async" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
};

export default ImageCarousel;
