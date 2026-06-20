import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true, executablePath: '/bin/chromium' });
const ctx = await b.newContext({ viewport: { width: 1178, height: 891 } });
const p = await ctx.newPage();
await p.goto('http://localhost:8080/guides', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(2500);
const out = await p.evaluate(() => {
  const el = Array.from(document.querySelectorAll('h2,h1,h3,span,p')).find(e => /Explore Guides/.test(e.textContent || ''));
  if (!el) return 'not found';
  const cs = getComputedStyle(el);
  const matches = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let rules; try { rules = sheet.cssRules; } catch { continue; }
    for (const r of Array.from(rules || [])) {
      if (!r.selectorText || !r.style) continue;
      if (!r.style.color) continue;
      try { if (el.matches(r.selectorText)) matches.push({ sel: r.selectorText.slice(0,200), color: r.style.color, imp: r.style.getPropertyPriority('color') }); } catch {}
    }
  }
  return { tag: el.tagName, cls: el.className, color: cs.color, matches };
});
console.log(JSON.stringify(out, null, 2));
await b.close();
