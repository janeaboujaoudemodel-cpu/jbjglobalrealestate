import { ReactNode, type CSSProperties } from "react";
import { ArrowLeft, Info, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ToolTheme, TOOL_CARD_BG, TOOL_WHITE_BORDER, TOOL_GOLD } from "./toolThemes";
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
  /** Show "Powered by JBJ" lockup + optional "Read more" pill at top of body (Property Evaluator layout). Default true. */
  poweredBy?: boolean;
  /** Optional "Read more" pill (href + label) rendered next to Powered By. */
  readMore?: { href: string; label: string };
}

export const PremiumToolShell = ({
  theme,
  eyebrowIcon: EyebrowIcon,
  eyebrow,
  title,
  subtitle,
  showBack = true,
  children,
  poweredBy = true,
  readMore,
}: Props) => {
  const navigate = useNavigate();

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
        [data-tool-emerald],
        [data-tool-emerald] * {
          border-color: rgba(255,255,255,0.42) !important;
          outline-color: rgba(255,255,255,0.52) !important;
        }
        [data-tool-emerald] .text-muted-foreground,
        [data-tool-emerald] .id-text-muted { color: rgba(255,255,255,0.76) !important; -webkit-text-fill-color: rgba(255,255,255,0.76) !important; }
        [data-tool-emerald] :is(svg, [class*="lucide"]):not([data-allow-gold]):not(.text-gold) { color: #FFFFFF; }
        [data-tool-emerald] [data-allow-gold], [data-tool-emerald] .text-gold, [data-tool-emerald] .jj-gold-accent { color: #FFFFFF !important; -webkit-text-fill-color: #FFFFFF !important; }
        [data-tool-emerald] input, [data-tool-emerald] textarea, [data-tool-emerald] select, [data-tool-emerald] [role="combobox"] {
          background: linear-gradient(135deg, rgba(8,18,13,0.92), rgba(0,0,0,0.88)) !important;
          border: 1px solid rgba(255,255,255,0.42) !important;
          color: #FFFFFF !important;
          -webkit-text-fill-color: #FFFFFF !important;
          caret-color: #FFFFFF !important;
        }
        [data-tool-emerald] input::placeholder, [data-tool-emerald] textarea::placeholder { color: rgba(255,255,255,0.55) !important; }
        [data-tool-emerald] [class*="bg-rose"],
        [data-tool-emerald] [class*="bg-pink"],
        [data-tool-emerald] [class*="bg-violet"],
        [data-tool-emerald] [class*="bg-indigo"],
        [data-tool-emerald] [class*="bg-amber"],
        [data-tool-emerald] [class*="bg-teal"],
        [data-tool-emerald] [class*="bg-champagne"],
        [data-tool-emerald] .bg-white,
        [data-tool-emerald] [class*="bg-white/"] {
          background: ${TOOL_CARD_BG} !important;
          background-color: transparent !important;
        }
        [data-tool-emerald] [class*="border-rose"],
        [data-tool-emerald] [class*="border-pink"],
        [data-tool-emerald] [class*="border-violet"],
        [data-tool-emerald] [class*="border-indigo"],
        [data-tool-emerald] [class*="border-amber"],
        [data-tool-emerald] [class*="border-teal"],
        [data-tool-emerald] [class*="border-champagne"] { border-color: ${TOOL_WHITE_BORDER} !important; }
        [data-tool-emerald] [class*="text-rose"],
        [data-tool-emerald] [class*="text-pink"],
        [data-tool-emerald] [class*="text-violet"],
        [data-tool-emerald] [class*="text-indigo"],
        [data-tool-emerald] [class*="text-amber"],
        [data-tool-emerald] [class*="text-teal"] { color: #FFFFFF !important; -webkit-text-fill-color: #FFFFFF !important; }
        [data-tool-emerald] [style*="rgba(251,113,133"],
        [data-tool-emerald] [style*="rgba(159,18,57"],
        [data-tool-emerald] [style*="rgba(7,16,31"],
        [data-tool-emerald] [style*="rgba(4,7,13"],
        [data-tool-emerald] [style*="#FDFBF7"],
        [data-tool-emerald] [style*="#F7F2EA"],
        [data-tool-emerald] [style*="#EFE6D6"] {
          background: ${TOOL_CARD_BG} !important;
          color: #FFFFFF !important;
        }
        [data-tool-emerald] [data-slot="card"],
        [data-tool-emerald] .jbj-card,
        [data-tool-emerald] .card {
          background: ${TOOL_CARD_BG} !important;
          border-color: ${TOOL_WHITE_BORDER} !important;
          color: #FFFFFF !important;
        }
        [data-tool-emerald] :is(button, a)[data-allow-dark-cta],
        [data-tool-emerald] :is(button, a).id-primary,
        [data-tool-emerald] :is(button, a).bcs-action-dark,
        [data-tool-emerald] :is(button, a):not([role="tab"]):not([data-fullscreen-tool-toggle])[class*="bg-rose"],
        [data-tool-emerald] :is(button, a):not([role="tab"]):not([data-fullscreen-tool-toggle])[class*="bg-red"],
        [data-tool-emerald] :is(button, a):not([role="tab"]):not([data-fullscreen-tool-toggle])[class*="bg-amber"] {
          background: linear-gradient(135deg, #065F46 0%, #04231A 55%, #022c1c 100%) !important;
          border-color: rgba(255,255,255,0.46) !important;
          color: #FFFFFF !important;
          -webkit-text-fill-color: #FFFFFF !important;
        }
        [data-tool-emerald] :is(button, a)[data-allow-dark-cta] svg,
        [data-tool-emerald] :is(button, a).id-primary svg,
        [data-tool-emerald] :is(button, a).bcs-action-dark svg { color: #FFFFFF !important; stroke: #FFFFFF !important; }
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
              "linear-gradient(180deg, #041610 0%, #02100a 40%, #000000 100%)",
            boxShadow:
              "0 30px 80px -30px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.22)",
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
                    border: `1px solid ${TOOL_WHITE_BORDER}`,
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
                  border: `1px solid ${TOOL_WHITE_BORDER}`,
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
            {poweredBy && (
              <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
                {/* Powered by JBJ lockup — white on dark body (Property Evaluator layout) */}
                <div className="flex items-center gap-3">
                  <div aria-hidden className="h-px w-16" style={{ background: TOOL_GOLD }} />
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-[0.22em] font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>Powered by</span>
                    <span className="text-xs font-bold tracking-[0.14em]" style={{ color: "#FFFFFF" }}>JBJ GLOBAL REAL ESTATE</span>
                  </div>
                  <div aria-hidden className="h-px w-16" style={{ background: TOOL_GOLD }} />
                </div>
                {readMore && (
                  <a
                    href={readMore.href}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.14em] transition-colors"
                    style={{
                      background: "rgba(6,78,59,0.55)",
                      border: `1px solid ${TOOL_WHITE_BORDER}`,
                      color: "#FFFFFF",
                    }}
                  >
                    <Info className="w-3.5 h-3.5" />
                    {readMore.label}
                  </a>
                )}
              </div>
            )}
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
          "linear-gradient(180deg, #041610 0%, #02100a 40%, #000000 100%)",
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
      [data-tool-emerald],
      [data-tool-emerald] * {
        border-color: rgba(255,255,255,0.42) !important;
        outline-color: rgba(255,255,255,0.52) !important;
      }
      [data-tool-emerald] .text-muted-foreground { color: rgba(255,255,255,0.76) !important; -webkit-text-fill-color: rgba(255,255,255,0.76) !important; }
      [data-tool-emerald] :is(svg, [class*="lucide"]):not([data-allow-gold]):not(.text-gold) { color: #FFFFFF; }
      [data-tool-emerald] [data-allow-gold], [data-tool-emerald] .text-gold { color: #FFFFFF !important; -webkit-text-fill-color: #FFFFFF !important; }
      [data-tool-emerald] input, [data-tool-emerald] textarea, [data-tool-emerald] select, [data-tool-emerald] [role="combobox"] {
        background: linear-gradient(135deg, rgba(8,18,13,0.92), rgba(0,0,0,0.88)) !important;
        border: 1px solid rgba(255,255,255,0.42) !important;
        color: #FFFFFF !important; -webkit-text-fill-color: #FFFFFF !important; caret-color: #FFFFFF !important;
      }
      [data-tool-emerald] input::placeholder, [data-tool-emerald] textarea::placeholder { color: rgba(255,255,255,0.55) !important; }
      /* Coerce residual per-tool palettes (rose/navy/champagne/white) to emerald ombré */
      [data-tool-emerald] [class*="bg-rose"],
      [data-tool-emerald] [class*="bg-pink"],
      [data-tool-emerald] [class*="bg-violet"],
      [data-tool-emerald] [class*="bg-indigo"],
      [data-tool-emerald] [class*="bg-amber"],
      [data-tool-emerald] [class*="bg-teal"],
      [data-tool-emerald] [class*="bg-champagne"],
      [data-tool-emerald] .bg-white,
      [data-tool-emerald] [class*="bg-white/"] {
        background: ${TOOL_CARD_BG} !important;
        background-color: transparent !important;
      }
      [data-tool-emerald] [class*="border-rose"],
      [data-tool-emerald] [class*="border-pink"],
      [data-tool-emerald] [class*="border-violet"],
      [data-tool-emerald] [class*="border-indigo"],
      [data-tool-emerald] [class*="border-amber"],
      [data-tool-emerald] [class*="border-teal"],
      [data-tool-emerald] [class*="border-champagne"] {
        border-color: ${TOOL_WHITE_BORDER} !important;
      }
      [data-tool-emerald] [class*="text-rose"],
      [data-tool-emerald] [class*="text-pink"],
      [data-tool-emerald] [class*="text-violet"],
      [data-tool-emerald] [class*="text-indigo"],
      [data-tool-emerald] [class*="text-amber"],
      [data-tool-emerald] [class*="text-teal"] { color: #FFFFFF !important; -webkit-text-fill-color: #FFFFFF !important; }
      /* Inline-style rose/navy gradients used by BusinessCardScanner */
      [data-tool-emerald] [style*="rgba(251,113,133"],
      [data-tool-emerald] [style*="rgba(159,18,57"],
      [data-tool-emerald] [style*="rgba(7,16,31"],
      [data-tool-emerald] [style*="rgba(4,7,13"],
      [data-tool-emerald] [style*="#FDFBF7"],
      [data-tool-emerald] [style*="#F7F2EA"],
      [data-tool-emerald] [style*="#EFE6D6"] {
        background: ${TOOL_CARD_BG} !important;
        color: #FFFFFF !important;
      }
      /* shadcn Card baseline coercion inside a tool */
      [data-tool-emerald] [data-slot="card"],
      [data-tool-emerald] .jbj-card,
      [data-tool-emerald] .card {
        background: ${TOOL_CARD_BG} !important;
        border-color: ${TOOL_WHITE_BORDER} !important;
        color: #FFFFFF !important;
      }
      [data-tool-emerald] :is(button, a)[data-allow-dark-cta],
      [data-tool-emerald] :is(button, a).id-primary,
      [data-tool-emerald] :is(button, a).bcs-action-dark,
      [data-tool-emerald] :is(button, a):not([role="tab"]):not([data-fullscreen-tool-toggle])[class*="bg-rose"],
      [data-tool-emerald] :is(button, a):not([role="tab"]):not([data-fullscreen-tool-toggle])[class*="bg-red"],
      [data-tool-emerald] :is(button, a):not([role="tab"]):not([data-fullscreen-tool-toggle])[class*="bg-amber"] {
        background: linear-gradient(135deg, #065F46 0%, #04231A 55%, #022c1c 100%) !important;
        border-color: rgba(255,255,255,0.46) !important;
        color: #FFFFFF !important;
        -webkit-text-fill-color: #FFFFFF !important;
      }
      [data-tool-emerald] :is(button, a)[data-allow-dark-cta] svg,
      [data-tool-emerald] :is(button, a).id-primary svg,
      [data-tool-emerald] :is(button, a).bcs-action-dark svg { color: #FFFFFF !important; stroke: #FFFFFF !important; }
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
            "linear-gradient(180deg, #041610 0%, #02100a 40%, #000000 100%)",
          boxShadow:
            "0 30px 80px -30px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.22)",
        }}
      >
        {children}
      </div>
    </div>
  </div>
);


export default PremiumToolShell;
