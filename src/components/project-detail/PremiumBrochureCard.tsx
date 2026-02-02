import { Download, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PremiumBrochureCardProps {
  projectName: string;
  brochureUrl?: string;
  projectImageUrl?: string;
  onDownloadClick: () => void;
  isLocked?: boolean;
}

/**
 * Premium Brochure Card - Styled like a real brochure/book resting on a table
 * with project photo as cover, 3D hover effect that lifts off the surface
 * Shows layered pages underneath for book effect
 */
const PremiumBrochureCard = ({
  projectName,
  brochureUrl,
  projectImageUrl,
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
      {/* Premium Brochure Card - Horizontal "sleeping" on table style */}
      <motion.div
        className="relative cursor-pointer group"
        onClick={handleClick}
        initial={{ rotateX: 8, rotateY: 0, y: 0 }}
        whileHover={{ 
          rotateX: 0, 
          rotateY: -5, 
          y: -20, 
          scale: 1.02,
          transition: { type: "spring", stiffness: 200, damping: 15 }
        }}
        whileTap={{ scale: 0.98, y: -10 }}
        style={{ 
          perspective: "1200px",
          transformStyle: "preserve-3d"
        }}
      >
        {/* Stacked Pages Effect - visible underneath the main cover */}
        <div 
          className="absolute w-[380px] h-[260px] rounded-lg"
          style={{
            transform: "translateZ(-8px) translateX(6px) translateY(6px)",
            background: "linear-gradient(135deg, #E8DCC8 0%, #D4C4A8 100%)",
            boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
          }}
        />
        <div 
          className="absolute w-[380px] h-[260px] rounded-lg"
          style={{
            transform: "translateZ(-4px) translateX(3px) translateY(3px)",
            background: "linear-gradient(135deg, #F5EBD7 0%, #E8DCC8 100%)",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        />

        {/* Main Card Container - Larger brochure with project image */}
        <div 
          className="relative w-[380px] h-[260px] rounded-lg overflow-hidden"
          style={{
            transformStyle: "preserve-3d",
            boxShadow: `
              0 30px 60px -15px rgba(0,0,0,0.5),
              0 15px 35px -10px rgba(0,0,0,0.35),
              0 5px 15px -5px rgba(0,0,0,0.25),
              inset 0 1px 0 rgba(255,255,255,0.1)
            `,
          }}
        >
          {/* Project Image as Cover Background */}
          {projectImageUrl ? (
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${projectImageUrl})` }}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900" />
          )}
          
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
          
          {/* Premium Gold Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-gold/15 via-transparent to-gold/5" />
          
          {/* Spine effect on left - book binding */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
          <div className="absolute left-2 top-4 bottom-4 w-[2px] bg-gold/40 rounded-full" />

          {/* Gold border accent */}
          <div className="absolute inset-0 border-2 border-gold/50 rounded-lg group-hover:border-gold/80 transition-colors" />
          
          {/* Top gold line accent */}
          <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />

          {/* Content Layout */}
          <div className="relative z-10 h-full flex flex-col justify-end p-6">
            {/* Top: Brand mark */}
            <div className="absolute top-4 left-10 flex items-center gap-2">
              <div className="w-10 h-10 rounded-full border-2 border-gold/70 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <span className="text-gold text-xs font-bold tracking-wider">JBJ</span>
              </div>
              <p className="text-gold/90 text-[8px] uppercase tracking-[0.15em] leading-tight">
                Global<br/>Real Estate
              </p>
            </div>

            {/* Bottom: Brochure info */}
            <div className="mt-auto">
              <p className="text-gold text-xs uppercase tracking-[0.25em] font-bold mb-2 drop-shadow-lg">
                Project Brochure
              </p>
              
              <h3
                className="text-white text-2xl font-bold mb-3 line-clamp-2 leading-tight drop-shadow-lg"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                {projectName}
              </h3>

              <div className="w-20 h-[2px] bg-gradient-to-r from-gold to-gold/30 mb-3" />
              
              <p className="text-white/70 text-[11px] uppercase tracking-[0.2em] drop-shadow">
                Dubai • UAE
              </p>
            </div>

            {/* Lock indicator for locked state */}
            {isLocked && (
              <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 border-2 border-gold/60 flex items-center justify-center backdrop-blur-sm">
                <Lock className="w-5 h-5 text-gold" />
              </div>
            )}
          </div>

          {/* Glossy reflection on hover */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 40%, transparent 100%)",
            }}
          />
        </div>

        {/* 3D Shadow beneath card - simulates resting on surface */}
        <div 
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[85%] h-8 blur-2xl transition-all duration-300 group-hover:blur-3xl group-hover:h-12 group-hover:w-[75%] group-hover:-bottom-10"
          style={{
            background: "radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.25) 50%, transparent 80%)",
          }}
        />
      </motion.div>

      {/* Download Button - Premium champagne style with visible hover */}
      <motion.button
        onClick={handleClick}
        className={cn(
          "flex items-center gap-3 px-10 py-4 rounded-lg font-semibold text-base transition-all duration-300",
          // Premium champagne gradient background
          "bg-gradient-to-r from-champagne via-champagne-light to-champagne",
          "text-foreground border-2 border-foreground/70",
          "shadow-[0_10px_30px_rgba(200,167,102,0.25),0_6px_15px_rgba(0,0,0,0.22)]",
          "hover:shadow-[0_14px_45px_rgba(200,167,102,0.35)] hover:border-gold/80",
          "group"
        )}
        whileHover={{ 
          y: -3, 
          scale: 1.02,
        }}
        whileTap={{ scale: 0.98, y: 0 }}
      >
        {isLocked ? (
          <>
            <Lock className="w-5 h-5 text-foreground group-hover:text-gold group-hover:scale-110 transition-all" />
            <span className="group-hover:text-gold transition-colors">Unlock Brochure</span>
          </>
        ) : (
          <>
            <Download className="w-5 h-5 text-foreground group-hover:text-gold group-hover:scale-110 transition-all" />
            <span className="group-hover:text-gold transition-colors">Download Brochure</span>
          </>
        )}
      </motion.button>

      {isLocked && (
        <p className="text-muted-foreground text-xs text-center max-w-[220px]">
          Request brochure access
        </p>
      )}
    </div>
  );
};

export default PremiumBrochureCard;
