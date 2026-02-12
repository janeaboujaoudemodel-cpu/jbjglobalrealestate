import jbjMonogram from "@/assets/jbj-monogram-light-bg.png";

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
    <div className={`flex flex-col items-center justify-center min-h-[60vh] gap-6 ${className}`}>
      {/* Logo container with fill animation */}
      <div className="relative w-24 h-24 md:w-32 md:h-32">
        {/* Base logo — faded */}
        <img
          src={jbjMonogram}
          alt="Loading"
          className="absolute inset-0 w-full h-full object-contain opacity-20"
        />
        {/* Filled logo — clip-path animates bottom to top */}
        <img
          src={jbjMonogram}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-contain animate-logo-fill"
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
