import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true, executablePath: '/bin/chromium' });
const ctx = await b.newContext({ viewport: { width: 1178, height: 891 } });
const p = await ctx.newPage();
await p.goto('http://localhost:8080/list-property', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(2500);
const out = await p.evaluate(() => {
  const el = Array.from(document.querySelectorAll('span')).find(e => /JBJ Seller Portal|JBJ Landlord Portal/.test(e.textContent || ''));
  const matches = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let rules; try { rules = sheet.cssRules; } catch { continue; }
    for (const r of Array.from(rules || [])) {
      if (!r.selectorText) continue;
      if (!/jj-contrast-on-light|--jj-on-light/.test(r.style.cssText || '')) continue;
      try { if (el.matches(r.selectorText)) matches.push({ sel: r.selectorText, css: r.style.cssText }); } catch(e) { matches.push({sel: r.selectorText.slice(0,80), err: e.message}); }
    }
  }
  return matches;
});
console.log(JSON.stringify(out, null, 2));
await b.close();
