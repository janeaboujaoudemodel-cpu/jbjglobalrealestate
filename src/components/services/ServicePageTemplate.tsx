import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import ConsultationRequestForm from "@/components/ConsultationRequestForm";
import MIPreFooterCard from "@/components/shell/MIPreFooterCard";
import { SEOHead } from "@/components/SEOHead";
import { scrollToId } from "@/lib/scroll";
import {
  ArrowUpRight,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";

const INK = "#1A1A1A";
const INK_SOFT = "rgba(26,26,26,0.74)";
const EMERALD = "#064E3B";
const EMERALD_DARK = "#042C1C";
const BLACK = "#000000";
const WHITE = "#FFFFFF";
const CHAMPAGNE = "#F7F2EA";
const CHAMPAGNE_DEEP = "#EFE3CF";
const EMERALD_GRADIENT = `linear-gradient(135deg, ${EMERALD} 0%, ${EMERALD_DARK} 58%, ${BLACK} 100%)`;
const PANEL_GRADIENT = "linear-gradient(160deg, #FFFDF8 0%, #F7F2EA 48%, #EFE3CF 100%)";

export type ServiceConfig = {
  slug: string;
  seoTitle: string;
  seoDescription: string;
  canonicalPath: string;
  hero: {
    eyebrowIcon: LucideIcon;
    eyebrow: string;
    title: string;
    subtitle: string;
    primaryLabel: string;
    secondaryLabel: string;
    secondaryHref: string;
  };
  toc: Array<{ id: string; label: string; icon: LucideIcon }>;
  overview: {
    eyebrow: string;
    title: string;
    text: string;
    leftTitle: string;
    leftItems: string[];
    rightTitle: string;
    rightItems: string[];
  };
  metrics: {
    eyebrow: string;
    title: string;
    text: string;
    featureIcon: LucideIcon;
    featureTitle: string;
    featureText: string;
    items: Array<{ value: string; label: string; icon: LucideIcon }>;
  };
  scope: {
    eyebrow: string;
    title: string;
    text: string;
    items: Array<{ title: string; icon: LucideIcon; points: string[] }>;
  };
  placement: {
    eyebrow: string;
    title: string;
    text: string;
    steps: string[];
  };
  finance: {
    eyebrow: string;
    title: string;
    text: string;
    items: Array<{ icon: LucideIcon; title: string; text: string }>;
  };
  operations: {
    eyebrow: string;
    title: string;
    text: string;
    items: Array<{ title: string; text: string }>;
  };
  workflow: {
    eyebrow: string;
    title: string;
    steps: Array<{ label: string; icon: LucideIcon }>;
  };
  reporting: {
    eyebrow: string;
    title: string;
    text: string;
    items: string[];
  };
  trust: {
    eyebrow: string;
    title: string;
    items: Array<{ icon: LucideIcon; title: string; text: string }>;
  };
  fees: {
    eyebrow: string;
    title: string;
    text: string;
    items: string[];
  };
  proposal: {
    eyebrow: string;
    title: string;
    text: string;
    formTitle: string;
    serviceOptions: string[];
    defaultService: string;
    messagePlaceholder: string;
    formSource: string;
    variant: string;
  };
  faq: Array<{ q: string; a: string }>;
  preFooter: {
    title: string;
    subtitle: string;
    primaryText: string;
    secondaryLink: string;
    secondaryText: string;
  };
};

function Section({
  id,
  eyebrow,
  title,
  text,
  children,
  className = "",
}: {
  id: string;
  eyebrow?: string;
  title?: string;
  text?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-28 py-6 md:py-8 ${className}`}>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div
          data-pm-panel
          className="rounded-3xl border p-6 md:p-9"
          style={{
            background: PANEL_GRADIENT,
            borderColor: "rgba(184,149,85,0.42)",
            boxShadow: "0 24px 56px -36px rgba(44,31,13,0.34), inset 0 1px 0 rgba(255,255,255,0.78)",
          }}
        >
          {(eyebrow || title || text) && (
            <div className="mb-7">
              {eyebrow ? (
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: EMERALD }}>
                  {eyebrow}
                </p>
              ) : null}
              {title ? (
                <h2 className="text-3xl font-semibold leading-tight md:text-4xl" style={{ color: INK, fontFamily: '"Cormorant Garamond", serif' }}>
                  {title}
                </h2>
              ) : null}
              {text ? <p className="mt-3 max-w-3xl text-base leading-relaxed" style={{ color: INK_SOFT }}>{text}</p> : null}
            </div>
          )}
          {children}
        </div>
      </div>
    </section>
  );
}

function EmeraldTile({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      data-pm-emerald
      className={`rounded-2xl border p-5 ${className}`}
      style={{
        background: EMERALD_GRADIENT,
        borderColor: "rgba(255,255,255,0.22)",
        boxShadow: "0 18px 38px -28px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.13)",
        color: WHITE,
      }}
    >
      {children}
    </div>
  );
}

function EmeraldIcon({ icon: Icon, large = false }: { icon: LucideIcon; large?: boolean }) {
  return (
    <span
      data-pm-emerald
      className={`${large ? "h-14 w-14" : "h-11 w-11"} inline-flex shrink-0 items-center justify-center rounded-full`}
      style={{ background: EMERALD_GRADIENT, color: WHITE }}
    >
      <Icon className={large ? "h-6 w-6" : "h-5 w-5"} strokeWidth={2.2} />
    </span>
  );
}

function NumberBadge({ value }: { value: number | string }) {
  return (
    <span
      data-pm-emerald
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
      style={{ background: EMERALD_GRADIENT, color: WHITE }}
    >
      {value}
    </span>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: INK }}>
          <span data-pm-emerald className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ background: EMERALD_GRADIENT }}>
            <CheckCircle2 className="h-3.5 w-3.5" />
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function HeroButton({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      data-pm-emerald
      data-no-contrast-guard
      data-on-dark
      className="jj-mi-hero-cta jj-mi-hero-cta-emerald allow-white inline-flex min-h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg px-6 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5 sm:w-auto md:px-8 md:py-4 md:text-base"
      style={{ background: EMERALD_GRADIENT, border: 0, color: WHITE }}
    >
      <span>{children}</span>
      <ArrowUpRight className="h-4 w-4" />
    </Link>
  );
}

export function ServicePageTemplate({ config }: { config: ServiceConfig }) {
  const slug = config.slug;
  const HeroEyebrowIcon = config.hero.eyebrowIcon;
  const MetricFeatureIcon = config.metrics.featureIcon;

  // Neutralize the shared phone country-code trigger's emerald/gold styling
  // inside the consultation form so it matches the surrounding champagne fields.
  useEffect(() => {
    let done = false;
    const apply = () => {
      const btn = document.querySelector<HTMLButtonElement>(
        `[data-service-page="${slug}"] [data-jbj-consultation-form] button[data-phone-code-trigger]`
      );
      if (!btn || done) return;
      done = true;
      btn.classList.remove("jj-emerald-action", "jj-cta-gold-metallic");
      btn.removeAttribute("data-emerald-action");
      btn.style.setProperty("background", "#F7F2EA", "important");
      btn.style.setProperty("background-image", "none", "important");
      btn.style.setProperty("border", "1px solid rgba(184,149,85,0.42)", "important");
      btn.style.setProperty("border-radius", "12px", "important");
      btn.style.setProperty("color", "#1A1A1A", "important");
      btn.style.setProperty("animation", "none", "important");
    };
    apply();
    if (done) return;
    const obs = new MutationObserver(() => { apply(); if (done) obs.disconnect(); });
    obs.observe(document.body, { subtree: true, childList: true });
    const t = window.setTimeout(() => obs.disconnect(), 8000);
    return () => { obs.disconnect(); clearTimeout(t); };
  }, [slug]);

  return (
    <div data-service-page={slug} data-pm-page style={{ background: CHAMPAGNE }}>
      <SEOHead
        title={config.seoTitle}
        description={config.seoDescription}
        canonicalPath={config.canonicalPath}
      />

      <style>{`
        [data-pm-page], [data-pm-page] * { box-sizing: border-box; }
        [data-pm-page] { background: ${CHAMPAGNE} !important; }
        [data-pm-page] main[data-service-body] {
          background: ${CHAMPAGNE} !important;
          background-image: linear-gradient(180deg, ${CHAMPAGNE} 0%, ${CHAMPAGNE_DEEP} 100%) !important;
        }
        [data-pm-page] [data-pm-panel],
        [data-pm-page] [data-pm-panel] *:not(svg):not(path):not(line):not(polyline):not(circle):not(rect):not([data-pm-emerald]):not([data-pm-emerald] *):not([data-pm-toc-button]):not([data-pm-toc-button] *) {
          color: ${INK} !important;
          -webkit-text-fill-color: ${INK} !important;
        }
        [data-pm-page] [data-pm-emerald],
        [data-pm-page] [data-pm-emerald] *:not(input):not(textarea),
        [data-pm-page] [data-pm-toc-button],
        [data-pm-page] [data-pm-toc-button] * {
          color: ${WHITE} !important;
          -webkit-text-fill-color: ${WHITE} !important;
        }
        [data-pm-page] [data-pm-emerald] svg,
        [data-pm-page] [data-pm-emerald] path,
        [data-pm-page] [data-pm-emerald] line,
        [data-pm-page] [data-pm-emerald] polyline,
        [data-pm-page] [data-pm-emerald] circle,
        [data-pm-page] [data-pm-emerald] rect,
        [data-pm-page] [data-pm-toc-button] svg,
        [data-pm-page] [data-pm-toc-button] path,
        [data-pm-page] [data-pm-toc-button] line,
        [data-pm-page] [data-pm-toc-button] polyline,
        [data-pm-page] [data-pm-toc-button] circle,
        [data-pm-page] [data-pm-toc-button] rect {
          color: ${WHITE} !important;
          stroke: ${WHITE} !important;
        }
        html body #root [data-pm-page] [data-pm-panel] [data-pm-emerald],
        html body #root [data-pm-page] [data-pm-panel] [data-pm-emerald] :is(*, h1, h2, h3, h4, h5, h6, p, span, div, small, strong, em, b, label),
        html body #root [data-pm-page] [data-pm-panel] [data-pm-toc-button],
        html body #root [data-pm-page] [data-pm-panel] [data-pm-toc-button] :is(*, h1, h2, h3, h4, h5, h6, p, span, div, small, strong, em, b, label) {
          color: ${WHITE} !important;
          -webkit-text-fill-color: ${WHITE} !important;
          text-shadow: none !important;
          opacity: 1 !important;
        }
        html body #root [data-pm-page] [data-pm-panel] [data-pm-emerald] :is(svg, path, line, polyline, polygon, circle, rect, [class*="lucide"]),
        html body #root [data-pm-page] [data-pm-panel] [data-pm-emerald] :is(svg, path, line, polyline, polygon, circle, rect, [class*="lucide"]) *,
        html body #root [data-pm-page] [data-pm-panel] [data-pm-toc-button] :is(svg, path, line, polyline, polygon, circle, rect, [class*="lucide"]),
        html body #root [data-pm-page] [data-pm-panel] [data-pm-toc-button] :is(svg, path, line, polyline, polygon, circle, rect, [class*="lucide"]) * {
          color: ${WHITE} !important;
          -webkit-text-fill-color: ${WHITE} !important;
          stroke: ${WHITE} !important;
          opacity: 1 !important;
        }
        [data-pm-page] [data-pm-faq-item] {
          background: rgba(255,253,248,0.72);
          transition: background 200ms ease, border-color 200ms ease;
        }
        [data-pm-page] [data-pm-faq-trigger],
        [data-pm-page] [data-pm-faq-trigger] *:not(svg):not(path) {
          color: ${INK} !important;
          -webkit-text-fill-color: ${INK} !important;
        }
        [data-pm-page] [data-pm-faq-item][data-state="open"],
        [data-pm-page] [data-pm-faq-item]:hover,
        [data-pm-page] [data-pm-faq-item]:focus-within {
          background: ${EMERALD_GRADIENT} !important;
          border-color: rgba(255,255,255,0.22) !important;
        }
        html body #root [data-pm-page] [data-pm-faq-item][data-state="open"] *,
        html body #root [data-pm-page] [data-pm-faq-item][data-state="open"] [data-pm-faq-answer],
        html body #root [data-pm-page] [data-pm-faq-item][data-state="open"] [data-pm-faq-answer] *,
        html body #root [data-pm-page] [data-pm-faq-item]:hover *,
        html body #root [data-pm-page] [data-pm-faq-item]:hover [data-pm-faq-answer],
        html body #root [data-pm-page] [data-pm-faq-item]:hover [data-pm-faq-answer] *,
        html body #root [data-pm-page] [data-pm-faq-item]:focus-within *,
        html body #root [data-pm-page] [data-pm-faq-item]:focus-within [data-pm-faq-answer] {
          color: ${WHITE} !important;
          -webkit-text-fill-color: ${WHITE} !important;
          opacity: 1 !important;
          text-shadow: none !important;
        }
        [data-pm-page] [data-pm-faq-item][data-state="open"] svg,
        [data-pm-page] [data-pm-faq-item][data-state="open"] path,
        [data-pm-page] [data-pm-faq-item]:hover svg,
        [data-pm-page] [data-pm-faq-item]:hover path {
          color: ${WHITE} !important;
          stroke: ${WHITE} !important;
        }
        /* Light divider between question and answer in the ACTIVE (open) state. */
        [data-pm-page] [data-pm-faq-item][data-state="open"] [data-pm-faq-answer] {
          position: relative;
          margin-top: 8px;
          padding-top: 14px !important;
        }
        [data-pm-page] [data-pm-faq-item][data-state="open"] [data-pm-faq-answer]::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 20%, rgba(255,255,255,0.55) 80%, rgba(255,255,255,0) 100%);
        }
        [data-pm-page] [data-jbj-consultation-form] {
          box-shadow: none !important;
          border-radius: 24px !important;
        }
        [data-pm-page] [data-jbj-consultation-form] form[data-form-shell] {
          border: 0 !important;
          border-color: transparent !important;
          box-shadow: none !important;
          background: transparent !important;
          background-image: none !important;
          padding: 0 !important;
        }
        [data-pm-page] [data-jbj-consultation-form] input,
        [data-pm-page] [data-jbj-consultation-form] textarea,
        [data-pm-page] [data-jbj-consultation-form] button[role="combobox"] {
          padding-left: 1.15rem !important;
          padding-right: 1.15rem !important;
        }
        [data-pm-page] [data-jbj-consultation-form] textarea {
          padding-top: 0.9rem !important;
          padding-bottom: 0.9rem !important;
        }
        html body #root [data-pm-page] [data-jbj-consultation-form] input,
        html body #root [data-pm-page] [data-jbj-consultation-form] textarea,
        html body #root [data-pm-page] [data-jbj-consultation-form] select,
        html body #root [data-pm-page] [data-jbj-consultation-form] button[role="combobox"],
        html body #root [data-pm-page] [data-jbj-consultation-form] button[data-jbj-signup-trigger],
        html body #root [data-pm-page] [data-jbj-consultation-form] [data-phone-code-trigger],
        html body #root [data-pm-page] [data-jbj-consultation-form] [data-light-select-trigger] {
          border: 1px solid rgba(184,149,85,0.42) !important;
          border-radius: 12px !important;
          background: #F7F2EA !important;
          background-color: #F7F2EA !important;
          background-image: none !important;
          box-shadow: none !important;
          outline: 0 !important;
        }
        html body #root [data-pm-page] [data-jbj-consultation-form] [data-field-group] {
          border: 0 !important;
          box-shadow: none !important;
          background: transparent !important;
          background-image: none !important;
        }
        html body #root [data-pm-page] [data-jbj-consultation-form] input:not([type="checkbox"]):not([type="radio"]),
        html body #root [data-pm-page] [data-jbj-consultation-form] button[role="combobox"],
        html body #root [data-pm-page] [data-jbj-consultation-form] button[data-jbj-signup-trigger],
        html body #root [data-pm-page] [data-jbj-consultation-form] [data-phone-code-trigger],
        html body #root [data-pm-page] [data-jbj-consultation-form] [data-light-select-trigger] {
          height: 3rem !important;
          min-height: 3rem !important;
        }
        [data-pm-page] [data-jbj-consultation-form] button[data-jbj-signup-trigger],
        [data-pm-page] [data-jbj-consultation-form] button[data-jbj-signup-trigger] *,
        [data-pm-page] [data-jbj-consultation-form] [data-phone-code-trigger],
        [data-pm-page] [data-jbj-consultation-form] [data-phone-code-trigger] * {
          color: ${INK} !important;
          -webkit-text-fill-color: ${INK} !important;
        }
        [data-pm-page] [data-jbj-consultation-form] button[data-jbj-signup-trigger] svg,
        [data-pm-page] [data-jbj-consultation-form] [data-phone-code-trigger] svg {
          color: ${INK} !important;
          stroke: ${INK} !important;
        }
        html body #root [data-pm-page] [data-jbj-consultation-form] button[data-phone-code-trigger],
        html body #root [data-pm-page] [data-jbj-consultation-form] button[data-phone-code-trigger].jj-emerald-action,
        html body #root [data-pm-page] [data-jbj-consultation-form] button[data-phone-code-trigger].jj-cta-gold-metallic {
          background: #F7F2EA !important;
          background-color: #F7F2EA !important;
          background-image: none !important;
          animation: none !important;
          transform: none !important;
          border: 1px solid rgba(184,149,85,0.42) !important;
          border-radius: 12px !important;
          color: ${INK} !important;
          -webkit-text-fill-color: ${INK} !important;
        }
        html body #root [data-pm-page] [data-jbj-consultation-form] input:focus,
        html body #root [data-pm-page] [data-jbj-consultation-form] textarea:focus,
        html body #root [data-pm-page] [data-jbj-consultation-form] button[role="combobox"]:focus,
        html body #root [data-pm-page] [data-jbj-consultation-form] button[role="combobox"]:focus-visible,
        html body #root [data-pm-page] [data-jbj-consultation-form] [data-phone-code-trigger]:focus,
        html body #root [data-pm-page] [data-jbj-consultation-form] [data-phone-code-trigger]:focus-visible {
          border-color: rgba(184,149,85,0.9) !important;
          box-shadow: none !important;
          outline: none !important;
        }
      `}</style>

      <section
        data-mi-hero
        data-unified-hero
        data-hero-dark
        data-surface="emerald"
        data-no-contrast-guard
        data-premium-emerald-hero
        data-brand-hero
        data-pm-emerald
        className="jj-hero-fullscreen jj-mi-prada-hero relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden px-4 text-center sm:px-6 lg:px-8"
        style={{ color: WHITE, borderRadius: 0 }}
      >
        <div className="relative z-10 mx-auto flex w-full max-w-[64rem] flex-col items-center justify-center px-6 text-center">
          <div data-no-contrast-guard className="mb-6 inline-flex items-center gap-2 border border-white/20 bg-white/5 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] backdrop-blur-sm">
            <HeroEyebrowIcon className="h-4 w-4" />
            {config.hero.eyebrow}
          </div>
          <h1 data-no-contrast-guard className="jj-mi-hero-title mx-auto max-w-[16ch] text-5xl font-light leading-[1.02] sm:text-6xl md:text-7xl lg:text-8xl" style={{ fontFamily: '"Cormorant Garamond", serif', color: WHITE }}>
            {config.hero.title}
          </h1>
          <p data-no-contrast-guard className="jj-mi-hero-copy mx-auto mt-8 max-w-[42rem] text-lg font-light leading-relaxed md:text-xl lg:text-2xl" style={{ color: "#E8CF8A" }}>
            {config.hero.subtitle}
          </p>
          <div className="mt-12 flex w-full flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row sm:flex-nowrap">
            <HeroButton to="#proposal">{config.hero.primaryLabel}</HeroButton>
            <HeroButton to={config.hero.secondaryHref}>{config.hero.secondaryLabel}</HeroButton>
          </div>
        </div>
      </section>

      <main data-service-body>
        <section className="pt-14 md:pt-20">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
            <div data-pm-panel className="rounded-3xl border p-6 md:p-9" style={{ background: PANEL_GRADIENT, borderColor: "rgba(184,149,85,0.42)", boxShadow: "0 24px 56px -36px rgba(44,31,13,0.34)" }}>
              <h2 className="mb-8 text-center text-3xl font-light tracking-tight md:text-4xl" style={{ color: INK, fontFamily: '"Cormorant Garamond", serif' }}>Table of Contents</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {config.toc.map((section, index) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      data-pm-toc-button
                      onClick={() => scrollToId(section.id)}
                      className="group flex min-h-[68px] items-center gap-3 rounded-xl px-4 py-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg"
                      style={{ background: EMERALD_GRADIENT, border: "1px solid rgba(232,207,138,0.28)", color: WHITE }}
                    >
                      <span
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums tracking-wider"
                        style={{ background: "rgba(255,255,255,0.14)", color: WHITE, border: "1px solid rgba(255,255,255,0.32)" }}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium leading-tight tracking-[0.005em]" style={{ color: WHITE }}>
                        {section.label}
                      </span>
                      <span
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors group-hover:bg-[rgba(232,207,138,0.22)]"
                        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.26)" }}
                      >
                        <Icon className="h-[15px] w-[15px]" style={{ color: WHITE, stroke: WHITE }} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <Section id="overview" eyebrow={config.overview.eyebrow} title={config.overview.title} text={config.overview.text}>
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2">
            <EmeraldTile>
              <h3 className="mb-4 text-xl font-semibold">{config.overview.leftTitle}</h3>
              <ul className="space-y-3 text-sm font-semibold leading-relaxed">
                {config.overview.leftItems.map((item) => (
                  <li key={item} className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 shrink-0" />{item}</li>
                ))}
              </ul>
            </EmeraldTile>
            <EmeraldTile>
              <h3 className="mb-4 text-xl font-semibold">{config.overview.rightTitle}</h3>
              <ul className="space-y-3 text-sm font-semibold leading-relaxed">
                {config.overview.rightItems.map((item) => (
                  <li key={item} className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 shrink-0" />{item}</li>
                ))}
              </ul>
            </EmeraldTile>
          </div>
        </Section>

        <Section id="metrics" eyebrow={config.metrics.eyebrow} title={config.metrics.title} text={config.metrics.text}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.6fr]">
            <EmeraldTile className="flex min-h-[240px] flex-col justify-between">
              <MetricFeatureIcon className="h-10 w-10" />
              <div>
                <p className="text-4xl font-semibold" style={{ fontFamily: '"Cormorant Garamond", serif' }}>{config.metrics.featureTitle}</p>
                <p className="mt-3 text-sm leading-relaxed">{config.metrics.featureText}</p>
              </div>
            </EmeraldTile>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {config.metrics.items.map((metric) => {
                const Icon = metric.icon;
                return (
                  <EmeraldTile key={metric.label} className="min-h-[136px]">
                    <Icon className="h-5 w-5" />
                    <p className="mt-4 text-3xl font-bold">{metric.value}</p>
                    <p className="mt-1 text-sm font-semibold leading-tight">{metric.label}</p>
                  </EmeraldTile>
                );
              })}
            </div>
          </div>
        </Section>

        <Section id="services" eyebrow={config.scope.eyebrow} title={config.scope.title} text={config.scope.text}>
          <div className="grid grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2">
            {config.scope.items.map((service) => (
              <div key={service.title} className="grid grid-cols-[48px_1fr] gap-4">
                <EmeraldIcon icon={service.icon} />
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: INK }}>{service.title}</h3>
                  <div className="mt-4"><BulletList items={service.points} /></div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="leasing" eyebrow={config.placement.eyebrow} title={config.placement.title} text={config.placement.text}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            {config.placement.steps.map((step, index) => (
              <div key={step} className="flex items-start gap-3 md:block md:text-center">
                <NumberBadge value={index + 1} />
                <p className="mt-0 font-semibold leading-tight md:mt-4" style={{ color: INK }}>{step}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="finance" eyebrow={config.finance.eyebrow} title={config.finance.title} text={config.finance.text}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {config.finance.items.map((item) => (
              <EmeraldTile key={item.title}>
                <item.icon className="h-6 w-6" />
                <h3 className="mt-4 font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed">{item.text}</p>
              </EmeraldTile>
            ))}
          </div>
        </Section>

        <Section id="operations" eyebrow={config.operations.eyebrow} title={config.operations.title} text={config.operations.text}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {config.operations.items.map((item) => (
              <div key={item.title}>
                <h3 className="font-semibold" style={{ color: INK }}>{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: INK_SOFT }}>{item.text}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="workflow" eyebrow={config.workflow.eyebrow} title={config.workflow.title}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
            {config.workflow.steps.map((step, index) => (
              <EmeraldTile key={step.label} className="flex items-center gap-4 sm:flex-col sm:text-center">
                <NumberBadge value={index + 1} />
                <step.icon className="h-6 w-6" />
                <p className="text-sm font-semibold leading-tight">{step.label}</p>
              </EmeraldTile>
            ))}
          </div>
        </Section>

        <Section id="reporting" eyebrow={config.reporting.eyebrow} title={config.reporting.title} text={config.reporting.text}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {config.reporting.items.map((item, index) => (
              <div key={item} className="flex items-center gap-4">
                <NumberBadge value={index + 1} />
                <p className="font-semibold" style={{ color: INK }}>{item}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="trust" eyebrow={config.trust.eyebrow} title={config.trust.title}>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {config.trust.items.map((item) => (
              <EmeraldTile key={item.title} className="text-center">
                <div className="inline-flex"><item.icon className="h-7 w-7" /></div>
                <h3 className="mt-4 font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed">{item.text}</p>
              </EmeraldTile>
            ))}
          </div>
        </Section>

        <Section id="fees" eyebrow={config.fees.eyebrow} title={config.fees.title} text={config.fees.text}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {config.fees.items.map((item, index) => (
              <EmeraldTile key={item} className="text-center">
                <NumberBadge value={index + 1} />
                <p className="mt-4 text-sm font-semibold">{item}</p>
              </EmeraldTile>
            ))}
          </div>
        </Section>

        <Section id="proposal" eyebrow={config.proposal.eyebrow} title={config.proposal.title} text={config.proposal.text}>
          <ConsultationRequestForm
            title={config.proposal.formTitle}
            subtitle=""
            serviceOptions={config.proposal.serviceOptions}
            defaultServiceNeeded={config.proposal.defaultService}
            messagePlaceholder={config.proposal.messagePlaceholder}
            formSource={config.proposal.formSource}
            variant={config.proposal.variant as never}
            showHeader={false}
            className="max-w-none"
          />
        </Section>

        <Section id="faq" eyebrow="FAQ" title="Frequently Asked Questions">
          <Accordion type="single" collapsible className="space-y-3">
            {config.faq.map((faq, index) => (
              <AccordionItem key={faq.q} value={`faq-${index}`} data-pm-faq-item className="overflow-hidden rounded-2xl border" style={{ borderColor: "rgba(184,149,85,0.38)" }}>
                <AccordionTrigger data-pm-faq-trigger className="min-h-[64px] px-5 py-4 text-left font-semibold hover:no-underline">{faq.q}</AccordionTrigger>
                <AccordionContent className="px-5 pb-5 pt-0"><p data-pm-faq-answer className="text-sm leading-relaxed" style={{ color: INK_SOFT }}>{faq.a}</p></AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Section>

        <MIPreFooterCard
          title={config.preFooter.title}
          subtitle={config.preFooter.subtitle}
          primaryLink="#proposal"
          primaryText={config.preFooter.primaryText}
          secondaryLink={config.preFooter.secondaryLink}
          secondaryText={config.preFooter.secondaryText}
          maxWidthClass="max-w-6xl"
          innerInset

        />
      </main>
    </div>
  );
}

export default ServicePageTemplate;
