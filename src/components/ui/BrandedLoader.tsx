import jbjMonogramNobuffer from "@/assets/jbj-monogram-nobuffer.png";
import jbjMonogramLightTransparent from "@/assets/jbj-monogram-light-transparent.png";

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
export function BrandedLoader({ text = "Loading...", className = "", variant = "light" }: BrandedLoaderProps) {
  const logo = variant === 'light' ? jbjMonogramNobuffer : jbjMonogramLightTransparent;
  
  return (
    <div className={`flex flex-col items-center justify-center min-h-screen gap-6 ${className}`}>
      <div className="relative w-40 h-40 md:w-52 md:h-52">
        {/* Gold fill animation overlay */}
        <div className="absolute inset-0 overflow-hidden rounded-full">
          <img
            src={logo}
            alt="Loading"
            className="w-full h-full object-contain opacity-20"
            style={{ filter: "grayscale(1)" }}
          />
        </div>
        <img
          src={logo}
          alt="Loading"
          className="relative w-full h-full object-contain"
          style={{ 
            filter: variant === 'light' 
              ? 'drop-shadow(0 0 24px rgba(0,0,0,0.3))'
              : 'drop-shadow(0 0 24px rgba(200,167,102,0.5))',
          }}
        />
      </div>
      <span
        className={`text-xs tracking-[0.25em] uppercase font-semibold ${variant === 'light' ? 'text-[#1A1A1A]' : 'text-[#1A1A1A]'}`}
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
  const logo = variant === 'light' ? jbjMonogramNobuffer : jbjMonogramLightTransparent;
  
  return (
    <img
      src={logo}
      alt="Loading"
      className={`object-contain ${className}`}
      style={{ 
        width: size, 
        height: size, 
        filter: "drop-shadow(0 0 8px rgba(200,167,102,0.4))",
        mixBlendMode: "multiply"
      }}
    />
  );
}
