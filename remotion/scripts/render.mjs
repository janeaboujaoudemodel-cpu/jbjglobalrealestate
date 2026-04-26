import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const bundled = await bundle({
  entryPoint: path.resolve(__dirname, "../src/index.ts"),
  webpackOverride: (c) => c,
});

const browser = await openBrowser("chrome", {
  browserExecutable: process.env.PUPPETEER_EXECUTABLE_PATH ?? "/bin/chromium",
  chromiumOptions: { args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"] },
  chromeMode: "chrome-for-testing",
});

const composition = await selectComposition({
  serveUrl: bundled,
  id: "main",
  puppeteerInstance: browser,
});

console.log("Rendering MP4...");
await renderMedia({
  composition,
  serveUrl: bundled,
  codec: "h264",
  outputLocation: "/tmp/remotion-aihub/out/aihub-bg.mp4",
  puppeteerInstance: browser,
  muted: true,
  concurrency: 1,
  crf: 22,
});

console.log("Rendering poster...");
await renderStill({
  composition,
  serveUrl: bundled,
  output: "/tmp/remotion-aihub/out/aihub-bg-poster.jpg",
  frame: 0,
  puppeteerInstance: browser,
  imageFormat: "jpeg",
  jpegQuality: 85,
});

await browser.close({ silent: false });
console.log("Done.");
