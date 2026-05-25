import { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ToolTheme, TOOL_GOLD } from "./toolThemes";

interface ToolHeroProps {
  theme: ToolTheme;
  eyebrowIcon: LucideIcon;
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  showBack?: boolean;
  children?: ReactNode;
}

/**
 * Premium ombré hero band shared by all calculator-style tools.
 * Theme drives the gradient; gold hairline grounds it to the brand.
 */
export const ToolHero = ({
  theme,
  eyebrowIcon: EyebrowIcon,
  eyebrow,
  title,
  subtitle,
  showBack = true,
  children,
}: ToolHeroProps) => {
  const navigate = useNavigate();

  return (
    <section
      data-allow-dark-cta
      className="relative overflow-hidden"
      style={{
        background: theme.heroGradient,
        borderBottom: `1px solid ${TOOL_GOLD}`,
      }}
    >
      {/* Subtle gold radial accent */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background:
            "radial-gradient(ellipse at top right, rgba(184,149,85,0.18), transparent 60%)",
        }}
      />

      <div className="container mx-auto px-4 pt-28 pb-16 md:pt-32 md:pb-20 relative z-10">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            data-allow-dark-cta
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-8 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl"
        >
          <div
            data-allow-dark-cta
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: `1px solid ${TOOL_GOLD}66`,
            }}
          >
            <EyebrowIcon className="w-4 h-4" style={{ color: TOOL_GOLD }} />
            <span
              className="text-xs font-semibold uppercase tracking-[0.18em]"
              style={{ color: TOOL_GOLD }}
            >
              {eyebrow}
            </span>
          </div>

          <h1
            data-allow-dark-cta
            className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-5 leading-[1.1]"
          >
            {title}
          </h1>

          {subtitle && (
            <p
              data-allow-dark-cta
              className="text-white/85 text-lg md:text-xl max-w-2xl"
            >
              {subtitle}
            </p>
          )}

          {children}
        </motion.div>
      </div>
    </section>
  );
};
