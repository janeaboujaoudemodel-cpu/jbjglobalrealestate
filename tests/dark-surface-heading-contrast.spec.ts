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

/**
 * The dark-host heading probe. Runs in page context, so it may not close over
 * anything outside its own arguments.
 *
 * `data-surface="emerald"` / `[data-hero-dark]` and friends declare *intent*,
 * not the pixels that actually ship: several passes deliberately repaint those
 * hosts champagne, and a champagne host correctly carries ink headings. So the
 * probe measures the composited background it finds and only audits hosts that
 * really render dark (bgLum <= 0.5), requiring AAA (>= 7:1) there.
 *
 * Both the full scan and the responsive sweep call this one function. They used
 * to carry separate copies, and the responsive copy drifted to a cheaper proxy
 * — "heading colour must be light" with no background check at all — which
 * reported 32 failures against headings measuring 16.16:1 on champagne.
 *
 * Scope note: bright hosts are skipped here on purpose. The inverse regression,
 * white text on a light surface, belongs to the static `check:contrast:white-on-light`
 * gate in `check:contrast:pr-gate`; this spec owns the dark half only.
 */
function collectDarkHostOffenders(hosts: string[]): Probe[] {
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
      // Tightened (PASS 142.1): flag any host that isn't clearly bright
      // (bgLum < 0.5) and require AAA-grade contrast (≥ 7.0:1) to catch
      // subtle heading-color drift long before it becomes visible.
      const bgLum = lum(bg[0], bg[1], bg[2]);
      if (bgLum > 0.5) return;
      const ratio = contrast([fg[0], fg[1], fg[2]], bg);
      if (ratio < 7.0) {
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
}


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

      const offenders: Probe[] = await page.evaluate(
        collectDarkHostOffenders,
        DARK_HOSTS as unknown as string[],
      );

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

  // Cross-viewport sweep — PASS 142 responsive lock.
  // Runs the dark-host heading probe at desktop / tablet / mobile so any
  // responsive layout swap (mobile-only hero, stacked tablet CTA, sticky
  // mobile nav) can't silently flip headings ink-black at a breakpoint.
  const RESPONSIVE_ROUTES = [
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
    '/about',
    '/contact',
    '/ai-home-finder',
  ] as const;

  for (const route of RESPONSIVE_ROUTES) {
    for (const vp of VIEWPORTS) {
      test(`responsive: dark headings stay light @ ${route} (${vp.name})`, async ({ browser }) => {
        const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
        const page = await ctx.newPage();

        await page.addInitScript(() => {
          try {
            localStorage.setItem('smart_popup_dismissed_until', String(Date.now() + 7 * 864e5));
            localStorage.setItem('cookies_consent', JSON.stringify({ accepted: true, ts: Date.now() }));
            localStorage.setItem('cookiesConsent', 'accepted');
          } catch {}
        });

        const resp = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
        test.skip(!resp || resp.status() >= 400, `route not deployed: ${route}`);
        await page.waitForTimeout(900);

        // Scroll so lazy dark sections mount at this viewport width — a
        // section that only renders below-the-fold on mobile still has
        // to satisfy the contract.
        await page.evaluate(async () => {
          const max = document.documentElement.scrollHeight;
          for (let y = 0; y < max; y += Math.floor(window.innerHeight * 0.8)) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 60));
          }
          window.scrollTo(0, 0);
        });
        await page.waitForTimeout(300);

        // Sweep ALL headings inside every dark host (not just the first),
        // so a responsive reorder of h2/h3 blocks still gets audited.
        const offenders: Probe[] = await page.evaluate(
          collectDarkHostOffenders,
          DARK_HOSTS as unknown as string[],
        );

        // Per-viewport artifact for CI debugging.
        const slug = route.replace(/\W+/g, '_') || 'root';
        await page.screenshot({ path: `e2e-artifacts/dark-contrast-${slug}-${vp.name}.png` });

        expect(
          offenders,
          `Dark-host headings rendered too dark at ${route} (${vp.name} ${vp.width}x${vp.height}):\n` +
            offenders
              .map((o) => `  ${o.tag} "${o.text}" — ${o.color} on ${o.bg} = ${o.contrast}:1`)
              .join('\n'),
        ).toEqual([]);

        await ctx.close();
      });
    }
  }
  // ------------------------------------------------------------------
  // Self-test for the probe itself.
  //
  // Every assertion above passes when `collectDarkHostOffenders` returns an
  // empty array, so a probe that silently stopped detecting anything would read
  // as a fully green suite. This plants known-bad markup on a synthetic page and
  // requires the probe to find it, and equally requires it to leave correct
  // pairings alone — the failure mode that put 32 false failures in CI.
  // ------------------------------------------------------------------
  test('probe self-test: detects planted contrast regressions', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.setContent(`
      <body style="margin:0">
        <section data-hero-dark style="background:#042c1c;padding:40px;width:600px">
          <h2 style="color:#1A1A1A;font-size:32px">ink heading on emerald</h2>
        </section>
        <section data-surface="dark" style="background:#0a0a0a;padding:40px;width:600px">
          <h2 style="color:#555555;font-size:32px">mid-grey heading on ink</h2>
        </section>
        <section data-hero-dark style="background:#042c1c;padding:40px;width:600px">
          <h2 style="color:#FFFFFF;font-size:32px">correct: white on emerald</h2>
        </section>
        <section data-surface="emerald" style="background:#F7F1E4;padding:40px;width:600px">
          <h2 style="color:#1A1A1A;font-size:32px">correct: ink on champagne</h2>
        </section>
      </body>`);

    const offenders: Probe[] = await page.evaluate(
      collectDarkHostOffenders,
      DARK_HOSTS as unknown as string[],
    );
    const flagged = offenders.map((o) => o.text).sort();

    // Detects a genuinely dark host carrying too-dark text...
    expect(flagged, 'the probe must flag ink-on-emerald').toContain('ink heading on emerald');
    expect(flagged, 'the probe must flag sub-AAA grey on ink').toContain(
      'mid-grey heading on ink',
    );
    // ...and leaves correct pairings alone. The champagne case is the one that
    // produced 32 false failures: the host declares `emerald` but renders light,
    // so ink text there is right and must not be reported.
    expect(flagged, 'white on emerald is correct').not.toContain('correct: white on emerald');
    expect(flagged, 'ink on champagne is correct').not.toContain('correct: ink on champagne');

    await ctx.close();
  });
});
