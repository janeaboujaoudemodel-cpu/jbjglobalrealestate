import { test, expect } from '@playwright/test';

/**
 * Visual regression — PASS 142 follow-up.
 *
 * Verifies that headings rendered on dark / emerald / ink / navy surfaces
 * are kept light (white-ish) at runtime across a wide set of routes,
 * including the contexts PASS 142's recursive exclusion guards were meant
 * to protect (`[data-hero-dark]`, `[data-on-dark]`, `[data-surface]` in
 * dark|emerald|ink|navy, `.surface-*`, `.jj-surface-emerald`, etc.).
 *
 * For every flagged heading we compute the WCAG contrast against its
 * own computed background and require >= 4.5:1 (AA for normal text).
 * If a heading lands on a dark surface as ink-black we'll catch it here.
 *
 * Pairs with src/test/report-contrast.regression.test.ts (static lock)
 * by adding the runtime/DOM half of the contract.
 */

const BASE_URL =
  process.env.PREVIEW_URL ||
  process.env.BASE_URL ||
  'https://jbjglobalrealestate.lovable.app';

// Routes that historically render dark/emerald hero or section surfaces.
// Adding a route here is the only thing required to grow coverage.
const ROUTES = [
  '/',
  '/properties',
  '/off-plan',
  '/developers',
  '/insights',
  '/market-intelligence',
  '/guides',
  '/careers',
  '/services/property-management',
  '/services/buying-advisory',
  '/services/investment-advisory',
  '/about',
  '/contact',
  '/ai-home-finder',
  '/compare-projects',
  '/mortgage-calculator',
  '/property-evaluator',
] as const;

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 1800 },
  { name: 'tablet',  width: 820,  height: 1180 },
  { name: 'mobile',  width: 390,  height: 844  },
] as const;

// Selector matrix that mirrors the PASS 142 exclusion contract.
const DARK_HOSTS = [
  '[data-hero-dark]',
  '[data-on-dark]',
  '[data-surface="dark"]',
  '[data-surface="emerald"]',
  '[data-surface="ink"]',
  '[data-surface="navy"]',
  '.surface-dark',
  '.surface-ink',
  '.surface-navy',
  '.jj-surface-emerald',
  '.jj-hero-fullscreen',
  '.jj-hero-neon',
  '.jj-cta-primary',
  '.jj-cta-emerald',
  '.jj-emerald-metallic',
  '.jj-pill-emerald',
  '.jj-pill-emerald-metallic',
  '.jj-side-tile.is-active',
];

type Probe = {
  selector: string;
  text: string;
  color: string;
  bg: string;
  contrast: number;
  tag: string;
};

const VIEWPORT_FOR_FULL_SCAN = VIEWPORTS[0]; // do the heavy DOM scan only on desktop

