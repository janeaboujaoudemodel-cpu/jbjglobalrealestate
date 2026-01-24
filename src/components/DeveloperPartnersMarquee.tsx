import { useEffect, useMemo, useRef, useState, useContext } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useDevelopers, useProjects } from "@/hooks/useProjects";
import { LanguageContext } from "@/contexts/LanguageContext";

// Curated partners list (30 developers - links become active only when inventory exists)
const CURATED_DEVELOPER_PARTNERS = [
  // Tier 1 - Master Developers
  { name: "Emaar Properties", slug: "emaar" },
  { name: "Nakheel", slug: "nakheel" },
  { name: "Meraas", slug: "meraas" },
  { name: "DAMAC Properties", slug: "damac" },
  { name: "Sobha Realty", slug: "sobha" },
  { name: "Aldar Properties", slug: "aldar" },
  { name: "Dubai Holding", slug: "dubai-holding" },
  // Tier 2 - Premium Developers
  { name: "Binghatti Developers", slug: "binghatti" },
  { name: "Omniyat", slug: "omniyat" },
  { name: "Dubai Properties", slug: "dubai-properties" },
  { name: "Ellington Properties", slug: "ellington" },
  { name: "Select Group", slug: "select-group" },
  { name: "Azizi Developments", slug: "azizi" },
  { name: "Imtiaz Developments", slug: "imtiaz" },
  { name: "Beyond Developments", slug: "beyond" },
  // Tier 3 - Top Performers
  { name: "Danube Properties", slug: "danube" },
  { name: "Samana Developers", slug: "samana" },
  { name: "Tiger Properties", slug: "tiger" },
  { name: "Mag Property", slug: "mag" },
  { name: "Vincitore Real Estate", slug: "vincitore" },
  // Tier 4 - Emerging Leaders
  { name: "ORO24 Developments", slug: "oro24" },
  { name: "Reportage Properties", slug: "reportage" },
  { name: "Bloom Holding", slug: "bloom" },
  { name: "Deyaar Development", slug: "deyaar" },
  { name: "Meydan", slug: "meydan" },
  // Tier 5 - Specialist Developers
  { name: "Seven Tides", slug: "seven-tides" },
  { name: "Arada Developments", slug: "arada" },
  { name: "Al Habtoor Group", slug: "al-habtoor" },
  { name: "Majid Al Futtaim", slug: "majid-al-futtaim" },
  { name: "RAK Properties", slug: "rak-properties" },
];

// Official / commonly-used Arabic brand renderings for the curated list.
// Note: we keep the English canonical list unchanged and only switch the display label.
const DEVELOPER_NAME_AR: Record<string, string> = {
  "Emaar Properties": "إعمار العقارية",
  "Nakheel": "نخيل",
  "Meraas": "مراس",
  "DAMAC Properties": "داماك العقارية",
  "Sobha Realty": "شوبا العقارية",
  "Aldar Properties": "الدار العقارية",
  "Dubai Holding": "دبي القابضة",
  "Binghatti Developers": "بن غاطي للتطوير",
  "Omniyat": "أمنيات",
  "Dubai Properties": "دبي للعقارات",
  "Ellington Properties": "إلينغتون العقارية",
  "Select Group": "سيلكت جروب",
  "Azizi Developments": "عزيزي للتطوير",
  "Imtiaz Developments": "امتياز للتطوير",
  "Beyond Developments": "بيوند للتطوير",
  "Danube Properties": "دانوب العقارية",
  "Samana Developers": "سمانا للتطوير",
  "Tiger Properties": "تايغر العقارية",
  "Mag Property": "ماج العقارية",
  "Vincitore Real Estate": "فينسيتوري العقارية",
  "ORO24 Developments": "أورو 24 للتطوير",
  "Reportage Properties": "ريبورتاج العقارية",
  "Bloom Holding": "بلوم القابضة",
  "Deyaar Development": "ديار للتطوير",
  "Meydan": "ميدان",
  "Seven Tides": "سفن تايدز",
  "Arada Developments": "أرادَ للتطوير",
  "Al Habtoor Group": "مجموعة الحبتور",
  "Majid Al Futtaim": "ماجد الفطيم",
  "RAK Properties": "رأس الخيمة العقارية",
};

// Real developer logo URLs extracted from Provident Estate
const DEVELOPER_LOGOS: Record<string, string> = {
  "Emaar": "https://providentestate.com/files/developers/logos/emaar-properties.png",
  "Nakheel": "https://providentestate.com/files/developers/logos/nakheel.png", 
  "DAMAC": "https://providentestate.com/files/developers/logos/damac.png",
  "Sobha": "https://providentestate.com/files/developers/logos/sobha-realty.png",
  "Meraas": "https://providentestate.com/files/developers/logos/meraas.png",
  "Dubai Properties": "https://providentestate.com/files/developers/logos/dubai-properties.png",
  "Ellington": "https://providentestate.com/files/developers/logos/ellington-properties.png",
  "Binghatti": "https://providentestate.com/files/developers/logos/binghatti.png",
  "Danube": "https://providentestate.com/files/developers/logos/danube.png",
  "Azizi": "https://providentestate.com/files/developers/logos/azizi-developments.png",
  "Majid Al Futtaim": "https://providentestate.com/files/developers/logos/majid-al-futtaim.png",
  "Omniyat": "https://providentestate.com/files/developers/logos/omniyat.png",
  "Aldar": "https://providentestate.com/files/developers/logos/aldar.png",
  "Select Group": "https://providentestate.com/files/developers/logos/select-group.png",
  "Deyaar": "https://providentestate.com/files/developers/logos/deyaar.png",
  "Dubai Holding": "https://providentestate.com/files/developers/logos/dubai-holding.png",
  "Samana": "https://providentestate.com/files/developers/logos/samana.png",
  "Reportage": "https://providentestate.com/files/developers/logos/reportage-properties.png",
  "Tiger": "https://providentestate.com/files/developers/logos/tiger-group.png",
  "Imtiaz": "https://providentestate.com/files/developers/logos/imtiaz-developments.png",
};

