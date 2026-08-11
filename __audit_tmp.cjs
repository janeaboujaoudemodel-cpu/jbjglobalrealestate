const { chromium, devices } = require('playwright');
const fs = require('fs');

const OUT = '/tmp/browser/image-audit';
fs.mkdirSync(OUT, { recursive: true });

const pages = [
  { name: 'home', url: 'https://www.jbj.ae/' },
  { name: 'properties', url: 'https://www.jbj.ae/properties' },
  { name: 'developers', url: 'https://www.jbj.ae/developers' },
];

async function run() {
  const browser = await chromium.launch({ executablePath: '/bin/chromium', args: ['--no-sandbox'] });
  const iphone = devices['iPhone 13'];
  const allResults = {};

  for (const p of pages) {
    const context = await browser.newContext({
      ...iphone,
      offline: false,
    });
    const page = await context.newPage();

    // Emulate CPU throttling and slow 4G-ish network via CDP
    const client = await context.newCDPSession(page);
    await client.send('Network.enable');
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: (1.6 * 1024 * 1024) / 8, // ~1.6Mbps
      uploadThroughput: (750 * 1024) / 8,
      latency: 150,
    });
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });

    const requests = [];
    const reqMap = new Map();

    page.on('request', (req) => {
      reqMap.set(req, { url: req.url(), resourceType: req.resourceType(), startTime: Date.now(), headers: req.headers() });
    });

    page.on('response', async (res) => {
      try {
        const req = res.request();
        const meta = reqMap.get(req) || { url: req.url(), resourceType: req.resourceType(), startTime: Date.now() };
        const timing = req.timing();
        let size = null;
        let cache = res.headers()['cache-control'] || null;
        let cfCache = res.headers()['cf-cache-status'] || res.headers()['x-cache'] || null;
        try {
          const buf = await res.body();
          size = buf.length;
        } catch (e) {}
        requests.push({
          url: meta.url,
          resourceType: meta.resourceType,
          status: res.status(),
          contentType: res.headers()['content-type'],
          sizeBytes: size,
          cacheControl: cache,
          cdnCacheStatus: cfCache,
          server: res.headers()['server'],
          timing,
          fromServiceWorker: res.fromServiceWorker && res.fromServiceWorker(),
        });
      } catch (e) {}
    });

    const navStart = Date.now();
    await page.goto(p.url, { waitUntil: 'networkidle', timeout: 90000 }).catch(e => console.log('goto err', p.name, e.message));
    const navEnd = Date.now();

    // scroll to trigger lazy loaded images
    await page.mouse.wheel(0, 3000).catch(()=>{});
    await page.waitForTimeout(3000);
    await page.mouse.wheel(0, 3000).catch(()=>{});
    await page.waitForTimeout(3000);

    // Grab DOM image attributes for cards
    const imgAttrs = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.slice(0, 60).map(img => ({
        src: img.currentSrc || img.src,
        dataSrc: img.getAttribute('data-src'),
        srcset: img.getAttribute('srcset'),
        loading: img.getAttribute('loading'),
        fetchpriority: img.getAttribute('fetchpriority'),
        decoding: img.getAttribute('decoding'),
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        renderedWidth: img.clientWidth,
        renderedHeight: img.clientHeight,
        alt: img.alt,
        classList: img.className,
        complete: img.complete,
      }));
    });

    await page.screenshot({ path: `${OUT}/${p.name}.png`, fullPage: false }).catch(()=>{});

    allResults[p.name] = {
      url: p.url,
      navTimeMs: navEnd - navStart,
      requestCount: requests.length,
      requests,
      imgAttrs,
    };

    fs.writeFileSync(`${OUT}/${p.name}.json`, JSON.stringify(allResults[p.name], null, 2));
    await context.close();
  }

  await browser.close();
  fs.writeFileSync(`${OUT}/summary.json`, JSON.stringify(Object.keys(allResults), null, 2));
  console.log('DONE');
}

run().catch(e => { console.error(e); process.exit(1); });
