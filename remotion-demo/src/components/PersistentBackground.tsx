import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { COLORS } from "../theme";

/** Persistent emerald ombre backdrop with slow drifting champagne motes. */
export default function PersistentBackground() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(120% 90% at 30% 20%, ${COLORS.emerald} 0%, ${COLORS.emeraldMid} 45%, ${COLORS.ink} 100%)`,
      }}
    >
      {/* Champagne hairline diagonals */}
      <AbsoluteFill style={{ opacity: 0.18 }}>
        {Array.from({ length: 14 }).map((_, i) => {
          const y = i * 90 + interpolate(frame, [0, 720], [0, 60]);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                top: y,
                left: -200,
                width: "140%",
                height: 1,
                background: `linear-gradient(90deg, transparent, ${COLORS.champagne}, transparent)`,
                transform: `rotate(-8deg)`,
              }}
            />
          );
        })}
      </AbsoluteFill>
      {/* Champagne motes */}
      {Array.from({ length: 18 }).map((_, i) => {
        const seed = i * 37.2;
        const x = (seed * 53) % 1920;
        const y = ((seed * 91) % 1080) + Math.sin((frame + seed) / 40) * 22;
        const size = 2 + (i % 4);
        const op = 0.12 + ((i % 5) / 5) * 0.35;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: "50%",
              background: COLORS.champagneSoft,
              opacity: op,
              filter: "blur(0.6px)",
            }}
          />
        );
      })}
      {/* Vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(120% 90% at 50% 60%, transparent 40%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </AbsoluteFill>
  );
}
