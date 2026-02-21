import jbjMonogram from "@/assets/jbj-monogram-light-transparent.png";

interface BrandedLoaderProps {
  text?: string;
  className?: string;
}

/**
 * Premium branded loader — JBJ monogram with pulse animation and gold glow.
 * Used as the universal full-page loading indicator.
 */
export function BrandedLoader({ text = "Loading...", className = "" }: BrandedLoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center min-h-screen gap-6 ${className}`}>
      <div className="relative w-24 h-24 md:w-32 md:h-32">
        <img
          src={jbjMonogram}
          alt="Loading"
          className="w-full h-full object-contain animate-pulse"
          style={{ filter: "drop-shadow(0 0 20px rgba(200,167,102,0.4))" }}
        />
      </div>
      <span
        className="text-gold/60 text-xs tracking-[0.25em] uppercase animate-pulse"
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        {text}
      </span>
    </div>
  );
}

/**
 * Compact branded loader for inline/button use — small monogram with pulse.
 * Use inside buttons, cards, and inline loading states.
 */
export function BrandedLoaderInline({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src={jbjMonogram}
      alt="Loading"
      className={`object-contain animate-pulse ${className}`}
      style={{ 
        width: size, 
        height: size, 
        filter: "drop-shadow(0 0 8px rgba(200,167,102,0.4))" 
      }}
    />
  );
}
