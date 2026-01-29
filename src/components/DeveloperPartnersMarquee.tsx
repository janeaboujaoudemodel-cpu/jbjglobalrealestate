import { useEffect, useRef, useState, useContext } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { LanguageContext } from "@/contexts/LanguageContext";

// LOCKED: Featured developer partners - exact logos from Provident Estate homepage
// Current developers: DAMAC, EMAAR, MERAAS, SOBHA REALTY, NAKHEEL (original 5)
// Added: BINGHATTI, SELECT GROUP, ELLINGTON, MAJID AL FUTTAIM, DANUBE (extracted from Provident)
const FEATURED_DEVELOPERS = [
  // === ORIGINAL 5 (LOCKED) ===
  { 
    name: "DAMAC", 
    slug: "damac",
    logo: "/developers/logos/damac-logo.webp"
  },
  { 
    name: "EMAAR", 
    slug: "emaar",
    logo: "/developers/logos/emaar-logo.webp"
  },
  { 
    name: "MERAAS", 
    slug: "meraas",
    logo: "/developers/logos/meraas-logo.webp"
  },
  { 
    name: "SOBHA REALTY", 
    slug: "sobha",
    logo: "/developers/logos/sobha-logo.webp"
  },
  { 
    name: "NAKHEEL", 
    slug: "nakheel",
    logo: "/developers/logos/nakheel-logo.webp"
  },
  // === EXTRACTED FROM PROVIDENT HOMEPAGE ===
  { 
    name: "BINGHATTI", 
    slug: "binghatti",
    logo: "/developers/logos/binghatti-logo.webp"
  },
  { 
    name: "SELECT GROUP", 
    slug: "select-group",
    logo: "/developers/logos/select-group-logo.webp"
  },
  { 
    name: "ELLINGTON PROPERTIES", 
    slug: "ellington-properties",
    logo: "/developers/logos/ellington-logo.webp"
  },
  { 
    name: "MAJID AL FUTTAIM", 
    slug: "majid-al-futtaim",
    logo: "/developers/logos/majid-al-futtaim-logo.webp"
  },
  { 
    name: "DANUBE PROPERTIES", 
    slug: "danube-properties",
    logo: "/developers/logos/danube-logo.webp"
  },
  { 
    name: "DUBAI PROPERTIES", 
    slug: "dubai-properties",
    logo: "/developers/logos/dubai-properties-logo.webp"
  },
];

const DeveloperPartnersMarquee = () => {
  const context = useContext(LanguageContext);
  const language = context?.language ?? "en";

  const trackRef = useRef<HTMLDivElement | null>(null);
  const loopRef = useRef<HTMLDivElement | null>(null);
  const [loopWidth, setLoopWidth] = useState(0);

  // Measure the width of ONE loop for seamless scrolling
  useEffect(() => {
    const el = loopRef.current;
    if (!el) return;

    const measure = () => {
      const w = el.scrollWidth;
      if (Number.isFinite(w) && w > 0) setLoopWidth(w);
    };

    measure();

    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    window.addEventListener("resize", measure);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const renderPartner = (developer: typeof FEATURED_DEVELOPERS[number], index: number, listKey: "a" | "b") => {
    // IMPORTANT: Keep spacing locked (px-* on the Link). Only adjust logo size.
    // We adjust size by changing responsive HEIGHT classes (layout-safe; no transform scaling).
    // MOBILE: Smaller logos to fit ~4 in viewport; DESKTOP: Keep original larger sizes
    // Unified sizing for all logos - same height for consistent alignment
    const sizeClass = "h-6 md:h-10 lg:h-12 w-auto max-w-[120px] md:max-w-[200px] lg:max-w-[240px] object-contain";

    return (
      <Link
        key={`${listKey}-${developer.slug}-${index}`}
        to={`/developers/${developer.slug}`}
        // Tighter spacing on mobile, normal on desktop
        className="flex-shrink-0 px-4 md:px-8 lg:px-10 flex items-center justify-center transition-opacity duration-300 hover:opacity-70"
        title={developer.name}
      >
        <img
          src={developer.logo}
          alt={developer.name}
          className={sizeClass}
          loading="lazy"
          decoding="async"
        />
      </Link>
    );
  };

  return (
    <section className="w-full bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] overflow-hidden">
      {/* Edge-to-edge container */}
      <div className="w-full">
        {/* Title section - Active champagne background with black text - Extra bottom spacing */}
        <div className="py-5 md:py-6 px-4 mb-2 md:mb-3">
          <p className="text-center text-black text-sm md:text-base font-light tracking-wide">
            {language === "ar" ? "شراكة مع المطورين الرائدين في دبي" : "Partners with Dubai's leading developers"}
          </p>
        </div>

        {/* Marquee Container - Gold champagne background to match Best Idea Award */}
        <div className="relative w-full overflow-hidden bg-gradient-to-r from-[#EDE4D3] via-[#F5EBD7] to-[#EDE4D3] py-6 md:py-8 border-t border-b border-gold/30">
          {/* Scrolling content */}
          <motion.div
            ref={trackRef}
            className="flex items-center"
            animate={
              loopWidth > 0
                ? { x: [0, -loopWidth] }
                : { x: 0 }
            }
            transition={{
              x: {
                duration: loopWidth > 0 ? Math.max(20, loopWidth / 60) : 0,
                repeat: Infinity,
                ease: "linear",
              },
            }}
          >
            {/* First loop */}
            <div ref={loopRef} className="flex items-center">
              {FEATURED_DEVELOPERS.map((d, idx) => renderPartner(d, idx, "a"))}
            </div>

            {/* Duplicate loops for seamless infinite scroll */}
            <div aria-hidden className="flex items-center">
              {FEATURED_DEVELOPERS.map((d, idx) => renderPartner(d, idx, "b"))}
            </div>
            <div aria-hidden className="flex items-center">
              {FEATURED_DEVELOPERS.map((d, idx) => renderPartner(d, idx, "a"))}
            </div>
            <div aria-hidden className="flex items-center">
              {FEATURED_DEVELOPERS.map((d, idx) => renderPartner(d, idx, "b"))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default DeveloperPartnersMarquee;
