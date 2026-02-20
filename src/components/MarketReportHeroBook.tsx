import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import luxuryVilla1 from "@/assets/luxury-villa-1.jpeg";
import { FounderContent } from "@/components/FounderContent";

type MarketReportHeroBookProps = {
  className?: string;
};

/**
 * Pixel-perfect reusable version of the Market Report page hero book.
 * IMPORTANT: This intentionally matches the visuals/markup used on /market-report.
 */
export default function MarketReportHeroBook({ className }: MarketReportHeroBookProps) {
  return (
    <motion.div
      className={className}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className="relative group cursor-pointer"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const rotateY = (x / rect.width - 0.5) * 24;
          const translateZ = 20;
          const scale = 1.04;

          e.currentTarget
            .querySelector<HTMLDivElement>(".book-inner")
            ?.style.setProperty(
              "transform",
              `rotateY(${rotateY}deg) rotateX(3deg) translateZ(${translateZ}px) scale(${scale})`
            );
        }}
        onMouseLeave={(e) => {
          e.currentTarget
            .querySelector<HTMLDivElement>(".book-inner")
            ?.style.setProperty("transform", "rotateY(-12deg) rotateX(5deg)");
        }}
      >
        <div
          className="book-inner relative transform-gpu transition-transform duration-500 ease-out"
          style={{ transformStyle: "preserve-3d", transform: "rotateY(-12deg) rotateX(5deg)" }}
        >
          {/* Book Cover */}
          <div
            className="relative bg-gradient-to-br from-zinc-900 via-black to-zinc-900 rounded-lg overflow-hidden shadow-2xl border border-gold/30"
            style={{
              boxShadow:
                "20px 20px 60px rgba(0,0,0,0.8), -5px -5px 20px rgba(168, 146, 90, 0.1)",
            }}
          >
            {/* Book Spine Effect */}
            <div
              className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-900 border-r border-gold/30"
              style={{
                transformStyle: "preserve-3d",
                transform: "rotateY(-90deg) translateX(-16px)",
                transformOrigin: "left center",
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="text-gold text-[9px] font-bold tracking-[0.15em] uppercase whitespace-nowrap"
                  style={{ transform: "rotate(-90deg)", textShadow: "0 0 10px rgba(200,167,102,0.5)" }}
                >
                  JBJ Global Real Estate 2026
                </span>
              </div>
            </div>

            {/* Visible Spine on Cover */}
            <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-gold/40 via-gold/20 to-transparent" />

            {/* Cover Image - Eager loading for immediate display */}
            <img
              src={luxuryVilla1}
              alt="UAE Real Estate Market Intelligence Book Cover"
              className="w-full h-52 md:h-60 object-cover opacity-60"
              loading="eager"
              fetchPriority="high"
              decoding="sync"
            />

            {/* Cover Content */}
            <div className="p-6 md:p-8 relative">
              <div className="w-16 h-1 bg-gradient-to-r from-gold to-gold-dark mb-4" />

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/30 text-gold text-[10px] uppercase tracking-[0.2em] mb-4">
                <Sparkles className="w-3 h-3" />
                Latest Edition 2026
              </div>

              <h3
                className="text-white text-xl md:text-2xl font-bold leading-tight mb-2"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                UAE Real Estate
                <span className="block text-gold">Market Intelligence</span>
              </h3>

              <FounderContent fallback={null}>
                <p className="text-zinc-500 text-xs mt-4">By Founder & CEO Jane Bou Jaoude</p>
              </FounderContent>

              <div className="mt-6 pt-4 border-t border-zinc-800">
                <p className="text-zinc-400 text-[10px] tracking-[0.3em] uppercase">JBJ Global Real Estate</p>
              </div>
            </div>

            {/* Book Pages Effect */}
            <div className="absolute right-0 top-0 bottom-0 w-3">
              <div
                className="h-full bg-gradient-to-l from-zinc-100/10 via-zinc-200/15 to-transparent"
                style={{ clipPath: "polygon(100% 0, 100% 100%, 0 95%, 0 5%)" }}
              />
              <div className="absolute right-0 top-[5%] bottom-[5%] w-[2px] bg-zinc-300/20" />
              <div className="absolute right-[3px] top-[6%] bottom-[6%] w-[1px] bg-zinc-300/15" />
              <div className="absolute right-[5px] top-[7%] bottom-[7%] w-[1px] bg-zinc-300/10" />
            </div>
          </div>

          {/* Shadow */}
          <div className="absolute -bottom-4 left-4 right-4 h-8 bg-black/60 blur-xl rounded-full transition-all duration-500 group-hover:blur-2xl group-hover:h-10" />
        </div>

        {/* Floating Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="absolute -bottom-2 -right-4 md:right-8 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] text-black border border-gold/50 px-4 py-2 rounded-full shadow-lg"
        >
          <span className="text-xs font-bold uppercase tracking-wider">Free Download</span>
        </motion.div>
      </div>
    </motion.div>
  );
}
