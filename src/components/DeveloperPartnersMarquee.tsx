import { useEffect, useRef, useState, useContext } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { LanguageContext } from "@/contexts/LanguageContext";

// Featured developer partners matching Provident Estate homepage - exactly 5 partners
const FEATURED_DEVELOPERS = [
  { 
    name: "DAMAC", 
    slug: "damac",
    // DAMAC logo from Provident CDN
    logo: "https://d3h330vgpwpjr8.cloudfront.net/x/296x/DAMAC_83e3dd90e5.webp"
  },
  { 
    name: "EMAAR", 
    slug: "emaar",
    // Emaar logo from Provident CDN
    logo: "https://d3h330vgpwpjr8.cloudfront.net/x/296x/Emaar_60f60eef86.webp"
  },
  { 
    name: "MERAAS", 
    slug: "meraas",
    // Meraas logo from Provident CDN
    logo: "https://d3h330vgpwpjr8.cloudfront.net/x/296x/Meraas_bb11a41bd5.webp"
  },
  { 
    name: "SOBHA REALTY", 
    slug: "sobha",
    // Sobha logo from Provident CDN
    logo: "https://d3h330vgpwpjr8.cloudfront.net/x/296x/Sobha_Realty_d7a77ee6e9.webp"
  },
  { 
    name: "NAKHEEL", 
    slug: "nakheel",
    // Nakheel logo from Provident CDN
    logo: "https://d3h330vgpwpjr8.cloudfront.net/x/296x/Nakheel_8bdb15ccc7.webp"
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
        className="flex-shrink-0 flex items-center justify-center h-14 md:h-16 px-8 md:px-12 transition-all duration-300 hover:opacity-70"
        title={developer.name}
      >
        <img 
          src={developer.logo} 
          alt={developer.name}
          className="h-6 md:h-8 w-auto object-contain max-w-[140px] md:max-w-[180px]"
          loading="lazy"
          style={{ filter: "brightness(0)" }} // Make logos black like Provident
        />
      </Link>
    );
  };

  return (
    <section className="w-full bg-[#1a2e3b] overflow-hidden">
      {/* Edge-to-edge container - no padding */}
      <div className="w-full">
        {/* Title section */}
        <div className="py-6 md:py-8 px-4">
          <p className="text-center text-white/90 text-sm md:text-base font-light tracking-wide">
            {language === "ar" ? "شراكة مع المطورين الرائدين في دبي" : "Partners with Dubai's leading developers"}
          </p>
        </div>

        {/* Marquee Container - TRUE edge-to-edge */}
        <div className="relative w-full overflow-hidden bg-white py-4 md:py-6">
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
                duration: loopWidth > 0 ? Math.max(15, loopWidth / 80) : 0,
                repeat: Infinity,
                ease: "linear",
              },
            }}
          >
            {/* First loop */}
            <div ref={loopRef} className="flex items-center">
              {FEATURED_DEVELOPERS.map((d, idx) => renderPartner(d, idx, "a"))}
            </div>

            {/* Duplicate loops for seamless effect */}
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
