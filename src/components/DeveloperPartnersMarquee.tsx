import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useDevelopers, useProjects } from "@/hooks/useProjects";

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

const DeveloperPartnersMarquee = () => {
  const [isPaused, setIsPaused] = useState(false);
  const { data: developers } = useDevelopers();
  const { data: projects } = useProjects();

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

  // Duplicate for seamless loop
  const duplicatedDevelopers = [...partners, ...partners];

  // Distance heuristic based on item count (keeps animation stable)
  const distance = Math.max(1200, partners.length * 180);

  return (
    <section className="py-10 md:py-16 bg-black border-y border-zinc-800/50 overflow-hidden">
      <div className="container mx-auto px-4 mb-8 md:mb-10">
        <h3 
          className="text-center text-xl md:text-2xl lg:text-3xl font-bold uppercase tracking-[0.15em]"
          style={{
            filter: 'drop-shadow(0 0 15px rgba(255,255,255,0.3)) drop-shadow(0 0 25px rgba(200,167,102,0.25))',
          }}
        >
          <span className="bg-gradient-to-r from-white via-[#FDFBF7] to-white bg-clip-text text-transparent">
            Partnering with UAE's{" "}
          </span>
          <span className="bg-gradient-to-r from-[#C9B896] via-[#E8DCC8] to-[#D4C4A8] bg-clip-text text-transparent" style={{ filter: 'drop-shadow(0 0 8px rgba(201, 184, 150, 0.3))' }}>
            Premier Developers
          </span>
        </h3>
      </div>

      {/* Marquee Container */}
      <div
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Gradient fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

        {/* Scrolling content */}
        <motion.div
          className="flex items-center gap-8 md:gap-12 py-4"
          animate={{
            x: [0, -distance],
          }}
          transition={{
            x: {
              duration: 50,
              repeat: Infinity,
              ease: "linear",
            },
          }}
          style={{
            animationPlayState: isPaused ? "paused" : "running",
          }}
          {...(isPaused && { animate: undefined })}
        >
          {duplicatedDevelopers.map((developer, index) => {
            return (
              <div
                key={`${developer.slug}-${index}`}
                className="flex-shrink-0 flex items-center gap-4 group"
              >
                {/* Developer Label - REVERSED: Black text on gold bg on normal, gold text on normal bg on hover */}
                <Link
                  to={`/properties?developer=${encodeURIComponent(
                    developer.developerId ?? developer.slug
                  )}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-black border-2 border-gold rounded-lg transition-all duration-300 hover:scale-105 hover:bg-gradient-to-r hover:from-white hover:via-[#FDFBF7] hover:to-[#F5F0E6] hover:border-black hover:shadow-[0_8px_25px_rgba(200,167,102,0.5)] shadow-[0_4px_15px_rgba(200,167,102,0.3)]"
                  style={{
                    boxShadow: `
                      0 4px 15px rgba(200,167,102,0.3),
                      0 0 20px rgba(200,167,102,0.2)
                    `,
                  }}
                  title={developer.name}
                >
                  <span className="text-white group-hover:text-gold transition-colors font-semibold text-sm md:text-base whitespace-nowrap">
                    {developer.name.split(' ')[0]}
                  </span>
                  <span className="text-gold group-hover:text-black transition-colors font-semibold text-sm md:text-base whitespace-nowrap">
                    {developer.name.split(' ').slice(1).join(' ') || ''}
                  </span>
                </Link>

                {/* Separator diamond - half gold, half white with glow */}
                {index < duplicatedDevelopers.length - 1 && (
                  <span 
                    className="w-2 h-2 rotate-45 flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #D4AF37 50%, #FFFFFF 50%)',
                      boxShadow: '0 0 8px rgba(255,255,255,0.6), 0 0 12px rgba(200,167,102,0.8)',
                    }}
                  />
                )}
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default DeveloperPartnersMarquee;
