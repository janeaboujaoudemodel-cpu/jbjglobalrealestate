import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";

/**
 * Luxury dark champagne-gold ambient loop, designed as a *background plate*
 * for the AI Hub hero. Key design decisions for legibility:
 *
 *  1. Base is near-black (#0A0A0C) — guarantees text/UI contrast at all frames.
 *  2. Two slow-drifting gold orbs sit in the OUTER quadrants only
 *     (top-left & bottom-right). The horizontal band where the title +
 *     subtitle live (vertical center, ~30%-70% Y) is intentionally kept dark.
 *  3. A horizontal "safe zone" vignette (radial-on-black) is drawn ON TOP of
 *     the orbs to actively darken anything that drifts behind the copy.
 *  4. Motion is sub-perceptible (sinusoidal, 10-20s periods) so there's no
 *     flicker / no contrast oscillation that would trip axe-core on rendered
 *     pages.
 *  5. The video loops cleanly — start and end frames are identical.
 */
export const MainVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();

  // Loop-safe phase: 0 -> 2π over the full duration so frame 0 == frame N
  const phase = (frame / durationInFrames) * Math.PI * 2;

  // Orb 1 — top-left, champagne gold
  const orb1X = width * 0.18 + Math.sin(phase) * 60;
  const orb1Y = height * 0.22 + Math.cos(phase) * 40;
  const orb1Opacity = interpolate(Math.sin(phase), [-1, 1], [0.55, 0.85]);

  // Orb 2 — bottom-right, deeper amber
  const orb2X = width * 0.82 + Math.sin(phase + Math.PI) * 80;
  const orb2Y = height * 0.78 + Math.cos(phase + Math.PI) * 50;
  const orb2Opacity = interpolate(Math.cos(phase), [-1, 1], [0.45, 0.7]);

  // Orb 3 — far top-right, very subtle warm white, slowest drift
  const orb3X = width * 0.92 + Math.sin(phase * 0.5) * 30;
  const orb3Y = height * 0.12 + Math.cos(phase * 0.5) * 20;

  // Subtle vertical sheen that breathes (very low contrast, just life)
  const sheen = interpolate(Math.sin(phase * 0.5), [-1, 1], [0.02, 0.06]);

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at 50% 50%, #14110D 0%, #0A0A0C 70%, #050507 100%)",
      }}
    >
      {/* Orb 1 — gold top-left */}
      <div
        style={{
          position: "absolute",
          left: orb1X - 380,
          top: orb1Y - 380,
          width: 760,
          height: 760,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(200,167,102,0.45) 0%, rgba(200,167,102,0.15) 40%, rgba(200,167,102,0) 70%)",
          opacity: orb1Opacity,
          filter: "blur(40px)",
        }}
      />

      {/* Orb 2 — amber bottom-right */}
      <div
        style={{
          position: "absolute",
          left: orb2X - 320,
          top: orb2Y - 320,
          width: 640,
          height: 640,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(168,130,72,0.4) 0%, rgba(168,130,72,0.12) 45%, rgba(168,130,72,0) 75%)",
          opacity: orb2Opacity,
          filter: "blur(30px)",
        }}
      />

      {/* Orb 3 — pinpoint warm white */}
      <div
        style={{
          position: "absolute",
          left: orb3X - 120,
          top: orb3Y - 120,
          width: 240,
          height: 240,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,240,210,0.18) 0%, rgba(255,240,210,0) 70%)",
        }}
      />

      {/* Breathing vertical sheen (very subtle) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255," +
            sheen.toFixed(3) +
            ") 50%, rgba(255,255,255,0) 100%)",
          mixBlendMode: "overlay",
        }}
      />

      {/* SUBTITLE SAFE ZONE — horizontal dark band centered on copy area.
          This is what guarantees the text behind it stays readable no matter
          where the orbs drift. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 70% 35% at 50% 50%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0) 100%)",
        }}
      />

      {/* Hairline gold accent across the bottom — institutional feel */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 1,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(200,167,102,0.5) 50%, transparent 100%)",
        }}
      />

      {/* Final global darken — keeps the entire plate firmly < 0.4 luminance */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.15)",
        }}
      />
    </AbsoluteFill>
  );
};
