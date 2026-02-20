import jbjMonogram from "@/assets/jbj-monogram-light-transparent.png";

interface BrandedLoaderProps {
  text?: string;
  className?: string;
}

/**
 * Premium branded loader — JBJ monogram with a bottom-to-top gold fill animation.
 * Uses a clip-path animation to "pour" gold into the logo silhouette.
 */
export function BrandedLoader({ text = "Loading...", className = "" }: BrandedLoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center min-h-screen gap-6 ${className}`}>
      {/* Logo — full opacity with premium glow */}
      <div className="relative w-24 h-24 md:w-32 md:h-32">
        <img
          src={jbjMonogram}
          alt="Loading"
          className="w-full h-full object-contain animate-pulse"
          style={{ filter: "drop-shadow(0 0 20px rgba(200,167,102,0.4))" }}
        />
      </div>

      {/* Subtle loading text */}
      <span
        className="text-gold/60 text-xs tracking-[0.25em] uppercase animate-pulse"
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        {text}
      </span>
    </div>
  );
}
