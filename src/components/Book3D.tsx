import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import marketReportCover from "@/assets/ceo/jane-founder-premium-landscape.png";
import luxuryVilla1 from "@/assets/luxury-villa-1.jpeg";
import { FounderContent } from "@/components/FounderContent";
import { useFounderVisibility } from "@/contexts/FounderVisibilityContext";

interface Book3DProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const Book3D = ({ size = "md", className = "" }: Book3DProps) => {
  const [hoverSide, setHoverSide] = useState<"left" | "right" | null>(null);
  const { isFounderVisible } = useFounderVisibility();

  // When founder visibility is disabled, never show founder portrait covers
  const coverImage = isFounderVisible ? marketReportCover : luxuryVilla1;
  
  // Enhanced dimensions with EXTRA THICK spine to display full company name
  const dimensions = {
    sm: { width: 180, height: 250, spine: 65, fontSize: "text-[10px]", titleSize: "text-sm" },
    md: { width: 240, height: 330, spine: 85, fontSize: "text-xs", titleSize: "text-base" },
    lg: { width: 320, height: 440, spine: 110, fontSize: "text-sm", titleSize: "text-lg" },
  };

  const { width, height, spine, fontSize, titleSize } = dimensions[size];
  const pageThickness = Math.max(30, spine - 15);

  // Calculate rotation based on which side is hovered
  // LEFT hover = flip to show RIGHT side (negative rotation)
  // RIGHT hover = flip to show LEFT side (positive rotation)
  const getRotation = () => {
    if (hoverSide === "left") return -70; // Hover left → flip left to show right
    if (hoverSide === "right") return 70; // Hover right → flip right to show left
    return 0; // Neutral position - flat facing viewer
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const midpoint = rect.width / 2;
    
    if (x < midpoint) {
      setHoverSide("left");
    } else {
      setHoverSide("right");
    }
  };

  const handleMouseLeave = () => {
    setHoverSide(null);
  };

