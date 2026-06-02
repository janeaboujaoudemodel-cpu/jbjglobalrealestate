/**
 * CompareCTA — locked button primitives for the /compare AI shell.
 * Three variants, all with correct white-on-dark contrast that opts out of
 * the global champagne contrast guard via `data-no-contrast-guard` +
 * `data-allow-dark-cta`.
 */

import { ButtonHTMLAttributes, ReactNode, forwardRef } from "react";

type Variant = "gradient" | "glass" | "outline";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: ReactNode;
  children: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1020] focus-visible:ring-violet-400";

const STYLES: Record<Variant, { className: string; style?: React.CSSProperties }> = {
  gradient: {
    className: `${base} text-white border border-white/20 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(124,58,237,0.45)] active:scale-[0.98]`,
    style: {
      background:
        "linear-gradient(135deg, #3B82F6 0%, #7C3AED 50%, #EC4899 100%)",
      color: "#FFFFFF",
    },
  },
  glass: {
    className: `${base} text-white hover:bg-white/[0.10] hover:-translate-y-0.5`,
    style: {
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(192,132,252,0.4)",
      color: "#FFFFFF",
    },
  },
  outline: {
    className: `${base} text-white hover:bg-white/[0.06]`,
    style: {
      background: "transparent",
      border: "1px solid rgba(255,255,255,0.28)",
      color: "#FFFFFF",
    },
  },
};

const CompareCTA = forwardRef<HTMLButtonElement, Props>(
  ({ variant = "gradient", icon, children, className = "", style, ...rest }, ref) => {
    const v = STYLES[variant];
    return (
      <button
        ref={ref}
        data-no-contrast-guard
        data-allow-dark-cta
        data-on-dark
        className={`${v.className} allow-white ${className}`}
        style={{ ...v.style, ...style }}
        {...rest}
      >
        {icon}
        <span className="allow-white" style={{ color: "#FFFFFF" }}>
          {children}
        </span>
      </button>
    );
  },
);
CompareCTA.displayName = "CompareCTA";

export default CompareCTA;
