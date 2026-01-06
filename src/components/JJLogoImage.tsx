// JJ Logo Image Component - Uses the official logo files
// Light version: Black J's with Gold divider on white/transparent background
// Dark version: White J's with Gold divider on black background

import logoLight from "@/assets/logo-light.jpg";
import logoDark from "@/assets/logo-dark.jpg";

interface JJLogoImageProps {
  variant?: 'light' | 'dark';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'footer';
  className?: string;
  showText?: boolean;
}

const sizeConfig = {
  xs: { width: 40, height: 40 },
  sm: { width: 48, height: 48 },
  md: { width: 64, height: 64 },
  lg: { width: 100, height: 100 },
  xl: { width: 140, height: 140 },
  footer: { width: 180, height: 180 },
};

export const JJLogoImage = ({ 
  variant = 'light', 
  size = 'md', 
  className = '',
  showText = true
}: JJLogoImageProps) => {
  const config = sizeConfig[size];
  const logoSrc = variant === 'dark' ? logoDark : logoLight;
  
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <img 
        src={logoSrc} 
        alt="JJ Global Capital" 
        width={config.width}
        height={config.height}
        className="object-contain"
        style={{ width: config.width, height: config.height }}
      />
      {showText && (
        <div 
          className="flex items-center justify-center text-current mt-1"
          style={{ 
            fontFamily: "Poppins, sans-serif",
            letterSpacing: '0.08em'
          }}
        >
          <span className={`font-semibold ${size === 'footer' ? 'text-lg md:text-xl' : size === 'xl' ? 'text-base' : size === 'lg' ? 'text-sm' : 'text-xs'}`}>
            GLOBAL
          </span>
          <span className="mx-1" />
          <span className={`font-semibold ${size === 'footer' ? 'text-lg md:text-xl' : size === 'xl' ? 'text-base' : size === 'lg' ? 'text-sm' : 'text-xs'}`}>
            CAPITAL
          </span>
        </div>
      )}
    </div>
  );
};

// Header-specific logo - Matches footer styling exactly (uses same logoDark asset)
// Uses crisp rendering with explicit dimensions to prevent blur
export const JJLogoHeaderImage = ({ className = '' }: { className?: string }) => (
  <div 
    className={`flex items-center gap-3 ${className}`}
    style={{ fontFamily: "Poppins, sans-serif" }}
  >
    {/* Logo image - same asset as footer (logoDark), crisp at 48x48 */}
    <img 
      src={logoDark} 
      alt="JJ Global Capital" 
      width={48}
      height={48}
      className="object-contain shrink-0"
      style={{ 
        width: 48, 
        height: 48,
        imageRendering: 'auto'
      }}
    />
    {/* Text block - styled like footer */}
    <div className="flex flex-col justify-center leading-tight">
      <span className="text-white font-semibold text-sm md:text-base tracking-[0.12em] uppercase">
        Global Capital
      </span>
      <span className="text-gold text-[10px] md:text-xs tracking-[0.2em] uppercase mt-0.5">
        Real Estate
      </span>
    </div>
  </div>
);

export default JJLogoImage;
