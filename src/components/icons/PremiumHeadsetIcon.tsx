interface PremiumHeadsetIconProps {
  className?: string;
  size?: number;
  color?: string;
}

/**
 * Premium AirPods Max-style headset SVG icon.
 * Used across support sections and email templates.
 */
export function PremiumHeadsetIcon({ className = "", size = 28, color = "currentColor" }: PremiumHeadsetIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
    >
      {/* Headband — thick premium arc */}
      <path d="M10 32 C10 12, 54 12, 54 32" stroke={color} strokeWidth="4.5" strokeLinecap="round" fill="none" />
      {/* Headband inner highlight */}
      <path d="M14 32 C14 16, 50 16, 50 32" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.35" fill="none" />
      {/* Crown mesh band */}
      <path d="M22 17 C22 13, 42 13, 42 17" stroke={color} strokeWidth="5" strokeLinecap="round" opacity="0.1" fill="none" />
      {/* Left arm */}
      <path d="M10 32 L10 38" stroke={color} strokeWidth="4" strokeLinecap="round" />
      {/* Right arm */}
      <path d="M54 32 L54 38" stroke={color} strokeWidth="4" strokeLinecap="round" />
      {/* Left ear cup */}
      <rect x="2" y="35" width="16" height="22" rx="8" fill={color} opacity="0.12" stroke={color} strokeWidth="2.5" />
      <rect x="5" y="39" width="10" height="14" rx="5" fill={color} opacity="0.06" />
      {/* Right ear cup */}
      <rect x="46" y="35" width="16" height="22" rx="8" fill={color} opacity="0.12" stroke={color} strokeWidth="2.5" />
      <rect x="49" y="39" width="10" height="14" rx="5" fill={color} opacity="0.06" />
      {/* Crown highlight */}
      <ellipse cx="32" cy="13" rx="7" ry="1.5" fill={color} opacity="0.1" />
    </svg>
  );
}

export default PremiumHeadsetIcon;
