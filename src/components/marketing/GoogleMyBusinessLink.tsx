import { MapPin, Star, ExternalLink } from 'lucide-react';

interface GoogleMyBusinessLinkProps {
  className?: string;
  variant?: 'badge' | 'button' | 'link';
}

// Replace with actual Google Business Profile link when verified
const GMB_URL = 'https://g.page/jjglobalcapital';

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
        className={`inline-flex items-center gap-2 bg-white text-black font-semibold px-6 py-3 rounded-xl hover:bg-gray-100 transition-all shadow-lg ${className}`}
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
        className={`inline-flex items-center gap-2 text-zinc-400 hover:text-gold transition-colors ${className}`}
      >
        <MapPin className="w-4 h-4" />
        <span>View on Google Maps</span>
        <ExternalLink className="w-3 h-3" />
      </a>
    );
  }

  // Badge variant (default)
  return (
    <a
      href={GMB_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-3 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-xl px-4 py-3 transition-all group ${className}`}
    >
      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
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
      </div>
      <div className="text-left">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className="w-3 h-3 fill-amber-400 text-amber-400"
            />
          ))}
        </div>
        <p className="text-white text-sm font-medium group-hover:text-gold transition-colors">
          Google Business Profile
        </p>
      </div>
    </a>
  );
};

export default GoogleMyBusinessLink;
