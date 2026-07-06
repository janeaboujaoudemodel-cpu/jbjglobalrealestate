import { chromium } from "@playwright/test";
import fs from "node:fs";

const baseUrl = process.env.PREVIEW_URL || "http://localhost:8080";
const outDir = "/mnt/documents/backend-emerald-contrast-proof";
fs.mkdirSync(outDir, { recursive: true });

const routes = ["/owner", "/owner/developers/new-project", "/owner/crm"];
const white = "rgb(255, 255, 255)";

const browser = await chromium.launch({ headless: true, executablePath: "/bin/chromium" });
const context = await browser.newContext({ viewport: { width: 1280, height: 1800 } });
const cookiesJson = process.env.LOVABLE_BROWSER_SUPABASE_COOKIES_JSON;
if (cookiesJson) {
  try {
    const cookies = JSON.parse(cookiesJson).map((cookie) => ({ ...cookie, url: baseUrl }));
    await context.addCookies(cookies);
  } catch {}
}
const page = await context.newPage();
const results = [];

const storageKey = process.env.LOVABLE_BROWSER_SUPABASE_STORAGE_KEY;
const sessionJson = process.env.LOVABLE_BROWSER_SUPABASE_SESSION_JSON;
if (storageKey && sessionJson) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 60_000 }).catch(() => {});
  await page.evaluate(({ storageKey, sessionJson }) => {
    window.localStorage.setItem(storageKey, sessionJson);
  }, { storageKey, sessionJson });
}

for (const route of routes) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded", timeout: 60_000 }).catch(() => {});
  await page.waitForTimeout(1800);
  const bad = await page.evaluate((white) => {
    const emeraldSelector = [
      '[data-surface="emerald"]',
      '[data-backend-icon-tile="emerald"]',
      '[data-backend-icon-tile="emerald-soft"]',
      '.jj-emerald-metallic',
      '.jj-pill-emerald-metallic',
      '.jj-surface-emerald',
      '.jj-cta-emerald',
      '.bg-\[\#064E3B\]',
    ].join(',');
    const visible = (el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) > 0.05 && r.width > 1 && r.height > 1;
    };
    const failures = [];
    const surfaces = [...document.querySelectorAll(emeraldSelector)].filter(visible);
    for (const surface of surfaces) {
      for (const el of [surface, ...surface.querySelectorAll('*')]) {
        if (!visible(el)) continue;
        const cs = getComputedStyle(el);
        const tag = el.tagName.toLowerCase();
        const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
        const svgish = ['svg','path','line','rect','circle','polyline','polygon'].includes(tag) || String(el.getAttribute('class') || '').includes('lucide');
        if (svgish) {
          if (cs.stroke && cs.stroke !== 'none' && cs.stroke !== white) failures.push({ tag, text: text.slice(0, 60), stroke: cs.stroke, className: el.getAttribute('class') || '' });
        } else if (text && cs.color !== white && cs.webkitTextFillColor !== white) {
          failures.push({ tag, text: text.slice(0, 60), color: cs.color, webkit: cs.webkitTextFillColor, className: el.getAttribute('class') || '' });
        }
        if (failures.length > 20) return failures;
      }
    }
    return failures;
  }, white);
  await page.screenshot({ path: `${outDir}/${route.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'owner'}.png`, fullPage: false });
  results.push({ route, badCount: bad.length, bad });
}

await browser.close();
fs.writeFileSync(`${outDir}/results.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results.map(({ route, badCount }) => ({ route, badCount })), null, 2));
if (results.some((r) => r.badCount > 0)) process.exit(1);