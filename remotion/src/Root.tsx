import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";

// 10s loop @ 30fps, 1920x1080
export const RemotionRoot = () => (
  <Composition
    id="main"
    component={MainVideo}
    durationInFrames={300}
    fps={30}
    width={1920}
    height={1080}
  />
);
