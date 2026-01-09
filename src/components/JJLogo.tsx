// JJ Logo Component - Precise alignment for premium branding
// GLOBAL ends under first J, CAPITAL starts under second J, divider centered in gap

interface JJLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'footer';
  showText?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: {
    j: 'text-lg md:text-xl',
    dividerHeight: 'h-3 md:h-4',
    text: 'text-[8px] md:text-[9px]',
    gap: '3px',
    textGap: '2px',
    wordGap: '6px',
  },
  md: {
    j: 'text-xl md:text-2xl',
    dividerHeight: 'h-4 md:h-5',
    text: 'text-[9px] md:text-[10px]',
    gap: '4px',
    textGap: '4px',
    wordGap: '8px',
  },
  lg: {
    j: 'text-4xl md:text-5xl lg:text-6xl',
    dividerHeight: 'h-8 md:h-10 lg:h-12',
    text: 'text-sm md:text-base lg:text-lg',
    gap: '6px',
    textGap: '6px',
    wordGap: '10px',
  },
  xl: {
    j: 'text-5xl md:text-6xl lg:text-7xl',
    dividerHeight: 'h-10 md:h-12 lg:h-14',
    text: 'text-base md:text-lg lg:text-xl',
    gap: '8px',
    textGap: '8px',
    wordGap: '12px',
  },
  footer: {
    j: 'text-6xl md:text-7xl lg:text-8xl',
    dividerHeight: 'h-12 md:h-16 lg:h-20',
    text: 'text-xl md:text-2xl lg:text-3xl',
    gap: '12px',
    textGap: '12px',
    wordGap: '16px',
  },
};

// Main logo component with precise alignment
export const JJLogo = ({ size = 'md', showText = true, className = '' }: JJLogoProps) => {
  const config = sizeConfig[size];
  const isFooter = size === 'footer';
  
  // Footer uses all black, others use gold J's
  const jColor = isFooter ? 'text-black' : 'text-gold';
  const dividerColor = 'bg-black';

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* J | J Monogram */}
      <div className="flex items-center justify-center">
        <span 
          className={`${jColor} font-extralight ${config.j} leading-none ${!isFooter ? 'drop-shadow-[0_0_8px_rgba(168,146,90,0.3)]' : ''}`}
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          J
        </span>
        
        {/* Centered Divider */}
        <div 
          className="flex items-center justify-center"
          style={{ marginLeft: config.gap, marginRight: config.gap }}
        >
          <div className={`w-[2px] ${dividerColor} ${config.dividerHeight}`} />
        </div>
        
        <span 
          className={`${jColor} font-extralight ${config.j} leading-none ${!isFooter ? 'drop-shadow-[0_0_8px_rgba(168,146,90,0.3)]' : ''}`}
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          J
        </span>
      </div>

      {/* GLOBAL REAL ESTATE - L ends under first J, E starts under second J */}
      {showText && (
        <div 
          className="flex items-center justify-center text-black"
          style={{ 
            fontFamily: "Poppins, sans-serif",
            marginTop: config.textGap,
            letterSpacing: '0.08em'
          }}
        >
          <span className={`font-semibold ${config.text}`}>
            GLOBAL
          </span>
          <span style={{ width: config.wordGap }} />
          <span className={`font-semibold ${config.text}`}>
            REAL ESTATE
          </span>
        </div>
      )}
    </div>
  );
};

// Header-specific logo - Horizontal layout with tight spacing
export const JJLogoHeader = ({ className = '' }: { className?: string }) => (
  <div 
    className={`flex items-center ${className}`}
    style={{ fontFamily: "Poppins, sans-serif" }}
  >
    {/* J | J Monogram */}
    <span className="text-gold font-extralight text-2xl md:text-3xl leading-none drop-shadow-[0_0_8px_rgba(168,146,90,0.3)]">J</span>
    <div className="mx-1 flex items-center justify-center">
      <div className="w-[1.5px] bg-black h-5 md:h-6" />
    </div>
    <span className="text-gold font-extralight text-2xl md:text-3xl leading-none drop-shadow-[0_0_8px_rgba(168,146,90,0.3)]">J</span>
    
    {/* GLOBAL REAL ESTATE - Horizontal, tight spacing */}
    <div className="ml-2 md:ml-3 flex items-center text-black">
      <span className="font-semibold text-sm md:text-base lg:text-lg tracking-[0.08em]">
        GLOBAL
      </span>
      <span className="mx-1" />
      <span className="font-semibold text-sm md:text-base lg:text-lg tracking-[0.08em]">
        REAL ESTATE
      </span>
    </div>
  </div>
);

export default JJLogo;
