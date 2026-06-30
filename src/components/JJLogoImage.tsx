// JBJ Logo Image Component - Uses the official JBJ logo files
// This component is DEPRECATED - Use JBJLogo.tsx instead
// Keeping for backward compatibility - all imports redirect to JBJ assets

import jbjMonogramLightTransparent from "@/assets/jbj-monogram-light-transparent.png"; // White J's - transparent bg
import jbjMonogramNobuffer from "@/assets/jbj-monogram-nobuffer.png"; // Black J's - transparent bg for light backgrounds
import jbjFullLogoDark from "@/assets/jbj-fulllogo-dark.png";
import jbjFullLogoLight from "@/assets/jbj-fulllogo-light.png";

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
  
  // Use JBJ monogram - LightBg (black J's) for light backgrounds, DarkBg (white J's) for dark backgrounds
  const logoSrc = variant === 'dark' ? jbjMonogramLightTransparent : jbjMonogramNobuffer;
  
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <img data-no-fallback 
        src={logoSrc} 
        alt="JBJ Global Real Estate"
        width={config.width}
        height={config.height}
        className="object-contain"
        style={{ width: config.width, height: config.height }}
       loading="lazy" decoding="async" />
      {showText && (
        <div 
          className="flex flex-col items-center justify-center text-current mt-1"
          style={{ 
            letterSpacing: '0.08em'
          }}
        >
          <span className={`font-semibold ${size === 'footer' ? 'text-lg md:text-xl' : size === 'xl' ? 'text-base' : size === 'lg' ? 'text-sm' : 'text-xs'}`}>
            JBJ GLOBAL REAL ESTATE
          </span>
        </div>
      )}
    </div>
  );
};

// CSS-based transparent logo - Gold 'B' on transparent background
// Use this for chat widget and dark overlays where image background won't work
interface JJLogoTransparentProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const transparentSizeConfig = {
  xs: { text: 'text-2xl', imgSize: 24 },
  sm: { text: 'text-3xl', imgSize: 32 },
  md: { text: 'text-4xl', imgSize: 40 },
  lg: { text: 'text-5xl', imgSize: 56 },
};

export const JJLogoTransparent = ({ size = 'md', className = '' }: JJLogoTransparentProps) => {
  const config = transparentSizeConfig[size];
  
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img data-no-fallback 
        src={jbjMonogramNobuffer}
        alt="JBJ Global Real Estate"
        width={config.imgSize}
        height={config.imgSize}
        className="object-contain"
        style={{ width: config.imgSize, height: config.imgSize }}
       loading="lazy" decoding="async" />
    </div>
  );
};

// Header-specific logo - Uses JBJ monogram with company name
export const JJLogoHeaderImage = ({ className = '' }: { className?: string }) => (
  <div 
    className={`flex items-center gap-3 ${className}`}
  >
    {/* JBJ Logo image - dark bg version for header (white J's visible on dark header) */}
    <img data-no-fallback 
      src={jbjMonogramLightTransparent} 
      alt="JBJ Global Real Estate"
      width={44}
      height={44}
      className="object-contain shrink-0"
      style={{ 
        width: 44, 
        height: 44,
        imageRendering: 'auto'
      }}
     loading="lazy" decoding="async" />
    {/* Text block */}
    <div className="flex flex-col justify-center leading-tight">
      <span className="text-white font-semibold text-sm md:text-base tracking-[0.12em] uppercase">
        Global Real Estate
      </span>
    </div>
  </div>
);

export default JJLogoImage;
