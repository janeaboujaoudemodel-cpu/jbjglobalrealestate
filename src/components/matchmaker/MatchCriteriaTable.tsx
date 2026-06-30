// Criteria × Properties tick table for the AI Home Finder results page.
// Renders the user's requirements as rows and the top properties as columns,
// with ✓ (match), ≈ (close), or ✗ (mismatch) cells plus the actual value.
import { Check, X, Minus } from "lucide-react";

type Verdict = "match" | "close" | "miss";

interface RowCell {
  verdict: Verdict;
  value: string;
}

interface CriterionRow {
  label: string;
  userPick: string;
  cells: RowCell[];
}

interface Props {
  answers: Record<string, string | string[]>;
  projects: any[];
}

const BUDGET_LABEL: Record<string, string> = {
  "under-1m": "Under AED 1M",
  "1m-2m": "AED 1M – 2M",
  "2m-5m": "AED 2M – 5M",
  "5m-10m": "AED 5M – 10M",
  "10m-plus": "AED 10M+",
};

const BEDROOM_LABEL: Record<string, string> = {
  studio: "Studio",
  "1br": "1 Bedroom",
  "2br": "2 Bedrooms",
  "3br": "3 Bedrooms",
  "4br-plus": "4+ Bedrooms",
};

const TIMELINE_LABEL: Record<string, string> = {
  ready: "Ready to move",
  "2025": "2025",
  "2026": "2026",
  "2027-plus": "2027 or later",
  flexible: "Flexible",
};

const LOCATION_LABEL: Record<string, string> = {
  beachfront: "Beachfront / Waterfront",
  "city-center": "City Center",
  "golf-community": "Golf Community",
  suburban: "Suburban",
  flexible: "Open to all",
};

const AREA_LABEL: Record<string, string> = {
  downtown: "Downtown Dubai",
  marina: "Dubai Marina",
  palm: "Palm Jumeirah",
  "business-bay": "Business Bay",
  "creek-harbour": "Dubai Creek Harbour",
  hills: "Dubai Hills Estate",
  "arabian-ranches": "Arabian Ranches",
  other: "Other Areas",
};

const FEATURE_LABEL: Record<string, string> = {
  "sea-view": "Sea / Water View",
  "city-view": "City / Skyline View",
  "private-pool": "Private Pool",
  "private-garden": "Private Garden",
  "maid-room": "Maid's Room",
  balcony: "Large Balcony / Terrace",
};

function priceVerdict(p: any, budget?: string): RowCell {
  const price = p?.price_from;
  const priceTo = p?.price_to;
  const fmt = (n: number) =>
    n >= 1_000_000 ? `AED ${(n / 1_000_000).toFixed(1)}M` : `AED ${Math.round(n / 1000)}K`;
  const display = price
    ? priceTo && priceTo > price
      ? `From ${fmt(price)} – ${fmt(priceTo)}`
      : `From ${fmt(price)}`
    : "On request";
  if (!budget || price == null) return { verdict: "close", value: display };

  // Budget ceiling per bucket. A project matches when its STARTING price is at
  // or below the ceiling — cheaper starting price means they almost certainly
  // have units inside the band (larger layouts, higher floors, etc.).
  let budgetMax = 0;
  switch (budget) {
    case "under-1m": budgetMax = 1_000_000; break;
    case "1m-2m":   budgetMax = 2_000_000; break;
    case "2m-5m":   budgetMax = 5_000_000; break;
    case "5m-10m":  budgetMax = 10_000_000; break;
    case "10m-plus":
      // Open-ended ceiling: match if they likely have 10M+ stock.
      if (price >= 6_000_000) return { verdict: "match", value: display };
      if (price >= 4_000_000) return { verdict: "close", value: display };
      return { verdict: "miss", value: display };
  }

  if (price <= budgetMax) return { verdict: "match", value: display };
  if (price <= budgetMax * 1.2) return { verdict: "close", value: display };
  return { verdict: "miss", value: display };
}

function bedroomVerdict(p: any, choice?: string): RowCell {
  const min = p?.bedrooms_min;
  const max = p?.bedrooms_max ?? min;
  const display =
    min == null
      ? "Bedroom mix on request"
      : min === 0
        ? `Studio${max > 0 ? `–${max} BR` : ""}`
        : `${min}–${max} BR`;
  if (!choice || min == null) return { verdict: "close", value: display };
  const has = (n: number) => min <= n && max >= n;
  let match = false;
  let close = false;
  switch (choice) {
    case "studio":
      match = min === 0;
      close = min <= 1;
      break;
    case "1br":
      match = has(1);
      close = has(1) || has(2);
      break;
    case "2br":
      match = has(2);
      close = has(1) || has(2) || has(3);
      break;
    case "3br":
      match = has(3);
      close = has(2) || has(3) || has(4);
      break;
    case "4br-plus":
      match = max >= 4;
      close = max >= 3;
      break;
  }
  return { verdict: match ? "match" : close ? "close" : "miss", value: display };
}

