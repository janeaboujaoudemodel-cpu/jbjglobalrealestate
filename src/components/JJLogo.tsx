// JBJ Logo Component - Uses official JBJ branding
// This component is DEPRECATED - Use JBJLogo.tsx instead
// Kept for backward compatibility only

import jbjMonogramDark from "@/assets/jbj-monogram-dark.png";
import jbjMonogramNobuffer from "@/assets/jbj-monogram-nobuffer.png";

interface JJLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'footer';
  showText?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { width: 32, height: 32, text: 'text-[8px] md:text-[9px]' },
  md: { width: 48, height: 48, text: 'text-[9px] md:text-[10px]' },
  lg: { width: 80, height: 80, text: 'text-sm md:text-base' },
  xl: { width: 100, height: 100, text: 'text-base md:text-lg' },
  footer: { width: 140, height: 140, text: 'text-xl md:text-2xl' },
};

// Main logo component - now uses JBJ monogram image
export const JJLogo = ({ size = 'md', showText = true, className = '' }: JJLogoProps) => {
  const config = sizeConfig[size];
  const isFooter = size === 'footer';
  
  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* JBJ Monogram */}
      <img 
        src={isFooter ? jbjMonogramNobuffer : jbjMonogramDark} 
        alt="JBJ GLOBAL REAL ESTATE"
        width={config.width}
        height={config.height}
        className="object-contain"
        style={{ width: config.width, height: config.height }}
      />

      {/* GLOBAL REAL ESTATE */}
      {showText && (
        <div 
          className={`flex items-center justify-center ${isFooter ? 'text-white' : 'text-foreground'} mt-2`}
          style={{ 
            fontFamily: "Poppins, sans-serif",
            letterSpacing: '0.08em'
          }}
        >
          <span className={`font-semibold ${config.text} tracking-[0.12em] uppercase`}>
            JBJ GLOBAL REAL ESTATE
          </span>
        </div>
      )}
    </div>
  );
};

// Header-specific logo - Horizontal layout with JBJ monogram
export const JJLogoHeader = ({ className = '' }: { className?: string }) => (
  <div 
    className={`flex items-center gap-3 ${className}`}
    style={{ fontFamily: "Poppins, sans-serif" }}
  >
    {/* JBJ Monogram */}
    <img 
      src={jbjMonogramDark} 
      alt="JBJ GLOBAL REAL ESTATE"
      width={44}
      height={44}
      className="object-contain shrink-0"
      style={{ width: 44, height: 44 }}
    />
    
    {/* GLOBAL REAL ESTATE - Horizontal */}
    <span className="text-white font-semibold text-sm md:text-base tracking-[0.12em] uppercase">
      Global Real Estate
    </span>
  </div>
);

export default JJLogo;
