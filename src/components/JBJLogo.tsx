// JBJ Logo Component - Uses the official monogram logo files
// Dark version: for dark backgrounds (black bg with white J's, gold B)
// Transparent version: for light backgrounds

import jbjMonogramDark from "@/assets/jbj-monogram-dark.png";
import jbjMonogramTransparent from "@/assets/jbj-monogram-transparent.png";
import jbjMonogramNobuffer from "@/assets/jbj-monogram-nobuffer.png";

interface JBJLogoProps {
  variant?: 'light' | 'dark' | 'nobuffer';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'footer';
  className?: string;
  showText?: boolean;
}

const sizeConfig = {
  xs: { width: 32, height: 32 },
  sm: { width: 48, height: 48 },
  md: { width: 64, height: 64 },
  lg: { width: 96, height: 96 },
  xl: { width: 120, height: 120 },
  footer: { width: 140, height: 140 },
};

export const JBJLogo = ({ 
  variant = 'dark', 
  size = 'md', 
  className = '',
  showText = false
}: JBJLogoProps) => {
  const config = sizeConfig[size];
  
  const logoSrc = variant === 'light' 
    ? jbjMonogramTransparent 
    : variant === 'nobuffer' 
      ? jbjMonogramNobuffer 
      : jbjMonogramDark;
  
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <img 
        src={logoSrc} 
        alt="JBJ Global Real Estate" 
        width={config.width}
        height={config.height}
        className="object-contain"
        style={{ width: config.width, height: config.height }}
      />
      {showText && (
        <span className="text-gold text-[10px] md:text-xs tracking-[0.2em] uppercase mt-2">
          Real Estate
        </span>
      )}
    </div>
  );
};

// Header-specific logo - Horizontal layout for navigation bar
export const JBJLogoHeader = ({ className = '' }: { className?: string }) => (
  <div 
    className={`flex items-center gap-3 ${className}`}
    style={{ fontFamily: "Poppins, sans-serif" }}
  >
    {/* Logo image - dark version for header */}
    <img 
      src={jbjMonogramDark} 
      alt="JBJ Global Real Estate" 
      width={44}
      height={44}
      className="object-contain shrink-0"
      style={{ 
        width: 44, 
        height: 44,
        imageRendering: 'auto'
      }}
    />
    {/* Text block */}
    <div className="flex flex-col justify-center leading-tight">
      <span className="text-white font-semibold text-sm md:text-base tracking-[0.12em] uppercase">
        Global Real Estate
      </span>
    </div>
  </div>
);

// Footer logo - larger with full branding
export const JBJLogoFooter = ({ className = '' }: { className?: string }) => (
  <div className={`flex flex-col items-center ${className}`}>
    <img 
      src={jbjMonogramDark} 
      alt="JBJ Global Real Estate" 
      width={120}
      height={120}
      className="object-contain"
      style={{ width: 120, height: 120 }}
    />
    <span className="text-gold text-xs tracking-[0.2em] uppercase mt-3">
      Real Estate Brokerage
    </span>
  </div>
);

export default JBJLogo;
