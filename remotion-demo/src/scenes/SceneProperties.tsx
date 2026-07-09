import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { COLORS } from "../theme";
import { cormorant, inter } from "../fonts";

const PROPS = [
  { name: "Amra Wellness Resort", area: "Dubai Islands", price: "AED 3.4M", status: "Off-Plan" },
  { name: "Aveline Residences", area: "JVC", price: "AED 1.9M", status: "Launch" },
  { name: "Marina Signature", area: "Dubai Marina", price: "AED 5.8M", status: "Ready" },
  { name: "Palm Vista Villas", area: "Palm Jumeirah", price: "AED 22M", status: "Premium" },
  { name: "Emerald Bay Tower", area: "Business Bay", price: "AED 2.7M", status: "Off-Plan" },
  { name: "Cascade Heights", area: "MBR City", price: "AED 4.1M", status: "Launch" },
];

function Card({ i, delay, item }: { i: number; delay: number; item: typeof PROPS[number] }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 22, stiffness: 130 } });
  const hue = 145 + (i * 7) % 30;
  return (
    <div style={{
      opacity: p, transform: `translateY(${(1 - p) * 28}px)`,
      background: `linear-gradient(160deg, hsl(${hue} 40% 12%), hsl(${hue - 20} 45% 6%))`,
      border: `1px solid ${COLORS.hairline}`,
      borderRadius: 6, padding: 22, height: 240, position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(80% 60% at 70% 0%, rgba(184,149,85,0.18), transparent 60%)`,
      }} />
      <div style={{
        display: "inline-block", padding: "5px 10px", borderRadius: 999,
        border: `1px solid ${COLORS.hairline}`,
        fontFamily: inter, fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase",
        color: COLORS.champagneSoft,
      }}>{item.status}</div>
      <div style={{
        marginTop: 66, fontFamily: cormorant, fontSize: 26, color: COLORS.cream,
        fontWeight: 500, lineHeight: 1.15,
      }}>{item.name}</div>
      <div style={{
        marginTop: 8, fontFamily: inter, fontSize: 13, color: "rgba(253,251,247,0.6)",
      }}>{item.area}</div>
      <div style={{
        position: "absolute", left: 22, bottom: 20,
        fontFamily: cormorant, fontSize: 22, color: COLORS.champagneSoft,
        letterSpacing: "0.02em",
      }}>{item.price}</div>
    </div>
  );
}

export default function SceneProperties() {
  const frame = useCurrentFrame();
  const eyebrow = interpolate(frame, [4, 20], [0, 1], { extrapolateRight: "clamp" });
  const title = interpolate(frame, [12, 40], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ padding: "80px 120px", color: COLORS.cream }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div>
          <div style={{
            opacity: eyebrow, fontFamily: inter, fontSize: 13,
            letterSpacing: "0.42em", textTransform: "uppercase", color: COLORS.champagneSoft,
            transform: `translateY(${(1 - eyebrow) * 8}px)`,
          }}>Curated Inventory</div>
          <div style={{
            marginTop: 14, fontFamily: cormorant, fontSize: 68, fontWeight: 500,
            opacity: title, transform: `translateY(${(1 - title) * 16}px)`,
          }}>
            Every project. <span style={{ fontStyle: "italic", color: COLORS.champagneSoft }}>Verified.</span>
          </div>
        </div>
        <div style={{
          opacity: title, fontFamily: inter, fontSize: 13, color: "rgba(253,251,247,0.55)",
          letterSpacing: "0.2em", textTransform: "uppercase",
        }}>1,240 active · updated hourly</div>
      </div>
      <div style={{
        marginTop: 46, display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
        gap: 22,
      }}>
        {PROPS.map((p, i) => (
          <Card key={p.name} i={i} delay={22 + i * 6} item={p} />
        ))}
      </div>
    </AbsoluteFill>
  );
}
