import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true, executablePath: '/bin/chromium' });
const ctx = await b.newContext({ viewport: { width: 1178, height: 891 } });
const p = await ctx.newPage();
await p.goto('http://localhost:8080/faq', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(2500);
const out = await p.evaluate(() => {
  const el = Array.from(document.querySelectorAll('h1,h2,h3')).find(e => /Your Questions Answered/.test(e.textContent || ''));
  const chain = [];
  let n = el;
  while (n && n.nodeType === 1) {
    const cs = getComputedStyle(n);
    chain.push({ tag: n.tagName, cls: (n.className || '').toString().slice(0,80), fill: cs.webkitTextFillColor });
    n = n.parentElement;
  }
  // find rules that set webkit-text-fill-color matching each ancestor
  const ancestorMatches = chain.slice(0, 10).map(c => c);
  return { chain };
});
console.log(JSON.stringify(out, null, 2));
await b.close();
