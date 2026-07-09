import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { COLORS } from "../theme";
import { cormorant, inter } from "../fonts";

/** Scene 2 — Access Gate mock: eyebrow, headline, primary CTA, secondary CTA */
export default function SceneGate() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const eyebrow = interpolate(frame, [4, 20], [0, 1], { extrapolateRight: "clamp" });
  const h1a = interpolate(frame, [12, 34], [0, 1], { extrapolateRight: "clamp" });
  const h1b = interpolate(frame, [20, 42], [0, 1], { extrapolateRight: "clamp" });
  const body = interpolate(frame, [30, 55], [0, 1], { extrapolateRight: "clamp" });
  const cta = spring({ frame: frame - 40, fps, config: { damping: 14, stiffness: 130 } });
  const cta2 = spring({ frame: frame - 52, fps, config: { damping: 14, stiffness: 130 } });

  return (
    <AbsoluteFill style={{ padding: "0 160px", justifyContent: "center", color: COLORS.cream }}>
      <div style={{ maxWidth: 900 }}>
        <div style={{
          fontFamily: inter, letterSpacing: "0.42em", textTransform: "uppercase",
          fontSize: 13, color: COLORS.champagneSoft, opacity: eyebrow,
          transform: `translateY(${(1 - eyebrow) * 8}px)`,
        }}>
          Welcome to JBJ
        </div>
        <div style={{
          marginTop: 26,
          fontFamily: cormorant, fontSize: 132, fontWeight: 500,
          lineHeight: 1.02, letterSpacing: "-0.005em",
        }}>
          <div style={{ opacity: h1a, transform: `translateY(${(1 - h1a) * 24}px)` }}>
            One partner.
          </div>
          <div style={{
            opacity: h1b, transform: `translateY(${(1 - h1b) * 24}px)`,
            color: COLORS.champagneSoft,
            fontStyle: "italic",
          }}>
            Every property need.
          </div>
        </div>
        <div style={{
          marginTop: 34, fontFamily: inter, fontSize: 20, lineHeight: 1.5,
          maxWidth: 620, color: "rgba(253,251,247,0.72)", opacity: body,
          transform: `translateY(${(1 - body) * 12}px)`,
        }}>
          From off-plan launches to golden visa support — we handle the full
          journey so you can focus on the outcome.
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 46 }}>
          <div style={{
            transform: `scale(${cta}) translateY(${(1 - cta) * 10}px)`, opacity: cta,
            padding: "18px 32px", borderRadius: 4, fontFamily: inter, fontWeight: 500,
            fontSize: 16, letterSpacing: "0.04em",
            background: `linear-gradient(135deg, ${COLORS.champagne}, ${COLORS.champagneSoft})`,
            color: COLORS.emeraldDeep,
            boxShadow: "0 20px 40px -20px rgba(184,149,85,0.6)",
          }}>
            Create your account →
          </div>
          <div style={{
            transform: `scale(${cta2}) translateY(${(1 - cta2) * 10}px)`, opacity: cta2,
            padding: "18px 32px", borderRadius: 4, fontFamily: inter, fontWeight: 500,
            fontSize: 16, letterSpacing: "0.04em",
            border: `1px solid ${COLORS.champagne}`,
            color: COLORS.cream,
          }}>
            Talk to an advisor
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
