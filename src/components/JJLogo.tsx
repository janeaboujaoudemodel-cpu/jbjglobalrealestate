// Premium J | J Logo Component - Consistent across all pages
// Smaller J's, wider/stretched GLOBAL CAPITAL text

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
    textSpacing: 'tracking-[0.25em]',
    wordGap: 'mx-3',
  },
  md: {
    j: 'text-xl md:text-2xl',
    dividerHeight: 'h-4 md:h-5',
    text: 'text-[11px] md:text-sm',
    gap: 'mx-1.5',
    textGap: 'mt-1.5',
    textSpacing: 'tracking-[0.3em]',
    wordGap: 'mx-4',
  },
  lg: {
    j: 'text-4xl md:text-5xl lg:text-6xl',
    dividerHeight: 'h-8 md:h-10 lg:h-12',
    text: 'text-base md:text-lg lg:text-xl',
    gap: 'mx-1.5 md:mx-2',
    textGap: 'mt-2',
    textSpacing: 'tracking-[0.35em]',
    wordGap: 'mx-5',
  },
  xl: {
    j: 'text-5xl md:text-6xl lg:text-7xl',
    dividerHeight: 'h-10 md:h-12 lg:h-14',
    text: 'text-lg md:text-xl lg:text-2xl',
    gap: 'mx-2 md:mx-2.5',
    textGap: 'mt-3',
    textSpacing: 'tracking-[0.4em]',
    wordGap: 'mx-6',
  },
  footer: {
    j: 'text-5xl md:text-6xl lg:text-7xl',
    dividerHeight: 'h-10 md:h-14 lg:h-16',
    text: 'text-2xl md:text-3xl lg:text-4xl',
    gap: 'mx-2 md:mx-3',
    textGap: 'mt-3 md:mt-4',
    textSpacing: 'tracking-[0.4em] md:tracking-[0.5em]',
    wordGap: 'mx-6 md:mx-8',
  },
};

export const JJLogo = ({ size = 'md', showText = true, className = '' }: JJLogoProps) => {
  const config = sizeConfig[size];

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* J | J Monogram - Smaller J's */}
      <div className="flex items-center justify-center">
        <span 
          className={`text-gold font-extralight ${config.j} leading-none`}
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          J
        </span>
        
        {/* Centered Divider */}
        <div className={`${config.gap} flex items-center justify-center`}>
          <div className={`w-[1.5px] bg-white/90 ${config.dividerHeight}`} />
        </div>
        
        <span 
          className={`text-gold font-extralight ${config.j} leading-none`}
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          J
        </span>
      </div>

      {/* GLOBAL CAPITAL - Wider, stretched with more letter-spacing */}
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

// Header-specific logo - Smaller J's, Wider GLOBAL CAPITAL
export const JJLogoHeader = ({ className = '' }: { className?: string }) => (
  <div 
    className={`flex items-center ${className}`}
    style={{ fontFamily: "Poppins, sans-serif" }}
  >
    {/* J | J Monogram - Smaller */}
    <span className="text-gold font-extralight text-2xl md:text-3xl leading-none drop-shadow-[0_0_8px_rgba(168,146,90,0.3)]">J</span>
    <div className="mx-1.5 flex items-center justify-center">
      <div className="w-[1.5px] bg-white h-5 md:h-6" />
    </div>
    <span className="text-gold font-extralight text-2xl md:text-3xl leading-none drop-shadow-[0_0_8px_rgba(168,146,90,0.3)]">J</span>
    
    {/* GLOBAL CAPITAL - Wider, more prominent */}
    <div className="ml-4 md:ml-5 flex items-center text-white/95">
      <span className="font-semibold text-sm md:text-base lg:text-lg tracking-[0.2em] md:tracking-[0.25em]">
        GLOBAL
      </span>
      <span className="mx-2 md:mx-3" />
      <span className="font-semibold text-sm md:text-base lg:text-lg tracking-[0.2em] md:tracking-[0.25em]">
        CAPITAL
      </span>
    </div>
  </div>
);

export default JJLogo;
