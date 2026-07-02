import { BarChart3, ChevronDown, MoreHorizontal, Plus, RefreshCw, Share2 } from "lucide-react";

/**
 * JBJ CRM — Analytics (Phase 6)
 * Zoho-parity dashboard grid: KPI ribbon + chart tiles.
 */

const KPIS = [
  { label: "Revenue This Quarter", value: "AED 4.82M", delta: "+18.4%", pos: true },
  { label: "Deals Closed", value: "127", delta: "+9", pos: true },
  { label: "Pipeline Value", value: "AED 12.6M", delta: "+3.1%", pos: true },
  { label: "Win Rate", value: "42%", delta: "-1.2%", pos: false },
];

function BarsChart() {
  const bars = [46, 62, 38, 74, 55, 88, 42, 66, 30, 78, 52, 70];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return (
    <svg viewBox="0 0 480 200" role="img" aria-label="Monthly revenue">
      <g stroke="#E7EAF1" strokeWidth="1">
        {[0, 1, 2, 3].map((i) => <line key={i} x1="30" x2="470" y1={40 + i * 40} y2={40 + i * 40} />)}
      </g>
      {bars.map((h, i) => (
        <g key={i}>
          <rect
            x={40 + i * 35}
            y={200 - h * 1.7 - 10}
            width="22"
            height={h * 1.7}
            rx="3"
            fill="url(#jcBar)"
          />
          <text x={51 + i * 35} y={196} textAnchor="middle" fontSize="9" fill="#8791A6">{months[i]}</text>
        </g>
      ))}
      <defs>
        <linearGradient id="jcBar" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#0F5A45" />
          <stop offset="100%" stopColor="#064E3B" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function LineChart() {
  const pts = [30, 45, 40, 60, 55, 75, 70, 92, 84, 110, 100, 128];
  const max = 130;
  const path = pts.map((v, i) => `${i === 0 ? "M" : "L"} ${30 + i * 38} ${180 - (v / max) * 150}`).join(" ");
  return (
    <svg viewBox="0 0 480 200" role="img" aria-label="Pipeline trend">
      <g stroke="#E7EAF1" strokeWidth="1">
        {[0, 1, 2, 3].map((i) => <line key={i} x1="30" x2="470" y1={40 + i * 40} y2={40 + i * 40} />)}
      </g>
      <path d={`${path} L 448 180 L 30 180 Z`} fill="rgba(15,90,69,0.10)" />
      <path d={path} fill="none" stroke="#0F5A45" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((v, i) => (
        <circle key={i} cx={30 + i * 38} cy={180 - (v / max) * 150} r="3" fill="#0F5A45" />
      ))}
    </svg>
  );
}

function Donut() {
  const segs = [
    { v: 42, c: "#064E3B", label: "Referral" },
    { v: 28, c: "#0F5A45", label: "Web" },
    { v: 18, c: "#B89555", label: "Campaign" },
    { v: 12, c: "#CBD2E1", label: "Other" },
  ];
  let acc = 0;
  const R = 60, C = 2 * Math.PI * R;
  return (
    <div className="jc-donut">
      <svg viewBox="0 0 160 160" width="160" height="160" role="img" aria-label="Lead sources">
        <g transform="translate(80 80) rotate(-90)">
          {segs.map((s, i) => {
            const seg = (s.v / 100) * C;
            const el = (
              <circle
                key={i}
                r={R}
                cx="0"
                cy="0"
                fill="none"
                stroke={s.c}
                strokeWidth="22"
                strokeDasharray={`${seg} ${C - seg}`}
                strokeDashoffset={-acc}
              />
            );
            acc += seg;
            return el;
          })}
        </g>
        <text x="80" y="76" textAnchor="middle" fontSize="18" fontWeight="700" fill="#202124">312</text>
        <text x="80" y="94" textAnchor="middle" fontSize="10" fill="#8791A6">Leads</text>
      </svg>
      <ul className="jc-donut__legend">
        {segs.map((s) => (
          <li key={s.label}><span style={{ background: s.c }} /> {s.label} <em>{s.v}%</em></li>
        ))}
      </ul>
    </div>
  );
}

function Funnel() {
  const rows = [
    { s: "Qualification", v: 128, w: 100 },
    { s: "Needs Analysis", v: 92, w: 82 },
    { s: "Proposal", v: 61, w: 64 },
    { s: "Negotiation", v: 34, w: 46 },
    { s: "Closed Won", v: 21, w: 30 },
  ];
  return (
    <ul className="jc-funnel">
      {rows.map((r) => (
        <li key={r.s}>
          <div className="jc-funnel__row">
            <div className="jc-funnel__bar" style={{ width: `${r.w}%` }}>{r.v}</div>
          </div>
          <span>{r.s}</span>
        </li>
      ))}
    </ul>
  );
}

export default function CrmAnalytics() {
  return (
    <div className="jc-analytics" data-no-contrast-guard>
      <header className="jc-analytics__head">
        <div>
          <h2>Sales Overview</h2>
          <p>Last refreshed just now · Asia/Dubai</p>
        </div>
        <div className="jc-analytics__cta">
          <button type="button" className="jc-btn jc-btn--ghost">
            This Quarter <ChevronDown size={13} />
          </button>
          <button type="button" className="jc-btn jc-btn--ghost"><RefreshCw size={14} /> Refresh</button>
          <button type="button" className="jc-btn jc-btn--ghost"><Share2 size={14} /> Share</button>
          <button type="button" className="jc-btn jc-btn--primary"><Plus size={14} /> Add Component</button>
        </div>
      </header>

      <div className="jc-analytics__kpis">
        {KPIS.map((k) => (
          <div key={k.label} className="jc-analytics__kpi">
            <span>{k.label}</span>
            <strong>{k.value}</strong>
            <em data-pos={k.pos}>{k.delta}</em>
          </div>
        ))}
      </div>

      <div className="jc-analytics__grid">
        <article className="jc-analytics__tile jc-analytics__tile--wide">
          <header><h3>Revenue by Month</h3><button type="button" aria-label="Tile actions"><MoreHorizontal size={15} /></button></header>
          <BarsChart />
        </article>
        <article className="jc-analytics__tile">
          <header><h3>Lead Sources</h3><button type="button" aria-label="Tile actions"><MoreHorizontal size={15} /></button></header>
          <Donut />
        </article>
        <article className="jc-analytics__tile">
          <header><h3>Deals Pipeline</h3><button type="button" aria-label="Tile actions"><MoreHorizontal size={15} /></button></header>
          <Funnel />
        </article>
        <article className="jc-analytics__tile jc-analytics__tile--wide">
          <header><h3>Pipeline Trend</h3><button type="button" aria-label="Tile actions"><MoreHorizontal size={15} /></button></header>
          <LineChart />
        </article>
        <article className="jc-analytics__tile jc-analytics__tile--empty">
          <BarChart3 size={32} />
          <h3>Add a component</h3>
          <p>Chart, KPI, cohort, or target meter.</p>
        </article>
      </div>
    </div>
  );
}
