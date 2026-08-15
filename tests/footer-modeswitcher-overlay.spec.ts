import { test, expect } from '@playwright/test';

/**
 * MinimalFooter — the deliberately minimal public footer (per founder
 * directive, see src/components/home/MinimalFooter.tsx) — must never
 * contain a mode switcher. Mode switching lives in the header
 * (HorizontalUtilityBar / MegaMenuAccount), not the footer.
 *
 * This replaces the old "footer ModeSwitcher never overlays header"
 * spec, which tested Footer.tsx's <ModeSwitcher>. MainLayout.tsx stopped
 * rendering Footer.tsx in favor of MinimalFooter, so that spec was
 * failing on every run because the trigger it looked for no longer
 * exists in the live footer — not because of a real overlay bug.
 *
 * This guard exists so reintroducing Footer.tsx's ModeSwitcher into
 * MainLayout.tsx — an unreviewed nav change — fails CI instead of
 * shipping silently. If that reintroduction is ever intentional, update
 * this test (and restore overlay-positioning coverage) in the same
 * commit.
 */

const BASE_URL =
  process.env.PREVIEW_URL ||
  process.env.BASE_URL ||
  'https://jbjglobalrealestate.lovable.app';

test('the public footer is the minimal footer, with no mode switcher', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  try {
    await page.waitForLoadState('networkidle', { timeout: 12_000 });
  } catch {}

  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' as ScrollBehavior }),
  );

  const footer = page.locator('footer[data-jj-minimal-footer]');
  await expect(
    footer,
    'the live public footer must be MinimalFooter',
  ).toBeVisible({ timeout: 10_000 });

  const modeTrigger = footer.locator('button[aria-haspopup="menu"]:has-text("Mode")');
  await expect(
    modeTrigger,
    "MinimalFooter must never contain a mode switcher trigger — mode switching lives in the header (HorizontalUtilityBar / MegaMenuAccount), not the footer. If Footer.tsx's ModeSwitcher was intentionally reintroduced into MainLayout.tsx, update this test to match.",
  ).toHaveCount(0);
});
