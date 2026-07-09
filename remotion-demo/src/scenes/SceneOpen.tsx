import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS } from "../theme";
import { cormorant, inter } from "../fonts";
import Monogram from "../components/Monogram";

export default function SceneOpen() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mono = spring({ frame, fps, config: { damping: 18, stiffness: 90 } });
  const line = interpolate(frame, [20, 55], [0, 1], { extrapolateRight: "clamp" });
  const word = interpolate(frame, [35, 70], [0, 1], { extrapolateRight: "clamp" });
  const eyebrow = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" });
  const drift = interpolate(frame, [0, 150], [0, -14]);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", color: COLORS.cream }}>
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 34,
        transform: `translateY(${drift}px) scale(${0.94 + mono * 0.06})`,
        opacity: mono,
      }}>
        <div style={{
          opacity: eyebrow,
          fontFamily: inter, letterSpacing: "0.42em",
          fontSize: 14, color: COLORS.champagneSoft, textTransform: "uppercase",
        }}>
          Est. Dubai — Global Real Estate
        </div>
        <Monogram size={148} />
        <div style={{
          height: 1, width: 320 * line, background: COLORS.champagne, opacity: 0.75,
        }} />
        <div style={{
          fontFamily: cormorant, fontSize: 88, fontWeight: 500, letterSpacing: "0.02em",
          color: COLORS.cream, opacity: word,
          transform: `translateY(${(1 - word) * 20}px)`,
        }}>
          JBJ Global Real Estate
        </div>
        <div style={{
          opacity: interpolate(frame, [55, 85], [0, 1], { extrapolateRight: "clamp" }),
          fontFamily: inter, fontSize: 18, color: "rgba(253,251,247,0.7)",
        }}>
          Dubai&apos;s trusted partner for premium property, investment &amp; lifestyle.
        </div>
      </div>
    </AbsoluteFill>
  );
}
