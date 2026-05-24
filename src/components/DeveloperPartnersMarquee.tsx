import { useEffect, useRef, useState, useCallback, useContext } from "react";
import { Link } from "react-router-dom";
import { LanguageContext } from "@/contexts/LanguageContext";
import { ImageWithSkeleton } from "@/components/ui/image-skeleton";

// LOCKED: Featured developer partners
const FEATURED_DEVELOPERS: {
  name: string; slug: string; logo: string; scale: number;
  width?: number; fit?: "contain" | "cover";
  offsetX?: number; offsetY?: number; objectPosition?: string;
  clipInset?: string; slotMarginLeft?: number; slotMarginRight?: number;
}[] = [
  { name: "DAMAC", slug: "damac", logo: "/developers/logos/damac-logo.webp", scale: 1 },
  { name: "EMAAR", slug: "emaar", logo: "/developers/logos/emaar-logo.webp", scale: 1 },
  { name: "MERAAS", slug: "meraas", logo: "/developers/logos/meraas-logo.webp", scale: 1 },
  { name: "SOBHA REALTY", slug: "sobha", logo: "/developers/logos/sobha-logo.webp", scale: 1 },
  { name: "NAKHEEL", slug: "nakheel", logo: "/developers/logos/nakheel-logo.webp", scale: 1 },
  { name: "BINGHATTI", slug: "binghatti", logo: "/developers/logos/binghatti-logo.webp", scale: 1 },
  { name: "SELECT GROUP", slug: "select-group", logo: "/developers/logos/select-group-logo.webp", scale: 1.1 },
  { name: "ELLINGTON PROPERTIES", slug: "ellington", logo: "/developers/logos/ellington-logo.webp", scale: 1 },
  { name: "MAJID AL FUTTAIM", slug: "majid-al-futtaim", logo: "/developers/logos/majid-al-futtaim-logo.webp", scale: 1, width: 170 },
  { name: "DANUBE PROPERTIES", slug: "danube", logo: "/developers/logos/danube-logo.webp", scale: 1.05 },
  { name: "DUBAI PROPERTIES", slug: "dubai-properties", logo: "/developers/logos/dubai-properties-logo.webp", scale: 1, width: 175, fit: "contain", offsetX: -10, offsetY: -10, objectPosition: "50% 50%", slotMarginLeft: -16 },
];

const TOTAL_IMAGES = FEATURED_DEVELOPERS.length;