function areaVerdict(p: any, areas?: string[]): RowCell {
  const value = `${p?.location || "—"}${p?.emirate ? `, ${p.emirate}` : ""}`;
  if (!areas?.length) return { verdict: "close", value };
  const blob = `${p?.name || ""} ${p?.location || ""} ${p?.community?.name || ""}`.toLowerCase();
  const hasOther = areas.includes("other");
  for (const a of areas) {
    if (a === "other") continue;
    const label = (AREA_LABEL[a] || a).toLowerCase();
    const tokens = label.replace(/dubai/g, "").trim().split(/\s+/).filter(Boolean);
    if (tokens.some((t) => blob.includes(t))) {
      return { verdict: "match", value };
    }
  }
  return { verdict: hasOther ? "close" : "miss", value };
}

function timelineVerdict(p: any, choice?: string): RowCell {
  const h = (p?.handover_date || "").toString();
  const value = h || "TBA";
  if (!choice || !h) return { verdict: "close", value };
  const lower = h.toLowerCase();
  let match = false;
  let close = false;
  if (choice === "ready") {
    match = lower.includes("ready");
    close = lower.includes("2025") || lower.includes("ready");
  } else if (choice === "flexible") {
    match = true;
  } else if (choice === "2027-plus") {
    match = /(2027|2028|2029|2030)/.test(lower);
    close = /(2026|2027|2028)/.test(lower);
  } else {
    match = lower.includes(choice);
    const year = parseInt(choice, 10);
    if (!Number.isNaN(year)) {
      close =
        lower.includes(String(year - 1)) ||
        lower.includes(String(year)) ||
        lower.includes(String(year + 1));
    }
  }
  return { verdict: match ? "match" : close ? "close" : "miss", value };
}

function locationTypeVerdict(p: any, picks?: string[]): RowCell {
  const views: string[] = (p?.views || []).map((v: string) => v.toLowerCase());
  const value = views.length ? views.slice(0, 2).join(", ") : "—";
  if (!picks?.length) return { verdict: "close", value };
  const hit = (kw: string) => views.some((v) => v.includes(kw));
  let match = false;
  for (const pk of picks) {
    if (pk === "flexible") match = true;
    if (pk === "beachfront" && (hit("sea") || hit("beach") || hit("water"))) match = true;
    if (pk === "city-center" && (hit("city") || hit("skyline"))) match = true;
    if (pk === "golf-community" && hit("golf")) match = true;
    if (pk === "suburban" && (hit("garden") || hit("community"))) match = true;
  }
  return { verdict: match ? "match" : "miss", value };
}

function featureVerdict(p: any, picks?: string[]): RowCell {
  const amenities: string[] = (p?.amenities || []).map((a: string) => a.toLowerCase());
  const views: string[] = (p?.views || []).map((v: string) => v.toLowerCase());
  if (!picks?.length) return { verdict: "close", value: amenities.slice(0, 2).join(", ") || "—" };
  const hit = (kw: string) =>
    amenities.some((a) => a.includes(kw)) || views.some((v) => v.includes(kw));
  const matched = picks.filter((pk) => {
    if (pk === "sea-view") return hit("sea") || hit("water");
    if (pk === "city-view") return hit("city") || hit("skyline");
    if (pk === "private-pool") return hit("pool");
    if (pk === "private-garden") return hit("garden");
    if (pk === "maid-room") return hit("maid");
    if (pk === "balcony") return hit("balcony") || hit("terrace");
    return false;
  });
  const verdict: Verdict =
    matched.length === picks.length ? "match" : matched.length > 0 ? "close" : "miss";
  const value = matched.length ? `${matched.length}/${picks.length} features` : "Limited info";
  return { verdict, value };
}

