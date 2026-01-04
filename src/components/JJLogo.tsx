// JJ Logo Component using the original logo image
import jjLogoImage from "@/assets/jj-flags.png";

interface JJLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'footer' | 'header';
  className?: string;
}

const sizeConfig = {
  sm: 'h-8 md:h-10',
  md: 'h-10 md:h-12',
  lg: 'h-16 md:h-20',
  xl: 'h-20 md:h-24',
  footer: 'h-24 md:h-32 lg:h-40',
  header: 'h-10 md:h-12',
};

export const JJLogo = ({ size = 'md', className = '' }: JJLogoProps) => {
  return (
    <img 
      src={jjLogoImage} 
      alt="JJ Global Capital" 
      className={`${sizeConfig[size]} w-auto object-contain ${className}`}
    />
  );
};

// Header-specific logo using the original image
export const JJLogoHeader = ({ className = '' }: { className?: string }) => (
  <img 
    src={jjLogoImage} 
    alt="JJ Global Capital" 
    className={`h-10 md:h-12 w-auto object-contain ${className}`}
  />
);

export default JJLogo;