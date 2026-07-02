import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  GripVertical,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Star,
  Users,
} from "lucide-react";

/**
 * JBJ CRM — Analytics dashboard.
 * Draggable/reorderable component tiles (HTML5 DnD, layout persisted to
 * localStorage). Structural parity with Zoho Analytics; JBJ palette only.
 */

type TileKind = "kpi" | "gauge" | "hbar" | "ranked" | "bar" | "pie";

type Tile = {
  id: string;
  kind: TileKind;
  title: string;
  value?: string;
  delta?: number;
  helper?: string;
  span?: 1 | 2; // grid columns
};

const DEFAULT_TILES: Tile[] = [
  { id: "leads",   kind: "kpi", title: "Leads This Month",   value: "10",         delta: 100, helper: "Last Month Relative: 0" },
  { id: "revenue", kind: "kpi", title: "Revenue This Month", value: "AED 35,000", delta: 100, helper: "Last Month Relative: 0" },
  { id: "deals",   kind: "kpi", title: "Deals In Pipeline",  value: "8",                     helper: "" },
  { id: "accts",   kind: "kpi", title: "Accounts This Month",value: "10",         delta: 100, helper: "Last Month Relative: 0" },
  { id: "leadgoal",kind: "gauge",title: "Lead Generation Target — This Year", helper: "Remaining : 990 · Target: 1000", span: 1 },
  { id: "revgoal", kind: "hbar", title: "Revenue Target — This Year",         helper: "Target AED 10,000 · Achieved AED 700,000", span: 1 },
  { id: "perf",    kind: "bar",  title: "Last 3 Months Performance", helper: "July 2026", span: 1 },
  { id: "source",  kind: "pie",  title: "Leads By Source", helper: "No data yet", span: 1 },
  { id: "reps",    kind: "ranked", title: "Prolific Sales Reps", helper: "By Sum of Amount", span: 1 },
];

const LS_KEY = "jbjcrm.analytics.order.v1";

function loadOrder(): string[] | null {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "null"); } catch { return null; }
}
function saveOrder(ids: string[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(ids)); } catch { /* ignore */ }
}

