import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import luxuryVilla1 from "@/assets/luxury-villa-1.jpeg";
import { FounderContent } from "@/components/FounderContent";

type MarketReportHeroBookProps = {
  className?: string;
};

/**
 * Pixel-perfect reusable version of the Market Report page hero book.
 * Champagne / Pearl / Gold luxury theme — matches the surrounding section palette.
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
          {/* Book Cover — champagne/pearl/gold */}
          <div
            className="relative bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#D4C4A8] rounded-lg overflow-hidden shadow-2xl border-2 border-gold/60"
            style={{
              boxShadow:
                "20px 20px 60px rgba(0,0,0,0.4), -5px -5px 20px rgba(200,167,102,0.3)",
            }}
          >
            {/* Gold Spine — rich warm gold on the left edge */}
            <div
              className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#C8A766] via-[#E8DCC8] to-transparent border-r border-gold/40"
              style={{
                transformStyle: "preserve-3d",
                transform: "rotateY(-90deg) translateX(-16px)",
                transformOrigin: "left center",
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="text-black text-[9px] font-bold tracking-[0.15em] uppercase whitespace-nowrap"
                  style={{ transform: "rotate(-90deg)" }}
                >
                  JBJ Global Real Estate 2026
                </span>
              </div>
            </div>

            {/* Visible Spine Strip on Cover */}
            <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#C8A766]/60 via-[#E8DCC8]/30 to-transparent" />

            {/* Cover Image — lighter opacity on light background */}
            <img
              src={luxuryVilla1}
              alt="UAE Real Estate Market Intelligence Book Cover"
              className="w-full h-48 md:h-56 object-cover opacity-40"
              loading="eager"
              fetchPriority="high"
            />

            {/* Cover Content */}
            <div className="p-6 md:p-8 relative">
              <div className="w-16 h-1 bg-gradient-to-r from-gold to-gold-dark mb-4" />

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/20 border border-gold/50 text-black text-[10px] uppercase tracking-[0.2em] mb-4">
                <Sparkles className="w-3 h-3 text-gold" />
                Latest Edition 2026
              </div>

              <h3
                className="text-black text-xl md:text-2xl font-bold leading-tight mb-2"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                UAE Real Estate
                <span className="block text-gold">Market Intelligence</span>
              </h3>

              <FounderContent fallback={null}>
                <p className="text-zinc-600 text-xs mt-4">By Founder & CEO Jane Bou Jaoude</p>
              </FounderContent>

              <div className="mt-6 pt-4 border-t border-gold/30">
                <p className="text-zinc-600 text-[10px] tracking-[0.3em] uppercase">JBJ Global Real Estate</p>
              </div>
            </div>

            {/* Champagne Page Edges — warm, not cold zinc */}
            <div className="absolute right-0 top-0 bottom-0 w-3">
              <div
                className="h-full bg-gradient-to-l from-[#F5EBD7]/30 via-[#E8DCC8]/20 to-transparent"
                style={{ clipPath: "polygon(100% 0, 100% 100%, 0 95%, 0 5%)" }}
              />
              <div className="absolute right-0 top-[5%] bottom-[5%] w-[2px] bg-[#C8A766]/20" />
              <div className="absolute right-[3px] top-[6%] bottom-[6%] w-[1px] bg-[#C8A766]/15" />
              <div className="absolute right-[5px] top-[7%] bottom-[7%] w-[1px] bg-[#C8A766]/10" />
            </div>
          </div>

          {/* Shadow */}
          <div className="absolute -bottom-4 left-4 right-4 h-8 bg-black/40 blur-xl rounded-full transition-all duration-500 group-hover:blur-2xl group-hover:h-10" />
        </div>

        {/* Floating Badge — already champagne, keep as-is */}
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
