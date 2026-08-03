const { chromium } = require('playwright');

const routes = [
  '/', '/access', '/properties', '/properties/explore', '/communities',
  '/developers', '/areas', '/resale-properties', '/map', '/list-property',
  '/property-evaluator', '/rental-index', '/buyer-guide', '/seller-guide',
  '/guides', '/rent-guide', '/tenant-guide', '/landlord-guide', '/faq',
  '/market-report', '/market-intelligence', '/services', '/contact', '/about',
  '/founder', '/awards', '/insights', '/library', '/success-stories',
  '/membership', '/academy', '/agencies', '/company-profile', '/news',
  '/terms', '/privacy', '/cookies', '/disclaimers', '/mortgage-calculator',
  '/favorites', '/compare', '/quiz', '/pricing', '/broker-pricing',
  '/sitemap', '/partners', '/investor-services', '/investor-hub', '/ai-hub',
  '/broker/portal', '/developer-portal', '/careers', '/join-application',
  '/api-access', '/qr-code-generator',
];

function parseColor(c) {
  const m = c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
  if (!m) return null;
  return { r: +m[1], g: +m[2], b: +m[3], a: m[4] !== undefined ? +m[4] : 1 };
}
function luminance({r,g,b}) {
  const f = (v) => { v/=255; return v<=0.03928? v/12.92 : Math.pow((v+0.055)/1.055,2.4); };
  return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b);
}
function contrast(c1,c2) {
  const l1 = luminance(c1)+0.05, l2 = luminance(c2)+0.05;
  return l1>l2 ? l1/l2 : l2/l1;
}
function isWhiteish(c) {
  if (!c) return false;
  return c.r>=245 && c.g>=245 && c.b>=245 && c.a > 0.5;
}

async function findBg(el) {
  return await el.evaluate((node) => {
    let cur = node;
    while (cur) {
      const st = getComputedStyle(cur);
      const bg = st.backgroundColor;
      const m = bg.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
      if (m) {
        const a = m[4] !== undefined ? +m[4] : 1;
        if (a > 0.05) return bg;
      }
      cur = cur.parentElement;
    }
    return 'rgb(255,255,255)';
  });
}

(async () => {
  const browser = await chromium.launch({executablePath:'/opt/ms-playwright/chromium-1208/chrome-linux64/chrome', args:['--no-sandbox']});
  const context = await browser.newContext({ viewport: { width: 1280, height: 1800 } });
  const page = await context.newPage();
  const results = [];

  for (const route of routes) {
    const url = 'http://localhost:8080' + route;
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
    } catch (e) {
      try { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 }); } catch(e2) {
        results.push({ route, error: 'nav failed: ' + e2.message });
        continue;
      }
    }
    await page.waitForTimeout(800);

    const elements = await page.$$('button, a, [role="button"], svg, input[type="submit"]');
    const findings = [];
    for (const el of elements) {
      try {
        const box = await el.boundingBox();
        if (!box || box.width < 4 || box.height < 4) continue;
        const visible = await el.isVisible();
        if (!visible) continue;

        const info = await el.evaluate((node) => {
          const st = getComputedStyle(node);
          return {
            tag: node.tagName.toLowerCase(),
            text: (node.innerText || node.getAttribute('aria-label') || '').trim().slice(0,60),
            color: st.color,
            bg: st.backgroundColor,
            fill: node.tagName.toLowerCase()==='svg' ? st.fill : null,
            stroke: node.tagName.toLowerCase()==='svg' ? st.stroke : null,
            opacity: st.opacity,
            display: st.display,
            visibility: st.visibility,
            disabled: node.disabled || node.getAttribute('aria-disabled')==='true',
          };
        });

        const bgResolved = await findBg(el);
        const bgColor = parseColor(bgResolved);
        const fgColor = parseColor(info.color);
        const fillColor = info.fill ? parseColor(info.fill) : null;

        // Check text vs background
        if (fgColor && bgColor && info.text) {
          const ratio = contrast(fgColor, bgColor);
          if (isWhiteish(fgColor) && isWhiteish(bgColor) && ratio < 1.3) {
            findings.push({ type: 'text-on-bg', ...info, bgResolved, ratio: ratio.toFixed(2), selector: await el.evaluate(n=>n.outerHTML.slice(0,150)) });
          } else if (ratio < 3 && info.text) {
            findings.push({ type:'low-contrast-text', ...info, bgResolved, ratio: ratio.toFixed(2) });
          }
        }
        // Check svg fill vs background
        if (fillColor && bgColor && isWhiteish(fillColor) && isWhiteish(bgColor)) {
          const ratio = contrast(fillColor, bgColor);
          if (ratio < 1.3) {
            findings.push({ type: 'svg-on-bg', ...info, bgResolved, ratio: ratio.toFixed(2) });
          }
        }
      } catch (e) { /* skip */ }
    }

    if (findings.length) {
      const shot = `/tmp/wow/${route.replace(/\//g,'_') || 'home'}.png`;
      await page.screenshot({ path: shot, fullPage: true });
      results.push({ route, findings, screenshot: shot });
    } else {
      results.push({ route, findings: [] });
    }
  }

  await browser.close();
  require('fs').writeFileSync('/tmp/wow/results.json', JSON.stringify(results, null, 2));
  console.log('DONE');
})();
