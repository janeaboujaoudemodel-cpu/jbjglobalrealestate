import * as React from "react";
import { Facebook, Instagram, Linkedin } from 'lucide-react';

interface SocialLinksProps {
  className?: string;
  iconClassName?: string;
  variant?: 'default' | 'gold' | 'white' | 'glow' | 'premium';
}

const SOCIAL_LINKS = {
  facebook: 'https://www.facebook.com/share/1G7CgSaV2L/?mibextid=wwXIfr',
  instagram: 'https://www.instagram.com/jbj.ae?igsh=NGs2b2cwNnNhb2Vl',
  linkedin: 'https://www.linkedin.com/company/jbj-global-real-estate/',
  youtube: 'https://youtube.com/@jbjglobalrealestate',
  tiktok: 'https://www.tiktok.com/@jbj.ae',
};

// Solid-fill SVG glyphs so all five icons render as identical "weight" on the
// gold metallic chip — matches YouTube/TikTok visual density.
const FacebookSolid = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94z"/>
  </svg>
);

const InstagramSolid = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.86 5.86 0 0 0-2.13 1.38A5.86 5.86 0 0 0 .63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.79.73 1.46 1.38 2.13a5.86 5.86 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.86 5.86 0 0 0 2.13-1.38 5.86 5.86 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.86 5.86 0 0 0-1.38-2.13A5.86 5.86 0 0 0 19.86.63C19.1.33 18.22.13 16.95.07 15.67.01 15.26 0 12 0z"/>
    <path d="M12 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zm0 10.16A4 4 0 1 1 16 12a4 4 0 0 1-4 4z"/>
    <circle cx="18.41" cy="5.59" r="1.44"/>
  </svg>
);

const LinkedinSolid = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 2.06-2.06 2.06 2.06 0 0 1-2.06 2.06zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"/>
  </svg>
);

export const SocialLinks = React.forwardRef<HTMLDivElement, SocialLinksProps>(({
  className = '',
  iconClassName,
  variant = 'default'
}, ref) => {
  const isPremium = variant === 'premium';
  const resolvedIconClass = iconClassName ?? (isPremium ? 'w-[18px] h-[18px]' : 'w-7 h-7');

  const getColorClasses = () => {
    switch (variant) {
      case 'gold':
        return 'text-[#1A1A1A] hover:text-[#1A1A1A]-light';
      case 'white':
        return 'text-white hover:text-[#1A1A1A]';
      case 'glow':
        return 'text-[#1A1A1A] hover:text-white drop-shadow-[0_0_8px_rgba(200,167,102,0.8)] hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] hover:scale-110 transition-all duration-300';
      case 'premium':
        // Unified circle chip — black glyph on champagne-tinted gold border,
        // fills to solid gold on hover (matches YouTube/TikTok hover style
        // applied uniformly to all social icons).
        return 'inline-flex items-center justify-center w-9 h-9 rounded-full bg-[hsl(var(--gold))]/15 border border-[hsl(var(--gold))] text-[#1A1A1A] hover:bg-[hsl(var(--gold))] hover:text-[#1A1A1A] hover:border-[hsl(var(--gold))] hover:scale-[1.06] hover:shadow-[0_0_18px_rgba(200,167,102,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--gold))]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F7F2EA] transition-all duration-200';
      default:
        return 'text-[#1A1A1A]/70 hover:text-[#1A1A1A]';
    }
  };

  const colorClasses = getColorClasses();

  // Premium uses solid-fill SVGs for visual parity with YouTube/TikTok.
  // Other variants keep the original Lucide line icons for backwards compat.
  const FacebookIcon = isPremium ? FacebookSolid : (Facebook as any);
  const InstagramIcon = isPremium ? InstagramSolid : (Instagram as any);
  const LinkedinIcon = isPremium ? LinkedinSolid : (Linkedin as any);

  return (
    <div ref={ref} className={`flex items-center gap-4 ${className}`}>
      <a
        href={SOCIAL_LINKS.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className={`transition-all duration-300 ${colorClasses}`}
        aria-label="Follow us on Facebook"
        data-no-contrast-guard
      >
        <FacebookIcon className={resolvedIconClass} />
      </a>
      <a
        href={SOCIAL_LINKS.instagram}
        target="_blank"
        rel="noopener noreferrer"
        className={`transition-all duration-300 ${colorClasses}`}
        aria-label="Follow us on Instagram"
        data-no-contrast-guard
      >
        <InstagramIcon className={resolvedIconClass} />
      </a>
      <a
        href={SOCIAL_LINKS.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className={`transition-all duration-300 ${colorClasses}`}
        aria-label="Follow us on LinkedIn"
        data-no-contrast-guard
      >
        <LinkedinIcon className={resolvedIconClass} />
      </a>
      <a
        href={SOCIAL_LINKS.youtube}
        target="_blank"
        rel="noopener noreferrer"
        className={`transition-all duration-300 ${colorClasses}`}
        aria-label="Subscribe on YouTube"
        data-no-contrast-guard
      >
        <svg className={resolvedIconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      </a>
      <a
        href={SOCIAL_LINKS.tiktok}
        target="_blank"
        rel="noopener noreferrer"
        className={`transition-all duration-300 ${colorClasses}`}
        aria-label="Follow us on TikTok"
        data-no-contrast-guard
      >
        <svg className={resolvedIconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
        </svg>
      </a>
    </div>
  );
});

SocialLinks.displayName = "SocialLinks";

export default SocialLinks;
