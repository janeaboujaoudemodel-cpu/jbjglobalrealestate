import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, executablePath: '/bin/chromium', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
await page.goto('http://localhost:8080/interior-design-ai', { waitUntil: 'networkidle', timeout: 60000 });
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
    return hits.slice(-20);
  }
  const choice = document.querySelector('.id-choice');
  const sweep = document.querySelector('.jj-sqtoggle-sweep');
  return { choice: choice ? {style: getComputedStyle(choice).cssText, rules: collect(choice)} : null, sweep: sweep ? {style: getComputedStyle(sweep).cssText, rules: collect(sweep)} : null };
});
console.log(JSON.stringify(out, null, 2).slice(0,20000));
await browser.close();
