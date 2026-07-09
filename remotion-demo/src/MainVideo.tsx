import { AbsoluteFill } from "remotion";
import {
  TransitionSeries,
  linearTiming,
  springTiming,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import PersistentBackground from "./components/PersistentBackground";
import SceneOpen from "./scenes/SceneOpen";
import SceneGate from "./scenes/SceneGate";
import SceneProperties from "./scenes/SceneProperties";
import SceneDashboard from "./scenes/SceneDashboard";
import SceneTools from "./scenes/SceneTools";
import SceneClose from "./scenes/SceneClose";

// scenes (frames) — 30fps
const SCENES = [110, 140, 150, 150, 150, 130];
const TRANSITION = 22;
// TransitionSeries overlaps: total = sum(scenes) - transitions * (scenes-1)
export const TOTAL_FRAMES = SCENES.reduce((a, b) => a + b, 0) - TRANSITION * (SCENES.length - 1);

const t = (mode: "fade" | "wipe" = "fade") =>
  mode === "wipe"
    ? { presentation: wipe({ direction: "from-right" }), timing: springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION }) }
    : { presentation: fade(), timing: linearTiming({ durationInFrames: TRANSITION }) };

export function MainVideo() {
  return (
    <AbsoluteFill>
      <PersistentBackground />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENES[0]}><SceneOpen /></TransitionSeries.Sequence>
        <TransitionSeries.Transition {...t("fade")} />
        <TransitionSeries.Sequence durationInFrames={SCENES[1]}><SceneGate /></TransitionSeries.Sequence>
        <TransitionSeries.Transition {...t("wipe")} />
        <TransitionSeries.Sequence durationInFrames={SCENES[2]}><SceneProperties /></TransitionSeries.Sequence>
        <TransitionSeries.Transition {...t("fade")} />
        <TransitionSeries.Sequence durationInFrames={SCENES[3]}><SceneDashboard /></TransitionSeries.Sequence>
        <TransitionSeries.Transition {...t("wipe")} />
        <TransitionSeries.Sequence durationInFrames={SCENES[4]}><SceneTools /></TransitionSeries.Sequence>
        <TransitionSeries.Transition {...t("fade")} />
        <TransitionSeries.Sequence durationInFrames={SCENES[5]}><SceneClose /></TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
}
