import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true, executablePath: '/bin/chromium' });
const ctx = await b.newContext({ viewport: { width: 1178, height: 891 } });
const p = await ctx.newPage();
await p.goto('http://localhost:8080/faq', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(2500);
const out = await p.evaluate(() => {
  const el = Array.from(document.querySelectorAll('h1,h2,h3')).find(e => /Your Questions Answered/.test(e.textContent || ''));
  const matches = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let rules; try { rules = sheet.cssRules; } catch { continue; }
    for (const r of Array.from(rules || [])) {
      if (!r.selectorText || !r.style) continue;
      const css = r.style.cssText || '';
      if (!/webkit-text-fill-color/.test(css)) continue;
      try { if (el.matches(r.selectorText)) matches.push({ sel: r.selectorText.slice(0,260), css: css.slice(0,200) }); } catch {}
    }
  }
  return matches;
});
console.log(JSON.stringify(out, null, 2));
await b.close();
