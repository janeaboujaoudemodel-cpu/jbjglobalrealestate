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
      {/* Champagne Layer */}
      <div className="mx-4 md:mx-8 lg:mx-16 py-8 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] rounded-2xl border border-gold/30 shadow-lg">
        <div className="mb-8 md:mb-10">
          <h3 className="text-center text-xl md:text-2xl lg:text-3xl font-bold uppercase tracking-[0.15em]">
            <span className="text-black">Partnering with UAE's </span>
            <span className="text-gold">Premier Developers</span>
          </h3>
        </div>

        {/* Marquee Container */}
        <div
          className="relative overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Gradient fade edges - using champagne to blend */}
          <div className="absolute left-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-r from-[#E8DCC8] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-l from-[#E8DCC8] to-transparent z-10 pointer-events-none" />

          {/* Scrolling content */}
          <motion.div
            className="flex items-center gap-6 md:gap-10 py-4 px-4"
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
                  {/* Developer Label - Transparent bg with gold border, 3D effect on hover */}
                  <Link
                    to={`/properties?developer=${encodeURIComponent(
                      developer.developerId ?? developer.slug
                    )}`}
                    className="inline-flex items-center gap-1 px-4 py-2.5 bg-transparent border-2 border-gold/50 rounded-lg transition-all duration-300 hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] group"
                    title={developer.name}
                  >
                    {/* Normal: First half black, second half gold. Hover: Invert */}
                    <span className="text-black group-hover:text-gold transition-colors font-semibold text-sm md:text-base whitespace-nowrap">
                      {developer.name.split(' ')[0]}
                    </span>
                    {developer.name.split(' ').slice(1).join(' ') && (
                      <span className="text-gold group-hover:text-black transition-colors font-semibold text-sm md:text-base whitespace-nowrap">
                        {developer.name.split(' ').slice(1).join(' ')}
                      </span>
                    )}
                  </Link>

                  {/* Separator diamond */}
                  {index < duplicatedDevelopers.length - 1 && (
                    <span className="w-2 h-2 rotate-45 flex-shrink-0 bg-gold" />
                  )}
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default DeveloperPartnersMarquee;
