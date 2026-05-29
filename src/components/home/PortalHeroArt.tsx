/**
 * PortalHeroArt — purposeful architectural line art for each homepage
 * portal showcase card. Replaces the generic lucide-icon-in-a-frame.
 *
 * Strict palette: ink #1A1A1A strokes + #B89555 gold hairline accents
 * on a champagne plate. No raster, no emoji.
 *
 * Each variant renders into a tall portrait viewBox (200×260).
 */

export type PortalKind = "broker" | "developer" | "careers" | "owner" | "investor";

const INK = "#1A1A1A";
const GOLD = "#B89555";

interface Props {
  kind: PortalKind;
  className?: string;
}

export default function PortalHeroArt({ kind, className }: Props) {
  return (
    <svg
      viewBox="0 0 200 260"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      className={className}
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      {kind === "broker" && <BrokerArt />}
      {kind === "developer" && <DeveloperArt />}
      {kind === "careers" && <CareersArt />}
      {kind === "owner" && <OwnerArt />}
      {kind === "investor" && <InvestorArt />}
    </svg>
  );
}

/* ─── BROKER — luxury tower silhouette + broker-network nodes ─── */
function BrokerArt() {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* Skyline towers */}
      <g stroke={INK} strokeWidth="1.4">
        <path d="M40 230 L40 120 L60 100 L60 230 Z" />
        <path d="M75 230 L75 80  L100 60 L100 230 Z" />
        <path d="M115 230 L115 110 L140 90 L140 230 Z" />
        <path d="M155 230 L155 140 L170 130 L170 230 Z" />
        {/* Window grid */}
        <path d="M82 100 L93 100 M82 115 L93 115 M82 130 L93 130 M82 145 L93 145 M82 160 L93 160 M82 175 L93 175 M82 190 L93 190" />
        <path d="M121 130 L134 130 M121 150 L134 150 M121 170 L134 170 M121 190 L134 190" />
      </g>
      {/* Ground rule */}
      <line x1="20" y1="230" x2="180" y2="230" stroke={INK} strokeWidth="1.4" />

      {/* Broker network — gold nodes + connecting hairlines above skyline */}
      <g stroke={GOLD} strokeWidth="0.9" opacity="0.9">
        <line x1="50"  y1="40"  x2="90"  y2="25" />
        <line x1="90"  y1="25"  x2="140" y2="40" />
        <line x1="50"  y1="40"  x2="140" y2="40" />
        <line x1="90"  y1="25"  x2="100" y2="60" />
        <line x1="50"  y1="40"  x2="60"  y2="100" />
        <line x1="140" y1="40"  x2="140" y2="90" />
      </g>
      <g fill={GOLD}>
        <circle cx="50"  cy="40" r="3" />
        <circle cx="90"  cy="25" r="3.5" />
        <circle cx="140" cy="40" r="3" />
      </g>
    </g>
  );
}

/* ─── DEVELOPER — masterplan / blueprint wireframe ─── */
function DeveloperArt() {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* Blueprint frame */}
      <rect x="22" y="30" width="156" height="200" stroke={INK} strokeWidth="1.4" rx="4" />
      {/* Grid */}
      <g stroke={GOLD} strokeWidth="0.5" opacity="0.55">
        {Array.from({ length: 7 }).map((_, i) => (
          <line key={`v${i}`} x1={22 + (i + 1) * 19.5} y1="30" x2={22 + (i + 1) * 19.5} y2="230" />
        ))}
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={`h${i}`} x1="22" y1={30 + (i + 1) * 20} x2="178" y2={30 + (i + 1) * 20} />
        ))}
      </g>
      {/* Tower footprints + section lines */}
      <g stroke={INK} strokeWidth="1.4">
        <rect x="38" y="60"  width="50" height="70" />
        <rect x="110" y="55" width="50" height="55" />
        <rect x="50"  y="150" width="100" height="60" />
        {/* Section call-outs */}
        <line x1="38"  y1="60"  x2="28"  y2="50" />
        <line x1="160" y1="55"  x2="170" y2="45" />
      </g>
      {/* Compass tick */}
      <g stroke={INK} strokeWidth="1.2">
        <circle cx="158" cy="208" r="8" />
        <line x1="158" y1="200" x2="158" y2="216" />
        <line x1="150" y1="208" x2="166" y2="208" />
      </g>
    </g>
  );
}

