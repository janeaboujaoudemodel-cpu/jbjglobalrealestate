import jbjMonogramNobuffer from "@/assets/jbj-monogram-nobuffer.png";
import jbjMonogramLightTransparent from "@/assets/jbj-monogram-light-transparent.png";

interface BrandedLoaderProps {
  text?: string;
  className?: string;
  variant?: 'dark' | 'light';
}

/**
 * Premium branded loader — compact JBJ monogram with a soft gold pulse.
 * Centered on screen. No long status text (a tiny dot row only).
 */
export function BrandedLoader({ text, className = "", variant = "light" }: BrandedLoaderProps) {
  const logo = variant === 'light' ? jbjMonogramNobuffer : jbjMonogramLightTransparent;

  // Center inside the visible content area (right of sidebar, below header).
  // CSS vars --app-content-left / --app-content-top are set by shell layouts
  // (OwnerDashboardShell, BrokerPortalLayout, MainLayout). They fall back to
  // 0 / 88px so public pages still center correctly under the global header.
  return (
    <div
      className={`fixed flex flex-col items-center justify-center gap-4 z-[60] pointer-events-none ${className}`}
      style={{
        top: "var(--app-content-top, 88px)",
        left: "var(--app-content-left, 0px)",
        right: 0,
        bottom: 0,
      }}
    >
      <div className="relative w-16 h-16 flex items-center justify-center">
        {/* Soft gold pulsing ring */}
        <span
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow: "0 0 0 1px rgba(184,149,85,0.35), 0 0 24px rgba(184,149,85,0.25)",
            animation: "jbj-pulse 1.6s ease-in-out infinite",
          }}
        />
        <img
          src={logo}
          alt=""
          aria-hidden="true"
          className="relative w-12 h-12 object-contain"
          style={{ animation: "jbj-fade 1.6s ease-in-out infinite" }}
         loading="lazy" decoding="async" />
      </div>
      {text ? (
        <span className="text-[10px] tracking-[0.25em] uppercase text-[#1A1A1A]/60">
          {text}
        </span>
      ) : null}
      <style>{`
        @keyframes jbj-pulse {
          0%, 100% { transform: scale(0.92); opacity: 0.55; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes jbj-fade {
          0%, 100% { opacity: 0.75; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/**
 * Compact branded loader for inline/button use — small monogram with pulse.
 */
export function BrandedLoaderInline({ size = 24, className = "", variant = "dark" }: { size?: number; className?: string; variant?: 'dark' | 'light' }) {
  const logo = variant === 'light' ? jbjMonogramNobuffer : jbjMonogramLightTransparent;

  return (
    <img
      src={logo}
      alt=""
      aria-hidden="true"
      className={`object-contain ${className}`}
      style={{
        width: size,
        height: size,
        animation: "jbj-fade 1.6s ease-in-out infinite",
      }}
     loading="lazy" decoding="async" />
  );
}