function buildRows(
  answers: Record<string, string | string[]>,
  projects: any[]
): CriterionRow[] {
  const rows: CriterionRow[] = [];

  if (answers.budget) {
    rows.push({
      label: "Budget",
      userPick: BUDGET_LABEL[answers.budget as string] || String(answers.budget),
      cells: projects.map((p) => priceVerdict(p, answers.budget as string)),
    });
  }
  if (answers.bedrooms) {
    rows.push({
      label: "Bedrooms",
      userPick: BEDROOM_LABEL[answers.bedrooms as string] || String(answers.bedrooms),
      cells: projects.map((p) => bedroomVerdict(p, answers.bedrooms as string)),
    });
  }
  if (answers.areas) {
    const arr = answers.areas as string[];
    rows.push({
      label: "Preferred Areas",
      userPick: arr.map((a) => AREA_LABEL[a] || a).join(", ") || "—",
      cells: projects.map((p) => areaVerdict(p, arr)),
    });
  }
  if (answers.timeline) {
    rows.push({
      label: "Timeline",
      userPick: TIMELINE_LABEL[answers.timeline as string] || String(answers.timeline),
      cells: projects.map((p) => timelineVerdict(p, answers.timeline as string)),
    });
  }
  if (answers.location_type) {
    const arr = Array.isArray(answers.location_type)
      ? (answers.location_type as string[])
      : [answers.location_type as string];
    rows.push({
      label: "Location Type",
      userPick: arr.map((a) => LOCATION_LABEL[a] || a).join(", "),
      cells: projects.map((p) => locationTypeVerdict(p, arr)),
    });
  }
  if (answers.views_and_features) {
    const arr = answers.views_and_features as string[];
    rows.push({
      label: "Key Features",
      userPick: arr.map((a) => FEATURE_LABEL[a] || a).join(", "),
      cells: projects.map((p) => featureVerdict(p, arr)),
    });
  }

  return rows;
}

const verdictStyles: Record<
  Verdict,
  { bg: string; ring: string; fg: string; Icon: typeof Check; label: string }
> = {
  match: {
    bg: "rgba(16,185,129,0.12)",
    ring: "rgba(16,185,129,0.55)",
    fg: "#047857",
    Icon: Check,
    label: "Match",
  },
  close: {
    bg: "rgba(217,119,6,0.12)",
    ring: "rgba(217,119,6,0.55)",
    fg: "#B45309",
    Icon: Minus,
    label: "Close",
  },
  miss: {
    bg: "rgba(178,58,72,0.10)",
    ring: "rgba(178,58,72,0.45)",
    fg: "#B23A48",
    Icon: X,
    label: "Miss",
  },
};

export function computeMatchTotals(rows: CriterionRow[], projectIndex: number) {
  let match = 0, close = 0, miss = 0;
  for (const r of rows) {
    const c = r.cells[projectIndex];
    if (!c) continue;
    if (c.verdict === "match") match++;
    else if (c.verdict === "close") close++;
    else miss++;
  }
  return { match, close, miss, total: rows.length };
}

