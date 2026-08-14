/**
 * Post-build prerender for every PUBLIC, non-authenticated route.
 *
 * `vite-plugin-prerender` was listed in package.json but never wired into
 * vite.config.ts, so nothing was ever prerendered — the deployed index.html
 * shipped an empty `<div id="root"></div>`. This script replaces it:
 *
 *   1. serves the freshly built `dist/` on a local port
 *   2. renders each public route in headless Chromium (already installed)
 *   3. writes the rendered HTML back to `dist/<route>/index.html`
 *
 * Private routes (AuthRequiredRoute / OwnerGuard / ModeRequiredRoute) and
 * parameterised routes are intentionally skipped — see routes.json, which is
 * generated from src/routes/PublicRoutes.tsx.
 *
 * Purely additive: it never touches CSS, colours or layout. If Chromium or the
 * preview server is unavailable the build still succeeds (soft fail).
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const DIST = path.join(ROOT, "dist");
const PORT = Number(process.env.PRERENDER_PORT || 4178);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const CONCURRENCY = Number(process.env.PRERENDER_CONCURRENCY || 4);
const ROUTE_TIMEOUT = 20_000;

if (!fs.existsSync(path.join(DIST, "index.html"))) {
  console.log("[prerender] no dist/index.html — skipping");
  process.exit(0);
}

const routes = JSON.parse(fs.readFileSync(path.join(__dirname, "routes.json"), "utf8"));

const server = spawn(
  "bunx",
  ["vite", "preview", "--port", String(PORT), "--strictPort", "--host", "127.0.0.1"],
  { cwd: ROOT, stdio: "ignore" },
);

const stop = () => {
  try {
    server.kill("SIGKILL");
  } catch {
    /* already gone */
  }
};
process.on("exit", stop);

async function waitForServer() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(ORIGIN + "/", { redirect: "manual" });
      if (res.status < 500) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

function outFile(route) {
  const clean = route === "/" || route === "" ? "" : route.replace(/^\/+|\/+$/g, "");
  return clean ? path.join(DIST, clean, "index.html") : path.join(DIST, "index.html");
}

const main = async () => {
  if (!(await waitForServer())) {
    console.log("[prerender] preview server did not start — skipping");
    return;
  }

  let playwright;
  try {
    playwright = await import("playwright");
  } catch {
    console.log("[prerender] playwright unavailable — skipping");
    return;
  }

  // Launch with the bundled browser; if the installed browser build does not
  // match this Playwright version, fall back to any Chromium already present.
  const findLocalChromium = () => {
    const base = "/opt/ms-playwright";
    if (!fs.existsSync(base)) return null;
    for (const dir of fs.readdirSync(base).filter((d) => d.startsWith("chromium"))) {
      for (const bin of ["chrome-linux/chrome", "chrome-linux/headless_shell"]) {
        const candidate = path.join(base, dir, bin);
        if (fs.existsSync(candidate)) return candidate;
      }
    }
    return null;
  };

  let browser;
  try {
    browser = await playwright.chromium.launch({ headless: true });
  } catch (err) {
    const executablePath = findLocalChromium();
    if (!executablePath) throw err;
    console.log(`[prerender] using local chromium at ${executablePath}`);
    browser = await playwright.chromium.launch({ headless: true, executablePath });
  }
  const results = { ok: 0, empty: 0, failed: 0 };
  const queue = [...routes];

  const worker = async () => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 1200 } });
    const page = await context.newPage();
    page.on("console", () => {});
    while (queue.length) {
      const route = queue.shift();
      try {
        await page.goto(ORIGIN + route, { waitUntil: "domcontentloaded", timeout: ROUTE_TIMEOUT });
        await page
          .waitForFunction(
            () => {
              const root = document.getElementById("root");
              return !!root && (root.innerText || "").trim().length > 80;
            },
            { timeout: ROUTE_TIMEOUT },
          )
          .catch(() => {});
        const html = await page.content();
        const rootText = await page.evaluate(
          () => (document.getElementById("root")?.innerText || "").trim().length,
        );
        if (rootText < 80) {
          results.empty += 1;
          continue;
        }
        const file = outFile(route);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, html);
        results.ok += 1;
      } catch (err) {
        results.failed += 1;
        console.log(`[prerender] ${route} failed: ${String(err).slice(0, 120)}`);
      }
    }
    await context.close();
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  await browser.close();
  console.log(
    `[prerender] ${results.ok} routes prerendered, ${results.empty} empty, ${results.failed} failed (of ${routes.length})`,
  );
};

main()
  .catch((err) => console.log("[prerender] skipped:", String(err).slice(0, 200)))
  .finally(stop);
