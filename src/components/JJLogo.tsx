// JJ Logo Component - Text version for both header and footer
// Reduced spacing between GLOBAL and CAPITAL

interface JJLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'footer';
  showText?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: {
    j: 'text-lg md:text-xl',
    dividerHeight: 'h-3 md:h-4',
    text: 'text-[9px] md:text-[11px]',
    gap: 'mx-1',
    textGap: 'mt-1',
    textSpacing: 'tracking-[0.2em]',
    wordGap: 'mx-1.5',
  },
  md: {
    j: 'text-xl md:text-2xl',
    dividerHeight: 'h-4 md:h-5',
    text: 'text-[11px] md:text-sm',
    gap: 'mx-1.5',
    textGap: 'mt-1.5',
    textSpacing: 'tracking-[0.2em]',
    wordGap: 'mx-2',
  },
  lg: {
    j: 'text-4xl md:text-5xl lg:text-6xl',
    dividerHeight: 'h-8 md:h-10 lg:h-12',
    text: 'text-base md:text-lg lg:text-xl',
    gap: 'mx-1.5 md:mx-2',
    textGap: 'mt-2',
    textSpacing: 'tracking-[0.25em]',
    wordGap: 'mx-3',
  },
  xl: {
    j: 'text-5xl md:text-6xl lg:text-7xl',
    dividerHeight: 'h-10 md:h-12 lg:h-14',
    text: 'text-lg md:text-xl lg:text-2xl',
    gap: 'mx-2 md:mx-2.5',
    textGap: 'mt-3',
    textSpacing: 'tracking-[0.25em]',
    wordGap: 'mx-3',
  },
  footer: {
    j: 'text-5xl md:text-6xl lg:text-7xl',
    dividerHeight: 'h-10 md:h-14 lg:h-16',
    text: 'text-xl md:text-2xl lg:text-3xl',
    gap: 'mx-2 md:mx-3',
    textGap: 'mt-3 md:mt-4',
    textSpacing: 'tracking-[0.25em] md:tracking-[0.3em]',
    // Symmetric spacing: GLOBAL and CAPITAL equidistant from center divider position
    wordGap: 'mx-3 md:mx-4',
  },
};

// Main logo component - TEXT version (no image)
export const JJLogo = ({ size = 'md', showText = true, className = '' }: JJLogoProps) => {
  const config = sizeConfig[size];

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* J | J Monogram */}
      <div className="flex items-center justify-center">
        <span 
          className={`text-gold font-extralight ${config.j} leading-none drop-shadow-[0_0_8px_rgba(168,146,90,0.3)]`}
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          J
        </span>
        
        {/* Centered Divider */}
        <div className={`${config.gap} flex items-center justify-center`}>
          <div className={`w-[1.5px] bg-white/90 ${config.dividerHeight}`} />
        </div>
        
        <span 
          className={`text-gold font-extralight ${config.j} leading-none drop-shadow-[0_0_8px_rgba(168,146,90,0.3)]`}
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          J
        </span>
      </div>

      {/* GLOBAL CAPITAL - Symmetric centered with divider in middle */}
      {showText && (
        <div 
          className={`${config.textGap} flex items-center justify-center text-white`}
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          <span className={`font-semibold ${config.text} ${config.textSpacing}`}>
            GLOBAL
          </span>
          <span className={config.wordGap} />
          <span className={`font-semibold ${config.text} ${config.textSpacing}`}>
            CAPITAL
          </span>
        </div>
      )}
    </div>
  );
};

// Header-specific logo - TEXT version with tighter GLOBAL CAPITAL spacing
export const JJLogoHeader = ({ className = '' }: { className?: string }) => (
  <div 
    className={`flex items-center ${className}`}
    style={{ fontFamily: "Poppins, sans-serif" }}
  >
    {/* J | J Monogram */}
    <span className="text-gold font-extralight text-2xl md:text-3xl leading-none drop-shadow-[0_0_8px_rgba(168,146,90,0.3)]">J</span>
    <div className="mx-1 flex items-center justify-center">
      <div className="w-[1.5px] bg-white/90 h-5 md:h-6" />
    </div>
    <span className="text-gold font-extralight text-2xl md:text-3xl leading-none drop-shadow-[0_0_8px_rgba(168,146,90,0.3)]">J</span>
    
    {/* GLOBAL CAPITAL - Tight spacing, reduced gap */}
    <div className="ml-2 md:ml-3 flex items-center text-white/95">
      <span className="font-semibold text-sm md:text-base lg:text-lg tracking-[0.12em]">
        GLOBAL
      </span>
      <span className="mx-0.5 md:mx-1" />
      <span className="font-semibold text-sm md:text-base lg:text-lg tracking-[0.12em]">
        CAPITAL
      </span>
    </div>
  </div>
);

export default JJLogo;