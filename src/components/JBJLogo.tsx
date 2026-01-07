// JBJ Logo Component - Uses the official logo files
// Light version (black J's, gold B): for white/light backgrounds
// Dark version (white J's, gold B): for dark backgrounds

import jbjLogoLight from "@/assets/jbj-logo-light.png";
import jbjLogoDark from "@/assets/jbj-logo-dark.png";
import jbjLogoDarkTransparent from "@/assets/jbj-logo-dark-transparent.png";

interface JBJLogoProps {
  variant?: 'light' | 'dark' | 'dark-transparent';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'footer';
  className?: string;
  showText?: boolean;
}

const sizeConfig = {
  xs: { width: 40, height: 28 },
  sm: { width: 56, height: 40 },
  md: { width: 80, height: 56 },
  lg: { width: 120, height: 84 },
  xl: { width: 160, height: 112 },
  footer: { width: 200, height: 140 },
};

export const JBJLogo = ({ 
  variant = 'dark', 
  size = 'md', 
  className = '',
  showText = false
}: JBJLogoProps) => {
  const config = sizeConfig[size];
  
  const logoSrc = variant === 'light' 
    ? jbjLogoLight 
    : variant === 'dark-transparent' 
      ? jbjLogoDarkTransparent 
      : jbjLogoDark;
  
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
        <span className="text-gold text-[10px] md:text-xs tracking-[0.2em] uppercase mt-1">
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
    {/* Logo image - dark transparent version for header */}
    <img 
      src={jbjLogoDarkTransparent} 
      alt="JBJ Global Real Estate" 
      width={56}
      height={40}
      className="object-contain shrink-0"
      style={{ 
        width: 56, 
        height: 40,
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
      src={jbjLogoDarkTransparent} 
      alt="JBJ Global Real Estate" 
      width={140}
      height={100}
      className="object-contain"
      style={{ width: 140, height: 100 }}
    />
    <span className="text-gold text-xs tracking-[0.2em] uppercase mt-2">
      Real Estate Brokerage
    </span>
  </div>
);

export default JBJLogo;
