import { Facebook, Instagram, Linkedin, Youtube, Twitter } from 'lucide-react';

interface SocialLinksProps {
  className?: string;
  iconClassName?: string;
  variant?: 'default' | 'gold' | 'white';
}

const SOCIAL_LINKS = {
  facebook: 'https://facebook.com/jjglobalcapital',
  instagram: 'https://instagram.com/jjglobalcapital',
  linkedin: 'https://linkedin.com/company/jjglobalcapital',
  youtube: 'https://youtube.com/@jjglobalcapital',
  twitter: 'https://x.com/jjglobalcapital',
};

export const SocialLinks = ({ 
  className = '', 
  iconClassName = 'w-5 h-5',
  variant = 'default' 
}: SocialLinksProps) => {
  const getColorClasses = () => {
    switch (variant) {
      case 'gold':
        return 'text-gold hover:text-gold-light';
      case 'white':
        return 'text-white hover:text-gold';
      default:
        return 'text-zinc-400 hover:text-gold';
    }
  };

  const colorClasses = getColorClasses();

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <a
        href={SOCIAL_LINKS.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className={`transition-colors ${colorClasses}`}
        aria-label="Follow us on Facebook"
      >
        <Facebook className={iconClassName} />
      </a>
      <a
        href={SOCIAL_LINKS.instagram}
        target="_blank"
        rel="noopener noreferrer"
        className={`transition-colors ${colorClasses}`}
        aria-label="Follow us on Instagram"
      >
        <Instagram className={iconClassName} />
      </a>
      <a
        href={SOCIAL_LINKS.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className={`transition-colors ${colorClasses}`}
        aria-label="Follow us on LinkedIn"
      >
        <Linkedin className={iconClassName} />
      </a>
      <a
        href={SOCIAL_LINKS.youtube}
        target="_blank"
        rel="noopener noreferrer"
        className={`transition-colors ${colorClasses}`}
        aria-label="Subscribe on YouTube"
      >
        <Youtube className={iconClassName} />
      </a>
      <a
        href={SOCIAL_LINKS.twitter}
        target="_blank"
        rel="noopener noreferrer"
        className={`transition-colors ${colorClasses}`}
        aria-label="Follow us on X (Twitter)"
      >
        <Twitter className={iconClassName} />
      </a>
    </div>
  );
};

export default SocialLinks;
