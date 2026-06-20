import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true, executablePath: '/bin/chromium' });
const ctx = await b.newContext({ viewport: { width: 1178, height: 891 } });
const p = await ctx.newPage();
await p.goto('http://localhost:8080/list-property', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(2500);
const out = await p.evaluate(() => {
  const el = Array.from(document.querySelectorAll('span')).find(e => /JBJ Seller Portal|JBJ Landlord Portal/.test(e.textContent || ''));
  // pick the rule from sheets
  let cssText = '';
  for (const sheet of Array.from(document.styleSheets)) {
    let rules; try { rules = sheet.cssRules; } catch { continue; }
    for (const r of Array.from(rules || [])) {
      if (!r.selectorText) continue;
      if ((r.style?.cssText || '').includes('--jj-contrast-on-light')) {
        if (r.selectorText.length > cssText.length) cssText = r.selectorText;
      }
    }
  }
  // Split by comma at top level (rough): cut at ", html body"
  const parts = cssText.split(/,\s*(?=html body )/);
  return { parts: parts.map((s,i)=>({i,len:s.length,matches:el.matches(s)})), partCount: parts.length };
});
console.log(JSON.stringify(out, null, 2));
await b.close();