const DeveloperPartnersMarquee = () => {
  const context = useContext(LanguageContext);
  const language = context?.language ?? "en";
  const isRTL = context?.isRTL ?? false;

  const { data: developers } = useDevelopers();
  const { data: projects } = useProjects();

  const trackRef = useRef<HTMLDivElement | null>(null);
  const loopRef = useRef<HTMLDivElement | null>(null);
  const [loopWidth, setLoopWidth] = useState(0);

  const inventoryByDeveloperId = useMemo(() => {
    const map = new Map<string, number>();
    (projects ?? []).forEach((p) => {
      const developerId = p.developer?.id ?? (p as any).developer_id;
      if (!developerId) return;
      map.set(developerId, (map.get(developerId) ?? 0) + 1);
    });
    return map;
  }, [projects]);

  const partners = useMemo(() => {
    return CURATED_DEVELOPER_PARTNERS.map((partner) => {
      const matched = developers?.find(
        (d) => d.slug?.toLowerCase() === partner.slug.toLowerCase()
      );
      const inventoryCount = matched
        ? inventoryByDeveloperId.get(matched.id) ?? 0
        : 0;

      return {
        ...partner,
        developerId: matched?.id ?? null,
        inventoryCount,
      };
    });
  }, [developers, inventoryByDeveloperId]);

  const displayNameFor = useMemo(() => {
    if (language !== "ar") {
      return (name: string) => name;
    }
    return (name: string) => DEVELOPER_NAME_AR[name] ?? name;
  }, [language]);

  // Measure the width of ONE loop (first list) for seamless looping.
  // This prevents long blank gaps and hover-only “reappearing” behavior.
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
  }, [language, partners.length]);

  const renderPartner = (developer: (typeof partners)[number], index: number, listKey: "a" | "b") => {
    const label = displayNameFor(developer.name);
    const isLastInList = index === partners.length - 1;
    const showSeparator = !(listKey === "b" && isLastInList);
    const logoUrl = DEVELOPER_LOGOS[developer.name];

    return (
      <div key={`${listKey}-${developer.slug}-${index}`} className="flex-shrink-0 flex items-center gap-6 group">
        <Link
          to={`/properties?developer=${encodeURIComponent(
            developer.developerId ?? developer.slug
          )}`}
          data-no-translate
          className="inline-flex items-center justify-center h-16 md:h-20 px-6 bg-white/90 border-2 border-gold/30 rounded-xl transition-all duration-300 hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5)] hover:-translate-y-1 shadow-[0_4px_15px_rgba(0,0,0,0.1)] group"
          title={label}
        >
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt={label}
              className="h-8 md:h-10 w-auto object-contain max-w-[120px] md:max-w-[150px] grayscale group-hover:grayscale-0 transition-all duration-300"
              loading="lazy"
            />
          ) : (
            <span className="text-black group-hover:text-gold transition-colors font-semibold text-sm md:text-base whitespace-nowrap">
              {label}
            </span>
          )}
        </Link>

        {showSeparator && <span className="w-1.5 h-1.5 rotate-45 flex-shrink-0 bg-gold" />}
      </div>
    );
  };

  return (
    <section className="py-10 md:py-16 bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border-y border-gold/30 overflow-hidden">
      {/* EDGE-TO-EDGE - No jj-layer-2 wrapper */}
      <div className="container mx-auto px-0">
        <div className="mb-8 md:mb-10 px-4 md:px-8">
          <h3 className="text-center text-xl md:text-2xl lg:text-3xl font-bold uppercase tracking-[0.15em]">
            {language === "ar" ? (
              <>
                <span className="text-black">شراكة مع </span>
                <span className="text-gold">أبرز مطوري العقارات في دولة الإمارات</span>
              </>
            ) : (
              <>
                <span className="text-black">Partnering with UAE's </span>
                <span className="text-gold">Premier Developers</span>
              </>
            )}
          </h3>
        </div>

        {/* Marquee Container - Full width */}
        <div className="relative overflow-hidden">
          {/* Gradient fade edges - using champagne to blend */}
          <div className="absolute left-0 top-0 bottom-0 w-12 md:w-20 bg-gradient-to-r from-champagne to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 md:w-20 bg-gradient-to-l from-champagne to-transparent z-10 pointer-events-none" />

          {/* Scrolling content */}
          <motion.div
            ref={trackRef}
            className="flex items-center py-4 px-4"
            animate={
              loopWidth > 0
                ? { x: [0, -loopWidth] }
                : { x: 0 }
            }
            transition={{
              x: {
                // Keep speed consistent across screen sizes
                duration: loopWidth > 0 ? Math.max(22, loopWidth / 140) : 0,
                repeat: Infinity,
                ease: "linear",
              },
            }}
          >
            {/* First loop */}
            <div ref={loopRef} className="flex items-center gap-6 md:gap-10">
              {partners.map((d, idx) => renderPartner(d, idx, "a"))}
            </div>

            {/* Second loop (aria-hidden duplicate) */}
            <div aria-hidden className="flex items-center gap-6 md:gap-10">
              {partners.map((d, idx) => renderPartner(d, idx, "b"))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default DeveloperPartnersMarquee;
