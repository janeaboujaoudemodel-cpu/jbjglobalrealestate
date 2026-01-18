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
    <section className="py-8 md:py-12 bg-black border-y border-zinc-800/50 overflow-hidden">
      <div className="container mx-auto px-4 mb-8">
        <h3 className="text-center text-lg md:text-xl font-semibold uppercase tracking-[0.3em] bg-gradient-to-r from-[#F5F0E6] via-white to-[#F5F0E6] bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
          Partnering with UAE's Premier Developers
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
          className="flex items-center gap-10 md:gap-14"
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
            const isClickable = !!developer.developerId;
            return (
              <div
                key={`${developer.slug}-${index}`}
                className="flex-shrink-0 flex items-center gap-3 group"
              >
                <Link
                  to={
                    developer.developerId
                      ? `/properties?developer=${encodeURIComponent(developer.developerId)}`
                      : "/properties"
                  }
                  className={
                    developer.developerId
                      ? "text-gold text-sm md:text-base font-semibold tracking-wide whitespace-nowrap transition-all duration-300 cursor-pointer drop-shadow-[0_0_8px_rgba(200,167,102,0.6)] hover:text-white hover:drop-shadow-[0_0_20px_rgba(255,255,255,0.9)]"
                      : "text-gold/70 text-sm md:text-base font-semibold tracking-wide whitespace-nowrap transition-all duration-300 cursor-pointer drop-shadow-[0_0_6px_rgba(200,167,102,0.4)] hover:text-white hover:drop-shadow-[0_0_20px_rgba(255,255,255,0.9)]"
                  }
                  title={developer.name}
                  style={{ textShadow: developer.developerId ? '0 0 12px rgba(200,167,102,0.5)' : '0 0 8px rgba(200,167,102,0.3)' }}
                >
                  {developer.name}
                </Link>

                {/* Separator diamond - glowing */}
                {index < duplicatedDevelopers.length - 1 && (
                  <span className="w-1.5 h-1.5 bg-gold rotate-45 flex-shrink-0 shadow-[0_0_8px_rgba(200,167,102,0.8)]" />
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

