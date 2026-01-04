// Premium J | J Logo Component - Consistent across all pages
// Centered stroke between J letters, GLOBAL on left, CAPITAL on right
// Symmetric spacing, no text touching the divider line

interface JJLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: {
    j: 'text-xl md:text-2xl',
    dividerHeight: 'h-6 md:h-7',
    text: 'text-[8px] md:text-[10px]',
    gap: 'mx-2',
    textGap: 'mt-1.5',
    textSpacing: 'tracking-[0.2em]',
  },
  md: {
    j: 'text-2xl md:text-3xl',
    dividerHeight: 'h-8 md:h-9',
    text: 'text-[10px] md:text-xs',
    gap: 'mx-2.5',
    textGap: 'mt-2',
    textSpacing: 'tracking-[0.25em]',
  },
  lg: {
    j: 'text-5xl md:text-6xl lg:text-7xl',
    dividerHeight: 'h-16 md:h-20 lg:h-24',
    text: 'text-xs md:text-sm lg:text-base',
    gap: 'mx-3 md:mx-4',
    textGap: 'mt-4',
    textSpacing: 'tracking-[0.35em]',
  },
  xl: {
    j: 'text-7xl md:text-8xl lg:text-9xl',
    dividerHeight: 'h-24 md:h-28 lg:h-32',
    text: 'text-sm md:text-base lg:text-lg',
    gap: 'mx-4 md:mx-5',
    textGap: 'mt-5',
    textSpacing: 'tracking-[0.35em]',
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
        
        {/* Centered Divider - extends beyond letters symmetrically */}
        <div className={`${config.gap} flex items-center justify-center`}>
          <div className={`w-[2px] bg-white/90 ${config.dividerHeight}`} />
        </div>
        
        <span 
          className={`text-gold font-extralight ${config.j} leading-none`}
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          J
        </span>
      </div>

      {/* GLOBAL CAPITAL - Symmetric, centered under the divider */}
      {showText && (
        <div 
          className={`${config.textGap} flex items-center justify-center text-white`}
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          <span className={`font-medium ${config.text} ${config.textSpacing}`}>
            GLOBAL
          </span>
          <span className="mx-3" />
          <span className={`font-medium ${config.text} ${config.textSpacing}`}>
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
    <span className="text-gold font-extralight text-2xl md:text-3xl leading-none">J</span>
    <div className="mx-2.5 flex items-center justify-center">
      <div className="w-[2px] bg-white/90 h-8 md:h-9" />
    </div>
    <span className="text-gold font-extralight text-2xl md:text-3xl leading-none">J</span>
    
    {/* GLOBAL CAPITAL - centered under the stroke */}
    <div className="ml-3 flex items-center text-white">
      <span className="font-semibold text-xs sm:text-sm md:text-base tracking-[0.2em]">
        GLOBAL
      </span>
      <span className="mx-2" />
      <span className="font-semibold text-xs sm:text-sm md:text-base tracking-[0.2em]">
        CAPITAL
      </span>
    </div>
  </div>
);

export default JJLogo;
