import * as React from "react";
import { Download, Lock, Loader2, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import jbjFullLogoDarkBg from "@/assets/jbj-fulllogo-dark-bg.jpg";

const BROCHURE_BG_URL = "https://imgengine.khaleejtimes.com/khaleejtimes-english/2026-02-04/lvnx1x0g/Dubai.jpg?width=1200&height=800&format=auto";
import { maybeProxyStorageUrl } from "@/utils/downloadProxy";
interface PremiumBrochureCardProps {
  projectName: string;
  brochureUrl?: string;
  projectImageUrl?: string;
  onDownloadClick: () => void;
  isLocked?: boolean;
  location?: string;
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
  location,
}: PremiumBrochureCardProps) => {
  const [isDownloading, setIsDownloading] = React.useState(false);

  // Fetch and download as blob to bypass ad-blocker blocking Supabase URLs
  const handleBlobDownload = async () => {
    if (!brochureUrl) {
      onDownloadClick();
      return;
    }
    
    setIsDownloading(true);
    try {
      const safeUrl = maybeProxyStorageUrl(
        brochureUrl,
        `${projectName.replace(/\s+/g, "-")}-Brochure.pdf`,
      );
      const response = await fetch(safeUrl);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${projectName.replace(/\s+/g, '-')}-Brochure.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.warn('Blob download failed, trying direct open:', error);
      // Fallback to window.open
      window.open(maybeProxyStorageUrl(brochureUrl), '_blank');
    } finally {
      setIsDownloading(false);
    }
  };
  const handleClick = () => {
    if (!isLocked && brochureUrl) {
      handleBlobDownload();
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
            background: "linear-gradient(135deg, #ECE2D2 0%, #D8C7A6 100%)",
            boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
          }}
        />
        <div 
          className="absolute w-[380px] h-[260px] rounded-lg"
          style={{
            transform: "translateZ(-4px) translateX(3px) translateY(3px)",
            background: "linear-gradient(135deg, #F7F1E6 0%, #ECE2D2 100%)",
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
          {/* Dynamic project image background */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${projectImageUrl || BROCHURE_BG_URL})` }}
          />
          
          {/* Lighter overlays — keep photo visible; readability comes from text panels */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />

          {/* Premium Gold Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-gold/10 via-transparent to-gold/5" />

          {/* Spine effect on left - book binding */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/55 via-black/25 to-transparent" />
          <div className="absolute left-2 top-4 bottom-4 w-[2px] bg-[#EFE6D6]/40 rounded-full" />

          {/* Gold border accent */}
          <div className="absolute inset-0 border-2 border-[#B89555]/50 rounded-lg group-hover:border-[#B89555]/80 transition-colors" />

          {/* Top gold line accent */}
          <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />

          {/* Content Layout */}
          <div className="relative z-10 h-full flex flex-col justify-end p-6">
            {/* Top: Brand mark — refined monogram + wordmark, no rectangular plate */}
            <div className="absolute top-5 left-10 flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden shrink-0"
                style={{
                  background: "radial-gradient(circle at 30% 30%, #FDFBF7 0%, #F7F2EA 55%, #EFE6D6 100%)",
                  border: "1px solid rgba(184,149,85,0.65)",
                  boxShadow:
                    "0 6px 14px rgba(0,0,0,0.28), inset 0 0 0 1px rgba(255,255,255,0.18)",
                }}
              >
                <img
                  src={jbjFullLogoDarkBg}
                  alt="JBJ"
                  className="w-full h-full object-cover"
                  style={{ transform: "scale(1.18)" }}
                />
              </div>
              <p
                className="text-white text-[11px] font-semibold uppercase tracking-[0.22em] leading-none whitespace-nowrap"
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.55), 0 0 14px rgba(0,0,0,0.35)" }}
              >
                <span style={{ color: "#E8C77A" }} className="font-bold">JBJ</span>{" "}
                <span className="font-light tracking-[0.26em]">Global Real Estate</span>
              </p>
            </div>

            {/* Bottom: Brochure info — on a deep navy readability panel */}
            <div
              className="mt-auto -mx-2 px-4 py-4 rounded-lg"
              style={{
                background: "linear-gradient(180deg, rgba(8,18,40,0) 0%, rgba(8,18,40,0.55) 35%, rgba(8,18,40,0.85) 100%)",
                backdropFilter: "blur(3px)",
              }}
            >
              <p className="text-[#E8C77A] text-[10px] uppercase tracking-[0.32em] font-bold mb-2">
                Project Brochure
              </p>

              <h3 className="text-white text-2xl font-semibold mb-3 line-clamp-2 leading-tight">
                {projectName}
              </h3>

              <div className="w-20 h-[2px] bg-gradient-to-r from-[#B89555] to-[#B89555]/20 mb-3" />

              <p className="text-white/95 text-[11px] uppercase tracking-[0.2em] font-medium">
                {location || 'Dubai • UAE'}
              </p>
            </div>

            {/* Premium 3D gold lock indicator */}
            {isLocked && (
              <div
                className="absolute top-4 right-4 w-11 h-11 rounded-full flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #F7ECD0 0%, #E8C77A 45%, #B89555 100%)",
                  boxShadow:
                    "0 10px 24px rgba(0,0,0,0.45), 0 4px 8px rgba(184,149,85,0.5), inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -2px 4px rgba(120,90,30,0.4)",
                  border: "1px solid rgba(120,90,30,0.55)",
                }}
                aria-hidden="true"
              >
                <Lock
                  className="w-5 h-5"
                  strokeWidth={2.5}
                  style={{ color: "#3A2A0E", filter: "drop-shadow(0 1px 0 rgba(255,255,255,0.55))" }}
                />
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
          "hover:shadow-[0_14px_45px_rgba(200,167,102,0.35)] hover:border-[#B89555]/80",
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
            <Lock className="w-5 h-5 text-foreground group-hover:text-[#1A1A1A] group-hover:scale-110 transition-all" />
            <span className="group-hover:text-[#1A1A1A] transition-colors">Unlock Brochure</span>
          </>
        ) : isDownloading ? (
          <>
            <Loader2 className="w-5 h-5 text-foreground animate-spin" />
            <span>Downloading...</span>
          </>
        ) : !brochureUrl ? (
          <>
            <FileText className="w-5 h-5 text-foreground group-hover:text-[#1A1A1A] group-hover:scale-110 transition-all" />
            <span className="group-hover:text-[#1A1A1A] transition-colors">Request Brochure</span>
          </>
        ) : (
          <>
            <Download className="w-5 h-5 text-foreground group-hover:text-[#1A1A1A] group-hover:scale-110 transition-all" />
            <span className="group-hover:text-[#1A1A1A] transition-colors">Download Brochure</span>
          </>
        )}
      </motion.button>

      {(isLocked || !brochureUrl) && (
        <p className="text-muted-foreground text-xs text-center max-w-[220px]">
          {brochureUrl ? "Request brochure access" : "Register your interest to receive the brochure"}
        </p>
      )}
    </div>
  );
};

export default PremiumBrochureCard;