/* ─── CAREERS — recruitment pipeline of executive cards ─── */
function CareersArt() {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* Pipeline rail */}
      <line x1="100" y1="20" x2="100" y2="240" stroke={GOLD} strokeWidth="0.8" opacity="0.7" strokeDasharray="3 4" />

      {[
        { y: 30,  full: true },
        { y: 100, full: true },
        { y: 170, full: false },
      ].map((row, i) => (
        <g key={i}>
          {/* Profile card */}
          <rect x="32" y={row.y} width="136" height="58" rx="6" stroke={INK} strokeWidth="1.4" />
          {/* Avatar circle */}
          <circle cx="55" cy={row.y + 29} r="13" stroke={INK} strokeWidth="1.4" />
          <path d={`M48 ${row.y + 27} a7 7 0 0 1 14 0`} stroke={INK} strokeWidth="1.4" />
          {/* Name + role lines */}
          <line x1="76" y1={row.y + 22} x2={row.full ? 152 : 130} y2={row.y + 22} stroke={INK} strokeWidth="2" />
          <line x1="76" y1={row.y + 34} x2={row.full ? 140 : 116} y2={row.y + 34} stroke={INK} strokeWidth="1" />
          <line x1="76" y1={row.y + 46} x2={row.full ? 124 : 100} y2={row.y + 46} stroke={GOLD} strokeWidth="1" />
          {/* Pipeline node */}
          <circle cx="100" cy={row.y + 70} r="3" fill={GOLD} />
        </g>
      ))}
    </g>
  );
}

/* ─── OWNER — portfolio dashboard mark ─── */
function OwnerArt() {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* Dashboard outer */}
      <rect x="22" y="28" width="156" height="204" rx="8" stroke={INK} strokeWidth="1.4" />
      {/* Header bar */}
      <line x1="22" y1="50" x2="178" y2="50" stroke={INK} strokeWidth="1.2" />
      <circle cx="32" cy="39" r="2" fill={GOLD} />
      <circle cx="40" cy="39" r="2" fill={INK} />
      <circle cx="48" cy="39" r="2" fill={INK} />

      {/* Stacked property tiles */}
      <g stroke={INK} strokeWidth="1.3">
        <rect x="34" y="64"  width="60" height="48" rx="3" />
        <path d="M34 88 L60 76 L94 88" />
        <rect x="34" y="124" width="60" height="48" rx="3" />
        <path d="M34 148 L60 136 L94 148" />
      </g>

      {/* Yield sparkline panel */}
      <g>
        <rect x="104" y="64" width="62" height="108" rx="3" stroke={INK} strokeWidth="1.3" />
        <polyline points="110,150 120,140 130,144 140,118 150,128 160,90" stroke={GOLD} strokeWidth="1.6" />
        <line x1="110" y1="160" x2="160" y2="160" stroke={INK} strokeWidth="0.8" opacity="0.5" />
      </g>

      {/* Bottom income bar */}
      <rect x="34" y="184" width="132" height="34" rx="3" stroke={INK} strokeWidth="1.3" />
      <line x1="44" y1="201" x2="100" y2="201" stroke={INK} strokeWidth="2" />
      <line x1="44" y1="210" x2="80"  y2="210" stroke={GOLD} strokeWidth="1.2" />
    </g>
  );
}

/* ─── INVESTOR — growth chart + global meridian arc ─── */
function InvestorArt() {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* Global arc above */}
      <g stroke={GOLD} strokeWidth="0.9" opacity="0.85">
        <path d="M30 70 Q100 10 170 70" />
        <path d="M44 78 Q100 30 156 78" opacity="0.6" />
      </g>
      <g fill={GOLD}>
        <circle cx="30"  cy="70" r="3" />
        <circle cx="100" cy="32" r="3.5" />
        <circle cx="170" cy="70" r="3" />
      </g>

      {/* Chart frame */}
      <rect x="26" y="100" width="148" height="120" stroke={INK} strokeWidth="1.4" rx="3" />
      {/* Y-axis ticks */}
      <g stroke={INK} strokeWidth="0.8" opacity="0.55">
        <line x1="26" y1="130" x2="174" y2="130" />
        <line x1="26" y1="160" x2="174" y2="160" />
        <line x1="26" y1="190" x2="174" y2="190" />
      </g>
      {/* Growth line */}
      <polyline
        points="34,200 54,188 74,192 94,170 114,176 134,140 154,148 168,118"
        stroke={INK}
        strokeWidth="1.8"
      />
      {/* Gold zone fill hint (hairline only) */}
      <polyline
        points="34,210 54,210 74,210 94,210 114,210 134,210 154,210 168,210"
        stroke={GOLD}
        strokeWidth="1"
        opacity="0.5"
      />
      {/* Data ticks */}
      <g fill={INK}>
        <circle cx="94"  cy="170" r="2" />
        <circle cx="134" cy="140" r="2" />
        <circle cx="168" cy="118" r="2.6" />
      </g>

      {/* Bottom serial rule */}
      <line x1="36" y1="240" x2="164" y2="240" stroke={GOLD} strokeWidth="0.8" opacity="0.7" />
    </g>
  );
}
