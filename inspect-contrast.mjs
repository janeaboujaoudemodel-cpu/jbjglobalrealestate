import { chromium } from 'playwright';

const url = 'https://id-preview--357981e3-cd4c-4c0d-ad5b-a1a379078f50.lovable.app/';
const browser = await chromium.launch({ headless: true, executablePath: '/bin/chromium' });
const page = await browser.newPage({ viewport: { width: 1178, height: 891 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2500);

const results = await page.evaluate(() => {
  function rulesFor(el) {
    const out = [];
    for (const sheet of Array.from(document.styleSheets)) {
      let rules;
      try { rules = sheet.cssRules; } catch { continue; }
      for (const rule of Array.from(rules || [])) {
        if (!('selectorText' in rule) || !rule.selectorText || !rule.style) continue;
        const style = rule.style;
        const hasRelevant = style.color || style.webkitTextFillColor || style.stroke || style.opacity;
        if (!hasRelevant) continue;
        try {
          if (el.matches(rule.selectorText)) {
            out.push({ selector: rule.selectorText, color: style.color, webkitTextFillColor: style.webkitTextFillColor, stroke: style.stroke, opacity: style.opacity, importantColor: style.getPropertyPriority('color'), importantTextFill: style.getPropertyPriority('-webkit-text-fill-color'), importantStroke: style.getPropertyPriority('stroke'), cssText: style.cssText });
          }
        } catch {}
      }
    }
    return out.slice(-20);
  }
  function dump(name, el) {
    if (!el) return { name, missing: true };
    const cs = getComputedStyle(el);
    const svg = el.querySelector('svg');
    const svgcs = svg ? getComputedStyle(svg) : null;
    return {
      name,
      tag: el.tagName,
      text: (el.textContent || '').trim().replace(/\s+/g, ' '),
      className: el.getAttribute('class'),
      dataSurface: el.getAttribute('data-surface'),
      dataCta: el.getAttribute('data-cta'),
      color: cs.color,
      webkitTextFillColor: cs.webkitTextFillColor,
      backgroundColor: cs.backgroundColor,
      opacity: cs.opacity,
      textShadow: cs.textShadow,
      span: el.querySelector('span') ? {
        className: el.querySelector('span').getAttribute('class'),
        color: getComputedStyle(el.querySelector('span')).color,
        webkitTextFillColor: getComputedStyle(el.querySelector('span')).webkitTextFillColor,
        opacity: getComputedStyle(el.querySelector('span')).opacity,
        rules: rulesFor(el.querySelector('span')),
      } : null,
      svg: svg ? {
        className: svg.getAttribute('class'),
        color: svgcs.color,
        stroke: svgcs.stroke,
        opacity: svgcs.opacity,
        rules: rulesFor(svg),
      } : null,
      rules: rulesFor(el),
    };
  }
  const consultation = document.querySelector('[data-hero-consultation-lock]');
  const verifiedButton = document.querySelector('button[aria-label="Open identity verification"]');
  const verifiedIcon = document.querySelector('[aria-label="Open identity verification"]')?.closest('div')?.querySelector('svg');
  const shieldTile = Array.from(document.querySelectorAll('svg')).find(svg => svg.classList.contains('lucide-shield-check'))?.parentElement;
  return [
    dump('hero consultation', consultation),
    dump('get verified button', verifiedButton),
    dump('get verified shield tile', shieldTile),
    dump('get verified shield icon', shieldTile?.querySelector('svg')),
  ];
});

console.log(JSON.stringify(results, null, 2));
await page.screenshot({ path: '/mnt/documents/contrast-before-home.png', fullPage: false });
await browser.close();
