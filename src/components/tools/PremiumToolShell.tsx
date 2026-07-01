import { ReactNode, type CSSProperties } from "react";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ToolTheme, TOOL_INK } from "./toolThemes";
import FullscreenToolToggle from "./FullscreenToolToggle";


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
  /** When true, the body background flips to ink + accent gradient
   *  (Property Measurement style) and inner shadcn Cards/inputs are
   *  auto-darkened via [data-tool-darkbody] global CSS. */
  darkBody?: boolean;
}

export const PremiumToolShell = ({
  theme,
  eyebrowIcon: EyebrowIcon,
  eyebrow,
  title,
  subtitle,
  showBack = true,
  children,
  darkBody = false,
}: Props) => {
  const navigate = useNavigate();

  const borderStyle: CSSProperties = {
    background: theme.borderConic,
    animation: "jbj-tool-border-spin 9s linear infinite",
  };

  return (
    <div
      data-tool-shell-root
      data-tool-emerald
      data-allow-dark-cta
      data-no-contrast-guard
      data-surface="dark"
      className="allow-white min-h-screen w-full p-0"
      style={{ background: theme.pageWash, color: "#FFFFFF" }}
    >
      <FullscreenToolToggle />
      <style>{`
        @keyframes jbj-tool-border-spin { to { transform: rotate(1turn); } }
        [data-tool-emerald],
        [data-tool-emerald] :is(h1,h2,h3,h4,h5,h6,p,span,label,small,strong,em,li,a,button,textarea,input,div,figcaption,dt,dd,th,td,time):not([class*="bg-clip-text"]):not([data-price-pill]) {
          color: #FFFFFF;
          -webkit-text-fill-color: #FFFFFF;
        }
        [data-tool-emerald] .text-muted-foreground,
        [data-tool-emerald] .id-text-muted { color: rgba(255,255,255,0.76) !important; -webkit-text-fill-color: rgba(255,255,255,0.76) !important; }
        [data-tool-emerald] :is(svg, [class*="lucide"]):not([data-allow-gold]):not(.text-gold) { color: #FFFFFF; }
        [data-tool-emerald] [data-allow-gold], [data-tool-emerald] .text-gold, [data-tool-emerald] .jj-gold-accent { color: #B89555 !important; -webkit-text-fill-color: #B89555 !important; }
        [data-tool-emerald] input, [data-tool-emerald] textarea, [data-tool-emerald] select {
          background: linear-gradient(135deg, rgba(4,40,28,0.88), rgba(0,0,0,0.86)) !important;
          border: 1px solid rgba(184,149,85,0.55) !important;
          color: #FFFFFF !important;
          -webkit-text-fill-color: #FFFFFF !important;
          caret-color: #FFFFFF !important;
        }
        [data-tool-emerald] input::placeholder, [data-tool-emerald] textarea::placeholder { color: rgba(255,255,255,0.55) !important; }
        .jbj-tool-shell-border::before {
          content: ""; position: absolute; inset: -2px; border-radius: 1.25rem; padding: 2px;
          background: var(--jbj-tool-border); animation: jbj-tool-border-spin 9s linear infinite;
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none;
        }
      `}</style>



      <div
        data-tool-frame
        className="relative mx-0 w-full jbj-tool-shell-border"
        style={
          {
            maxWidth: "none",
            "--jbj-tool-border": theme.borderConic,
          } as CSSProperties
        }
      >
        <div
          className="relative min-h-screen overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, #064E3B 0%, #042c1c 48%, #000000 100%)",
            boxShadow:
              "0 30px 80px -30px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(184,149,85,0.45)",
          }}
        >
          {/* Hero — emerald ombré, white ink. Back button lives inside. */}
          <div
            data-allow-dark-cta
            data-surface="dark"
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
                className="absolute top-4 left-4 md:top-5 md:left-6 z-20 inline-flex items-center gap-1.5 text-xs md:text-sm font-medium transition-transform group allow-white"
                style={{ color: "#FFFFFF" }}
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform allow-white" style={{ color: "#FFFFFF" }} />
                <span className="allow-white" style={{ color: "#FFFFFF" }}>Back</span>
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
                  className="inline-flex items-center justify-center w-14 h-14 rounded-2xl"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(6,78,59,0.96) 0%, rgba(0,0,0,0.98) 100%)",
                    border: `1px solid ${theme.accent}`,
                    boxShadow: `0 8px 24px -10px ${theme.accent}88`,
                  }}
                >
                  <EyebrowIcon
                    className="w-6 h-6 allow-white"
                    style={{ color: "#FFFFFF" }}
                  />
                </span>
              </div>

              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4"
                style={{
                  background: "rgba(6,78,59,0.55)",
                  border: `1px solid ${theme.accent}88`,
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
                className="text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.1] mb-4 allow-white"
                style={{ color: "#FFFFFF" }}
              >
                {title}
              </h1>

              {subtitle && (
                <p
                  className="text-sm md:text-base max-w-2xl mx-auto allow-white"
                  style={{ color: "rgba(255,255,255,0.82)" }}
                >
                  {subtitle}
                </p>
              )}
            </motion.div>
          </div>

          {/* Body */}
          <div
            data-tool-darkbody="true"
            className="px-4 py-8 md:px-8 md:py-10"
            style={{
              color: "#FFFFFF",
              ["--tool-accent" as any]: theme.accent,
              ["--tool-accent-soft" as any]: `${theme.accent}33`,
              ["--tool-accent-border" as any]: `${theme.accent}66`,
            }}
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
  className = "",
}: {
  theme: ToolTheme;
  children: ReactNode;
  maxWidth?: string;
  className?: string;
}) => (
  <div
    data-tool-shell-root
    data-tool-emerald
    data-allow-dark-cta
    data-no-contrast-guard
    data-surface="dark"
    className={`allow-white min-h-screen w-full p-0 ${className}`}
    style={
      {
        background:
          "linear-gradient(180deg, #064E3B 0%, #042c1c 48%, #000000 100%)",
        color: "#FFFFFF",
        ["--tool-accent" as string]: theme.accent,
        ["--tool-accent-border" as string]: theme.accentBorder,
      } as CSSProperties
    }
  >
    <FullscreenToolToggle />
    <style>{`
      @keyframes jbj-tool-border-spin { to { transform: rotate(1turn); } }
      [data-tool-emerald],
      [data-tool-emerald] :is(h1,h2,h3,h4,h5,h6,p,span,label,small,strong,em,li,a,button,textarea,input,div,figcaption,dt,dd,th,td,time):not([class*="bg-clip-text"]):not([data-price-pill]) {
        color: #FFFFFF; -webkit-text-fill-color: #FFFFFF;
      }
      [data-tool-emerald] .text-muted-foreground { color: rgba(255,255,255,0.76) !important; -webkit-text-fill-color: rgba(255,255,255,0.76) !important; }
      [data-tool-emerald] :is(svg, [class*="lucide"]):not([data-allow-gold]):not(.text-gold) { color: #FFFFFF; }
      [data-tool-emerald] [data-allow-gold], [data-tool-emerald] .text-gold { color: #B89555 !important; -webkit-text-fill-color: #B89555 !important; }
      [data-tool-emerald] input, [data-tool-emerald] textarea, [data-tool-emerald] select {
        background: linear-gradient(135deg, rgba(4,40,28,0.88), rgba(0,0,0,0.86)) !important;
        border: 1px solid rgba(184,149,85,0.55) !important;
        color: #FFFFFF !important; -webkit-text-fill-color: #FFFFFF !important; caret-color: #FFFFFF !important;
      }
      [data-tool-emerald] input::placeholder, [data-tool-emerald] textarea::placeholder { color: rgba(255,255,255,0.55) !important; }
      .jbj-tool-frame-border::before {
        content: ""; position: absolute; inset: -2px; border-radius: 1.25rem; padding: 2px;
        background: var(--jbj-tool-border); animation: jbj-tool-border-spin 9s linear infinite;
        -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
        -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none;
      }
    `}</style>
    <div
      data-tool-frame
      className="relative mx-0 w-full jbj-tool-frame-border"
      style={
        {
          maxWidth: "none",
          "--jbj-tool-border": theme.borderConic,
        } as CSSProperties
      }
    >
      <div
        className="relative min-h-screen overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, #064E3B 0%, #042c1c 48%, #000000 100%)",
          boxShadow:
            "0 30px 80px -30px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(184,149,85,0.45)",
        }}
      >
        {children}
      </div>
    </div>
  </div>
);


export default PremiumToolShell;
