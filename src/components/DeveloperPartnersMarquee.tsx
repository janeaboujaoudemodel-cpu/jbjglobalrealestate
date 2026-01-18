import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

// Top UAE developers ordered by premium status
const DEVELOPER_PARTNERS = [
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
  
  // Duplicate for seamless loop
  const duplicatedDevelopers = [...DEVELOPER_PARTNERS, ...DEVELOPER_PARTNERS];

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
            x: [0, -50 * DEVELOPER_PARTNERS.length * 4],
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
          {duplicatedDevelopers.map((developer, index) => (
            <div
              key={`${developer.slug}-${index}`}
              className="flex-shrink-0 flex items-center gap-3 group"
            >
              {/* Developer name with premium styling - clickable */}
              <Link 
                to={`/properties?developer=${encodeURIComponent(developer.slug)}`}
                className="text-zinc-400 text-sm md:text-base font-medium tracking-wide whitespace-nowrap hover:text-gold transition-colors duration-300 cursor-pointer"
              >
                {developer.name}
              </Link>
              
              {/* Separator diamond */}
              {index < duplicatedDevelopers.length - 1 && (
                <span className="w-1.5 h-1.5 bg-gold/40 rotate-45 flex-shrink-0" />
              )}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default DeveloperPartnersMarquee;