test.describe('Dark-surface heading contrast (PASS 142 follow-up)', () => {
  for (const route of ROUTES) {
    test(`headings on dark surfaces stay light @ ${route}`, async ({ browser }) => {
      const ctx = await browser.newContext({
        viewport: { width: VIEWPORT_FOR_FULL_SCAN.width, height: VIEWPORT_FOR_FULL_SCAN.height },
      });
      const page = await ctx.newPage();

      // Suppress dismissible overlays so we never accidentally probe a modal scrim.
      await page.addInitScript(() => {
        try {
          localStorage.setItem('smart_popup_dismissed_until', String(Date.now() + 7 * 864e5));
          localStorage.setItem('smart_popup_shown_count', '99');
          localStorage.setItem('smart_popup_session_shown', '1');
          localStorage.setItem('cookies_consent', JSON.stringify({ accepted: true, ts: Date.now() }));
          localStorage.setItem('cookiesConsent', 'accepted');
        } catch {}
      });

      const resp = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
      // Skip cleanly if the deployed preview doesn't serve a route — coverage
      // is additive, not a deploy gate.
      test.skip(!resp || resp.status() >= 400, `route not deployed: ${route}`);
      await page.waitForTimeout(1200);

      // Scroll the full document so lazy sections paint their real backgrounds.
      await page.evaluate(async () => {
        const max = document.documentElement.scrollHeight;
        for (let y = 0; y < max; y += Math.floor(window.innerHeight * 0.8)) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 80));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(400);

      const offenders: Probe[] = await page.evaluate((hosts) => {
        // ---- WCAG helpers (must live in the page context) ----
        const parse = (s: string): [number, number, number, number] => {
          const m = s.match(/rgba?\(([^)]+)\)/i);
          if (!m) return [255, 255, 255, 1];
          const p = m[1].split(',').map((x) => parseFloat(x.trim()));
          return [p[0] ?? 255, p[1] ?? 255, p[2] ?? 255, p[3] ?? 1];
        };
        const lum = (r: number, g: number, b: number) => {
          const f = (c: number) => {
            const s = c / 255;
            return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
          };
          return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
        };
        const contrast = (a: [number, number, number], b: [number, number, number]) => {
          const L1 = lum(a[0], a[1], a[2]);
          const L2 = lum(b[0], b[1], b[2]);
          const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
          return (hi + 0.05) / (lo + 0.05);
        };
        // Walk up the DOM compositing background colors until we hit an opaque one.
        const effectiveBg = (el: Element): [number, number, number] => {
          let r = 255, g = 255, b = 255, a = 0;
          let node: Element | null = el;
          while (node && a < 0.999) {
            const cs = getComputedStyle(node);
            const [nr, ng, nb, na] = parse(cs.backgroundColor);
            if (na > 0) {
              // composite onto current
              const k = na * (1 - a);
              r = r * a + nr * k;
              g = g * a + ng * k;
              b = b * a + nb * k;
              a = a + k;
            }
            // also treat gradient backgrounds as the first color stop
            if (cs.backgroundImage && cs.backgroundImage.includes('gradient')) {
              const m = cs.backgroundImage.match(/rgba?\([^)]+\)|#[0-9a-fA-F]{3,8}/);
              if (m) {
                const v = m[0];
                let rr = 0, gg = 0, bb = 0;
                if (v.startsWith('#')) {
                  let h = v.slice(1);
                  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
                  const n = parseInt(h, 16);
                  rr = (n >> 16) & 255; gg = (n >> 8) & 255; bb = n & 255;
                } else {
                  const [pr, pg, pb] = parse(v);
                  rr = pr; gg = pg; bb = pb;
                }
                const k = 1 - a;
                r = r * a + rr * k;
                g = g * a + gg * k;
                b = b * a + bb * k;
                a = 1;
              }
            }
            node = node.parentElement;
          }
          return [Math.round(r), Math.round(g), Math.round(b)];
        };

        const selectorList = (hosts as string[]).join(',');
        const out: any[] = [];

        const visible = (el: Element) => {
          const cs = getComputedStyle(el);
          if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < 0.1) return false;
          const r = (el as HTMLElement).getBoundingClientRect();
          return r.width >= 24 && r.height >= 12;
        };

        document.querySelectorAll(selectorList).forEach((host) => {
          if (!visible(host)) return;
          const headings = host.querySelectorAll('h1, h2, h3, h4, h5, h6');
          headings.forEach((h) => {
            if (!visible(h)) return;
            // Skip headings whose text isn't visible to user
            const text = (h.textContent || '').trim().slice(0, 80);
            if (!text) return;
            const cs = getComputedStyle(h);
            const fg = parse(cs.color);
            const bg = effectiveBg(h);
            // Only flag when the host actually painted dark — luminance < 0.35.
            const bgLum = lum(bg[0], bg[1], bg[2]);
            if (bgLum > 0.35) return;
            const ratio = contrast([fg[0], fg[1], fg[2]], bg);
            if (ratio < 4.5) {
              out.push({
                selector: host.tagName.toLowerCase() +
                  (host.getAttribute('data-hero-dark') !== null ? '[data-hero-dark]' : '') +
                  (host.getAttribute('data-on-dark') !== null ? '[data-on-dark]' : '') +
                  (host.getAttribute('data-surface') ? `[data-surface="${host.getAttribute('data-surface')}"]` : ''),
                text,
                color: `rgb(${fg[0]},${fg[1]},${fg[2]})`,
                bg: `rgb(${bg[0]},${bg[1]},${bg[2]})`,
                contrast: Math.round(ratio * 100) / 100,
                tag: h.tagName.toLowerCase(),
              });
            }
          });
        });
        return out;
      }, DARK_HOSTS);

      // Capture proof so a failure is debuggable from CI artifacts.
      const slug = route.replace(/\W+/g, '_') || 'root';
      await page.screenshot({ path: `e2e-artifacts/dark-contrast-${slug}.png` });

      expect(
        offenders,
        `Headings rendered too dark on a dark surface at ${route}:\n` +
          offenders.map((o) => `  ${o.tag} "${o.text}" — ${o.color} on ${o.bg} = ${o.contrast}:1`).join('\n'),
      ).toEqual([]);

      await ctx.close();
    });
  }

  // Cross-viewport sweep on a representative subset to catch responsive flips.
  const RESPONSIVE_SUBSET = ['/', '/properties', '/insights'] as const;
  for (const route of RESPONSIVE_SUBSET) {
    for (const vp of VIEWPORTS) {
      test(`responsive: dark headings stay light @ ${route} (${vp.name})`, async ({ browser }) => {
        const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
        const page = await ctx.newPage();
        const resp = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
        test.skip(!resp || resp.status() >= 400, `route not deployed: ${route}`);
        await page.waitForTimeout(900);

        // Lighter heuristic: just check first heading inside each dark host.
        const offenders = await page.evaluate((hosts) => {
          const parse = (s: string) => {
            const m = s.match(/rgba?\(([^)]+)\)/i);
            const p = m ? m[1].split(',').map((x) => parseFloat(x.trim())) : [255, 255, 255, 1];
            return [p[0] ?? 255, p[1] ?? 255, p[2] ?? 255];
          };
          const lum = (rgb: number[]) => {
            const f = (c: number) => {
              const s = c / 255;
              return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
            };
            return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
          };
          const out: any[] = [];
          document.querySelectorAll((hosts as string[]).join(',')).forEach((host) => {
            const h = host.querySelector('h1, h2, h3') as HTMLElement | null;
            if (!h) return;
            const r = h.getBoundingClientRect();
            if (r.width < 24 || r.height < 12) return;
            const fgLum = lum(parse(getComputedStyle(h).color));
            // On a dark host the heading must read as a light token (lum >= 0.6).
            if (fgLum < 0.6) {
              out.push({
                text: (h.textContent || '').trim().slice(0, 60),
                color: getComputedStyle(h).color,
              });
            }
          });
          return out;
        }, DARK_HOSTS);

        expect(
          offenders,
          `Dark-host headings rendered too dark at ${route} (${vp.name}):\n` +
            offenders.map((o: any) => `  "${o.text}" — ${o.color}`).join('\n'),
        ).toEqual([]);

        await ctx.close();
      });
    }
  }
});
