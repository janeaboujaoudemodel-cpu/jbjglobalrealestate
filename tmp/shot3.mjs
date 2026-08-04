import { chromium } from '@playwright/test';
const b = await chromium.launch({ headless: true, executablePath: '/bin/chromium', args:['--no-sandbox'] });
for (const [w,h,tag] of [[1348,959,'desk'],[390,844,'mob']]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto('http://localhost:8080/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForTimeout(7000);
  const col = p.getByRole('button', { name: /collapse/i }).first();
  if (await col.count()) await col.click({ force: true }).catch(()=>{});
  await p.waitForTimeout(1500);
  await p.keyboard.press('Escape');
  await p.waitForTimeout(1000);
  await p.screenshot({ path: `/mnt/documents/filter3-${tag}.png` });
  await p.close();
}
await b.close();
