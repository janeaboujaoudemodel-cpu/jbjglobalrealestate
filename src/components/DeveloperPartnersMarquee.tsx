import { useEffect, useRef, useState, useContext } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { LanguageContext } from "@/contexts/LanguageContext";

// Featured developer partners - exact logos from Provident Estate homepage
const FEATURED_DEVELOPERS = [
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
    return (
      <Link
        key={`${listKey}-${developer.slug}-${index}`}
        to={`/developers/${developer.slug}`}
        // Uniform fixed-width slots for consistent spacing
        className="flex-shrink-0 w-[160px] md:w-[200px] lg:w-[240px] flex items-center justify-center transition-opacity duration-300 hover:opacity-70 px-4 md:px-6"
        title={developer.name}
      >
        <img 
          src={developer.logo} 
          alt={developer.name}
          className="h-8 md:h-10 lg:h-12 w-auto max-w-[120px] md:max-w-[160px] lg:max-w-[200px] object-contain"
          loading="lazy"
          decoding="async"
        />
      </Link>
    );
  };

  return (
    <section className="w-full bg-[#1a2e3b] overflow-hidden">
      {/* Edge-to-edge container */}
      <div className="w-full">
        {/* Title section */}
        <div className="py-5 md:py-6 px-4">
          <p className="text-center text-white/90 text-sm md:text-base font-light tracking-wide">
            {language === "ar" ? "شراكة مع المطورين الرائدين في دبي" : "Partners with Dubai's leading developers"}
          </p>
        </div>

        {/* Marquee Container - TRUE edge-to-edge white strip with premium sizing */}
        <div className="relative w-full overflow-hidden bg-white py-6 md:py-8">
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
