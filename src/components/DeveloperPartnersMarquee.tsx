import { useEffect, useRef, useState, useCallback, useContext } from "react";
import { Link } from "react-router-dom";
import { LanguageContext } from "@/contexts/LanguageContext";

// LOCKED: Featured developer partners
const FEATURED_DEVELOPERS = [
  { name: "DAMAC", slug: "damac", logo: "/developers/logos/damac-logo.webp" },
  { name: "EMAAR", slug: "emaar", logo: "/developers/logos/emaar-logo.webp" },
  { name: "MERAAS", slug: "meraas", logo: "/developers/logos/meraas-logo.webp" },
  { name: "SOBHA REALTY", slug: "sobha", logo: "/developers/logos/sobha-logo.webp" },
  { name: "NAKHEEL", slug: "nakheel", logo: "/developers/logos/nakheel-logo.webp" },
  { name: "BINGHATTI", slug: "binghatti", logo: "/developers/logos/binghatti-logo.webp" },
  { name: "SELECT GROUP", slug: "select-group", logo: "/developers/logos/select-group-logo.webp" },
  { name: "ELLINGTON PROPERTIES", slug: "ellington", logo: "/developers/logos/ellington-logo.webp" },
  { name: "MAJID AL FUTTAIM", slug: "majid-al-futtaim", logo: "/developers/logos/majid-al-futtaim-logo.webp" },
  { name: "DANUBE PROPERTIES", slug: "danube", logo: "/developers/logos/danube-logo.webp" },
  { name: "DUBAI PROPERTIES", slug: "dubai-properties", logo: "/developers/logos/dubai-properties-logo.webp" },
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
      >
        <div
          className="w-[140px] h-[28px] md:h-[36px] lg:h-[40px] flex items-center justify-center"
        >
          <img
            src={developer.logo}
            alt={developer.name}
            className="max-h-full max-w-full object-contain"
            loading="eager"
            decoding="async"
            onLoad={isFirst ? handleImageLoad : undefined}
            onError={isFirst ? handleImageError : undefined}
          />
          {/* Fallback initial – hidden by default, shown on error */}
          <span
            className="items-center justify-center text-lg md:text-xl font-bold text-gold"
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

  return (
    <section className="w-full overflow-hidden bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]">
      {/* Inject keyframes */}
      {loopWidth > 0 && (
        <style>{`
          @keyframes marquee-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-${loopWidth}px); }
          }
        `}</style>
      )}

      <div className="w-full">
        <div className="py-5 md:py-6 px-4 mb-2 md:mb-3">
          <p className="text-center text-black text-sm md:text-base font-light tracking-wide">
            {language === "ar" ? "شراكة مع المطورين الرائدين في دبي" : "Partners with Dubai's leading developers"}
          </p>
        </div>

        <div className="relative w-full overflow-hidden py-6 md:py-8 bg-gradient-to-r from-[#EDE4D3] via-[#F5EBD7] to-[#EDE4D3] border-t border-b border-gold/30">
          <div style={marqueeStyle} className="items-center">
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
