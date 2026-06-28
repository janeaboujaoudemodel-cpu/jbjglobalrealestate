import { chromium } from "playwright";

const BASE_URL = process.env.QA_BASE_URL || "http://localhost:8080";
const ROUTES = ["/", "/projects", "/developers", "/faq"];

const assertNormalScroll = async (page, route) => {
  await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(900);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "auto" }));
  await page.waitForTimeout(80);

  const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  if (scrollHeight <= window.innerHeight) return;

  const moves = [];
  for (let i = 0; i < 6; i += 1) {
    const before = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, 80);
    await page.waitForTimeout(120);
    const after = await page.evaluate(() => window.scrollY);
    moves.push(after - before);
  }

  const positiveMoves = moves.filter((move) => move > 0);
  const biggestMove = Math.max(...moves);
  const totalMove = moves.reduce((sum, move) => sum + move, 0);

  if (positiveMoves.length < 5) {
    throw new Error(`${route}: wheel input did not consistently scroll the page (${moves.join(", ")})`);
  }

  if (biggestMove > 220) {
    throw new Error(`${route}: small wheel input jumped too far (${moves.join(", ")})`);
  }

  if (totalMove < 300 || totalMove > 950) {
    throw new Error(`${route}: total scroll distance is abnormal (${totalMove}; moves ${moves.join(", ")})`);
  }

  return { route, moves, totalMove };
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1121, height: 853 }, deviceScaleFactor: 2 });
const page = await context.newPage();

try {
  const results = [];
  for (const route of ROUTES) {
    results.push(await assertNormalScroll(page, route));
  }
  console.log(JSON.stringify({ ok: true, results }, null, 2));
} finally {
  await browser.close();
}