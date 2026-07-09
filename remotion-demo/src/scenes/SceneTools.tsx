import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { COLORS } from "../theme";
import { cormorant, inter } from "../fonts";

const TOOLS = [
  { title: "AI Home Finder", body: "Match buyers to inventory in seconds — natural-language search across every off-plan launch." },
  { title: "Property Measurement", body: "Instant floor-plan measurement with AR — deliver quotes on site, not next week." },
  { title: "Interior Design AI", body: "Photorealistic renders per unit type — help clients see the finished home before hand-over." },
  { title: "CRM Command Center", body: "Leads, calendar, inbox, tasks — all under one emerald roof, replacing five disconnected tools." },
];

function ToolCard({ i, item }: { i: number; item: typeof TOOLS[number] }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delay = 12 + i * 10;
  const p = spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 120 } });
  return (
    <div style={{
      opacity: p, transform: `translateY(${(1 - p) * 26}px)`,
      padding: 32, borderRadius: 6, border: `1px solid ${COLORS.hairline}`,
      background: "linear-gradient(160deg, rgba(4,44,28,0.72), rgba(3,20,14,0.55))",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 24, right: 24,
        width: 44, height: 44, borderRadius: "50%",
        border: `1px solid ${COLORS.champagne}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: cormorant, fontSize: 18, color: COLORS.champagneSoft,
      }}>{String(i + 1).padStart(2, "0")}</div>
      <div style={{
        fontFamily: cormorant, fontSize: 34, color: COLORS.cream, fontWeight: 500,
        maxWidth: 320, lineHeight: 1.1,
      }}>{item.title}</div>
      <div style={{
        marginTop: 14, fontFamily: inter, fontSize: 14,
        color: "rgba(253,251,247,0.68)", lineHeight: 1.55, maxWidth: 380,
      }}>{item.body}</div>
    </div>
  );
}

export default function SceneTools() {
  const frame = useCurrentFrame();
  const eyebrow = interpolate(frame, [2, 18], [0, 1], { extrapolateRight: "clamp" });
  const title = interpolate(frame, [10, 34], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ padding: "80px 120px", color: COLORS.cream }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{
            opacity: eyebrow, fontFamily: inter, fontSize: 13,
            letterSpacing: "0.42em", textTransform: "uppercase", color: COLORS.champagneSoft,
          }}>Intelligent Toolkit</div>
          <div style={{
            marginTop: 14, fontFamily: cormorant, fontSize: 68, fontWeight: 500,
            opacity: title,
          }}>
            AI-native, <span style={{ fontStyle: "italic", color: COLORS.champagneSoft }}>white-glove.</span>
          </div>
        </div>
      </div>
      <div style={{
        marginTop: 44, flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr 1fr", gap: 22,
      }}>
        {TOOLS.map((t, i) => <ToolCard key={t.title} i={i} item={t} />)}
      </div>
    </AbsoluteFill>
  );
}
