import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { COLORS } from "../theme";
import { cormorant, inter } from "../fonts";

const KPIS = [
  { label: "Active Leads", value: "348", delta: "+12%" },
  { label: "Closed AED", value: "184M", delta: "+8.4%" },
  { label: "Response Time", value: "3m 21s", delta: "-14%" },
];

function Kpi({ i, item }: { i: number; item: typeof KPIS[number] }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - (14 + i * 8), fps, config: { damping: 18, stiffness: 110 } });
  const num = interpolate(frame, [24 + i * 6, 60 + i * 6], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div style={{
      opacity: p, transform: `translateY(${(1 - p) * 20}px)`,
      padding: 26, border: `1px solid ${COLORS.hairline}`, borderRadius: 6,
      background: "linear-gradient(160deg, rgba(4,44,28,0.7), rgba(3,20,14,0.5))",
      flex: 1,
    }}>
      <div style={{
        fontFamily: inter, fontSize: 11, letterSpacing: "0.32em",
        textTransform: "uppercase", color: COLORS.champagneSoft,
      }}>{item.label}</div>
      <div style={{
        marginTop: 14, display: "flex", alignItems: "baseline", gap: 12,
      }}>
        <div style={{
          fontFamily: cormorant, fontSize: 62, color: COLORS.cream, fontWeight: 500,
          opacity: num,
        }}>{item.value}</div>
        <div style={{
          fontFamily: inter, fontSize: 14, color: item.delta.startsWith("-") ? "#ef9a9a" : COLORS.champagneSoft,
          opacity: num,
        }}>{item.delta}</div>
      </div>
    </div>
  );
}

function Bar({ i, h, delay }: { i: number; h: number; delay: number }) {
  const frame = useCurrentFrame();
  const grow = interpolate(frame, [delay, delay + 22], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div style={{
      width: 22, height: h * grow, background: `linear-gradient(180deg, ${COLORS.champagne}, ${COLORS.champagneSoft})`,
      borderRadius: 2, alignSelf: "flex-end",
      boxShadow: `0 0 20px rgba(184,149,85,${0.15 + (i % 3) * 0.05})`,
    }} />
  );
}

export default function SceneDashboard() {
  const frame = useCurrentFrame();
  const eyebrow = interpolate(frame, [4, 20], [0, 1], { extrapolateRight: "clamp" });
  const title = interpolate(frame, [10, 34], [0, 1], { extrapolateRight: "clamp" });
  const chart = spring({
    frame: frame - 40, fps: 30, config: { damping: 20, stiffness: 100 },
  });
  const bars = [60, 90, 55, 110, 140, 80, 165, 130, 195, 170, 220, 260];

  return (
    <AbsoluteFill style={{ padding: "80px 120px", color: COLORS.cream }}>
      <div>
        <div style={{
          opacity: eyebrow, fontFamily: inter, fontSize: 13,
          letterSpacing: "0.42em", textTransform: "uppercase", color: COLORS.champagneSoft,
          transform: `translateY(${(1 - eyebrow) * 8}px)`,
        }}>Owner Command Center</div>
        <div style={{
          marginTop: 14, fontFamily: cormorant, fontSize: 68, fontWeight: 500,
          opacity: title, transform: `translateY(${(1 - title) * 16}px)`,
        }}>
          Your business, <span style={{ fontStyle: "italic", color: COLORS.champagneSoft }}>in one view.</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 20, marginTop: 46 }}>
        {KPIS.map((k, i) => <Kpi key={k.label} i={i} item={k} />)}
      </div>
      <div style={{
        marginTop: 34, padding: 30, border: `1px solid ${COLORS.hairline}`,
        borderRadius: 6, flex: 1,
        background: "linear-gradient(160deg, rgba(4,44,28,0.55), rgba(3,20,14,0.35))",
        opacity: chart, transform: `translateY(${(1 - chart) * 20}px)`,
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "baseline",
        }}>
          <div style={{
            fontFamily: inter, fontSize: 12, letterSpacing: "0.3em",
            textTransform: "uppercase", color: COLORS.champagneSoft,
          }}>Pipeline · Last 12 weeks</div>
          <div style={{ fontFamily: cormorant, fontSize: 22, color: COLORS.cream }}>AED 62.4M forecast</div>
        </div>
        <div style={{
          marginTop: 30, display: "flex", gap: 22, alignItems: "flex-end", height: 260,
        }}>
          {bars.map((h, i) => <Bar key={i} i={i} h={h} delay={50 + i * 3} />)}
        </div>
      </div>
    </AbsoluteFill>
  );
}
