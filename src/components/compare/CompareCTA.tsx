/**
 * CompareCTA — champagne/gold CTA primitives for the /compare shell.
 * Variants: gradient (ink CTA), glass (champagne raised), outline (gold hairline).
 */

import { ButtonHTMLAttributes, ReactNode, forwardRef } from "react";

type Variant = "gradient" | "glass" | "outline";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: ReactNode;
  children: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F7F2EA] focus-visible:ring-[#064E3B]";

const CompareCTA = forwardRef<HTMLButtonElement, Props>(
  ({ variant = "gradient", icon, children, className = "", style, ...rest }, ref) => {
    if (variant === "gradient") {
      // Primary ink CTA on champagne — white text/icons stay legible (own dark bg)
      return (
        <button
          ref={ref}
          data-cta="dark"
          className={`jj-cta-dark ${base} ${className}`}
          style={style}
          {...rest}
        >
          {icon}
          <span>{children}</span>
        </button>
      );
    }

    if (variant === "glass") {
      return (
        <button
          ref={ref}
          data-cta="champagne"
          className={`jj-cta-champagne ${base} ${className}`}
          style={style}
          {...rest}
        >
          {icon}
          <span>{children}</span>
        </button>
      );
    }

    return (
      <button
        ref={ref}
        data-cta="outline"
        className={`jj-cta-outline ${base} ${className}`}
        style={{
          background: "linear-gradient(135deg, #064E3B 0%, #042c1c 58%, #000000 100%)",
          border: "0",
          color: "#FFFFFF",
          WebkitTextFillColor: "#FFFFFF",
          boxShadow: "0 10px 24px -12px rgba(6,78,59,0.82), inset 0 1px 0 rgba(255,255,255,0.16)",
          ...style,
        }}
        {...rest}
      >
        {icon}
        <span>{children}</span>
      </button>
    );
  },
);
CompareCTA.displayName = "CompareCTA";

export default CompareCTA;
