/**
 * WhatsAppOutlineIcon — outline (stroked) WhatsApp glyph.
 *
 * Card CTA rows use lucide outline icons for Email and Call. A solid/filled
 * WhatsApp mark next to them reads inconsistent, so this icon is drawn in the
 * same "open from inside" outline language: transparent fill, 2px round strokes,
 * `currentColor` so the surface contract (white on emerald) applies as usual.
 */
interface WhatsAppOutlineIconProps {
  className?: string;
  strokeWidth?: number;
}

export function WhatsAppOutlineIcon({ className, strokeWidth = 2 }: WhatsAppOutlineIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Bubble */}
      <path d="M21 11.6a8.6 8.6 0 0 1-12.8 7.5L3 20.8l1.8-5A8.6 8.6 0 1 1 21 11.6Z" />
      {/* Handset */}
      <path d="M9.2 8.4h.7l1 2-.9 1a6.4 6.4 0 0 0 2.9 2.9l1-.9 2 1v.7a1.6 1.6 0 0 1-1.6 1.4A8 8 0 0 1 7.8 10a1.6 1.6 0 0 1 1.4-1.6Z" />
    </svg>
  );
}

export default WhatsAppOutlineIcon;
