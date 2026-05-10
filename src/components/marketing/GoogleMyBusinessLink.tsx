import { MapPin, Star, ExternalLink } from 'lucide-react';

interface GoogleMyBusinessLinkProps {
  className?: string;
  variant?: 'badge' | 'button' | 'link';
}

// Replace with actual Google Business Profile link when verified
// NOTE: g.page URLs require a verified Google Business Profile from Google
// This cannot be created programmatically - must be set up via Google Business dashboard
const GMB_URL = 'https://www.google.com/maps/place/Dubai/@25.2048493,55.2707828,11z';

export const GoogleMyBusinessLink = ({
  className = '',
  variant = 'badge',
}: GoogleMyBusinessLinkProps) => {
  if (variant === 'button') {
    return (
      <a
        href={GMB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 bg-[#FDFBF7] text-[#1A1A1A] font-semibold px-6 py-3 rounded-xl hover:bg-[#F7F2EA] transition-all shadow-lg ${className}`}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        <span>Find us on Google</span>
        <ExternalLink className="w-4 h-4" />
      </a>
    );
  }

  if (variant === 'link') {
    return (
      <a
        href={GMB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 text-white/70 hover:text-[#1A1A1A] transition-colors ${className}`}
      >
        <MapPin className="w-4 h-4" />
        <span>View on Google Maps</span>
        <ExternalLink className="w-3 h-3" />
      </a>
    );
  }

  // Badge variant (default) — Champagne-on-ink premium chip designed for the
  // gold metallic Connect card in the footer. Black-on-light, fully readable.
  return (
    <a
      href={GMB_URL}
      target="_blank"
      rel="noopener noreferrer"
      data-no-contrast-guard
      className={`inline-flex items-center gap-2.5 bg-[#FDFBF7] hover:bg-[#F7F2EA] border border-[#1A1A1A]/15 hover:border-[#1A1A1A]/30 rounded-lg px-3 py-2 transition-all group shadow-[0_2px_8px_rgba(0,0,0,0.18)] ${className}`}
    >
      <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="none">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      <div className="text-left leading-tight">
        <div className="flex items-center gap-0.5 mb-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className="w-2.5 h-2.5 fill-amber-500 text-amber-500"
            />
          ))}
        </div>
        <p
          className="text-[11px] font-semibold tracking-[0.02em] whitespace-nowrap"
          style={{ color: '#1A1A1A' }}
        >
          Google Business Profile
        </p>
      </div>
    </a>
  );
};

export default GoogleMyBusinessLink;
