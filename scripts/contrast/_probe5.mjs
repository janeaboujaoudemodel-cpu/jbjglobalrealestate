import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true, executablePath: '/bin/chromium' });
const ctx = await b.newContext({ viewport: { width: 1178, height: 891 } });
const p = await ctx.newPage();
await p.goto('http://localhost:8080/list-property', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(2500);
const out = await p.evaluate(() => {
  const el = Array.from(document.querySelectorAll('span')).find(e => /JBJ Seller Portal|JBJ Landlord Portal/.test(e.textContent || ''));
  const sel1 = 'html body :is(.jj-cta-champagne, .jj-cta-outline, .jj-pill-active, [data-cta="champagne"], [data-cta="outline"], .bg-white, [class~="bg-white"], [class~="bg-[#FFFFFF]"], [class~="bg-[#FFF]"], [class~="bg-[#FDFBF7]"], [class~="bg-[#FAF5EC]"], [class~="bg-[#F7F2EA]"], [class~="bg-[#F5F0E6]"], [class~="bg-[#F2EADB]"], [class~="bg-[#EFE6D6]"], [class~="bg-[#EADFC8]"], [class~="bg-[#E8DCC4]"], [class~="bg-[#E5D9BE]"], [class~="bg-[#B89555]"], [class~="from-[#FDFBF7]"], [class~="via-[#F7F2EA]"], [class~="to-[#EFE6D6]"], [class~="bg-champagne"], [class~="bg-cream"], [class~="bg-pearl"], [class~="bg-beige"], [class~="bg-ivory"], [class~="bg-sand"], .surface-page, .surface-light, .surface-pearl, .surface-champagne, .surface-cream, .surface-raised, .surface-gold, [data-surface="page"], [data-surface="light"], [data-surface="pearl"], [data-surface="champagne"], [data-surface="cream"], [data-surface="raised"], [data-surface="gold"], .jj-card-inner, .jj-layer-2)';
  return { matches1: el.matches(sel1), hasGuard: el.hasAttribute('data-no-contrast-guard'), notGuard: el.matches(':not([data-no-contrast-guard])') };
});
console.log(JSON.stringify(out, null, 2));
await b.close();
