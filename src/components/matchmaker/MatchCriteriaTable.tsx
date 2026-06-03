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
  const display = price ? `AED ${(price / 1_000_000).toFixed(1)}M` : "On request";
  if (!budget || price == null) return { verdict: "close", value: display };
  const within = (lo: number, hi: number) => price >= lo && price < hi;
  let match = false;
  let close = false;
  switch (budget) {
    case "under-1m":
      match = price < 1_000_000;
      close = price < 1_250_000;
      break;
    case "1m-2m":
      match = within(1_000_000, 2_000_000);
      close = within(800_000, 2_500_000);
      break;
    case "2m-5m":
      match = within(2_000_000, 5_000_000);
      close = within(1_700_000, 6_000_000);
      break;
    case "5m-10m":
      match = within(5_000_000, 10_000_000);
      close = within(4_000_000, 12_000_000);
      break;
    case "10m-plus":
      match = price >= 10_000_000;
      close = price >= 8_000_000;
      break;
  }
  return { verdict: match ? "match" : close ? "close" : "miss", value: display };
}

function bedroomVerdict(p: any, choice?: string): RowCell {
  const min = p?.bedrooms_min;
  const max = p?.bedrooms_max ?? min;
  const display =
    min == null
      ? "Type TBC"
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
    bg: "rgba(16,185,129,0.18)",
    ring: "rgba(16,185,129,0.55)",
    fg: "#34D399",
    Icon: Check,
    label: "Match",
  },
  close: {
    bg: "rgba(245,158,11,0.18)",
    ring: "rgba(245,158,11,0.55)",
    fg: "#FBBF24",
    Icon: Minus,
    label: "Close",
  },
  miss: {
    bg: "rgba(239,68,68,0.18)",
    ring: "rgba(239,68,68,0.55)",
    fg: "#F87171",
    Icon: X,
    label: "Miss",
  },
};

export default function MatchCriteriaTable({ answers, projects }: Props) {
  const rows = buildRows(answers, projects);
  if (!rows.length || !projects.length) return null;

  return (
    <div
      data-no-contrast-guard
      className="aihf-panel rounded-2xl p-5 md:p-7 mb-10 overflow-x-auto"
    >
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg md:text-xl font-semibold mb-1">
            How each property matches your requirements
          </h3>
          <p className="aihf-muted text-sm">
            ✓ exact match · ≈ close fit · ✗ does not match — actual value shown in each cell.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-3 text-xs aihf-muted">
          <Legend verdict="match" />
          <Legend verdict="close" />
          <Legend verdict="miss" />
        </div>
      </div>

      <table className="w-full border-separate" style={{ borderSpacing: 0 }}>
        <thead>
          <tr>
            <th
              className="text-left text-xs font-semibold uppercase tracking-wide p-3"
              style={{ color: "#67E8F9" }}
            >
              Your requirement
            </th>
            {projects.map((p, i) => (
              <th
                key={p.id || i}
                className="text-left text-xs font-semibold uppercase tracking-wide p-3"
                style={{ color: "#67E8F9" }}
              >
                #{i + 1} · {p.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={row.label}>
              <td
                className="align-top p-3 text-sm"
                style={{
                  background: ri % 2 ? "rgba(2,17,15,0.55)" : "rgba(4,56,50,0.40)",
                  borderTop: "1px solid rgba(45,212,191,0.25)",
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
                      background: ri % 2 ? "rgba(2,17,15,0.55)" : "rgba(3,30,24,0.55)",
                      borderTop: "1px solid rgba(45,212,191,0.25)",
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
                        <div className="text-sm leading-snug">{cell.value}</div>
                      </div>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
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
