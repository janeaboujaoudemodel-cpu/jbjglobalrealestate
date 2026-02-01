import { Download, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PremiumBrochureCardProps {
  projectName: string;
  brochureUrl?: string;
  onDownloadClick: () => void;
  isLocked?: boolean;
}

/**
 * Premium Brochure Card - Styled like a real brochure resting/sleeping on a table
 * with 3D hover effect that lifts off the surface
 */
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
        {/* Card Container - Horizontal brochure proportions (like A4 landscape) */}
        <div 
          className="relative w-[340px] h-[220px] rounded-lg overflow-hidden"
          style={{
            transformStyle: "preserve-3d",
            boxShadow: `
              0 25px 50px -15px rgba(0,0,0,0.5),
              0 10px 25px -8px rgba(0,0,0,0.3),
              0 4px 10px -2px rgba(0,0,0,0.2),
              inset 0 1px 0 rgba(255,255,255,0.1)
            `,
          }}
        >
          {/* Brochure Cover Background */}
          <div 
            className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900"
          />
          
          {/* Premium Gold Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-gold/10 via-transparent to-gold/5" />
          
          {/* Page edge effect - looks like stacked pages */}
          <div 
            className="absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-l from-zinc-600 to-zinc-800"
            style={{ transform: "translateZ(-2px)" }}
          />
          <div 
            className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-zinc-600 to-zinc-800"
            style={{ transform: "translateZ(-2px)" }}
          />
          
          {/* Spine shadow on left */}
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-black/40 to-transparent" />

          {/* Gold border accent */}
          <div className="absolute inset-0 border border-gold/40 rounded-lg" />
          
          {/* Top gold line accent */}
          <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />

          {/* Content Layout */}
          <div className="relative z-10 h-full flex items-center p-6">
            {/* Left side - Brand mark */}
            <div className="flex flex-col items-center justify-center w-24 border-r border-gold/30 pr-5 mr-5">
              <div className="w-14 h-14 rounded-full border-2 border-gold/60 flex items-center justify-center mb-2">
                <span className="text-gold text-lg font-bold tracking-wider">JBJ</span>
              </div>
              <p className="text-gold/70 text-[8px] uppercase tracking-[0.15em] text-center leading-tight">
                Global<br/>Real Estate
              </p>
            </div>

            {/* Right side - Brochure info */}
            <div className="flex-1 flex flex-col justify-center">
              <p className="text-gold/80 text-[9px] uppercase tracking-[0.25em] font-medium mb-2">
                Project Brochure
              </p>
              
              <h3 
                className="text-white text-xl font-semibold mb-3 line-clamp-2 leading-tight"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                {projectName}
              </h3>

              <div className="w-16 h-[2px] bg-gradient-to-r from-gold to-gold/30 mb-3" />
              
              <p className="text-white/50 text-[10px] uppercase tracking-[0.2em]">
                Dubai • UAE
              </p>
            </div>

            {/* Lock indicator for locked state */}
            {isLocked && (
              <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gold/20 border border-gold/50 flex items-center justify-center">
                <Lock className="w-4 h-4 text-gold" />
              </div>
            )}
          </div>

          {/* Glossy reflection on hover */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, transparent 100%)",
            }}
          />
        </div>

        {/* 3D Shadow beneath card - simulates resting on surface */}
        <div 
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[90%] h-6 blur-xl transition-all duration-300 group-hover:blur-2xl group-hover:h-10 group-hover:w-[80%] group-hover:-bottom-8"
          style={{
            background: "radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 50%, transparent 80%)",
          }}
        />
      </motion.div>

      {/* Download Button - Premium gold style */}
      <motion.button
        onClick={handleClick}
        className={cn(
          "flex items-center gap-3 px-10 py-4 rounded-lg font-semibold text-base transition-all duration-300",
          "bg-gold hover:bg-gold/90",
          "border border-gold/80",
          "text-black",
          "group shadow-lg"
        )}
        style={{
          boxShadow: `
            0 10px 30px rgba(200,167,102,0.4),
            0 4px 12px rgba(0,0,0,0.2),
            inset 0 1px 0 rgba(255,255,255,0.25)
          `,
        }}
        whileHover={{ 
          y: -3, 
          scale: 1.02,
          boxShadow: `
            0 16px 40px rgba(200,167,102,0.5),
            0 8px 20px rgba(0,0,0,0.25),
            inset 0 1px 0 rgba(255,255,255,0.3)
          `
        }}
        whileTap={{ scale: 0.98, y: 0 }}
      >
        {isLocked ? (
          <>
            <Lock className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Unlock Brochure
          </>
        ) : (
          <>
            <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Download Brochure
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
