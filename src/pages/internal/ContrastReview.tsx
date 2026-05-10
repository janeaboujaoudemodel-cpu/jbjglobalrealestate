/**
 * Internal Contrast Review Hub — Owner-only.
 *
 * A premium before/after gallery for the recent contrast & typography
 * refactor on Market Intelligence and related surfaces. Presentation only;
 * no business logic, no data writes.
 */
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, CheckCircle2, AlertTriangle } from "lucide-react";

type Surface = {
  bg: string; // hex on white
  label: string;
};

type Pair = {
  id: string;
  area: string;
  element: string;
  before: { className: string; fg: string; bg: string; note: string };
  after: { className: string; fg: string; bg: string; note: string };
};

type RouteEntry = {
  label: string;
  path: string;
  description: string;
};

const ROUTES: RouteEntry[] = [
  {
    label: "Market Intelligence — Public",
    path: "/market-intelligence",
    description: "Hero overlay tuning + standardized typography scale.",
  },
  {
    label: "Internal Dashboard",
    path: "/internal/market-intelligence/dashboard",
    description: "KPI cards, eyebrows, body copy aligned to MI tokens.",
  },
  {
    label: "Broker Intelligence",
    path: "/internal/market-intelligence/brokers",
    description: "Card titles & chips standardized.",
  },
  {
    label: "AI Insights",
    path: "/internal/market-intelligence/ai-insights",
    description: "AI panels using purple theme + MI typography.",
  },
  {
    label: "Data Operations",
    path: "/internal/market-intelligence/data-ops",
    description: "Data source rows and TOC item alignment.",
  },
];

// Pre-refactor (before) vs current (after) token pairs.
// Colors are sRGB hex used solely for the contrast preview swatches.
const PAIRS: Pair[] = [
  {
    id: "hero-desc",
    area: "Hero overlay",
    element: "Description copy on background image",
    before: {
      className: "text-white/85",
      fg: "#FFFFFFD9",
      bg: "#1A1A1A",
      note: "Single overlay, white at 85% — washed by ambient gold layer.",
    },
    after: {
      className: "text-white/95 + drop-shadow + composite overlays",
      fg: "#FFFFFFF2",
      bg: "#0A0A0A",
      note: "Triple overlay (vertical + spotlight + section blend), z-stacked under gold.",
    },
  },
  {
    id: "eyebrow",
    area: "Section eyebrow",
    element: "Uppercase kicker label",
    before: {
      className: "text-xs uppercase tracking-wider text-muted-foreground/70",
      fg: "#71717AB3",
      bg: "#FFFFFF",
      note: "Inconsistent tracking and faded muted color across files.",
    },
    after: {
      className: "MI_EYEBROW (text-xs font-semibold uppercase tracking-[0.3em])",
      fg: "#52525B",
      bg: "#FFFFFF",
      note: "Single source token — uniform tracking and weight.",
    },
  },
  {
    id: "h2",
    area: "Section heading",
    element: "Section H2",
    before: {
      className: "text-2xl/3xl mixed, font-semibold/bold mixed",
      fg: "#0A0A0A",
      bg: "#FFFFFF",
      note: "Sizes drifted between sections — visual rhythm broken.",
    },
    after: {
      className: "MI_H2 (text-3xl md:text-4xl font-bold leading-tight tracking-tight)",
      fg: "#0A0A0A",
      bg: "#FFFFFF",
      note: "One scale, aligned across 8 components.",
    },
  },
  {
    id: "card-title",
    area: "Card title",
    element: "Card H3",
    before: {
      className: "text-base/text-lg, font-medium",
      fg: "#27272A",
      bg: "#FAFAFA",
      note: "Mixed weights produced soft hierarchy.",
    },
    after: {
      className: "MI_CARD_TITLE (text-lg font-semibold leading-snug)",
      fg: "#0A0A0A",
      bg: "#FAFAFA",
      note: "Stronger weight; legible against neutral surfaces.",
    },
  },
  {
    id: "body",
    area: "Body copy",
    element: "Paragraph text",
    before: {
      className: "text-sm text-muted-foreground/80 leading-normal",
      fg: "#71717ACC",
      bg: "#FFFFFF",
      note: "Faded muted color failed AA on small sizes.",
    },
    after: {
      className: "MI_BODY_MUTED (text-sm text-muted-foreground leading-relaxed)",
      fg: "#52525B",
      bg: "#FFFFFF",
      note: "Full-opacity muted, generous line-height.",
    },
  },
  {
    id: "chip",
    area: "Chip / Pill",
    element: "Trust badge & filter chip",
    before: {
      className: "text-[11px] text-[#1A1A1A]/80",
      fg: "#B8956ACC",
      bg: "#FFFFFF",
      note: "Faded gold — banned by faded-gold guard.",
    },
    after: {
      className: "MI_CHIP (text-xs font-semibold text-foreground)",
      fg: "#0A0A0A",
      bg: "#F4F4F5",
      note: "Solid foreground on neutral pill — passes AAA.",
    },
  },
  {
    id: "toc",
    area: "Table of contents",
    element: "Active TOC item",
    before: {
      className: "text-sm text-muted-foreground hover:text-foreground",
      fg: "#A1A1AA",
      bg: "#FAFAFA",
      note: "Active state indistinguishable from idle.",
    },
    after: {
      className: "MI_TOC_ITEM (text-sm font-medium + active:text-foreground)",
      fg: "#0A0A0A",
      bg: "#FAFAFA",
      note: "Active item visually anchored.",
    },
  },
  {
    id: "kpi",
    area: "KPI value",
    element: "Large stat number",
    before: {
      className: "text-xl font-semibold",
      fg: "#27272A",
      bg: "#FFFFFF",
      note: "Under-sized vs. supporting label.",
    },
    after: {
      className: "MI_KPI (text-2xl font-bold)",
      fg: "#0A0A0A",
      bg: "#FFFFFF",
      note: "Establishes data hierarchy.",
    },
  },
];

