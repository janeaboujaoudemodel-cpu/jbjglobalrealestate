import { chromium } from 'playwright';

const BASE = 'http://localhost:8080';
const browser = await chromium.launch({ executablePath: '/bin/chromium', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

await page.goto(`${BASE}/developers`, { waitUntil: 'networkidle', timeout: 60000 });

// Try to dismiss any welcome/gate overlay
try {
  const gate = page.locator('[data-welcome-gate], [role="dialog"]').first();
  if (await gate.isVisible({ timeout: 2000 }).catch(() => false)) {
    const btn = page.locator('button:has-text("Enter"), button:has-text("Continue"), button:has-text("Explore")').first();
    if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) await btn.click();
  }
} catch {}

await page.waitForTimeout(1500);

async function waitImagesSettled() {
  await page.evaluate(async () => {
    const imgs = Array.from(document.querySelectorAll('img'));
    await Promise.all(imgs.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(res => { img.addEventListener('load', res); img.addEventListener('error', res); setTimeout(res, 8000); });
    }));
  });
  await page.waitForTimeout(400);
}

// Determine total pages from pagination controls
const pageButtons = await page.locator('section:has-text("Developer") button').allTextContents().catch(() => []);
let totalPages = 1;
const numeric = (await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button'));
  return btns.map(b => b.textContent.trim()).filter(t => /^\d+$/.test(t)).map(Number);
}));
if (numeric.length) totalPages = Math.max(...numeric);

console.log('Detected total pages from pagination:', totalPages);

const results = [];
for (let p = 1; p <= totalPages; p++) {
  if (p > 1) {
    await page.evaluate((pg) => {
      const btns = Array.from(document.querySelectorAll('button'));
      const target = btns.find(b => b.textContent.trim() === String(pg));
      if (target) target.click();
    }, p);
    await page.waitForTimeout(1200);
  }
  await waitImagesSettled();

  const cards = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('[data-developer-card="true"]'));
    return nodes.map(card => {
      const name = card.getAttribute('data-developer-name') || 'UNKNOWN';
      const heroImg = card.querySelector('.aspect-\\[5\\/3\\] img, img[alt$="featured project"]');
      const hasHero = !!heroImg;
      const heroLoaded = heroImg ? (heroImg.complete && heroImg.naturalWidth > 4) : false;
      const heroSrc = heroImg ? heroImg.src : null;
      const heroW = heroImg ? heroImg.naturalWidth : 0;
      const heroH = heroImg ? heroImg.naturalHeight : 0;

      const logoWrap = card.querySelector('[data-developer-logo]');
      const logoState = logoWrap ? logoWrap.getAttribute('data-developer-logo') : 'missing-wrap';
      const logoImg = logoWrap ? logoWrap.querySelector('img') : null;
      const logoLoaded = logoImg ? (logoImg.complete && logoImg.naturalWidth > 4) : false;
      const logoW = logoImg ? logoImg.naturalWidth : 0;
      const logoH = logoImg ? logoImg.naturalHeight : 0;

      // sample logo pixel colors to detect opaque-white block
      let whiteBlock = false;
      if (logoImg && logoLoaded) {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = logoImg.naturalWidth;
          canvas.height = logoImg.naturalHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(logoImg, 0, 0);
          const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          let opaqueWhite = 0, totalOpaque = 0;
          for (let i = 0; i < d.length; i += 4 * 37) {
            const a = d[i+3];
            if (a > 200) {
              totalOpaque++;
              if (d[i] > 245 && d[i+1] > 245 && d[i+2] > 245) opaqueWhite++;
            }
          }
          if (totalOpaque > 10 && opaqueWhite / totalOpaque > 0.95) whiteBlock = true;
        } catch (e) { /* CORS-tainted canvas, cannot sample */ }
      }

      return {
        name, hasHero, heroLoaded, heroSrc, heroW, heroH,
        logoState, logoLoaded, logoW, logoH, whiteBlock,
      };
    });
  });

  await page.screenshot({ path: `/tmp/dev-audit-page-${p}.png`, fullPage: true });
  results.push({ page: p, cardCount: cards.length, cards });
  console.log(`Page ${p}: ${cards.length} cards captured`);
}

await browser.close();

const fs = await import('fs');
fs.writeFileSync('/tmp/dev-audit-results.json', JSON.stringify(results, null, 2));
console.log('DONE');