const DeveloperPartnersMarquee = () => {
  const context = useContext(LanguageContext);
  const language = context?.language ?? "en";

  const loopRef = useRef<HTMLDivElement | null>(null);
  const [loopWidth, setLoopWidth] = useState(0);
  const loadedCount = useRef(0);
  const [allLoaded, setAllLoaded] = useState(false);

  const measure = useCallback(() => {
    const el = loopRef.current;
    if (!el) return;
    const w = el.scrollWidth;
    if (Number.isFinite(w) && w > 0) setLoopWidth(w);
  }, []);

  const handleImageLoad = useCallback(() => {
    loadedCount.current += 1;
    if (loadedCount.current >= TOTAL_IMAGES) {
      setAllLoaded(true);
      measure();
    }
  }, [measure]);

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    // Hide the broken image and show the fallback initial
    img.style.display = "none";
    const fallback = img.nextElementSibling as HTMLElement | null;
    if (fallback) fallback.style.display = "flex";
    handleImageLoad(); // count it as "loaded" so we don't block measurement
  }, [handleImageLoad]);

  // Initial measure + resize listener
  useEffect(() => {
    measure();
    const ro = new ResizeObserver(() => measure());
    if (loopRef.current) ro.observe(loopRef.current);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, [measure]);

  // Re-measure once all images loaded
  useEffect(() => {
    if (allLoaded) measure();
  }, [allLoaded, measure]);

  const duration = loopWidth > 0 ? Math.max(12, loopWidth / 80) : 0;

  const renderPartner = (developer: typeof FEATURED_DEVELOPERS[number], index: number, isFirst: boolean) => {
    const initial = developer.name.charAt(0);
    return (
      <Link
        key={`${isFirst ? "a" : "b"}-${developer.slug}-${index}`}
        to={`/developer/${developer.slug}`}
        className="flex-shrink-0 flex items-center justify-center transition-opacity duration-300 hover:opacity-70"
        title={developer.name}
        style={{
          ...(developer.slotMarginLeft ? { marginLeft: developer.slotMarginLeft } : undefined),
          ...(developer.slotMarginRight ? { marginRight: developer.slotMarginRight } : undefined),
        }}
      >
        <div
          className="h-[36px] md:h-[42px] lg:h-[48px] flex items-center justify-center overflow-hidden"
          style={{ width: `${(developer as any).width ?? 140}px` }}
        >
          <ImageWithSkeleton
            src={developer.logo}
            alt={developer.name}
            className={`${developer.fit === "cover" ? "object-cover" : "object-contain"}`}
            style={{
              ...(developer.scale !== 1 || developer.offsetX || developer.offsetY
                ? { transform: `translate(${developer.offsetX ?? 0}px, ${developer.offsetY ?? 0}px) scale(${developer.scale})` }
                : undefined),
              ...(developer.objectPosition ? { objectPosition: developer.objectPosition } : undefined),
              ...(developer.clipInset ? { clipPath: `inset(${developer.clipInset})` } : undefined),
            }}
            loading="eager"
            decoding="async"
            onLoad={isFirst ? handleImageLoad : undefined}
            onError={isFirst ? handleImageError : undefined}
          />
          {/* Fallback initial – hidden by default, shown on error */}
          <span
            className="items-center justify-center text-lg md:text-xl font-bold text-[#1A1A1A]"
            style={{ display: "none" }}
          >
            {initial}
          </span>
        </div>
      </Link>
    );
  };

  // Inline keyframes style for CSS-driven marquee
  const marqueeStyle: React.CSSProperties = loopWidth > 0
    ? {
        display: "flex",
        animation: `marquee-scroll ${duration}s linear infinite`,
      }
    : { display: "flex" };

  const [isPaused, setIsPaused] = useState(false);

  const marqueeStyleFinal: React.CSSProperties = loopWidth > 0
    ? {
        display: "flex",
        animation: `marquee-scroll ${duration}s linear infinite`,
        animationPlayState: isPaused ? "paused" : "running",
      }
    : { display: "flex" };

  return (
    <section className="w-full overflow-hidden bg-[#F7F2EA]">
      <style>{`
        @keyframes jbj-champagne-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .jbj-shimmer-text {
          background: linear-gradient(90deg, #8a6f3a 0%, #B89555 25%, #F5E6C8 50%, #B89555 75%, #8a6f3a 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
          animation: jbj-champagne-shimmer 6s linear infinite;
        }
        .jbj-shimmer-bg {
          background: linear-gradient(90deg, #F7F2EA 0%, #EFE6D6 25%, #F9F2DF 50%, #EFE6D6 75%, #F7F2EA 100%);
          background-size: 200% auto;
          animation: jbj-champagne-shimmer 10s linear infinite;
        }
      `}</style>
      {loopWidth > 0 && (
        <style>{`
          @keyframes marquee-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-${loopWidth}px); }
          }
        `}</style>
      )}

      <div className="w-full">
        <div className="jbj-shimmer-bg py-5 md:py-6 px-4">
          <p className="jbj-shimmer-text text-center text-sm md:text-base font-light tracking-[0.18em] uppercase">
            {language === "ar" ? "شراكة مع المطورين الرائدين في دبي" : "Partners with Dubai's leading developers"}
          </p>
        </div>

        {/* Clean gold divider between title and marquee */}
        <div aria-hidden className="mx-auto h-px w-full max-w-7xl bg-gradient-to-r from-transparent via-[#B89555]/60 to-transparent" />


        <div
          className="relative w-full overflow-hidden py-6 md:py-8 bg-[#EFE6D6]"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div style={marqueeStyleFinal} className="items-center">
            {/* Loop A – measured */}
            <div ref={loopRef} className="flex items-center gap-10">
              {FEATURED_DEVELOPERS.map((d, idx) => renderPartner(d, idx, true))}
            </div>
            {/* Loop B – seamless duplicate */}
            <div aria-hidden className="flex items-center gap-10">
              {FEATURED_DEVELOPERS.map((d, idx) => renderPartner(d, idx, false))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DeveloperPartnersMarquee;
