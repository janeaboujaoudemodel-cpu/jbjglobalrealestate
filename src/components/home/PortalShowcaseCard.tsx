import { Link } from "react-router-dom";
import { ArrowRight, LucideIcon, ShieldCheck, Sparkles } from "lucide-react";
import PortalHeroArt, { type PortalKind } from "./PortalHeroArt";
import { IconTile } from "@/components/ui/icon-tile";
import { cn } from "@/lib/utils";

/**
 * PortalShowcaseCard — single canonical homepage card used to advertise
 * every JBJ portal (Broker / Developer / Careers / Owner / Investor).
 *
 * Update this file and every portal showcase across the homepage updates.
 */
export interface PortalShowcaseCardProps {
  kind: PortalKind;
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  features: { label: string; icon: LucideIcon }[];
  /** Optional helper line shown under the CTA. */
  helper?: string;
}

const DEFAULT_HELPER =
  "Secure sign-in with your JBJ account — your workspace, personalized.";

const PORTAL_ACCENT: Record<PortalKind, { metric: string; metricLabel: string; panelTitle: string; modules: string[] }> = {
  broker: {
    metric: "360°",
    metricLabel: "Broker operating suite",
    panelTitle: "Deal Command Center",
    modules: ["Pipeline", "Listings", "Academy", "AI Sales"],
  },
  developer: {
    metric: "LIVE",
    metricLabel: "Launch-ready project desk",
    panelTitle: "Project Submission Suite",
    modules: ["Inventory", "Launches", "Approvals", "Broker Network"],
  },
  careers: {
    metric: "48h",
    metricLabel: "Executive review window",
    panelTitle: "Talent Access Desk",
    modules: ["Profile", "Interview", "Academy", "Offers"],
  },
  owner: {
    metric: "HQ",
    metricLabel: "Private owner command",
    panelTitle: "Portfolio Oversight",
    modules: ["Revenue", "Leads", "Approvals", "Insights"],
  },
  investor: {
    metric: "ROI",
    metricLabel: "Investor intelligence layer",
    panelTitle: "Investment Workbench",
    modules: ["Matches", "Yield", "Market", "Portfolio"],
  },
};

