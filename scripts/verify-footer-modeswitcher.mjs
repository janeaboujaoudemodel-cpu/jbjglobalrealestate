#!/usr/bin/env node
/**
 * Verifies the footer ModeSwitcher dropdown opens upward and never overlays
 * the 88px fixed header across desktop / tablet / mobile viewports.
 *
 * Captures screenshots to /mnt/documents/mode-switcher-footer-verification/.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, statSync } from "node:fs";

const URL = process.argv.includes("--url")
  ? process.argv[process.argv.indexOf("--url") + 1]
  : "https://jbjglobalrealestate.lovable.app";

const OUT = "/mnt/documents/mode-switcher-footer-verification";
mkdirSync(OUT, { recursive: true });

let chromium;
try { ({ chromium } = await import("playwright")); } catch {
  spawnSync("npm", ["i", "-D", "playwright@^1.47.0"], { stdio: "inherit" });
  spawnSync("npx", ["playwright", "install", "chromium"], { stdio: "inherit" });
  ({ chromium } = await import("playwright"));
}

const findChromium = () => {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  try {
    for (const d of readdirSync("/").filter((x) => x.startsWith("chromium"))) {
      for (const c of [`/${d}/chrome-linux64/chrome`, `/${d}/chrome-headless-shell-linux64/chrome-headless-shell`]) {
        try { if (statSync(c).isFile()) return c; } catch {}
      }
    }
  } catch {}
  for (const bin of ["chromium", "chromium-browser", "google-chrome", "chrome"]) {
    const r = spawnSync("which", [bin]);
    const p = r.stdout?.toString().trim();
    if (p) return p;
  }
  const r = spawnSync("nix", ["build", "nixpkgs#chromium", "--print-out-paths", "--no-link"]);
  const path = r.stdout?.toString().trim().split("\n").pop();
  if (path) {
    const exe = `${path}/bin/chromium`;
    try { if (statSync(exe).isFile()) return exe; } catch {}
  }
  return undefined;
};

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "mobile", width: 390, height: 844 },
];

const exe = findChromium();
if (exe) console.log(`→ Using chromium: ${exe}`);
const browser = await chromium.launch(exe ? { executablePath: exe } : {});

const HEADER_PX = 88;
const results = [];

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await ctx.newPage();
  console.log(`\n=== ${vp.name} ${vp.width}x${vp.height} ===`);

  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60_000 });
  try { await page.waitForLoadState("networkidle", { timeout: 12_000 }); } catch {}
  await page.waitForTimeout(1500);

  // Scroll to bottom to reveal the footer
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
  await page.waitForTimeout(800);

  // Find the footer ModeSwitcher trigger (button with "Mode" text inside <footer>)
  const footerTrigger = page.locator('footer button[aria-haspopup="menu"]:has-text("Mode")').first();
  const count = await footerTrigger.count();
  if (count === 0) {
    console.warn(`  ⚠ Footer ModeSwitcher not found at ${vp.name} — capturing footer state anyway`);
    await page.screenshot({ path: `${OUT}/${vp.name}-footer-no-trigger.png` });
    await ctx.close();
    continue;
  }

  // Shot 1: footer visible, dropdown closed
  await page.screenshot({ path: `${OUT}/${vp.name}-1-footer-closed.png` });

  // Open the dropdown
  await footerTrigger.scrollIntoViewIfNeeded();
  await footerTrigger.click();
  await page.waitForTimeout(500);

  // Locate the open menu portal (Radix renders [data-radix-popper-content-wrapper])
  const menu = page.locator('[role="menu"]').first();
  const menuBox = await menu.boundingBox();
  const triggerBox = await footerTrigger.boundingBox();

  let opensUpward = null;
  let clearsHeader = null;
  if (menuBox && triggerBox) {
    opensUpward = menuBox.y + menuBox.height <= triggerBox.y + 2; // menu sits above trigger
    clearsHeader = menuBox.y >= HEADER_PX;
    console.log(`  menu: y=${menuBox.y.toFixed(1)} h=${menuBox.height.toFixed(1)} | trigger.y=${triggerBox.y.toFixed(1)}`);
    console.log(`  upward=${opensUpward}  clearsHeader(≥${HEADER_PX})=${clearsHeader}`);
  } else {
    console.warn("  ⚠ Could not measure menu/trigger bounding boxes");
  }

  // Shot 2: dropdown open at the bottom of the page
  await page.screenshot({ path: `${OUT}/${vp.name}-2-open-at-bottom.png` });

  // Shot 3: zoom on the header+footer overlap region to prove no overlay
  await page.screenshot({
    path: `${OUT}/${vp.name}-3-open-full-viewport.png`,
    fullPage: false,
  });

  // Close, then scroll so footer is only partially in view, reopen
  await page.keyboard.press("Escape");
  await page.waitForTimeout(250);
  await page.evaluate(() => window.scrollBy({ top: -200, behavior: "instant" }));
  await page.waitForTimeout(400);
  if (await footerTrigger.isVisible().catch(() => false)) {
    await footerTrigger.click();
    await page.waitForTimeout(500);
    const menu2 = page.locator('[role="menu"]').first();
    const mb2 = await menu2.boundingBox();
    if (mb2) console.log(`  partial-scroll menu.y=${mb2.y.toFixed(1)} clearsHeader=${mb2.y >= HEADER_PX}`);
    await page.screenshot({ path: `${OUT}/${vp.name}-4-partial-scroll.png` });
  }

  results.push({ viewport: vp.name, opensUpward, clearsHeader, menuBox, triggerBox });
  await ctx.close();
}

await browser.close();

console.log("\n=== Summary ===");
for (const r of results) {
  const ok = r.opensUpward && r.clearsHeader;
  console.log(`  ${ok ? "✓" : "✗"} ${r.viewport}: upward=${r.opensUpward} clearsHeader=${r.clearsHeader}`);
}
console.log(`\nScreenshots → ${OUT}`);
