import { useState } from "react";
import { motion } from "framer-motion";
import { Download, FileText, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrochureBook3DProps {
  projectName: string;
  developerName?: string;
  brochureUrl?: string;
  onDownloadClick: () => void;
  isLocked?: boolean;
  coverImageUrl?: string;
}

const BrochureBook3D = ({
  projectName,
  developerName,
  brochureUrl,
  onDownloadClick,
  isLocked = false,
  coverImageUrl,
}: BrochureBook3DProps) => {
  const [hoverSide, setHoverSide] = useState<"left" | "right" | null>(null);

  const width = 220;
  const height = 300;
  const spine = 50;
  const pageThickness = 35;

  const getRotation = () => {
    if (hoverSide === "left") return -45;
    if (hoverSide === "right") return 45;
    return 0;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const midpoint = rect.width / 2;
    setHoverSide(x < midpoint ? "left" : "right");
  };

  const handleClick = () => {
    if (!isLocked && brochureUrl) {
      window.open(brochureUrl, "_blank");
    } else {
      onDownloadClick();
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className="relative cursor-pointer"
        style={{
          width: width + spine + 40,
          height: height + 40,
          perspective: "1200px",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverSide(null)}
        onClick={handleClick}
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
            scale: hoverSide ? 1.05 : 1,
          }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 15,
          }}
        >
          {/* Shadow */}
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 transition-all duration-500"
            style={{
              width: width * 0.85,
              height: hoverSide ? 30 : 22,
              background: "radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 40%, transparent 70%)",
              filter: hoverSide ? "blur(16px)" : "blur(10px)",
              transform: `translateZ(-${spine * 2}px) translateY(18px)`,
            }}
          />

          {/* Spine */}
          <div
            className="absolute top-0 h-full"
            style={{
              width: spine,
              left: 0,
              background: "linear-gradient(90deg, hsl(var(--premium-bg)) 0%, hsl(var(--premium-bg) / 0.9) 20%, hsl(var(--premium-bg) / 0.8) 50%, hsl(var(--premium-bg) / 0.9) 80%, hsl(var(--premium-bg)) 100%)",
              transform: `rotateY(-90deg) translateZ(${width / 2}px) translateX(-${spine / 2}px)`,
              transformOrigin: "center center",
              boxShadow: "inset -3px 0 12px rgba(0,0,0,0.5), inset 3px 0 6px rgba(200,167,102,0.1)",
              borderTop: "1px solid rgba(200,167,102,0.3)",
              borderBottom: "1px solid rgba(200,167,102,0.3)",
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="text-gold font-bold tracking-[0.3em] uppercase whitespace-nowrap"
                style={{
                  writingMode: "vertical-rl",
                  textOrientation: "mixed",
                  transform: "rotate(180deg)",
                  fontSize: "11px",
                  textShadow: "0 0 15px rgba(200,167,102,0.6), 0 2px 4px rgba(0,0,0,0.5)",
                }}
              >
                BROCHURE
              </span>
            </div>
          </div>

          {/* Front Cover */}
          <div
            className="absolute top-0 w-full h-full rounded-r-md overflow-hidden"
            style={{
              left: spine,
              width: width,
              backgroundImage: coverImageUrl
                ? `linear-gradient(145deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.8) 60%, rgba(0,0,0,0.65) 100%), url(${coverImageUrl})`
                : "linear-gradient(145deg, hsl(var(--premium-bg)) 0%, hsl(var(--premium-bg) / 0.9) 50%, hsl(var(--premium-bg)) 100%)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              border: "1px solid hsl(var(--gold) / 0.5)",
              transform: `translateZ(${spine / 2}px)`,
              boxShadow: `
                6px 6px 25px rgba(0,0,0,0.5),
                inset 0 0 50px hsl(var(--gold) / 0.08),
                inset 0 1px 0 rgba(255,255,255,0.04)
              `,
            }}
          >
            {/* Gold gradient overlay */}
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(180deg, hsl(var(--gold) / 0.12) 0%, transparent 30%, transparent 70%, hsl(var(--gold) / 0.1) 100%)",
              }}
            />

            {/* Corner accents */}
            {[
              { position: "top-3 left-3", gradientH: "from-gold/70 to-transparent", gradientV: "from-gold/70 to-transparent" },
              { position: "top-3 right-3", gradientH: "from-transparent to-gold/70", gradientV: "from-gold/70 to-transparent" },
              { position: "bottom-3 left-3", gradientH: "from-gold/70 to-transparent", gradientV: "from-transparent to-gold/70" },
              { position: "bottom-3 right-3", gradientH: "from-transparent to-gold/70", gradientV: "from-transparent to-gold/70" },
            ].map((corner, idx) => (
              <div key={idx} className={`absolute ${corner.position} w-8 h-8`}>
                <div className={`absolute ${idx < 2 ? "top-0" : "bottom-0"} ${idx % 2 === 0 ? "left-0" : "right-0"} w-full h-[2px] bg-gradient-to-r ${corner.gradientH}`} />
                <div className={`absolute ${idx < 2 ? "top-0" : "bottom-0"} ${idx % 2 === 0 ? "left-0" : "right-0"} w-[2px] h-full bg-gradient-to-b ${corner.gradientV}`} />
              </div>
            ))}

            {/* Cover content */}
            <div className="relative h-full flex flex-col items-center justify-center p-5 text-center z-10">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center mb-4">
                {isLocked ? (
                  <Lock className="w-7 h-7 text-gold" />
                ) : (
                  <FileText className="w-7 h-7 text-gold" />
                )}
              </div>

              <div className="w-10 h-[1px] bg-gradient-to-r from-transparent via-gold/50 to-transparent mb-4" />

              <h3
                className="text-primary-foreground font-bold text-sm leading-tight mb-2 line-clamp-2"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                {projectName}
              </h3>

              {developerName && (
                <p className="text-gold/80 text-[10px] tracking-wide mb-3">{developerName}</p>
              )}

              <div className="px-3 py-1.5 border border-gold/40 rounded bg-background/60 backdrop-blur-sm">
                <span className="text-gold text-[9px] font-medium tracking-[0.12em] uppercase">
                  Project Brochure
                </span>
              </div>

              <div className="mt-auto pt-4 w-full">
                <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-muted/50 to-transparent mb-2" />
                <p className="text-muted-foreground text-[8px] uppercase tracking-[0.15em]">
                  JBJ Global Real Estate
                </p>
              </div>
            </div>

            {/* Glossy effect */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.12) 100%)",
              }}
            />
          </div>

          {/* Top edge */}
          <div
            className="absolute left-0"
            style={{
              width: width + spine,
              height: pageThickness,
              top: 0,
              background: "linear-gradient(180deg, hsl(var(--champagne) / 0.9) 0%, hsl(var(--champagne)) 30%, hsl(var(--champagne-light)) 70%, hsl(var(--champagne) / 0.9) 100%)",
              transform: `rotateX(90deg) translateZ(${height / 2}px) translateY(-${pageThickness / 2}px)`,
              transformOrigin: "center center",
              boxShadow: "inset 0 2px 6px rgba(0,0,0,0.12)",
            }}
          />

          {/* Bottom edge */}
          <div
            className="absolute left-0"
            style={{
              width: width + spine,
              height: pageThickness,
              bottom: 0,
              background: "linear-gradient(0deg, hsl(var(--champagne) / 0.9) 0%, hsl(var(--champagne)) 30%, hsl(var(--champagne-light)) 70%, hsl(var(--champagne) / 0.9) 100%)",
              transform: `rotateX(-90deg) translateZ(${height / 2}px) translateY(${pageThickness / 2}px)`,
              transformOrigin: "center center",
              boxShadow: "inset 0 -2px 6px rgba(0,0,0,0.12)",
            }}
          />

          {/* Right edge (fore-edge) */}
          <div
            className="absolute top-0 h-full"
            style={{
              width: pageThickness,
              right: 0,
              background: "linear-gradient(90deg, hsl(var(--champagne-light)) 0%, hsl(var(--champagne)) 20%, hsl(var(--champagne) / 0.9) 50%, hsl(var(--champagne)) 80%, hsl(var(--champagne-light)) 100%)",
              transform: `rotateY(90deg) translateZ(${width / 2 - pageThickness / 2}px)`,
              transformOrigin: "center center",
              boxShadow: "inset -2px 0 6px rgba(0,0,0,0.1)",
            }}
          />

          {/* Back cover */}
          <div
            className="absolute top-0 w-full h-full rounded-l-md"
            style={{
              left: spine,
              width: width,
              background: "linear-gradient(145deg, hsl(var(--premium-bg)) 0%, hsl(var(--premium-bg) / 0.9) 100%)",
              transform: `translateZ(-${spine / 2}px)`,
              boxShadow: "0 0 0 1px hsl(var(--gold) / 0.2)",
            }}
          >
            <div className="absolute inset-0 border border-gold/20 rounded-l-md" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-muted-foreground text-[10px] uppercase tracking-[0.15em]">JBJ Global</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Download Button */}
      <button
        onClick={handleClick}
        className={cn(
          "flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all",
          isLocked
            ? "bg-gradient-to-r from-gold/20 to-gold/10 border-2 border-gold/40 text-gold hover:border-gold/60 hover:bg-gold/20"
            : "bg-gradient-to-r from-gold to-gold-light text-primary-foreground hover:from-gold-light hover:to-gold"
        )}
      >
        {isLocked ? (
          <>
            <Lock className="w-4 h-4" />
            Unlock Brochure
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Download Brochure
          </>
        )}
      </button>

      {isLocked && (
        <p className="text-muted-foreground text-xs text-center max-w-[200px]">
          Register your details to unlock the brochure download
        </p>
      )}
    </div>
  );
};

export default BrochureBook3D;
