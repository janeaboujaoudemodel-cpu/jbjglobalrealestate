import * as React from "react";
import { Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';

interface SocialLinksProps {
  className?: string;
  iconClassName?: string;
  variant?: 'default' | 'gold' | 'white' | 'glow';
}

const SOCIAL_LINKS = {
  facebook: 'https://www.facebook.com/share/1G7CgSaV2L/?mibextid=wwXIfr',
  instagram: 'https://www.instagram.com/jbj.ae?igsh=NGs2b2cwNnNhb2Vl',
  linkedin: 'https://www.linkedin.com/company/jbj-global-real-estate/',
  youtube: 'https://youtube.com/@jbjglobalrealestate',
  tiktok: 'https://www.tiktok.com/@jbj.ae',
};

export const SocialLinks = React.forwardRef<HTMLDivElement, SocialLinksProps>(({
  className = '',
  iconClassName = 'w-5 h-5',
  variant = 'default'
}, ref) => {
  const getColorClasses = () => {
    switch (variant) {
      case 'gold':
        return 'text-gold hover:text-gold-light';
      case 'white':
        return 'text-white hover:text-gold';
      case 'glow':
        return 'text-gold hover:text-white drop-shadow-[0_0_8px_rgba(200,167,102,0.8)] hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] hover:scale-110 transition-all duration-300';
      default:
        return 'text-zinc-400 hover:text-gold';
    }
  };

  const colorClasses = getColorClasses();

  return (
    <div ref={ref} className={`flex items-center gap-4 ${className}`}>
      <a
        href={SOCIAL_LINKS.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className={`transition-all duration-300 ${colorClasses}`}
        aria-label="Follow us on Facebook"
      >
        <Facebook className={iconClassName} />
      </a>
      <a
        href={SOCIAL_LINKS.instagram}
        target="_blank"
        rel="noopener noreferrer"
        className={`transition-all duration-300 ${colorClasses}`}
        aria-label="Follow us on Instagram"
      >
        <Instagram className={iconClassName} />
      </a>
      <a
        href={SOCIAL_LINKS.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className={`transition-all duration-300 ${colorClasses}`}
        aria-label="Follow us on LinkedIn"
      >
        <Linkedin className={iconClassName} />
      </a>
      <a
        href={SOCIAL_LINKS.youtube}
        target="_blank"
        rel="noopener noreferrer"
        className={`transition-all duration-300 ${colorClasses}`}
        aria-label="Subscribe on YouTube"
      >
        <Youtube className={iconClassName} />
      </a>
      <a
        href={SOCIAL_LINKS.tiktok}
        target="_blank"
        rel="noopener noreferrer"
        className={`transition-all duration-300 ${colorClasses}`}
        aria-label="Follow us on TikTok"
      >
        <svg className={iconClassName} viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
        </svg>
      </a>
    </div>
  );
});

SocialLinks.displayName = "SocialLinks";

export default SocialLinks;
