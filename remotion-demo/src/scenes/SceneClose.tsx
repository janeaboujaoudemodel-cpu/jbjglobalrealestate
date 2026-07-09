import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { COLORS } from "../theme";
import { cormorant, inter } from "../fonts";
import Monogram from "../components/Monogram";

export default function SceneClose() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mono = spring({ frame, fps, config: { damping: 18, stiffness: 90 } });
  const rule = interpolate(frame, [18, 46], [0, 1], { extrapolateRight: "clamp" });
  const line1 = interpolate(frame, [28, 55], [0, 1], { extrapolateRight: "clamp" });
  const url = interpolate(frame, [42, 72], [0, 1], { extrapolateRight: "clamp" });
  const legal = interpolate(frame, [55, 85], [0, 1], { extrapolateRight: "clamp" });
  const drift = interpolate(frame, [0, 150], [0, -10]);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", color: COLORS.cream }}>
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 30,
        transform: `translateY(${drift}px)`,
      }}>
        <div style={{ opacity: mono, transform: `scale(${0.94 + mono * 0.06})` }}>
          <Monogram size={128} />
        </div>
        <div style={{ height: 1, width: 260 * rule, background: COLORS.champagne, opacity: 0.75 }} />
        <div style={{
          fontFamily: cormorant, fontStyle: "italic", fontSize: 46, fontWeight: 400,
          color: COLORS.cream, opacity: line1, letterSpacing: "0.01em",
          transform: `translateY(${(1 - line1) * 14}px)`,
        }}>
          Property. Investment. Lifestyle.
        </div>
        <div style={{
          fontFamily: inter, fontSize: 20, letterSpacing: "0.28em",
          textTransform: "uppercase", color: COLORS.champagneSoft, opacity: url,
        }}>
          jbj.ae
        </div>
        <div style={{
          marginTop: 20, fontFamily: inter, fontSize: 11, letterSpacing: "0.32em",
          textTransform: "uppercase", color: "rgba(253,251,247,0.4)", opacity: legal,
        }}>
          JBJ Global Real Estate — Dubai · RERA-Certified
        </div>
      </div>
    </AbsoluteFill>
  );
}