export default function PortalShowcaseCard({
  kind,
  eyebrow,
  title,
  description,
  cta,
  href,
  features,
  helper = DEFAULT_HELPER,
}: PortalShowcaseCardProps) {
  const accent = PORTAL_ACCENT[kind];

  return (
    <section className="jj-portal-showcase relative overflow-hidden py-10 md:py-14">
      <div className="relative w-full px-4 md:px-6">
        <div
          data-no-contrast-guard
          className="allow-white jj-portal-shell group/portal relative mx-auto max-w-[1500px] overflow-hidden rounded-[34px] border border-[hsl(var(--gold)/0.62)] bg-[hsl(var(--navy-cta))] p-3 shadow-[0_32px_90px_-50px_hsl(var(--navy-cta)/0.75)] sm:p-4 md:p-5"
        >
          <div className="pointer-events-none absolute inset-0 opacity-80 [background-image:linear-gradient(90deg,hsl(var(--gold)/0.10)_1px,transparent_1px),linear-gradient(180deg,hsl(var(--gold)/0.08)_1px,transparent_1px)] [background-size:72px_72px]" />
          <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full border border-[hsl(var(--gold)/0.24)]" />
          <div className="pointer-events-none absolute -bottom-32 left-10 h-80 w-80 rounded-full border border-[hsl(var(--gold)/0.18)]" />

          <div className="relative grid min-h-[560px] gap-3 lg:grid-cols-[0.86fr_1.14fr]">
            <aside className="relative overflow-hidden rounded-[28px] border border-[hsl(var(--gold)/0.56)] bg-[linear-gradient(135deg,hsl(var(--background))_0%,hsl(var(--secondary))_52%,hsl(var(--champagne-3))_100%)] p-7 shadow-[inset_0_1px_0_hsl(0_0%_100%/0.76),0_18px_45px_-30px_hsl(0_0%_0%/0.48)] sm:p-9 lg:p-11">
              <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,hsl(var(--gold)/0.72),transparent)]" />
              <div className="pointer-events-none absolute -right-20 top-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,hsl(var(--gold)/0.13),transparent_68%)]" />

              <div className="relative flex h-full flex-col">
                <div className="mb-8 flex items-center justify-between gap-4">
                  <div className="inline-flex items-center gap-3 rounded-full border border-[hsl(var(--gold)/0.55)] bg-[hsl(var(--background)/0.72)] px-3 py-2 shadow-[inset_0_1px_0_hsl(0_0%_100%/0.72)]">
                    <IconTile icon={ShieldCheck} tone="gold" size="sm" className="rounded-full" />
                    <span className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-foreground">
                      {eyebrow}
                    </span>
                  </div>
                  <span className="hidden rounded-full border border-[hsl(var(--gold)/0.38)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-foreground/70 sm:inline-flex">
                    Private access
                  </span>
                </div>

                <h2 className="max-w-[12ch] font-display text-[clamp(2.3rem,5vw,5.6rem)] font-black leading-[0.9] text-foreground">
                  {title}
                </h2>

                <p className="mt-7 max-w-[58ch] text-base font-medium leading-[1.78] text-foreground/78 md:text-[17px]">
                  {description}
                </p>

                <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {features.map((f, index) => (
                    <li key={f.label}>
                      <span className="flex min-h-[68px] items-center gap-3 rounded-2xl border border-[hsl(var(--gold)/0.34)] bg-[hsl(var(--background)/0.58)] px-3.5 py-3 shadow-[inset_0_1px_0_hsl(0_0%_100%/0.64)] transition-all duration-300 group-hover/portal:border-[hsl(var(--gold)/0.52)]">
                        <IconTile icon={f.icon} tone="gold" size="sm" className="rounded-xl" />
                        <span className="min-w-0">
                          <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-foreground/48">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="block text-sm font-extrabold leading-tight text-foreground">
                            {f.label}
                          </span>
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Link
                    to={href}
                    data-surface="dark"
                    data-on-dark
                    data-no-contrast-guard
                    data-allow-dark-cta
                    className="allow-white group/cta inline-flex min-h-[60px] items-center justify-between gap-5 rounded-2xl border border-[hsl(var(--gold)/0.68)] bg-[hsl(var(--navy-cta))] px-6 text-[15px] font-extrabold text-white shadow-[inset_0_1px_0_hsl(0_0%_100%/0.10),0_18px_38px_-22px_hsl(var(--navy-cta)/0.9)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[hsl(var(--navy-cta-hover))] hover:text-white hover:shadow-[inset_0_1px_0_hsl(0_0%_100%/0.12),0_25px_58px_-24px_hsl(var(--navy-cta)/0.95)] sm:min-w-[245px]"
                  >
                    <span className="allow-white" data-no-contrast-guard>{cta}</span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[hsl(var(--gold)/0.58)] bg-[hsl(var(--navy-cta-hover))] transition-transform duration-300 group-hover/cta:translate-x-1">
                      <ArrowRight className="allow-white h-4 w-4 text-white" data-no-contrast-guard strokeWidth={2.4} />
                    </span>
                  </Link>

                  {helper && (
                    <span className="border-l border-[hsl(var(--gold)/0.42)] pl-4 text-[12px] font-semibold italic leading-relaxed text-foreground/62">
                      {helper}
                    </span>
                  )}
                </div>
              </div>
            </aside>

            <div className="relative overflow-hidden rounded-[28px] border border-[hsl(var(--gold)/0.46)] bg-[hsl(var(--navy-cta)/0.94)] p-4 shadow-[inset_0_1px_0_hsl(0_0%_100%/0.08)] sm:p-5 lg:p-7">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,hsl(var(--gold)/0.16),transparent_32%),linear-gradient(135deg,hsl(0_0%_100%/0.06),transparent_42%)]" />
              <div className="relative flex h-full flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[hsl(var(--gold)/0.34)] bg-[hsl(var(--background)/0.08)] px-4 py-3 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <IconTile icon={Sparkles} tone="gold" size="sm" className="rounded-full bg-[hsl(var(--champagne-3))]" />
                    <div>
                      <p className="allow-white text-[10px] font-bold uppercase tracking-[0.22em] text-white/56" data-no-contrast-guard>
                        JBJ Global Real Estate
                      </p>
                      <p className="allow-white text-sm font-extrabold text-white" data-no-contrast-guard>
                        {accent.panelTitle}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-full border border-[hsl(var(--gold)/0.46)] px-3 py-1.5">
                    <span className="allow-white text-[11px] font-bold uppercase tracking-[0.18em] text-white" data-no-contrast-guard>
                      Verified workspace
                    </span>
                  </div>
                </div>

                <div className="grid flex-1 gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                  <div className="flex flex-col gap-4">
                    <div className="rounded-[24px] border border-[hsl(var(--gold)/0.36)] bg-[hsl(var(--background))] p-5 shadow-[0_20px_55px_-32px_hsl(0_0%_0%/0.72)]">
                      <div className="mb-5 flex items-end justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-foreground/45">
                            Access level
                          </p>
                          <p className="mt-2 text-5xl font-black leading-none text-foreground">
                            {accent.metric}
                          </p>
                        </div>
                        <div className="h-16 w-16 rounded-2xl border border-[hsl(var(--gold)/0.45)] bg-[hsl(var(--champagne-2))] p-2">
                          <PortalHeroArt kind={kind} className="opacity-95" />
                        </div>
                      </div>
                      <p className="text-sm font-bold text-foreground/72">{accent.metricLabel}</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                      {accent.modules.map((module, index) => (
                        <div
                          key={module}
                          className={cn(
                            "rounded-2xl border p-4 transition-transform duration-300 group-hover/portal:-translate-y-0.5",
                            index === 0
                              ? "border-[hsl(var(--gold)/0.62)] bg-[hsl(var(--champagne-3))] text-foreground"
                              : "border-[hsl(var(--gold)/0.28)] bg-[hsl(var(--background)/0.10)] text-white"
                          )}
                        >
                          <p className={cn("text-[10px] font-black uppercase tracking-[0.18em]", index === 0 ? "text-foreground/48" : "allow-white text-white/48")} data-no-contrast-guard>
                            Module {index + 1}
                          </p>
                          <p className={cn("mt-2 text-sm font-extrabold", index === 0 ? "text-foreground" : "allow-white text-white")} data-no-contrast-guard>
                            {module}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="relative min-h-[360px] overflow-hidden rounded-[26px] border border-[hsl(var(--gold)/0.40)] bg-[linear-gradient(145deg,hsl(var(--champagne-1)),hsl(var(--champagne-2)))] p-5 shadow-[inset_0_1px_0_hsl(0_0%_100%/0.75)]">
                    <div className="absolute inset-x-5 top-5 flex items-center justify-between border-b border-[hsl(var(--gold)/0.22)] pb-4">
                      <span className="text-[10px] font-black uppercase tracking-[0.24em] text-foreground/50">Private OS</span>
                      <span className="rounded-full border border-[hsl(var(--gold)/0.42)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-foreground">Live</span>
                    </div>
                    <div className="absolute inset-x-5 bottom-5 top-20 grid grid-rows-[1fr_auto] gap-4">
                      <div className="relative overflow-hidden rounded-2xl border border-[hsl(var(--gold)/0.34)] bg-[hsl(var(--background)/0.64)] p-5">
                        <PortalHeroArt kind={kind} className="mx-auto h-full max-h-[230px] opacity-95" />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {["Lead Flow", "Inventory", "Close Rate"].map((label, index) => (
                          <div key={label} className="rounded-2xl border border-[hsl(var(--gold)/0.30)] bg-[hsl(var(--background)/0.62)] p-3">
                            <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/46">{label}</span>
                            <span className="mt-2 block text-lg font-black text-foreground">{["92", "48", "+31"][index]}{index === 1 ? "" : "%"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