  return (
    <div
      className={cn("relative cursor-pointer", className)}
      style={{ 
        width: width + spine + 40, 
        height: height + 40,
        perspective: "1500px",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="relative"
        style={{
          width: width + spine,
          height: height,
          transformStyle: "preserve-3d",
          transformOrigin: "center center",
        }}
        initial={{ rotateY: 0 }}
        animate={{ 
          rotateY: getRotation(),
          scale: hoverSide ? 1.08 : 1,
        }}
        transition={{
          type: "spring",
          stiffness: 80,
          damping: 12,
          mass: 1.2,
        }}
        whileTap={{
          rotateY: 180,
          scale: 1.02,
          transition: { duration: 0.8, ease: "easeOut" }
        }}
      >
        {/* Book shadow - enhanced for depth */}
        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 transition-all duration-500"
          style={{
            width: width * 0.9,
            height: hoverSide ? 35 : 28,
            background: "radial-gradient(ellipse, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)",
            filter: hoverSide ? "blur(18px)" : "blur(12px)",
            transform: `translateZ(-${spine * 2}px) translateY(20px)`,
          }}
        />

        {/* Book spine - The thick edge - NOW MUCH THICKER */}
        <div
          className="absolute top-0 h-full"
          style={{
            width: spine,
            left: 0,
            background: "linear-gradient(90deg, #1a1a1a 0%, #2d2d2d 20%, #3a3a3a 50%, #2d2d2d 80%, #1a1a1a 100%)",
            transform: `rotateY(-90deg) translateZ(${width / 2}px) translateX(-${spine / 2}px)`,
            transformOrigin: "center center",
            boxShadow: "inset -4px 0 15px rgba(0,0,0,0.5), inset 4px 0 8px rgba(200,167,102,0.15)",
            borderTop: "1px solid rgba(200,167,102,0.3)",
            borderBottom: "1px solid rgba(200,167,102,0.3)",
          }}
        >
          {/* Spine Text - Vertical - Extra readable on thicker spine */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span 
              className="text-gold font-bold tracking-[0.35em] uppercase whitespace-nowrap"
              style={{ 
                writingMode: "vertical-rl", 
                textOrientation: "mixed",
                transform: "rotate(180deg)",
                fontSize: size === "sm" ? "11px" : size === "md" ? "14px" : "18px",
                textShadow: "0 0 20px rgba(200,167,102,0.7), 0 2px 6px rgba(0,0,0,0.6)",
                letterSpacing: "0.4em",
              }}
            >
              JBJ GLOBAL REAL ESTATE 2026
            </span>
          </div>
        </div>

        {/* Book front cover - Premium dark design */}
        <div
          className="absolute top-0 w-full h-full rounded-r-md overflow-hidden"
          style={{
            left: spine,
            width: width,
            backgroundImage: `linear-gradient(145deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.78) 60%, rgba(0,0,0,0.6) 100%), url(${coverImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center 20%",
            backgroundRepeat: "no-repeat",
            border: "1px solid rgba(168, 146, 90, 0.5)",
            transform: `translateZ(${spine / 2}px)`,
            boxShadow: `
              8px 8px 30px rgba(0,0,0,0.5),
              inset 0 0 60px rgba(168, 146, 90, 0.08),
              inset 0 1px 0 rgba(255,255,255,0.05)
            `,
          }}
        >
          {/* Subtle gold gradient overlay */}
          <div 
            className="absolute inset-0"
            style={{
              background: "linear-gradient(180deg, rgba(168,146,90,0.1) 0%, transparent 30%, transparent 70%, rgba(168,146,90,0.08) 100%)",
            }}
          />

          {/* Decorative gold corner accents */}
          <div className="absolute top-3 left-3 w-10 h-10">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-gold/70 to-transparent" />
            <div className="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-gold/70 to-transparent" />
          </div>
          <div className="absolute top-3 right-3 w-10 h-10">
            <div className="absolute top-0 right-0 w-full h-[2px] bg-gradient-to-l from-gold/70 to-transparent" />
            <div className="absolute top-0 right-0 w-[2px] h-full bg-gradient-to-b from-gold/70 to-transparent" />
          </div>
          <div className="absolute bottom-3 left-3 w-10 h-10">
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-gold/70 to-transparent" />
            <div className="absolute bottom-0 left-0 w-[2px] h-full bg-gradient-to-t from-gold/70 to-transparent" />
          </div>
          <div className="absolute bottom-3 right-3 w-10 h-10">
            <div className="absolute bottom-0 right-0 w-full h-[2px] bg-gradient-to-l from-gold/70 to-transparent" />
            <div className="absolute bottom-0 right-0 w-[2px] h-full bg-gradient-to-t from-gold/70 to-transparent" />
          </div>
          
          {/* Cover content */}
          <div className="relative h-full flex flex-col items-center justify-center p-4 md:p-6 text-center z-10">
            {/* JBJ Logo Mark - NEW BRANDING */}
            <div className="mb-3 md:mb-4">
              <div className="flex flex-col items-center">
                <span 
                  className="text-gold font-bold tracking-[0.3em] uppercase"
                  style={{ 
                    fontSize: size === "sm" ? "28px" : size === "md" ? "36px" : "44px",
                    fontFamily: "Poppins, sans-serif",
                    textShadow: "0 2px 8px rgba(168,146,90,0.4)",
                    letterSpacing: "0.2em",
                  }}
                >
                  JBJ
                </span>
                <span className="text-gold/60 text-[7px] md:text-[8px] tracking-[0.3em] uppercase block mt-1">
                  Global Real Estate
                </span>
              </div>
            </div>

            {/* Decorative divider */}
            <div className="w-12 md:w-16 h-[1px] bg-gradient-to-r from-transparent via-gold/50 to-transparent mb-3 md:mb-4" />

            {/* Title */}
            <h3 
              className={`text-white font-bold mb-1 ${titleSize} leading-tight`}
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              UAE Real Estate
            </h3>
            <p className={`text-gold font-medium ${fontSize} tracking-wide`}>
              Market Intelligence
            </p>

            {/* Decorative line */}
            <div className="w-8 md:w-10 h-[1px] bg-gradient-to-r from-transparent via-gold/40 to-transparent my-2 md:my-3" />

            {/* Edition badge */}
            <div className="px-3 md:px-4 py-1.5 border border-gold/40 rounded bg-black/60 backdrop-blur-sm">
              <span className="text-gold text-[7px] md:text-[9px] font-medium tracking-[0.15em] uppercase">
                {new Date().getFullYear()}–{new Date().getFullYear() + 1} Edition
              </span>
            </div>

            {/* Author footer */}
            <div className="mt-auto pt-3 md:pt-4 w-full">
              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent mb-2" />
              <FounderContent fallback={null}>
                <p className="text-zinc-500 text-[7px] md:text-[8px] uppercase tracking-[0.2em]">
                  By Founder & CEO Jane Bou Jaoude
                </p>
              </FounderContent>
            </div>
          </div>

          {/* Glossy effect overlay */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.15) 100%)",
            }}
          />
        </div>

        {/* Book top edge - Sealed cream pages texture */}
        <div
          className="absolute left-0"
          style={{
            width: width + spine,
            height: pageThickness,
            top: 0,
            background: "linear-gradient(180deg, #e8e2d4 0%, #f0ead8 30%, #f5f0e0 70%, #ebe5d5 100%)",
            transform: `rotateX(90deg) translateZ(${height / 2}px) translateY(-${pageThickness / 2}px)`,
            transformOrigin: "center center",
            boxShadow: "inset 0 2px 8px rgba(0,0,0,0.15)",
            borderLeft: "1px solid rgba(0,0,0,0.2)",
            borderRight: "1px solid rgba(0,0,0,0.2)",
          }}
        />

        {/* Book bottom edge - Sealed cream pages texture */}
        <div
          className="absolute left-0"
          style={{
            width: width + spine,
            height: pageThickness,
            bottom: 0,
            background: "linear-gradient(0deg, #e8e2d4 0%, #f0ead8 30%, #f5f0e0 70%, #ebe5d5 100%)",
            transform: `rotateX(-90deg) translateZ(${height / 2}px) translateY(${pageThickness / 2}px)`,
            transformOrigin: "center center",
            boxShadow: "inset 0 -2px 8px rgba(0,0,0,0.15)",
            borderLeft: "1px solid rgba(0,0,0,0.2)",
            borderRight: "1px solid rgba(0,0,0,0.2)",
          }}
        />

        {/* Book right edge (fore-edge) - Sealed cream pages texture */}
        <div
          className="absolute top-0 h-full"
          style={{
            width: pageThickness,
            right: 0,
            background: "linear-gradient(90deg, #f5f0e0 0%, #f0ead8 20%, #ebe5d5 50%, #f0ead8 80%, #f5f0e0 100%)",
            transform: `rotateY(90deg) translateZ(${width / 2 - pageThickness / 2}px)`,
            transformOrigin: "center center",
            boxShadow: "inset -3px 0 8px rgba(0,0,0,0.12)",
            borderTop: "1px solid rgba(0,0,0,0.15)",
            borderBottom: "1px solid rgba(0,0,0,0.15)",
          }}
        />

        {/* Book back cover */}
        <div
          className="absolute top-0 w-full h-full rounded-l-md"
          style={{
            left: spine,
            width: width,
            background: "linear-gradient(145deg, #151515 0%, #0a0a0a 100%)",
            transform: `translateZ(-${spine / 2}px)`,
            boxShadow: "0 0 0 1px rgba(168, 146, 90, 0.2)",
          }}
        >
          {/* Back cover minimal design */}
          <div className="absolute inset-0 border border-gold/20 rounded-l-md" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-zinc-600 text-xs uppercase tracking-[0.2em]">
              JBJ Global
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Book3D;