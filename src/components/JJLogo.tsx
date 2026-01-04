// Premium J | J Logo Component - Consistent across all pages
// Centered stroke between J letters, GLOBAL on left, CAPITAL on right
// Symmetric spacing, no text touching the divider line

interface JJLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'footer';
  showText?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: {
    j: 'text-xl md:text-2xl',
    dividerHeight: 'h-4 md:h-5',
    text: 'text-[8px] md:text-[10px]',
    gap: 'mx-1.5',
    textGap: 'mt-1.5',
    textSpacing: 'tracking-[0.15em]',
    wordGap: 'mx-2',
  },
  md: {
    j: 'text-2xl md:text-3xl',
    dividerHeight: 'h-5 md:h-6',
    text: 'text-[10px] md:text-xs',
    gap: 'mx-2',
    textGap: 'mt-2',
    textSpacing: 'tracking-[0.2em]',
    wordGap: 'mx-2',
  },
  lg: {
    j: 'text-5xl md:text-6xl lg:text-7xl',
    dividerHeight: 'h-10 md:h-12 lg:h-14',
    text: 'text-sm md:text-base lg:text-lg',
    gap: 'mx-2 md:mx-2.5',
    textGap: 'mt-3',
    textSpacing: 'tracking-[0.25em]',
    wordGap: 'mx-2',
  },
  xl: {
    j: 'text-7xl md:text-8xl lg:text-9xl',
    dividerHeight: 'h-14 md:h-16 lg:h-20',
    text: 'text-base md:text-lg lg:text-xl',
    gap: 'mx-2.5 md:mx-3',
    textGap: 'mt-4',
    textSpacing: 'tracking-[0.25em]',
    wordGap: 'mx-2',
  },
  footer: {
    j: 'text-7xl md:text-8xl lg:text-[10rem]',
    dividerHeight: 'h-14 md:h-20 lg:h-28',
    text: 'text-xl md:text-2xl lg:text-3xl',
    gap: 'mx-3 md:mx-4',
    textGap: 'mt-4 md:mt-5',
    textSpacing: 'tracking-[0.2em]',
    wordGap: 'mx-3',
  },
};

export const JJLogo = ({ size = 'md', showText = true, className = '' }: JJLogoProps) => {
  const config = sizeConfig[size];

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* J | J Monogram - Perfectly centered divider */}
      <div className="flex items-center justify-center">
        <span 
          className={`text-gold font-extralight ${config.j} leading-none`}
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          J
        </span>
        
        {/* Centered Divider - shorter, doesn't extend beyond letters */}
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

      {/* GLOBAL CAPITAL - Symmetric, centered under the divider, NO DOT */}
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

// Header-specific logo with horizontal layout
export const JJLogoHeader = ({ className = '' }: { className?: string }) => (
  <div 
    className={`flex items-center ${className}`}
    style={{ fontFamily: "Poppins, sans-serif" }}
  >
    {/* J | J Monogram */}
    <span className="text-gold font-extralight text-2xl md:text-3xl lg:text-4xl leading-none">J</span>
    <div className="mx-1.5 flex items-center justify-center">
      <div className="w-[1.5px] bg-white/90 h-5 md:h-7 lg:h-8" />
    </div>
    <span className="text-gold font-extralight text-2xl md:text-3xl lg:text-4xl leading-none">J</span>
    
    {/* GLOBAL CAPITAL - reduced gap between words */}
    <div className="ml-2.5 md:ml-3 flex items-center text-white">
      <span className="font-semibold text-sm sm:text-base md:text-lg tracking-[0.15em]">
        GLOBAL
      </span>
      <span className="mx-1.5" />
      <span className="font-semibold text-sm sm:text-base md:text-lg tracking-[0.15em]">
        CAPITAL
      </span>
    </div>
  </div>
);

export default JJLogo;
