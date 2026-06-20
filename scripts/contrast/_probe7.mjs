import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true, executablePath: '/bin/chromium' });
const ctx = await b.newContext({ viewport: { width: 1178, height: 891 } });
const p = await ctx.newPage();
await p.goto('http://localhost:8080/faq', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(2500);
const out = await p.evaluate(() => {
  const el = Array.from(document.querySelectorAll('h1,h2,h3')).find(e => /Your Questions Answered/.test(e.textContent || ''));
  if (!el) return 'not found';
  const cs = getComputedStyle(el);
  return { color: cs.color, fill: cs.webkitTextFillColor, stroke: cs.stroke };
});
console.log(JSON.stringify(out, null, 2));
await b.close();
