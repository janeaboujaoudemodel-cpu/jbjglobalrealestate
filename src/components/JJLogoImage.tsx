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

// Header-specific logo - Horizontal layout with dark logo (for dark header background)
export const JJLogoHeaderImage = ({ className = '' }: { className?: string }) => (
  <div 
    className={`flex items-center ${className}`}
    style={{ fontFamily: "Poppins, sans-serif" }}
  >
    <img 
      src={logoDark} 
      alt="JJ Global Capital" 
      className="h-10 md:h-12 w-auto object-contain"
    />
    <div className="ml-2 md:ml-3 flex items-center text-white">
      <span className="font-semibold text-sm md:text-base lg:text-lg tracking-[0.08em]">
        GLOBAL
      </span>
      <span className="mx-1" />
      <span className="font-semibold text-sm md:text-base lg:text-lg tracking-[0.08em]">
        CAPITAL
      </span>
    </div>
  </div>
);

export default JJLogoImage;
