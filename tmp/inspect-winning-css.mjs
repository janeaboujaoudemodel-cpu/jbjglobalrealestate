import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, executablePath: '/bin/chromium', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } });
await page.goto('http://localhost:8080/interior-design-ai', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('.id-choice', { timeout: 15000 }).catch(() => {}); await page.waitForTimeout(1000);
const out = await page.evaluate(() => {
  function matches(el, sel){ try { return el.matches(sel); } catch { return false; } }
  function collect(el){
    const hits=[];
    for (const sheet of Array.from(document.styleSheets)) {
      let rules; try { rules = sheet.cssRules; } catch { continue; }
      for (const rule of Array.from(rules)) {
        if (rule.type === CSSRule.STYLE_RULE && matches(el, rule.selectorText)) {
          const txt = rule.cssText;
          if (/border|background|box-shadow|16,\s*185|184,\s*149|B89555|10B981|C5B087/i.test(txt)) hits.push(txt);
        }
      }
    }
    return hits.slice(-50);
  }
  const choice = document.querySelector('.id-choice');
  const footer = document.querySelector('footer');
  const free = [...document.querySelectorAll('div,span')].find(e => e.textContent?.trim()==='Completely Free');
  function info(el){ if(!el) return null; const cs=getComputedStyle(el); return {tag: el.tagName, cls: el.className, vals:{borderTopColor:cs.borderTopColor,borderRightColor:cs.borderRightColor,borderBottomColor:cs.borderBottomColor,borderLeftColor:cs.borderLeftColor,boxShadow:cs.boxShadow,background:cs.background}, rules: collect(el)}; }
  return { choice: info(choice), footer: info(footer), free: info(free) };
});
console.log(JSON.stringify(out, null, 2).slice(0,50000));
await browser.close();
