import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true, executablePath: '/bin/chromium' });
const ctx = await b.newContext({ viewport: { width: 1178, height: 891 } });
const p = await ctx.newPage();
await p.goto('http://localhost:8080/list-property', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(2500);
const out = await p.evaluate(() => {
  const el = Array.from(document.querySelectorAll('span')).find(e => /JBJ Seller Portal|JBJ Landlord Portal/.test(e.textContent || ''));
  return {
    hasAttr: el.hasAttribute('data-no-contrast-guard'),
    val: el.getAttribute('data-no-contrast-guard'),
    matchesNot: el.matches(':not([data-no-contrast-guard])'),
    matchesNotEq: el.matches(':not([data-no-contrast-guard=""])'),
    parentChain: (() => { const arr=[]; let n=el; while(n){ arr.push(n.tagName+(n.className?'.'+String(n.className).slice(0,40):'')); n=n.parentElement; } return arr.slice(0,10); })(),
  };
});
console.log(JSON.stringify(out, null, 2));
await b.close();