// WCAG relative luminance + contrast ratio.
function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  const c = [r, g, b].map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

// Flatten foreground (with optional alpha) onto background, then compute ratio.
function contrast(fgHex: string, bgHex: string): number {
  const flatten = (hex: string, bg: string): string => {
    const h = hex.replace("#", "");
    if (h.length !== 8) return "#" + h;
    const a = parseInt(h.substring(6, 8), 16) / 255;
    const fr = parseInt(h.substring(0, 2), 16);
    const fg = parseInt(h.substring(2, 4), 16);
    const fb = parseInt(h.substring(4, 6), 16);
    const bgh = bg.replace("#", "");
    const br = parseInt(bgh.substring(0, 2), 16);
    const bgg = parseInt(bgh.substring(2, 4), 16);
    const bb = parseInt(bgh.substring(4, 6), 16);
    const mix = (f: number, b: number) => Math.round(f * a + b * (1 - a));
    const toHex = (n: number) => n.toString(16).padStart(2, "0");
    return "#" + toHex(mix(fr, br)) + toHex(mix(fg, bgg)) + toHex(mix(fb, bb));
  };
  const fg = flatten(fgHex, bgHex);
  const l1 = luminance(fg);
  const l2 = luminance(bgHex);
  const [a, b] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (a + 0.05) / (b + 0.05);
}

function ratioBadge(r: number) {
  const passAA = r >= 4.5;
  const passAAA = r >= 7;
  const tone = passAAA
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : passAA
    ? "bg-blue-50 text-blue-700 border-blue-200"
    : "bg-red-50 text-red-700 border-red-200";
  const label = passAAA ? "AAA" : passAA ? "AA" : "FAIL";
  return { tone, label, ratio: r.toFixed(2) };
}

