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

    const backgroundImageColor = (backgroundImage) => {
      if (!backgroundImage || backgroundImage === 'none') return null;
      const lower = backgroundImage.toLowerCase();
      if (lower.includes('url(')) return { color: backgroundImage, parsed: null, image: true };
      if (/(#0a0a0a|#1a1a1a|#0b0b0b|#0b1b33|#1f1f1f|#2e1065|#4c1d95|#022c22|#064e3b|rgb\(\s*(?:0|4|6|10|11|31|46|76)\b)/.test(lower)) {
        return { color: backgroundImage, parsed: { r: 10, g: 10, b: 10, a: 1 }, image: true };
      }
      if (/(#ffffff|#fdfbf7|#f7f2ea|#efe6d6|#f2ebff|#e8f3ec|rgb\(\s*25[0-5]\s*,\s*25[0-5]\s*,\s*25[0-5])/.test(lower)) {
        return { color: backgroundImage, parsed: { r: 253, g: 251, b: 247, a: 1 }, image: true };
      }
      return { color: backgroundImage, parsed: null, image: true };
    };

    const effectiveBackground = (element) => {
      let node = element;
      while (node && node.nodeType === 1) {
        const styles = getComputedStyle(node);
        const imageColor = backgroundImageColor(styles.backgroundImage);
        if (imageColor) return { ...imageColor, tag: node.tagName, className: node.getAttribute('class') || '' };
        const color = styles.backgroundColor;
        const parsed = rgb(color);
        if (parsed && parsed.a > 0.2) return { color, parsed, tag: node.tagName, className: node.getAttribute('class') || '' };
        node = node.parentElement;
      }
      const color = getComputedStyle(document.body).backgroundColor;
      return { color, parsed: rgb(color), tag: 'BODY', className: '' };
    };

    const isVisiblyHidden = (element) => {
      let node = element;
      while (node && node.nodeType === 1) {
        const styles = getComputedStyle(node);
        if (styles.visibility === 'hidden' || Number.parseFloat(styles.opacity || '1') <= 0.05) return true;
        node = node.parentElement;
      }
      return false;
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

    const selectors = 'button,a,[role="button"],input,textarea,select,h1,h2,h3,p,span,label,svg,[class*="lucide"]';
    return Array.from(document.querySelectorAll(selectors)).flatMap((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.width < 4 || rect.height < 4 || rect.bottom < 0 || rect.top > innerHeight || rect.right < 0 || rect.left > innerWidth) return [];
      if (isVisiblyHidden(element)) return [];
      const visibleLabel = (element.textContent || element.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ');
      if (!visibleLabel && !(element instanceof SVGElement) && !element.matches('button,a,[role="button"],input,textarea,select')) return [];

      const computed = getComputedStyle(element);
      const stroke = rgb(computed.stroke);
      const textFill = rgb(computed.webkitTextFillColor);
      const foreground = element instanceof SVGElement && stroke && computed.stroke !== 'none'
        ? stroke
        : textFill || rgb(computed.color);
      const background = effectiveBackground(element);
      if (!foreground || !background.parsed) return [];

      const ratio = contrastRatio(foreground, background.parsed);
      const bgLum = luminance(background.parsed);
      const fgLum = luminance(foreground);
      const darkBg = bgLum < 0.25;
      const lightBg = bgLum > 0.72 && background.parsed.r > 220 && background.parsed.g > 200;
      const blackOnDark = darkBg && fgLum < 0.18;
      const insideDarkHero = Boolean(element.closest('[data-hero-dark]'));
      const whiteOnLight = lightBg && fgLum > 0.72 && !insideDarkHero;

      if (ratio >= 4.5 && !blackOnDark && !whiteOnLight) return [];
      return [{
        text: visibleLabel.slice(0, 80),
        tag: element.tagName,
        className: element.getAttribute('class') || '',
        color: computed.color,
        background: background.color,
        backgroundOwner: `${background.tag}.${background.className}`.slice(0, 120),
        ratio: Number(ratio.toFixed(2)),
        blackOnDark,
        whiteOnLight,
        matchingRules: matchingRules(element),
      }];
    }).slice(0, 40);
  }, { rgbSource: rgb.toString(), luminanceSource: luminance.toString(), contrastRatioSource: contrastRatio.toString() });

  const polarityFailures = routeFailures.filter((item) => item.blackOnDark || item.whiteOnLight);
  if (polarityFailures.length) failures.push({ route, failures: polarityFailures });
  console.log(
    `${polarityFailures.length ? '✗' : '✓'} ${route} — ${polarityFailures.length} black-on-dark/white-on-light issue(s), ${routeFailures.length} low-contrast warning(s)`,
  );
  await page.close();
}

await browser.close();

if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exit(1);
}