export default function MatchCriteriaTable({ answers, projects }: Props) {
  const rows = buildRows(answers, projects);
  if (!rows.length || !projects.length) return null;

  const totals = projects.map((_, i) => computeMatchTotals(rows, i));

  return (
    <div
      data-no-contrast-guard
      className="aihf-panel rounded-2xl p-5 md:p-7 mb-8 overflow-x-auto"
      style={{
        background:
          "#F7F2EA",
        border: "1px solid rgba(184,149,85,0.55)",
        boxShadow:
          "none",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <h3 className="text-lg md:text-xl font-semibold mb-1">
            How each property matches your requirements
          </h3>
          <p className="aihf-muted text-sm">
            Match = exact fit · Close = softened fit · Miss = outside that requirement — actual value shown in each cell.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs aihf-muted">
          <Legend verdict="match" />
          <Legend verdict="close" />
          <Legend verdict="miss" />
        </div>
      </div>

      <table className="w-full border-separate" style={{ borderSpacing: 0 }}>
        <thead>
          <tr>
            <th
              data-no-contrast-guard
              className="aihf-criteria-head text-left text-xs font-semibold uppercase tracking-wide p-3 sticky left-0 !text-[#1A1A1A]"
              style={{
                color: "#1A1A1A",
                WebkitTextFillColor: "#1A1A1A",
                background: "#EFE6D6",
                minWidth: 170,
              }}
            >
              Your requirement
            </th>
            {projects.map((p, i) => {
              const rankBg =
                i === 0
                  ? "#EFE6D6"
                  : i === 1
                  ? "#F7F2EA"
                  : "#FDFBF7";
              return (
                <th
                  key={p.id || i}
                  className="text-left text-xs font-semibold uppercase tracking-wide p-3 align-bottom"
                  style={{ color: "#1A1A1A", minWidth: 220 }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    {p.cover_image_url ? (
                      <img
                        src={p.cover_image_url}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover"
                        style={{ border: "1px solid rgba(184,149,85,0.45)" }}
                       loading="lazy" decoding="async" />
                    ) : null}
                    <div className="flex flex-col gap-1">
                      <span
                        className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{
                          background: rankBg,
                          color: "#1A1A1A",
                          letterSpacing: "0.04em",
                        }}
                      >
                        #{i + 1}
                      </span>
                    </div>
                  </div>
                  <div
                    className="text-sm font-bold normal-case tracking-normal leading-tight"
                    style={{ color: "#1A1A1A" }}
                  >
                    {p.name}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={row.label}>
              <td
                className="align-top p-3 text-sm sticky left-0"
                style={{
                  background:
                    ri % 2
                      ? "#F7F2EA"
                      : "#EFE6D6",
                  borderTop: "1px solid rgba(184,149,85,0.28)",
                  minWidth: 170,
                }}
              >
                <div className="font-semibold mb-0.5">{row.label}</div>
                <div className="aihf-muted text-xs leading-snug">{row.userPick}</div>
              </td>
              {row.cells.map((cell, ci) => {
                const s = verdictStyles[cell.verdict];
                const Icon = s.Icon;
                return (
                  <td
                    key={ci}
                    className="align-top p-3 text-sm"
                    style={{
                      background:
                        ri % 2
                          ? "#FDFBF7"
                          : "#F7F2EA",
                      borderTop: "1px solid rgba(184,149,85,0.22)",
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className="inline-flex items-center justify-center rounded-full w-6 h-6 flex-shrink-0 mt-0.5"
                        style={{
                          background: s.bg,
                          border: `1px solid ${s.ring}`,
                        }}
                        aria-label={s.label}
                      >
                        <Icon className="w-3.5 h-3.5" style={{ color: s.fg, stroke: s.fg }} />
                      </span>
                      <div>
                        <div className="text-xs font-semibold" style={{ color: s.fg }}>
                          {s.label}
                        </div>
                        <div className="text-sm leading-snug" style={{ color: "#1A1A1A" }}>
                          {cell.value}
                        </div>
                      </div>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}

          {/* Summary footer row */}
          <tr>
            <td
              className="align-top p-3 sticky left-0"
              style={{
                background:
                  "#EFE6D6",
                borderTop: "2px solid rgba(184,149,85,0.55)",
                minWidth: 170,
              }}
            >
              <div className="text-xs font-bold uppercase tracking-wide" style={{ color: "#1A1A1A" }}>
                Match summary
              </div>
              <div className="aihf-muted text-[11px] mt-0.5">
                Why we ranked them this way
              </div>
            </td>
            {totals.map((t, i) => (
              <td
                key={i}
                className="align-top p-3"
                style={{
                  background:
                    "#F7F2EA",
                  borderTop: "2px solid rgba(184,149,85,0.55)",
                }}
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    data-surface="emerald"
                    data-no-contrast-guard
                    className="allow-white inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
                    style={{ backgroundImage: "var(--jj-emerald-ombre)", border: "1px solid rgba(184,149,85,0.55)", color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
                  >
                    <Check className="w-3 h-3 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                    <span className="allow-white" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>{t.match} matched</span>
                  </span>
                  {t.close > 0 && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
                      style={{ background: verdictStyles.close.bg, border: `1px solid ${verdictStyles.close.ring}`, color: verdictStyles.close.fg }}
                    >
                      <Minus className="w-3 h-3" style={{ stroke: verdictStyles.close.fg }} />
                      {t.close} close
                    </span>
                  )}
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
                    style={{ background: verdictStyles.miss.bg, border: `1px solid ${verdictStyles.miss.ring}`, color: verdictStyles.miss.fg }}
                  >
                    <X className="w-3 h-3" style={{ stroke: verdictStyles.miss.fg }} />
                    {t.miss} missed
                  </span>
                </div>
                <div
                  className="mt-1.5 text-[11px] font-semibold"
                  style={{ color: i === 0 ? "#047857" : "#1A1A1A" }}
                >
                  {i === 0
                    ? `Best fit — ${t.match}/${t.total} criteria`
                    : `${t.match}/${t.total} criteria met`}
                </div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function Legend({ verdict }: { verdict: Verdict }) {
  const s = verdictStyles[verdict];
  const Icon = s.Icon;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-flex items-center justify-center rounded-full w-5 h-5"
        style={{ background: s.bg, border: `1px solid ${s.ring}` }}
      >
        <Icon className="w-3 h-3" style={{ color: s.fg, stroke: s.fg }} />
      </span>
      {s.label}
    </span>
  );
}

// Exported helpers reused by the PDF builder so we render identical verdicts.
export function buildCriteriaRowsForExport(
  answers: Record<string, string | string[]>,
  projects: any[]
): CriterionRow[] {
  return buildRows(answers, projects);
}

export type { CriterionRow, RowCell, Verdict };
