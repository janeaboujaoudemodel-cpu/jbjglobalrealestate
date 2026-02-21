import jbjMonogramDarkOnLight from "@/assets/jbj-monogram-dark-on-light.png";
import jbjMonogramLightOnDark from "@/assets/jbj-monogram-light-on-dark.png";

interface BrandedLoaderProps {
  text?: string;
  className?: string;
  variant?: 'dark' | 'light';
}

/**
 * Premium branded loader — JBJ monogram with pulse animation and gold glow.
 * variant='dark' (default): dark background → light monogram
 * variant='light': light background → dark monogram
 */
export function BrandedLoader({ text = "Loading...", className = "", variant = "dark" }: BrandedLoaderProps) {
  const logo = variant === 'light' ? jbjMonogramDarkOnLight : jbjMonogramLightOnDark;
  
  return (
    <div className={`flex flex-col items-center justify-center min-h-screen gap-6 ${className}`}>
      <div className="relative w-24 h-24 md:w-32 md:h-32">
        <img
          src={logo}
          alt="Loading"
          className="w-full h-full object-contain animate-pulse"
          style={{ filter: "drop-shadow(0 0 20px rgba(200,167,102,0.4))", mixBlendMode: "multiply" }}
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
 */
export function BrandedLoaderInline({ size = 24, className = "", variant = "dark" }: { size?: number; className?: string; variant?: 'dark' | 'light' }) {
  const logo = variant === 'light' ? jbjMonogramDarkOnLight : jbjMonogramLightOnDark;
  
  return (
    <img
      src={logo}
      alt="Loading"
      className={`object-contain animate-pulse ${className}`}
      style={{ 
        width: size, 
        height: size, 
        filter: "drop-shadow(0 0 8px rgba(200,167,102,0.4))",
        mixBlendMode: "multiply"
      }}
    />
  );
}
