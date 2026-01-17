import { motion } from "framer-motion";

interface Book3DProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const Book3D = ({ size = "md", className = "" }: Book3DProps) => {
  const dimensions = {
    sm: { width: 160, height: 220, spine: 18, fontSize: "text-[10px]", titleSize: "text-sm" },
    md: { width: 220, height: 300, spine: 24, fontSize: "text-xs", titleSize: "text-base" },
    lg: { width: 300, height: 400, spine: 30, fontSize: "text-sm", titleSize: "text-lg" },
  };

  const { width, height, spine, fontSize, titleSize } = dimensions[size];

  return (
    <motion.div
      className={`relative ${className}`}
      style={{ 
        width: width + spine + 20, 
        height: height + 20,
        perspective: "1200px",
        transformStyle: "preserve-3d",
      }}
      initial={{ rotateY: -5, rotateX: 5 }}
      animate={{ 
        rotateY: [-5, 5, -5],
        rotateX: [5, 2, 5],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      whileHover={{
        rotateY: 15,
        scale: 1.05,
        transition: { duration: 0.4 }
      }}
    >
      {/* Book shadow */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2"
        style={{
          width: width * 0.8,
          height: 20,
          background: "radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)",
          filter: "blur(8px)",
          transform: "translateZ(-50px)",
        }}
      />

      {/* Book container with 3D transform */}
      <div 
        className="relative"
        style={{
          width: width + spine,
          height: height,
          transformStyle: "preserve-3d",
          transform: "rotateY(-20deg)",
        }}
      >
        {/* Book spine - Elegant gold gradient */}
        <div
          className="absolute left-0 top-0 h-full"
          style={{
            width: spine,
            background: "linear-gradient(90deg, #7A6A42 0%, #A8925A 30%, #C4A85C 50%, #A8925A 70%, #7A6A42 100%)",
            transform: `translateX(-${spine}px) rotateY(-90deg)`,
            transformOrigin: "right center",
            boxShadow: "inset -2px 0 8px rgba(0,0,0,0.3), inset 2px 0 4px rgba(255,255,255,0.1)",
          }}
        >
          <div className="h-full flex items-center justify-center">
            <span 
              className="text-white font-semibold tracking-widest drop-shadow-lg"
              style={{ 
                writingMode: "vertical-rl", 
                textOrientation: "mixed",
                fontSize: size === "sm" ? "8px" : size === "md" ? "10px" : "12px",
                letterSpacing: "0.2em",
                textShadow: "0 1px 2px rgba(0,0,0,0.5)",
              }}
            >
              JBJ GLOBAL REAL ESTATE
            </span>
          </div>
        </div>

        {/* Book front cover - Premium dark design */}
        <div
          className="absolute top-0 left-0 w-full h-full rounded-r-md overflow-hidden"
          style={{
            background: "linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 50%, #1a1a1a 100%)",
            border: "1px solid rgba(168, 146, 90, 0.5)",
            boxShadow: `
              4px 4px 20px rgba(0,0,0,0.5),
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
            {/* JJ Logo Mark */}
            <div className="mb-3 md:mb-4">
              <div className="flex items-center justify-center gap-1">
                <span 
                  className="text-gold font-bold"
                  style={{ 
                    fontSize: size === "sm" ? "24px" : size === "md" ? "32px" : "40px",
                    fontFamily: "Poppins, sans-serif",
                    textShadow: "0 2px 4px rgba(168,146,90,0.3)",
                  }}
                >
                  J
                </span>
                <div className="w-[2px] h-6 md:h-8 bg-gradient-to-b from-transparent via-gold/60 to-transparent mx-1" />
                <span 
                  className="text-gold font-bold"
                  style={{ 
                    fontSize: size === "sm" ? "24px" : size === "md" ? "32px" : "40px",
                    fontFamily: "Poppins, sans-serif",
                    textShadow: "0 2px 4px rgba(168,146,90,0.3)",
                  }}
                >
                  J
                </span>
              </div>
              <span className="text-gold/60 text-[7px] md:text-[8px] tracking-[0.3em] uppercase block mt-1">
                Global Real Estate
              </span>
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
                2025–2026 Edition
              </span>
            </div>

            {/* Author footer */}
            <div className="mt-auto pt-3 md:pt-4 w-full">
              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent mb-2" />
              <p className="text-zinc-500 text-[7px] md:text-[8px] uppercase tracking-[0.2em]">
                By Founder and CEO Jane Abou Jaoude
              </p>
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

        {/* Book pages (side) - Cream colored pages */}
        <div
          className="absolute right-0 top-[2px] h-[calc(100%-4px)]"
          style={{
            width: 10,
            background: "repeating-linear-gradient(to bottom, #f5f0e0 0px, #f5f0e0 1px, #ebe5d5 1px, #ebe5d5 2px)",
            transform: "translateX(100%) rotateY(90deg)",
            transformOrigin: "left center",
            boxShadow: "inset -2px 0 4px rgba(0,0,0,0.15)",
          }}
        />

        {/* Book back cover (partially visible) */}
        <div
          className="absolute top-0 left-0 w-full h-full"
          style={{
            background: "linear-gradient(145deg, #151515 0%, #0a0a0a 100%)",
            transform: "translateZ(-10px)",
            borderRadius: "0 4px 4px 0",
          }}
        />
      </div>
    </motion.div>
  );
};

export default Book3D;