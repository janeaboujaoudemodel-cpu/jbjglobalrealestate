import { test, expect } from '@playwright/test';

/**
 * Media Ingestion Audit (Aug 17 2026) — finding 3.1.
 *
 * The audit reported every `/owner/*` route and `/admin/media-ingestion`
 * rendering a blank page in production for the owner's own account: the bundle
 * loaded, the user resolved as owner, and then the content container collapsed
 * to zero height with no console error and no failed request.
 *
 * That did not reproduce against this source across three routes and three
 * owner-verification states (cached, cold+slow, cold+failing). This spec exists
 * so the question stops being re-litigated by hand: it drives the real shell in
 * a real browser and asserts the content actually occupies space.
 *
 * Note on what "blank" means here. `#root`'s first two children are legitimately
 * zero-height mounts (portal anchors), so measuring `#root > *` alone reports
 * `height: 0` on a perfectly healthy page — worth knowing before concluding the
 * shell has collapsed. These assertions look at the tallest child instead.
 *
 * The session is stubbed rather than real: OWNER_BACKEND_EMAILS is a hard-coded
 * allow-list, so a token carrying one of those emails plus a stubbed
 * `verify-owner` reproduces the owner path without a live credential.
 *
 * RUN THIS AGAINST A PRODUCTION BUILD (`npm run build && npm run preview`),
 * NOT `vite dev`.
 *
 * This is not a style preference — it is the whole reason this spec initially
 * gave the wrong answer. Finding 3.1 turned out to be a circular chunk
 * dependency between `charts-vendor` and `react-vendor` (JBJ-031): a vendor
 * chunk was modulepreloaded ahead of React, evaluated before React had
 * initialised, and threw at module scope, leaving #root empty. `vite dev`
 * serves unbundled ES modules — no manualChunks, no vendor chunks, no cycle —
 * so the defect cannot exist in dev and this spec passed against a server that
 * was structurally incapable of reproducing it. A pass here means nothing
 * unless the target is bundled output. See ROADMAP JBJ-033.
 */

const BASE_URL = process.env.PREVIEW_URL || process.env.BASE_URL || 'http://127.0.0.1:8080';
const PROJECT_REF = 'mdafrewypkkrildjgtey';
const OWNER_EMAIL = 'janeaboujaoudenails@gmail.com';
const OWNER_UID = '00000000-0000-4000-8000-000000000001';

const OWNER_ROUTES = ['/owner/media-ingest', '/owner/crm/jbj/home', '/admin/media-ingestion'];

function stubSession() {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const access_token = [
    b64({ alg: 'HS256', typ: 'JWT' }),
    b64({ sub: OWNER_UID, email: OWNER_EMAIL, role: 'authenticated', exp, aud: 'authenticated' }),
    'stub',
  ].join('.');
  return {
    access_token,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: exp,
    refresh_token: 'stub',
    user: {
      id: OWNER_UID,
      aud: 'authenticated',
      role: 'authenticated',
      email: OWNER_EMAIL,
      app_metadata: {},
      user_metadata: {},
      created_at: new Date(0).toISOString(),
    },
  };
}

/** Height of the tallest direct child of #root — the actual page content. */
async function contentHeight(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const root = document.getElementById('root');
    if (!root) return -1;
    const heights = Array.from(root.children).map((el) => el.getBoundingClientRect().height);
    return heights.length ? Math.round(Math.max(...heights)) : 0;
  });
}

async function openAsOwner(
  browser: import('@playwright/test').Browser,
  route: string,
  verify: 'ok' | 'slow' | 'error' = 'ok',
) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  await ctx.addInitScript(
    ([ref, session]) => {
      localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session));
      localStorage.setItem('cookiesConsent', 'accepted');
      localStorage.setItem('smart_popup_dismissed_until', String(Date.now() + 7 * 864e5));
    },
    [PROJECT_REF, stubSession()] as const,
  );

  await page.route('**/functions/v1/verify-owner', async (route_) => {
    if (verify === 'slow') await new Promise((r) => setTimeout(r, 6000));
    if (verify === 'error') {
      return route_.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"stub"}' });
    }
    return route_.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ isOwner: true, email: OWNER_EMAIL }),
    });
  });

  // Everything else Supabase answers empty, so no request hangs the page.
  await page.route('**/*.supabase.co/**', (route_) =>
    route_.request().url().includes('verify-owner')
      ? route_.fallback()
      : route_.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );

  await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  return { ctx, page };
}

test.describe('Owner portal renders (audit finding 3.1)', () => {
  for (const route of OWNER_ROUTES) {
    test(`content occupies real height @ ${route}`, async ({ browser }) => {
      const { ctx, page } = await openAsOwner(browser, route);

      const height = await contentHeight(page);
      const text = ((await page.locator('body').innerText()) || '').trim();

      expect(height, `${route} rendered a collapsed container (tallest #root child was ${height}px)`).toBeGreaterThan(200);
      expect(text.length, `${route} rendered no visible text`).toBeGreaterThan(20);

      await ctx.close();
    });
  }

  // The audit's description — bundle loads, owner resolves, container collapses —
  // is what a stuck verification state would look like, so cover those too.
  for (const verify of ['slow', 'error'] as const) {
    test(`content still renders when verify-owner is ${verify}`, async ({ browser }) => {
      const { ctx, page } = await openAsOwner(browser, '/owner/media-ingest', verify);
      const height = await contentHeight(page);
      expect(
        height,
        `owner shell collapsed to ${height}px while verify-owner was ${verify}`,
      ).toBeGreaterThan(200);
      await ctx.close();
    });
  }
});
