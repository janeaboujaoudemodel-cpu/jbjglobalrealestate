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
      {/* Premium Brochure Card */}
      <motion.div
        className="relative cursor-pointer group"
        onClick={handleClick}
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Card Container - Rectangular A4-like proportions */}
        <div 
          className="relative w-[280px] h-[380px] rounded-2xl overflow-hidden"
          style={{
            boxShadow: `
              0 25px 50px -12px rgba(0,0,0,0.5),
              0 12px 24px -8px rgba(0,0,0,0.3),
              0 0 0 1px rgba(200,167,102,0.3),
              inset 0 1px 0 rgba(255,255,255,0.1)
            `,
          }}
        >
          {/* Dubai Skyline Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1000&auto=format&fit=crop')`,
            }}
          />
          
          {/* Premium Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-gold/5" />
          
          {/* Shimmer Effect on Hover */}
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: "linear-gradient(135deg, transparent 0%, rgba(200,167,102,0.15) 50%, transparent 100%)",
            }}
          />

          {/* Corner Accents */}
          <div className="absolute top-4 left-4 w-12 h-12">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-gold to-transparent" />
            <div className="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-gold to-transparent" />
          </div>
          <div className="absolute top-4 right-4 w-12 h-12">
            <div className="absolute top-0 right-0 w-full h-[2px] bg-gradient-to-l from-gold to-transparent" />
            <div className="absolute top-0 right-0 w-[2px] h-full bg-gradient-to-b from-gold to-transparent" />
          </div>
          <div className="absolute bottom-4 left-4 w-12 h-12">
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-gold to-transparent" />
            <div className="absolute bottom-0 left-0 w-[2px] h-full bg-gradient-to-t from-gold to-transparent" />
          </div>
          <div className="absolute bottom-4 right-4 w-12 h-12">
            <div className="absolute bottom-0 right-0 w-full h-[2px] bg-gradient-to-l from-gold to-transparent" />
            <div className="absolute bottom-0 right-0 w-[2px] h-full bg-gradient-to-t from-gold to-transparent" />
          </div>

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col items-center justify-between p-8">
            {/* Top Section - Brand */}
            <div className="text-center">
              <p className="text-gold/80 text-[10px] uppercase tracking-[0.3em] font-medium">
                JBJ Global Real Estate
              </p>
            </div>

            {/* Center Section - Brochure Title */}
            <div className="text-center flex-1 flex flex-col items-center justify-center">
              <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-gold/60 to-transparent mb-6" />
              
              <h3 
                className="text-white text-4xl font-light tracking-[0.15em] uppercase mb-3"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                BROCHURE
              </h3>
              
              <div className="w-24 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent mb-4" />
              
              <p className="text-white/70 text-sm font-light max-w-[200px] line-clamp-2">
                {projectName}
              </p>

              {/* Lock Icon for Locked State */}
              {isLocked && (
                <div className="mt-4 w-10 h-10 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-gold" />
                </div>
              )}
            </div>

            {/* Bottom Section - Dubai Skyline Text */}
            <div className="text-center">
              <p className="text-white/50 text-[9px] uppercase tracking-[0.2em]">
                Dubai • UAE
              </p>
            </div>
          </div>

          {/* Glossy Reflection */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 40%, transparent 100%)",
            }}
          />
        </div>

        {/* Shadow beneath card */}
        <div 
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 blur-xl"
          style={{
            background: "radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)",
          }}
        />
      </motion.div>

      {/* Download Button - Champagne Style */}
      <button
        onClick={handleClick}
        className={cn(
          "flex items-center gap-2.5 px-8 py-4 rounded-xl font-semibold text-sm transition-all duration-300",
          "bg-gradient-to-r from-champagne via-champagne-light to-champagne",
          "border-2 border-gold/50 hover:border-gold",
          "text-gold hover:text-gold-dark",
          "shadow-lg hover:shadow-xl hover:-translate-y-0.5",
          "group"
        )}
        style={{
          boxShadow: `
            0 8px 24px rgba(200,167,102,0.25),
            0 4px 12px rgba(0,0,0,0.15),
            inset 0 1px 0 rgba(255,255,255,0.5)
          `,
        }}
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
      </button>

      {isLocked && (
        <p className="text-muted-foreground text-xs text-center max-w-[240px]">
          Register your details to unlock the full brochure
        </p>
      )}
    </div>
  );
};

export default PremiumBrochureCard;
