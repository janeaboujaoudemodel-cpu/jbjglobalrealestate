/**
 * /dev/footer-preview — Internal QA tool
 *
 * Renders the live <Footer /> against a cyclable swatch of dark backgrounds
 * (solid, gradient, noise) at desktop/tablet/mobile widths, with an optional
 * pixel-ruler overlay for verifying hairlines and dividers.
 *
 * Owner-only. noindex,nofollow.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, X, Ruler } from "lucide-react";
import OwnerGuard from "@/components/OwnerGuard";
import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";

type Preset = {
  key: string;
  label: string;
  hex: string;
  style: React.CSSProperties;
};

const NOISE_SVG =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.35 0'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>\")";

const PRESETS: Preset[] = [
  {
    key: "obsidian",
    label: "Obsidian (footer base)",
    hex: "#0A0908",
    style: { background: "#0A0908" },
  },
  {
    key: "ink",
    label: "Pure Black",
    hex: "#000000",
    style: { background: "#000000" },
  },
  {
    key: "charcoal",
    label: "Warm Charcoal",
    hex: "#1A1714",
    style: { background: "#1A1714" },
  },
  {
    key: "midnight",
    label: "Midnight Blue-Black",
    hex: "#0B1020",
    style: { background: "#0B1020" },
  },
  {
    key: "espresso",
    label: "Espresso",
    hex: "#15110D",
    style: { background: "#15110D" },
  },
  {
    key: "gradient-radial",
    label: "Radial Champagne Wash",
    hex: "#0A0908",
    style: {
      background:
        "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(200,167,102,0.10), transparent 70%), #0A0908",
    },
  },
  {
    key: "gradient-linear",
    label: "Black → Obsidian (top→bottom)",
    hex: "#0A0908",
    style: { background: "linear-gradient(180deg, #000000 0%, #0A0908 100%)" },
  },
  {
    key: "noise",
    label: "Obsidian + Grain",
    hex: "#0A0908",
    style: {
      backgroundColor: "#0A0908",
      backgroundImage: NOISE_SVG,
      backgroundRepeat: "repeat",
    },
  },
];

const WIDTHS = [
  { key: "desktop", label: "Desktop · 1280", value: 1280 },
  { key: "tablet", label: "Tablet · 768", value: 768 },
  { key: "mobile", label: "Mobile · 390", value: 390 },
] as const;

type WidthKey = (typeof WIDTHS)[number]["key"];

const STORAGE_KEY = "jbj_footer_preview_state";

interface PersistedState {
  presetKey: string;
  widthKey: WidthKey;
  ruler: boolean;
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      return {
        presetKey:
          PRESETS.find((p) => p.key === parsed.presetKey)?.key ?? PRESETS[0].key,
        widthKey:
          (WIDTHS.find((w) => w.key === parsed.widthKey)?.key as WidthKey) ??
          "desktop",
        ruler: Boolean(parsed.ruler),
      };
    }
  } catch {
    /* ignore */
  }
  return { presetKey: PRESETS[0].key, widthKey: "desktop", ruler: false };
}

