import { motion } from "framer-motion";

interface Book3DProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const Book3D = ({ size = "md", className = "" }: Book3DProps) => {
  const dimensions = {
    sm: { width: 140, height: 190, spine: 15, fontSize: "text-xs" },
    md: { width: 200, height: 270, spine: 20, fontSize: "text-sm" },
    lg: { width: 280, height: 380, spine: 28, fontSize: "text-base" },
  };

  const { width, height, spine, fontSize } = dimensions[size];

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
        {/* Book spine */}
        <div
          className="absolute left-0 top-0 h-full"
          style={{
            width: spine,
            background: "linear-gradient(90deg, #8B7847 0%, #A8925A 50%, #8B7847 100%)",
            transform: `translateX(-${spine}px) rotateY(-90deg)`,
            transformOrigin: "right center",
            boxShadow: "inset -2px 0 8px rgba(0,0,0,0.3)",
          }}
        >
          <div className="h-full flex items-center justify-center">
            <span 
              className="text-white font-semibold tracking-widest"
              style={{ 
                writingMode: "vertical-rl", 
                textOrientation: "mixed",
                fontSize: size === "sm" ? "8px" : size === "md" ? "10px" : "12px",
                letterSpacing: "0.2em",
              }}
            >
              JJ GLOBAL CAPITAL
            </span>
          </div>
        </div>

        {/* Book front cover */}
        <div
          className="absolute top-0 left-0 w-full h-full rounded-r-md overflow-hidden"
          style={{
            background: "linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 100%)",
            border: "1px solid rgba(168, 146, 90, 0.4)",
            boxShadow: `
              4px 4px 20px rgba(0,0,0,0.5),
              inset 0 0 60px rgba(168, 146, 90, 0.05)
            `,
          }}
        >
          {/* Background Villa Image */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />

          {/* Gold corner accents */}
          <div className="absolute top-0 left-0 w-12 h-12 border-l-2 border-t-2 border-gold/60 rounded-tl-sm" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-r-2 border-b-2 border-gold/60 rounded-br-sm" />
          
          {/* Cover content */}
          <div className="relative h-full flex flex-col items-center justify-center p-4 text-center z-10">
            {/* Small logo */}
            <div className="mb-4">
              <span className="text-gold/80 text-[10px] tracking-[0.3em] uppercase">
                J | J Global Capital
              </span>
            </div>

            {/* Title */}
            <h3 
              className={`text-white font-bold mb-2 ${fontSize}`}
              style={{ fontFamily: "Poppins, sans-serif", lineHeight: 1.3 }}
            >
              UAE Real Estate
            </h3>
            <p className={`text-gold font-semibold ${fontSize}`}>
              Market Intelligence
            </p>

            {/* Decorative line */}
            <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent my-4" />

            {/* Year */}
            <div className="px-4 py-1.5 border border-gold/50 rounded-sm bg-black/40 backdrop-blur-sm">
              <span className="text-gold text-xs font-medium tracking-wider">
                2025–2026 EDITION
              </span>
            </div>

            {/* Author */}
            <div className="mt-auto pt-4 border-t border-zinc-800/50 w-full">
              <p className="text-zinc-400 text-[10px] uppercase tracking-wider">
                By Jane Abou Jaoude
              </p>
            </div>
          </div>

          {/* Glossy effect */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)",
            }}
          />
        </div>

        {/* Book pages (side) */}
        <div
          className="absolute right-0 top-[2px] h-[calc(100%-4px)]"
          style={{
            width: 8,
            background: "repeating-linear-gradient(to bottom, #f0ead6 0px, #f0ead6 1px, #e8e0c8 1px, #e8e0c8 2px)",
            transform: "translateX(100%) rotateY(90deg)",
            transformOrigin: "left center",
            boxShadow: "inset -1px 0 3px rgba(0,0,0,0.1)",
          }}
        />

        {/* Book back cover (partially visible) */}
        <div
          className="absolute top-0 left-0 w-full h-full"
          style={{
            background: "linear-gradient(145deg, #151515 0%, #0a0a0a 100%)",
            transform: "translateZ(-8px)",
            borderRadius: "0 4px 4px 0",
          }}
        />
      </div>
    </motion.div>
  );
};

export default Book3D;
