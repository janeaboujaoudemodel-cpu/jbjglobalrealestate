#!/usr/bin/env node
import { chromium } from 'playwright';

const previewUrl = process.env.PREVIEW_URL || 'http://localhost:8080';
const routes = (process.env.ROUTES || '/,/founder').split(',').map((route) => route.trim()).filter(Boolean);
const viewport = { width: Number(process.env.VIEWPORT_WIDTH || 1178), height: Number(process.env.VIEWPORT_HEIGHT || 891) };

const rgb = (value) => {
  const match = String(value).match(/rgba?\(([^)]+)\)/);
  if (!match) return null;
  const [r, g, b, a = 1] = match[1].split(',').map((part) => Number.parseFloat(part));
  return Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b) ? { r, g, b, a } : null;
};

const luminance = ({ r, g, b }) => {
  const [rr, gg, bb] = [r, g, b].map((v) => {
    const channel = v / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rr + 0.7152 * gg + 0.0722 * bb;
};

const contrastRatio = (fg, bg) => {
  const a = luminance(fg);
  const b = luminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};

const launchOptions = process.env.CHROMIUM_PATH
  ? { headless: true, executablePath: process.env.CHROMIUM_PATH }
  : { headless: true, executablePath: '/bin/chromium' };
const browser = await chromium.launch(launchOptions);
const context = await browser.newContext({ viewport, deviceScaleFactor: 2 });
const failures = [];

for (const route of routes) {
  const page = await context.newPage();
  const target = new URL(route, previewUrl).toString();
  await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500);

  const routeFailures = await page.evaluate(({ rgbSource, luminanceSource, contrastRatioSource }) => {
    const rgb = eval(`(${rgbSource})`);
    const luminance = eval(`(${luminanceSource})`);
    const contrastRatio = eval(`(${contrastRatioSource})`);

    const effectiveBackground = (element) => {
      let node = element;
      while (node && node.nodeType === 1) {
        const color = getComputedStyle(node).backgroundColor;
        const parsed = rgb(color);
        if (parsed && parsed.a > 0.2) return { color, parsed, tag: node.tagName, className: node.getAttribute('class') || '' };
        node = node.parentElement;
      }
      const color = getComputedStyle(document.body).backgroundColor;
      return { color, parsed: rgb(color), tag: 'BODY', className: '' };
    };

    const matchingRules = (element) => {
      const matched = [];
      for (const sheet of Array.from(document.styleSheets)) {
        let rules;
        try { rules = sheet.cssRules; } catch { continue; }
        for (const rule of Array.from(rules || [])) {
          if (!rule.selectorText || !rule.style) continue;
          const style = rule.style;
          if (!(style.color || style.webkitTextFillColor || style.stroke)) continue;
          try {
            if (element.matches(rule.selectorText)) {
              matched.push({
                selector: rule.selectorText.slice(0, 220),
                color: style.color,
                fill: style.webkitTextFillColor,
                stroke: style.stroke,
                importantColor: style.getPropertyPriority('color'),
                importantFill: style.getPropertyPriority('-webkit-text-fill-color'),
                importantStroke: style.getPropertyPriority('stroke'),
              });
            }
          } catch {}
        }
      }
      return matched.slice(-5);
    };

    const selectors = 'button,a,[role="button"],input,textarea,select,h1,h2,h3,p,span,label,svg';
    return Array.from(document.querySelectorAll(selectors)).flatMap((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.width < 4 || rect.height < 4 || rect.bottom < 0 || rect.top > innerHeight || rect.right < 0 || rect.left > innerWidth) return [];

      const computed = getComputedStyle(element);
      const foreground = rgb(computed.color);
      const background = effectiveBackground(element);
      if (!foreground || !background.parsed) return [];

      const ratio = contrastRatio(foreground, background.parsed);
      const bgLum = luminance(background.parsed);
      const fgLum = luminance(foreground);
      const blueDarkBg = background.parsed.b > background.parsed.r + 20 && bgLum < 0.25;
      const champagneLightBg = bgLum > 0.72 && background.parsed.r > 220 && background.parsed.g > 200;
      const blackOnBlue = blueDarkBg && fgLum < 0.18;
      const whiteOnChampagne = champagneLightBg && fgLum > 0.72;

      if (ratio >= 4.5 && !blackOnBlue && !whiteOnChampagne) return [];
      return [{
        text: (element.textContent || element.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 80),
        tag: element.tagName,
        className: element.getAttribute('class') || '',
        color: computed.color,
        background: background.color,
        backgroundOwner: `${background.tag}.${background.className}`.slice(0, 120),
        ratio: Number(ratio.toFixed(2)),
        blackOnBlue,
        whiteOnChampagne,
        matchingRules: matchingRules(element),
      }];
    }).slice(0, 40);
  }, { rgbSource: rgb.toString(), luminanceSource: luminance.toString(), contrastRatioSource: contrastRatio.toString() });

  const polarityFailures = routeFailures.filter((item) => item.blackOnBlue || item.whiteOnChampagne);
  if (polarityFailures.length) failures.push({ route, failures: polarityFailures });
  console.log(
    `${polarityFailures.length ? '✗' : '✓'} ${route} — ${polarityFailures.length} black-on-blue/white-on-champagne issue(s), ${routeFailures.length} low-contrast warning(s)`,
  );
  await page.close();
}

await browser.close();

if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exit(1);
}