export default function ContrastReview() {
  const [active, setActive] = useState<RouteEntry>(ROUTES[0]);

  const summary = useMemo(() => {
    let beforeFails = 0;
    let afterPass = 0;
    PAIRS.forEach((p) => {
      if (contrast(p.before.fg, p.before.bg) < 4.5) beforeFails++;
      if (contrast(p.after.fg, p.after.bg) >= 4.5) afterPass++;
    });
    return { beforeFails, afterPass, total: PAIRS.length };
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A]">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[#B89555]/30 bg-[#FDFBF7]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#B89555]/30 text-[#1A1A1A]/70 transition hover:bg-[#F7F2EA]"
              aria-label="Back to home"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#1A1A1A]/60">
                Internal · Design QA
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-[#1A1A1A]/70">
                Contrast Review Gallery
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {summary.afterPass}/{summary.total} pass AA after
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              {summary.beforeFails} fixed
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10 space-y-12">
        {/* Intro */}
        <section className="max-w-3xl">
          <p className="text-base leading-relaxed text-[#1A1A1A]/70">
            A side-by-side review of the typography &amp; contrast refactor across the
            Market Intelligence module and the supporting hero overlay. Each card pairs the
            previous token usage with the current standardized token, computes WCAG ratios
            on representative swatches, and links you to the live page so you can verify
            the rendered result.
          </p>
        </section>

        {/* Live route preview */}
        <section className="rounded-2xl border border-[#B89555]/30 bg-[#F7F2EA]/60 p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#1A1A1A]/60">
                Live preview
              </p>
              <h2 className="text-xl font-bold tracking-tight text-[#1A1A1A]/70">
                {active.label}
              </h2>
              <p className="mt-1 text-sm text-[#1A1A1A]/70">{active.description}</p>
            </div>
            <a
              href={active.path}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-[#B89555]/30 bg-[#FDFBF7] px-4 py-2 text-xs font-semibold text-[#1A1A1A] transition hover:bg-[#F7F2EA]"
            >
              Open in new tab <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {ROUTES.map((r) => (
              <button
                key={r.path}
                onClick={() => setActive(r)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  r.path === active.path
                    ? "border-[#B89555]/30 bg-[#FDFBF7] text-white"
                    : "border-[#B89555]/30 bg-[#FDFBF7] text-[#1A1A1A]/70 hover:bg-[#F7F2EA]"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-xl border border-[#B89555]/30 bg-[#FDFBF7] shadow-sm">
            <iframe
              key={active.path}
              src={active.path}
              title={`Live preview — ${active.label}`}
              className="h-[720px] w-full"
              loading="lazy"
            />
          </div>
        </section>

        {/* Before / After token pairs */}
        <section>
          <div className="mb-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#1A1A1A]/60">
              Token diff
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-[#1A1A1A]/70">
              Before &amp; after — typography &amp; contrast
            </h2>
            <p className="mt-1 text-sm text-[#1A1A1A]/70">
              Computed against representative swatches. AA ≥ 4.5, AAA ≥ 7.0.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {PAIRS.map((p) => {
              const beforeR = contrast(p.before.fg, p.before.bg);
              const afterR = contrast(p.after.fg, p.after.bg);
              const b = ratioBadge(beforeR);
              const a = ratioBadge(afterR);
              return (
                <article
                  key={p.id}
                  className="overflow-hidden rounded-2xl border border-[#B89555]/30 bg-[#FDFBF7]"
                >
                  <header className="border-b border-[#B89555]/30 px-5 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#1A1A1A]/60">
                      {p.area}
                    </p>
                    <h3 className="text-base font-semibold text-[#1A1A1A]/70">{p.element}</h3>
                  </header>

                  <div className="grid grid-cols-2">
                    {/* Before */}
                    <div className="border-r border-[#B89555]/30 p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#1A1A1A]/70">
                          Before
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${b.tone}`}
                        >
                          {b.label} · {b.ratio}
                        </span>
                      </div>
                      <div
                        className="mb-3 flex h-20 items-center justify-center rounded-lg border border-[#B89555]/30"
                        style={{ background: p.before.bg }}
                      >
                        <span
                          className="text-sm font-medium"
                          style={{ color: p.before.fg }}
                        >
                          Sample text
                        </span>
                      </div>
                      <code className="block break-all rounded-md bg-[#F7F2EA] px-2 py-1.5 text-[11px] text-[#1A1A1A]/70">
                        {p.before.className}
                      </code>
                      <p className="mt-2 text-xs leading-relaxed text-[#1A1A1A]/60">
                        {p.before.note}
                      </p>
                    </div>

                    {/* After */}
                    <div className="p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-600">
                          After
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${a.tone}`}
                        >
                          {a.label} · {a.ratio}
                        </span>
                      </div>
                      <div
                        className="mb-3 flex h-20 items-center justify-center rounded-lg border border-[#B89555]/30"
                        style={{ background: p.after.bg }}
                      >
                        <span
                          className="text-sm font-semibold"
                          style={{ color: p.after.fg }}
                        >
                          Sample text
                        </span>
                      </div>
                      <code className="block break-all rounded-md bg-emerald-50 px-2 py-1.5 text-[11px] text-emerald-900">
                        {p.after.className}
                      </code>
                      <p className="mt-2 text-xs leading-relaxed text-[#1A1A1A]/70">
                        {p.after.note}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Footer guidance */}
        <section className="rounded-2xl border border-[#B89555]/30 bg-[#F7F2EA] p-6">
          <h3 className="text-sm font-semibold text-[#1A1A1A]/70">Verification checklist</h3>
          <ul className="mt-3 space-y-2 text-sm text-[#1A1A1A]/70">
            <li>• <code className="rounded bg-[#FDFBF7] px-1.5 py-0.5 text-xs">npm run check:contrast</code> — automated WCAG sweep.</li>
            <li>• <code className="rounded bg-[#FDFBF7] px-1.5 py-0.5 text-xs">npm run check:a11y</code> — focus order, ARIA, keyboard nav.</li>
            <li>• <code className="rounded bg-[#FDFBF7] px-1.5 py-0.5 text-xs">npm run check:faded-gold</code> — guards against faded-gold reintroduction.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
