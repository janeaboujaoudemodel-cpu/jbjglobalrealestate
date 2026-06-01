import { ReactNode, type CSSProperties } from "react";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ToolTheme, TOOL_INK } from "./toolThemes";

/**
 * PremiumToolShell — one outer card per tool with an animated ombré border
 * (accent → ink → accent rotating conic) and a centered hero on top.
 *
 * Visual contract:
 *  - Champagne page background (so the tool sits inside JBJ).
 *  - Single rounded-2xl shell with 2px animated colored border.
 *  - Centered hero (icon tile, eyebrow chip, title, subtitle).
 *  - Body slot for the actual tool sections.
 *  - No inner gold/champagne ToolCards — sections are separated by accent hairlines.
 */
interface Props {
  theme: ToolTheme;
  eyebrowIcon: LucideIcon;
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  showBack?: boolean;
  children: ReactNode;
  /** Optional max width of the shell */
  maxWidth?: string;
}

export const PremiumToolShell = ({
  theme,
  eyebrowIcon: EyebrowIcon,
  eyebrow,
  title,
  subtitle,
  showBack = true,
  children,
  maxWidth = "1200px",
}: Props) => {
  const navigate = useNavigate();

  const borderStyle: CSSProperties = {
    background: theme.borderConic,
    animation: "jbj-tool-border-spin 9s linear infinite",
  };

  return (
    <div
      className="min-h-screen w-full pt-6 md:pt-8 pb-12 px-3 sm:px-5"
      style={{ background: theme.pageWash }}
    >
      <style>{`
        @keyframes jbj-tool-border-spin {
          to { transform: rotate(1turn); }
        }
        .jbj-tool-shell-border::before {
          content: "";
          position: absolute;
          inset: -2px;
          border-radius: 1.25rem;
          padding: 2px;
          background: var(--jbj-tool-border);
          animation: jbj-tool-border-spin 9s linear infinite;
          -webkit-mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
                  mask-composite: exclude;
          pointer-events: none;
        }
      `}</style>

      <div
        className="relative mx-auto jbj-tool-shell-border"
        style={
          {
            maxWidth,
            "--jbj-tool-border": theme.borderConic,
          } as CSSProperties
        }
      >
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: "#FDFBF7",
            boxShadow:
              "0 30px 80px -30px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.04)",
          }}
        >
          {/* Hero — centered, ombré accent → ink. Back button lives inside. */}
          <div
            data-allow-dark-cta
            className="relative overflow-hidden text-center px-5 pt-6 pb-10 md:pt-7 md:pb-14"
            style={{ background: theme.heroGradient }}
          >
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at top, rgba(255,255,255,0.10), transparent 60%)",
              }}
            />

            {showBack && (
              <button
                onClick={() => navigate(-1)}
                data-allow-dark-cta
                data-no-contrast-guard
                className="allow-white absolute top-4 left-4 md:top-5 md:left-6 z-20 inline-flex items-center gap-1.5 text-xs md:text-sm font-medium transition-transform group"
                style={{ color: "#FFFFFF" }}
              >
                <ArrowLeft className="w-4 h-4 text-white group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-white">Back</span>
              </button>
            )}

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="relative z-10 max-w-3xl mx-auto pt-3"
            >
              <div className="flex justify-center mb-5">
                <span
                  data-allow-dark-cta
                  className="inline-flex items-center justify-center w-14 h-14 rounded-2xl"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: `1px solid ${theme.accent}`,
                    boxShadow: `0 0 30px ${theme.accent}55`,
                  }}
                >
                  <EyebrowIcon
                    className="w-6 h-6 allow-white"
                    style={{ color: "#FFFFFF" }}
                  />
                </span>
              </div>

              <div
                data-allow-dark-cta
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: `1px solid rgba(255,255,255,0.25)`,
                }}
              >
                <span
                  className="text-[10px] font-semibold uppercase tracking-[0.22em] allow-white"
                  style={{ color: "#FFFFFF" }}
                >
                  {eyebrow}
                </span>
              </div>

              <h1
                data-allow-dark-cta
                className="text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.1] mb-4 allow-white"
                style={{ color: "#FFFFFF" }}
              >
                {title}
              </h1>

              {subtitle && (
                <p
                  data-allow-dark-cta
                  className="text-sm md:text-base allow-white max-w-2xl mx-auto"
                  style={{ color: "rgba(255,255,255,0.82)" }}
                >
                  {subtitle}
                </p>
              )}
            </motion.div>
          </div>

          {/* Body */}
          <div
            className="px-4 py-8 md:px-8 md:py-10"
            style={{ color: TOOL_INK }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Lightweight wrapper that gives an existing tool page the animated
 * per-tool ombré border without rebuilding its internals. Used for tools
 * whose body is already a custom dark layout (Quiz, PropertyMeasurement,
 * InteriorDesignAI, BusinessCardScanner).
 */
export const ToolAnimatedFrame = ({
  theme,
  children,
  maxWidth = "1400px",
  className = "",
}: {
  theme: ToolTheme;
  children: ReactNode;
  maxWidth?: string;
  className?: string;
}) => (
  <div
    className={`min-h-screen w-full pt-6 md:pt-8 pb-12 px-3 sm:px-5 ${className}`}
    style={{ background: theme.pageWash }}
  >
    <style>{`
      @keyframes jbj-tool-border-spin { to { transform: rotate(1turn); } }
      .jbj-tool-frame-border::before {
        content: "";
        position: absolute;
        inset: -2px;
        border-radius: 1.25rem;
        padding: 2px;
        background: var(--jbj-tool-border);
        animation: jbj-tool-border-spin 9s linear infinite;
        -webkit-mask:
          linear-gradient(#000 0 0) content-box,
          linear-gradient(#000 0 0);
        -webkit-mask-composite: xor;
                mask-composite: exclude;
        pointer-events: none;
      }
    `}</style>
    <div
      className="relative mx-auto jbj-tool-frame-border"
      style={
        {
          maxWidth,
          "--jbj-tool-border": theme.borderConic,
        } as CSSProperties
      }
    >
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: "#FDFBF7",
          boxShadow:
            "0 30px 80px -30px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.04)",
        }}
      >
        {children}
      </div>
    </div>
  </div>
);

export default PremiumToolShell;
