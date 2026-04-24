#!/usr/bin/env node
/**
 * Automated screenshot export for the ModeSwitcher color verification.
 *
 * What it does:
 *   1. Launches a headless Chromium against the published preview URL
 *      (default: https://jbjglobalrealestate.lovable.app).
 *   2. Captures the homepage at desktop / tablet / mobile viewports.
 *   3. Opens the ModeSwitcher dropdown and captures a focused shot of
 *      every mode color (Investor=orange, Broker=blue, I+B=green,
 *      Developer=purple) by clicking each row.
 *   4. Writes raw PNGs to /tmp/mode-shots/ and frames them with the
 *      product-shot skill, saving the final deck to
 *      /mnt/documents/mode-switcher-export/.
 *
 * Usage:
 *   node scripts/export-mode-switcher-shots.mjs                # default URL
 *   node scripts/export-mode-switcher-shots.mjs --url <url>    # override
 *   node scripts/export-mode-switcher-shots.mjs --raw-only     # skip framing
 *
 * Requires: playwright (auto-installed if missing), python3 + Pillow for
 * the product-shot framing step.
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { argv } from "node:process";

const args = argv.slice(2);
const getArg = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const RAW_ONLY = args.includes("--raw-only");
const URL = getArg("--url", "https://jbjglobalrealestate.lovable.app");

const RAW_DIR = "/tmp/mode-shots";
const OUT_DIR = "/mnt/documents/mode-switcher-export";
mkdirSync(RAW_DIR, { recursive: true });
mkdirSync(OUT_DIR, { recursive: true });

// Lazy-install playwright if missing
let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.log("Installing playwright (one-time)…");
  spawnSync("npm", ["i", "-D", "playwright@^1.47.0"], { stdio: "inherit" });
  spawnSync("npx", ["playwright", "install", "chromium"], { stdio: "inherit" });
  ({ chromium } = await import("playwright"));
}

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "mobile", width: 390, height: 844 },
];

const MODES = [
  { key: "investor", label: "Mode: Investor", expected: "orange (#F97316)" },
  { key: "broker", label: "Mode: Broker", expected: "blue (#2563EB)" },
  { key: "investor_broker", label: "Mode: Investor + Broker", expected: "green (#16A34A)" },
  { key: "developer", label: "Mode: Developer", expected: "purple (#7C3AED)" },
];

// Find any installed chromium build (Playwright's downloader sometimes
// installs an older version than the package expects).
import { readdirSync, statSync } from "node:fs";
const findChromium = () => {
  const roots = readdirSync("/")
    .filter((d) => d.startsWith("chromium-") || d.startsWith("chromium_headless_shell-"))
    .map((d) => `/${d}`);
  for (const r of roots) {
    const candidates = [
      `${r}/chrome-linux64/chrome`,
      `${r}/chrome-headless-shell-linux64/chrome-headless-shell`,
    ];
    for (const c of candidates) {
      try { if (statSync(c).isFile()) return c; } catch {}
    }
  }
  return undefined;
};
const exe = findChromium();
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const ctx = await browser.newContext({ viewport: VIEWPORTS[0] });
const page = await ctx.newPage();

console.log(`→ Loading ${URL}`);
await page.goto(URL, { waitUntil: "networkidle", timeout: 45_000 });
await page.waitForTimeout(1500);

const rawShots = [];

// 1. Full-page shots at every viewport
for (const vp of VIEWPORTS) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.waitForTimeout(800);
  const path = `${RAW_DIR}/01-${vp.name}-${vp.width}x${vp.height}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`  ✓ ${path}`);
  rawShots.push({ path, label: `Homepage @ ${vp.width}×${vp.height}` });
}

// 2. ModeSwitcher dropdown — open + per-mode capture (desktop)
await page.setViewportSize({ width: 1440, height: 900 });
await page.waitForTimeout(500);

const triggerSel = 'button[aria-haspopup="menu"]:has-text("Mode")';
const trigger = page.locator(triggerSel).first();

if ((await trigger.count()) === 0) {
  console.warn("⚠ Mode trigger not found — page may require login. Skipping dropdown shots.");
} else {
  for (const m of MODES) {
    // Make sure it's open
    const isOpen = await trigger.getAttribute("aria-expanded");
    if (isOpen !== "true") {
      await trigger.click();
      await page.waitForTimeout(300);
    }

    // Click the row for this mode (skip switching on the first to capture as-is)
    const row = page.locator(`[role="menuitem"]:has-text("${m.label}")`).first();
    if ((await row.count()) === 0) {
      console.warn(`⚠ Row not found for ${m.label}`);
      continue;
    }
    await row.click();
    await page.waitForTimeout(700); // mode change + toast

    // Reopen dropdown for the screenshot so all four colored rows are visible
    await trigger.click();
    await page.waitForTimeout(300);

    const path = `${RAW_DIR}/02-dropdown-${m.key}.png`;
    // Clip around the header so the colored dropdown is the focus
    await page.screenshot({ path, clip: { x: 900, y: 0, width: 540, height: 560 } });
    console.log(`  ✓ ${path}  (active=${m.expected})`);
    rawShots.push({ path, label: `Dropdown — active: ${m.label} → ${m.expected}` });

    // Close before next iteration
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
  }
}

await browser.close();

// 3. Frame with product-shot skill
if (!RAW_ONLY) {
  if (!existsSync("/tmp/product_shot.py")) {
    console.warn("⚠ /tmp/product_shot.py not found — skipping framing. Raw shots are in", RAW_DIR);
  } else {
    const presets = ["sunset", "ocean", "lavender", "aurora", "candy", "ember", "midnight"];
    rawShots.forEach((shot, i) => {
      const out = `${OUT_DIR}/${shot.path.split("/").pop().replace(".png", "-framed.png")}`;
      const preset = presets[i % presets.length];
      const r = spawnSync("python3", ["/tmp/product_shot.py", shot.path, out, "--preset", preset], {
        stdio: "inherit",
      });
      if (r.status === 0) console.log(`  🖼  ${out}  [${preset}]`);
    });
  }
}

console.log("\nDone.");
console.log("  Raw:    ", RAW_DIR);
console.log("  Framed: ", OUT_DIR);
