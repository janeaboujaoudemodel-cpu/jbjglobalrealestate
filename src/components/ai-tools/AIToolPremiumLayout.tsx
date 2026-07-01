import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";

/**
 * AIToolPremiumLayout — Unified Emerald Ombré Surface
 *
 * Matches the Interior Design AI / Property Measurement contract:
 *   background: linear-gradient(180deg, #064E3B → #042c1c → #000000)
 *   text: pure white  |  tool-panel hairlines: white
 *   primary CTA: emerald metallic with white ink
 *
 * Scoped via [data-tool-emerald] so all downstream cards/inputs/text auto-adopt
 * white ink + dark emerald surfaces without touching each tool page.
 */

interface AIToolPremiumLayoutProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
  accentColor?: string;   // kept for backward compat, ignored (emerald unified)
  gradientFrom?: string;  // kept for backward compat, ignored
  children: ReactNode;
  badge?: string;
  description?: string;
  showFinancialDisclaimer?: boolean;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const AIToolPremiumLayout = ({
  title,
  subtitle,
  icon,
  children,
  badge = "AI-Powered",
  showFinancialDisclaimer = false,
}: AIToolPremiumLayoutProps) => {
  const navigate = useNavigate();

  // Highlight second word of the title in gold
  const words = title.split(" ");
  const firstWord = words[0] ?? title;
  const restWords = words.slice(1).join(" ");

  return (
    <div
      data-tool-shell-root
      data-tool-emerald
      data-allow-dark-cta
      data-no-contrast-guard
      data-surface="dark"
      data-marketing-page
      className="allow-white min-h-screen w-full"
      style={{
        background:
          "linear-gradient(180deg, #064E3B 0%, #042c1c 48%, #000000 100%)",
        color: "#FFFFFF",
      }}
    >
      <style>{`
        [data-tool-emerald],
        [data-tool-emerald] :is(h1,h2,h3,h4,h5,h6,p,span,label,small,strong,em,li,a,button,textarea,input,div,figcaption,dt,dd,th,td,time):not([class*="bg-clip-text"]):not([data-price-pill]) {
          color: #FFFFFF; -webkit-text-fill-color: #FFFFFF;
        }
        [data-tool-emerald] .text-muted-foreground {
          color: rgba(255,255,255,0.76) !important;
          -webkit-text-fill-color: rgba(255,255,255,0.76) !important;
        }
        [data-tool-emerald] :is(svg, [class*="lucide"]):not([data-allow-gold]):not(.text-gold):not(.text-\\[\\#B89555\\]) { color: #FFFFFF; }
        [data-tool-emerald] [data-allow-gold],
        [data-tool-emerald] .text-gold,
        [data-tool-emerald] .text-\\[\\#B89555\\] {
          color: #B89555 !important;
          -webkit-text-fill-color: #B89555 !important;
        }
        [data-tool-emerald] input,
        [data-tool-emerald] textarea,
        [data-tool-emerald] select,
        [data-tool-emerald] [role="combobox"] {
          background: linear-gradient(135deg, rgba(8,18,13,0.92), rgba(0,0,0,0.88)) !important;
          border: 1px solid rgba(255,255,255,0.42) !important;
          color: #FFFFFF !important;
          -webkit-text-fill-color: #FFFFFF !important;
          caret-color: #FFFFFF !important;
        }
        [data-tool-emerald] input::placeholder,
        [data-tool-emerald] textarea::placeholder {
          color: rgba(255,255,255,0.55) !important;
        }
        [data-tool-emerald] .id-panel,
        [data-tool-emerald] .ai-tool-card {
          background: linear-gradient(135deg, rgba(8,18,13,0.96) 0%, rgba(3,8,5,0.98) 58%, rgba(0,0,0,1) 100%) !important;
          border: 1px solid rgba(255,255,255,0.42) !important;
          box-shadow: 0 18px 52px -28px rgba(16,185,129,0.48), inset 0 0 28px rgba(255,255,255,0.04) !important;
        }
      `}</style>

      {/* Hero — emerald ombré with gold hairline */}
      <section
        className="pt-32 pb-16 border-b"
        style={{
          background:
            "linear-gradient(180deg, #064E3B 0%, #042c1c 60%, #000000 100%)",
          borderColor: "rgba(255,255,255,0.24)",
        }}
      >
        <div className="container mx-auto px-4">
          {/* Back button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex justify-start"
          >
            <Button
              size="sm"
              onClick={() => {
                const ref = document.referrer;
                const local = ref && ref.includes(window.location.hostname);
                if (local) navigate(-1);
                else navigate("/toolkit");
              }}
              data-allow-dark-cta
              data-no-contrast-guard
              className="allow-white mb-6 relative z-10"
              style={{
                background:
                  "linear-gradient(135deg, #065F46 0%, #064E3B 55%, #064E3B 100%)",
                color: "#FFFFFF",
                border: "1px solid rgba(255,255,255,0.46)",
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2 allow-white" style={{ color: "#FFFFFF" }} />
              <span className="allow-white" style={{ color: "#FFFFFF" }}>Back</span>
            </Button>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto"
          >
            {/* Emerald badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{
                background: "rgba(6,78,59,0.55)",
                 border: "1px solid rgba(255,255,255,0.42)",
              }}
            >
              <div className="allow-white" style={{ color: "#FFFFFF" }}>{icon}</div>
              <span
                className="allow-white text-xs font-semibold uppercase tracking-wider"
                style={{ color: "#FFFFFF" }}
              >
                {badge}
              </span>
            </div>

            {/* Title (rest of title in gold) */}
            <h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
              style={{
                fontFamily:
                  "'Inter', 'SF Pro Display', system-ui, sans-serif",
                letterSpacing: "-0.02em",
                color: "#FFFFFF",
              }}
            >
              <span className="allow-white" style={{ color: "#FFFFFF" }}>{firstWord}</span>
              {restWords ? " " : ""}
              {restWords && (
                <span data-allow-gold style={{ color: "#B89555" }}>
                  {restWords}
                </span>
              )}
            </h1>

            <p
              className="text-base sm:text-lg md:text-xl mb-4 max-w-2xl mx-auto allow-white"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              {subtitle}
            </p>

            <p className="text-sm allow-white" style={{ color: "rgba(255,255,255,0.65)" }}>
              <Sparkles
                className="inline h-4 w-4 mr-1"
                data-allow-gold
                style={{ color: "#B89555" }}
              />
              Powered by AI • Data-driven insights • Real-time analysis
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content — dark emerald panel with gold hairline */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="max-w-6xl mx-auto rounded-2xl p-6 md:p-8 id-panel ai-tool-card"
            style={{
              background:
                "linear-gradient(135deg, rgba(8,18,13,0.96) 0%, rgba(3,8,5,0.98) 58%, rgba(0,0,0,1) 100%)",
              border: "1px solid rgba(255,255,255,0.42)",
              boxShadow:
                "0 18px 52px -28px rgba(16,185,129,0.48), inset 0 0 28px rgba(255,255,255,0.04)",
            }}
          >
            {children}

            {showFinancialDisclaimer && (
              <div
                className="mt-8 p-4 rounded-xl"
                style={{
                  background: "rgba(0,0,0,0.35)",
                  border: "1px solid rgba(255,255,255,0.34)",
                }}
              >
                <p className="text-sm leading-relaxed allow-white" style={{ color: "#FFFFFF" }}>
                  <strong className="allow-white" style={{ color: "#FFFFFF" }}>Disclaimer:</strong>{" "}
                  This AI-generated analysis is for informational purposes only. Does not
                  constitute financial, investment, or legal advice.{" "}
                  <Link
                    to="/contact"
                    className="underline"
                    data-allow-gold
                    style={{ color: "#B89555" }}
                  >
                    Contact our team
                  </Link>{" "}
                  for professional guidance. Past performance does not guarantee future results.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default AIToolPremiumLayout;
