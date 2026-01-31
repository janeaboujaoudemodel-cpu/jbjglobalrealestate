import { Download, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PremiumBrochureCardProps {
  projectName: string;
  brochureUrl?: string;
  onDownloadClick: () => void;
  isLocked?: boolean;
}

const PremiumBrochureCard = ({
  projectName,
  brochureUrl,
  onDownloadClick,
  isLocked = false,
}: PremiumBrochureCardProps) => {
  const handleClick = () => {
    if (!isLocked && brochureUrl) {
      window.open(brochureUrl, "_blank");
    } else {
      onDownloadClick();
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Premium Brochure Card - Rectangular Style */}
      <motion.div
        className="relative cursor-pointer group"
        onClick={handleClick}
        whileHover={{ y: -12, scale: 1.05, rotateX: 5, rotateY: 3 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        style={{ perspective: 1000 }}
      >
        {/* Card Container - Premium Rectangular A4 proportions */}
        <div 
          className="relative w-[280px] h-[380px] rounded-2xl overflow-hidden border-2 border-gold/60"
          style={{
            boxShadow: `
              0 30px 60px -15px rgba(0,0,0,0.6),
              0 15px 30px -10px rgba(0,0,0,0.4),
              0 0 0 1px rgba(200,167,102,0.5),
              inset 0 1px 0 rgba(255,255,255,0.15)
            `,
          }}
        >
          {/* Dubai Skyline Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1000&auto=format&fit=crop')`,
            }}
          />
          
          {/* Premium Dark Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-br from-gold/15 via-transparent to-gold/10" />
          
          {/* Shimmer Effect - Hidden on normal, visible on hover */}
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: "linear-gradient(135deg, transparent 0%, rgba(200,167,102,0.25) 50%, transparent 100%)",
            }}
          />

          {/* Corner Accents - Gold Premium - Fully visible */}
          <div className="absolute top-4 left-4 w-12 h-12">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-gold to-transparent" />
            <div className="absolute top-0 left-0 w-[3px] h-full bg-gradient-to-b from-gold to-transparent" />
          </div>
          <div className="absolute top-4 right-4 w-12 h-12">
            <div className="absolute top-0 right-0 w-full h-[3px] bg-gradient-to-l from-gold to-transparent" />
            <div className="absolute top-0 right-0 w-[3px] h-full bg-gradient-to-b from-gold to-transparent" />
          </div>
          <div className="absolute bottom-4 left-4 w-12 h-12">
            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-gold to-transparent" />
            <div className="absolute bottom-0 left-0 w-[3px] h-full bg-gradient-to-t from-gold to-transparent" />
          </div>
          <div className="absolute bottom-4 right-4 w-12 h-12">
            <div className="absolute bottom-0 right-0 w-full h-[3px] bg-gradient-to-l from-gold to-transparent" />
            <div className="absolute bottom-0 right-0 w-[3px] h-full bg-gradient-to-t from-gold to-transparent" />
          </div>

          {/* Content - Fully visible on normal load */}
          <div className="relative z-10 h-full flex flex-col items-center justify-between p-8">
            {/* Top Section - Brand */}
            <div className="text-center">
              <p className="text-gold text-[11px] uppercase tracking-[0.3em] font-semibold">
                JBJ Global Real Estate
              </p>
            </div>

            {/* Center Section - Brochure Title & Project Name */}
            <div className="text-center flex-1 flex flex-col items-center justify-center">
              <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent mb-6" />
              
              <h3 
                className="text-white text-4xl font-light tracking-[0.15em] uppercase mb-3"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                BROCHURE
              </h3>
              
              <div className="w-28 h-[3px] bg-gradient-to-r from-transparent via-gold to-transparent mb-4" />
              
              {/* Project Name - Prominently displayed */}
              <p 
                className="text-gold text-xl font-bold max-w-[220px] line-clamp-2 text-center tracking-wide"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                {projectName}
              </p>

              {/* Lock Icon for Locked State */}
              {isLocked && (
                <div className="mt-4 w-12 h-12 rounded-full bg-gold/30 border-2 border-gold flex items-center justify-center">
                  <Lock className="w-6 h-6 text-gold" />
                </div>
              )}
            </div>

            {/* Bottom Section - Dubai Skyline Text */}
            <div className="text-center">
              <p className="text-white/70 text-[10px] uppercase tracking-[0.25em] font-medium">
                Dubai • UAE
              </p>
            </div>
          </div>

          {/* Glossy Reflection - Visible on hover for 3D pop effect */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 40%, transparent 100%)",
            }}
          />
        </div>

        {/* 3D Shadow beneath card - Enhanced on hover */}
        <div 
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[85%] h-10 blur-2xl transition-all duration-300 group-hover:blur-3xl group-hover:h-14 group-hover:w-[95%]"
          style={{
            background: "radial-gradient(ellipse, rgba(200,167,102,0.4) 0%, rgba(0,0,0,0.5) 40%, transparent 70%)",
          }}
        />
      </motion.div>

      {/* Download Button - Primary CTA Style */}
      <motion.button
        onClick={handleClick}
        className={cn(
          "flex items-center gap-3 px-12 py-5 rounded-xl font-bold text-lg transition-all duration-300",
          "bg-gold hover:bg-gold/90",
          "border-2 border-gold",
          "text-black",
          "group shadow-xl"
        )}
        style={{
          boxShadow: `
            0 15px 40px rgba(200,167,102,0.5),
            0 8px 20px rgba(0,0,0,0.25),
            inset 0 2px 0 rgba(255,255,255,0.3)
          `,
        }}
        whileHover={{ 
          y: -5, 
          scale: 1.02,
          boxShadow: `
            0 22px 55px rgba(200,167,102,0.6),
            0 12px 30px rgba(0,0,0,0.3),
            inset 0 2px 0 rgba(255,255,255,0.4)
          `
        }}
        whileTap={{ scale: 0.98, y: 0 }}
      >
        {isLocked ? (
          <>
            <Lock className="w-6 h-6 group-hover:scale-110 transition-transform" />
            Unlock Brochure
          </>
        ) : (
          <>
            <Download className="w-6 h-6 group-hover:scale-110 transition-transform" />
            Download Brochure
          </>
        )}
      </motion.button>

      {isLocked && (
        <p className="text-muted-foreground text-xs text-center max-w-[240px]">
          Request brochure access
        </p>
      )}
    </div>
  );
};

export default PremiumBrochureCard;
