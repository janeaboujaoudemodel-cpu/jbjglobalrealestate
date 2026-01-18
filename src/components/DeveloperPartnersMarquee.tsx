import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useDevelopers, useProjects } from "@/hooks/useProjects";

// Curated partners list (links become active only when inventory exists)
const CURATED_DEVELOPER_PARTNERS = [
  { name: "Emaar Properties", slug: "emaar" },
  { name: "Nakheel", slug: "nakheel" },
  { name: "Meraas", slug: "meraas" },
  { name: "DAMAC Properties", slug: "damac" },
  { name: "Sobha Realty", slug: "sobha" },
  { name: "Binghatti Developers", slug: "binghatti" },
  { name: "Omniyat", slug: "omniyat" },
  { name: "Dubai Properties", slug: "dubai-properties" },
  { name: "Ellington Properties", slug: "ellington" },
  { name: "Aldar Properties", slug: "aldar" },
  { name: "Select Group", slug: "select-group" },
  { name: "Azizi Developments", slug: "azizi" },
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

  // If we have inventory for any curated partner, only enable those links.
  const hasAnyInventory = partners.some((p) => (p.inventoryCount ?? 0) > 0);

  // Duplicate for seamless loop
  const duplicatedDevelopers = [...partners, ...partners];

  // Distance heuristic based on item count (keeps animation stable)
  const distance = Math.max(800, partners.length * 220);

  return (
    <section className="py-8 md:py-12 bg-black border-y border-zinc-800/50 overflow-hidden">
      <div className="container mx-auto px-4 mb-6">
        <p className="text-center text-zinc-500 text-xs uppercase tracking-[0.25em]">
          Partnering with UAE's Premier Developers
        </p>
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
          className="flex items-center gap-12 md:gap-16"
          animate={{
            x: [0, -distance],
          }}
          transition={{
            x: {
              duration: 40,
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
            const isClickable =
              !!developer.developerId &&
              (!hasAnyInventory || (developer.inventoryCount ?? 0) > 0);

            return (
              <div
                key={`${developer.slug}-${index}`}
                className="flex-shrink-0 flex items-center gap-3 group"
              >
                {isClickable ? (
                  <Link
                    to={`/properties?developer=${encodeURIComponent(
                      developer.developerId!
                    )}`}
                    className="text-zinc-400 text-sm md:text-base font-medium tracking-wide whitespace-nowrap hover:text-gold transition-colors duration-300 cursor-pointer"
                    title={`${developer.name}`}
                  >
                    {developer.name}
                  </Link>
                ) : (
                  <span
                    className="text-zinc-600 text-sm md:text-base font-medium tracking-wide whitespace-nowrap cursor-default"
                    title={
                      hasAnyInventory
                        ? "No published listings for this developer yet"
                        : developer.name
                    }
                  >
                    {developer.name}
                  </span>
                )}

                {/* Separator diamond */}
                {index < duplicatedDevelopers.length - 1 && (
                  <span className="w-1.5 h-1.5 bg-gold/40 rotate-45 flex-shrink-0" />
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