export default function CrmAnalytics() {
  const [order, setOrder] = useState<string[]>(() => loadOrder() ?? DEFAULT_TILES.map((t) => t.id));
  const [dragId, setDragId] = useState<string | null>(null);

  useEffect(() => { saveOrder(order); }, [order]);

  const tiles = useMemo(() => {
    const byId = new Map(DEFAULT_TILES.map((t) => [t.id, t]));
    const ordered = order.map((id) => byId.get(id)).filter(Boolean) as Tile[];
    // append any newly-added tiles not yet in stored order
    for (const t of DEFAULT_TILES) if (!order.includes(t.id)) ordered.push(t);
    return ordered;
  }, [order]);

  const onDragStart = (id: string) => setDragId(id);
  const onDragOver = (e: React.DragEvent, overId: string) => {
    e.preventDefault();
    if (!dragId || dragId === overId) return;
    setOrder((prev) => {
      const a = prev.indexOf(dragId);
      const b = prev.indexOf(overId);
      if (a === -1 || b === -1) return prev;
      const next = prev.slice();
      next.splice(a, 1);
      next.splice(b, 0, dragId);
      return next;
    });
  };
  const onDragEnd = () => setDragId(null);

  return (
    <div className="jc-an" data-no-contrast-guard>
      <div className="jc-an__toolbar">
        <button type="button" className="jc-an__scope">
          <span>All</span> <ChevronDown size={13} />
        </button>
        <button type="button" className="jc-an__scope">
          <Star size={13} /> <span>Org Overview</span> <ChevronDown size={13} />
        </button>
        <button type="button" className="jc-an__scope">
          <Users size={13} /> <span>All Users</span>
        </button>
        <div className="jc-an__spacer" />
        <button type="button" className="jc-an__icon" aria-label="Refresh"><RefreshCw size={14} /></button>
        <button type="button" className="jc-an__ghost">Add Component</button>
        <button type="button" className="jc-an__cta"><Plus size={13} /> Create Dashboard</button>
        <button type="button" className="jc-an__icon" aria-label="More"><MoreHorizontal size={16} /></button>
      </div>

      <div className="jc-an__grid">
        {tiles.map((t) => (
          <article
            key={t.id}
            className="jc-an__tile"
            data-kind={t.kind}
            data-span={t.span ?? 1}
            data-dragging={dragId === t.id}
            draggable
            onDragStart={() => onDragStart(t.id)}
            onDragOver={(e) => onDragOver(e, t.id)}
            onDragEnd={onDragEnd}
          >
            <header className="jc-an__tile-head">
              <span className="jc-an__handle" aria-hidden="true"><GripVertical size={12} /></span>
              <h3>{t.title}</h3>
              <button type="button" className="jc-an__tile-more" aria-label="Tile options"><MoreHorizontal size={14} /></button>
            </header>
            <div className="jc-an__tile-body">
              {t.kind === "kpi" && (
                <>
                  <div className="jc-an__kpi-value">
                    <strong>{t.value}</strong>
                    {typeof t.delta === "number" && (
                      <span className="jc-an__kpi-delta" data-dir={t.delta >= 0 ? "up" : "down"}>
                        ▲ {Math.abs(t.delta)}%
                      </span>
                    )}
                  </div>
                  {t.helper && <div className="jc-an__kpi-helper">{t.helper}</div>}
                </>
              )}
              {t.kind === "gauge" && (
                <div className="jc-an__gauge" aria-hidden="true">
                  <svg viewBox="0 0 200 110">
                    <path d="M10 100 A 90 90 0 0 1 190 100" fill="none" stroke="#EFE6D6" strokeWidth="18" strokeLinecap="round" />
                    <path d="M10 100 A 90 90 0 0 1 40 40" fill="none" stroke="#B89555" strokeWidth="18" strokeLinecap="round" />
                    <line x1="100" y1="100" x2="70" y2="55" stroke="#1A1A1A" strokeWidth="4" strokeLinecap="round" />
                    <circle cx="100" cy="100" r="6" fill="#1A1A1A" />
                  </svg>
                  <div className="jc-an__gauge-legend"><span>0</span><span>{t.helper}</span></div>
                </div>
              )}
              {t.kind === "hbar" && (
                <div className="jc-an__hbar" aria-hidden="true">
                  <div className="jc-an__hbar-row">
                    <span>Entire Org</span>
                    <div className="jc-an__hbar-track">
                      <div className="jc-an__hbar-fill" style={{ width: "78%" }} />
                      <span className="jc-an__hbar-label">AED 700,000</span>
                    </div>
                  </div>
                  <div className="jc-an__hbar-axis"><span>0</span><span>500k</span><span>1M</span></div>
                  <div className="jc-an__hbar-helper">{t.helper}</div>
                </div>
              )}
              {t.kind === "bar" && (
                <div className="jc-an__bars" aria-hidden="true">
                  {[40, 62, 28, 74, 55, 82].map((h, i) => (
                    <div key={i} className="jc-an__bar" style={{ height: `${h}%` }} />
                  ))}
                </div>
              )}
              {t.kind === "pie" && (
                <div className="jc-an__pie" aria-hidden="true">
                  <svg viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="#EFE6D6" />
                    <path d="M50 10 A40 40 0 0 1 90 50 L50 50 Z" fill="#064E3B" />
                    <path d="M90 50 A40 40 0 0 1 50 90 L50 50 Z" fill="#064E3B" />
                    <path d="M50 90 A40 40 0 0 1 20 68 L50 50 Z" fill="#B89555" />
                  </svg>
                  <div className="jc-an__pie-helper">{t.helper}</div>
                </div>
              )}
              {t.kind === "ranked" && (
                <ul className="jc-an__ranked">
                  <li>
                    <span className="jc-an__ranked-idx">1</span>
                    <span className="jc-an__ranked-name">Jane Bou Jaoude</span>
                    <span className="jc-an__ranked-val">AED 35,000</span>
                  </li>
                </ul>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