const FooterPreviewInner = () => {
  const [state, setState] = useState<PersistedState>(() => loadState());
  const [liveLuminance, setLiveLuminance] = useState<number | null>(null);

  // Poll the footer's data-hairline-luminance attribute so we can show
  // the adaptive alphas the hook computed for the current preset.
  useEffect(() => {
    const read = () => {
      const el = document.getElementById("site-footer");
      const v = el?.getAttribute("data-hairline-luminance");
      if (v) setLiveLuminance(parseFloat(v));
    };
    read();
    const id = window.setInterval(read, 400);
    return () => window.clearInterval(id);
  }, [state.presetKey]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const presetIndex = useMemo(
    () => Math.max(0, PRESETS.findIndex((p) => p.key === state.presetKey)),
    [state.presetKey],
  );
  const preset = PRESETS[presetIndex];
  const width = WIDTHS.find((w) => w.key === state.widthKey)!.value;

  const cyclePreset = useCallback((dir: 1 | -1) => {
    setState((s) => {
      const idx = Math.max(0, PRESETS.findIndex((p) => p.key === s.presetKey));
      const next = (idx + dir + PRESETS.length) % PRESETS.length;
      return { ...s, presetKey: PRESETS[next].key };
    });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement) {
        const tag = e.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        cyclePreset(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        cyclePreset(-1);
      } else if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        setState((s) => ({ ...s, ruler: !s.ruler }));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cyclePreset]);

  const rulerStyle: React.CSSProperties = state.ruler
    ? {
        backgroundImage:
          "linear-gradient(to right, rgba(200,167,102,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(200,167,102,0.18) 1px, transparent 1px)",
        backgroundSize: "8px 8px",
      }
    : {};

  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Footer Preview · Dark Surface QA";
    let meta = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const created = !meta;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "robots";
      document.head.appendChild(meta);
    }
    const prevContent = meta.content;
    meta.content = "noindex,nofollow";
    return () => {
      document.title = prevTitle;
      if (created) meta?.remove();
      else if (meta) meta.content = prevContent;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white font-inter">
      {/* Toolbar */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#1A1A1A]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2 mr-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[hsl(43_55%_60%)]" />
            <h1 className="text-sm font-semibold tracking-wide">
              Footer Preview · Dark Surface QA
            </h1>
          </div>

          {/* Preset selector */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => cyclePreset(-1)}
              aria-label="Previous background"
              className="inline-flex h-8 w-8 items-center justify-center rounded border border-white/15 bg-[#FDFBF7]/5 hover:bg-[#FDFBF7]/10"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <select
              value={state.presetKey}
              onChange={(e) =>
                setState((s) => ({ ...s, presetKey: e.target.value }))
              }
              className="h-8 rounded border border-white/15 bg-[#1A1A1A]/60 px-2 text-xs text-white"
              aria-label="Background preset"
            >
              {PRESETS.map((p) => (
                <option key={p.key} value={p.key} className="bg-[#1A1A1A]">
                  {p.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => cyclePreset(1)}
              aria-label="Next background"
              className="inline-flex h-8 w-8 items-center justify-center rounded border border-white/15 bg-[#FDFBF7]/5 hover:bg-[#FDFBF7]/10"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Width selector */}
          <div className="flex items-center gap-1 rounded border border-white/15 bg-[#FDFBF7]/5 p-0.5">
            {WIDTHS.map((w) => (
              <button
                key={w.key}
                type="button"
                onClick={() => setState((s) => ({ ...s, widthKey: w.key }))}
                className={cn(
                  "h-7 rounded px-2 text-[11px] font-medium transition-colors",
                  state.widthKey === w.key
                    ? "bg-[#FDFBF7] text-[#1A1A1A]"
                    : "text-white/70 hover:text-white",
                )}
              >
                {w.label}
              </button>
            ))}
          </div>

          {/* Ruler toggle */}
          <button
            type="button"
            onClick={() => setState((s) => ({ ...s, ruler: !s.ruler }))}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded border px-2.5 text-xs",
              state.ruler
                ? "border-[hsl(43_55%_60%)] bg-[hsl(43_55%_60%)]/15 text-[hsl(43_55%_60%)]"
                : "border-white/15 bg-[#FDFBF7]/5 text-white/80 hover:bg-[#FDFBF7]/10",
            )}
            aria-pressed={state.ruler}
            title="Toggle 8px grid (R)"
          >
            <Ruler className="h-3.5 w-3.5" />
            Ruler
          </button>

          {/* Hex + adaptive hairline read-out */}
          <div className="ml-auto flex items-center gap-2 text-[11px] text-white/90">
            <span
              className="inline-block h-4 w-4 rounded border border-white/20"
              style={preset.style}
            />
            <span className="font-mono">{preset.hex}</span>
            {liveLuminance !== null && (
              <>
                <span className="hidden sm:inline">·</span>
                <span
                  className="hidden sm:inline font-mono text-[hsl(43_55%_70%)]"
                  title="Underlay luminance detected by useAdaptiveHairline. Lower = darker, higher = brighter."
                >
                  L={liveLuminance.toFixed(3)}
                </span>
              </>
            )}
            <span className="hidden md:inline">·</span>
            <span className="hidden md:inline">
              ← / → cycle · R ruler
            </span>
          </div>

          <Link
            to="/"
            aria-label="Close preview"
            className="inline-flex h-8 w-8 items-center justify-center rounded border border-white/15 bg-[#FDFBF7]/5 hover:bg-[#FDFBF7]/10"
          >
            <X className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Canvas */}
      <main className="mx-auto max-w-[1600px] p-4 sm:p-6">
        <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-wider text-white/85">
          <span>Live &lt;Footer /&gt;</span>
          <span>·</span>
          <span>{preset.label}</span>
          <span>·</span>
          <span>{width}px</span>
        </div>

        <div
          className="relative mx-auto overflow-hidden rounded-lg border border-white/10 shadow-2xl transition-all"
          style={{ width: "100%", maxWidth: width }}
        >
          {/* Background swatch */}
          <div className="relative" style={preset.style}>
            {/* Footer */}
            <div className="relative">
              <Footer />
            </div>

            {/* Ruler overlay */}
            {state.ruler && (
              <div
                className="pointer-events-none absolute inset-0"
                style={rulerStyle}
                aria-hidden="true"
              />
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-white/85">
          Internal QA tool · noindex · resize the browser or use the width
          selector to verify hairlines at every breakpoint.
        </p>
      </main>
    </div>
  );
};

const FooterPreviewPage = () => (
  <OwnerGuard>
    <FooterPreviewInner />
  </OwnerGuard>
);

export default FooterPreviewPage;
