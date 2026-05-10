import { Star } from 'lucide-react';

interface TrustpilotWidgetProps {
  className?: string;
}

export const TrustpilotWidget = ({ className = '' }: TrustpilotWidgetProps) => {
  // Placeholder widget - replace with actual Trustpilot embed when available
  const trustpilotUrl = 'https://www.trustpilot.com/review/jbj.ae';

  return (
    <a
      href={trustpilotUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-3 bg-[#1A1A1A]/50 hover:bg-[#1A1A1A] border border-[#1A1A1A]/50 rounded-xl px-4 py-3 transition-all group ${className}`}
    >
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className="w-4 h-4 fill-emerald-400 text-emerald-400"
          />
        ))}
      </div>
      <div className="text-left">
        <p className="text-white text-sm font-medium group-hover:text-[#1A1A1A] transition-colors">
          Excellent on Trustpilot
        </p>
        <p className="text-white/90 text-xs">Read our reviews</p>
      </div>
      <svg
        className="w-20 h-6 ml-2"
        viewBox="0 0 126 31"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M33.3 15.5L37.7 14L39.2 18.4L33.3 22.8V15.5Z"
          fill="#00B67A"
        />
        <path
          d="M39.2 18.4L37.7 14L43.6 14L39.2 18.4Z"
          fill="#00B67A"
        />
        <path
          d="M39.2 18.4L43.6 22.8L39.2 22.8L39.2 18.4Z"
          fill="#005128"
        />
        <text
          x="50"
          y="20"
          fill="#FFFFFF"
          fontSize="14"
          fontFamily="Arial, sans-serif"
          fontWeight="bold"
        >
          Trustpilot
        </text>
      </svg>
    </a>
  );
};

export default TrustpilotWidget;
