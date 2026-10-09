// Captures timed frames of animated design screens into PNGs (one folder per animation).
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
// Usage (from design/motion/tools):  node capture.js [only-id]
// Needs: npm i playwright && npx playwright install chromium ; internet for Google Fonts.
const SCREENS = path.resolve(__dirname, '../../screens');
const OUT = path.resolve(__dirname, '../frames');
const PORT = 8799;
const BASE = `http://localhost:${PORT}/`;

const JOBS = [
  { id: '01-welcome', file: 'OB1Welcome.dc.html', w: 390, h: 844, times: [0, 400, 800, 1300, 1700, 2300, 2800, 3300, 3900, 4600] },
  { id: '02-printing', file: 'OB8Printing.dc.html', w: 390, h: 844, times: [100, 500, 1700, 2600, 3300, 4900, 6500, 7300] },
  { id: '03-signin-stamp', file: 'OB9SignIn.dc.html', w: 390, h: 844, times: [0, 650, 800, 900, 1000, 1100, 1250, 1600] },
  { id: '04-tour-swipe-hint', file: 'TourStep5.dc.html', w: 390, h: 844, times: [0, 300, 650, 1100, 1450, 1650, 1950, 2300] },
  { id: '05-tour-done-stamp', file: 'TourStep9.dc.html', w: 390, h: 844, times: [0, 250, 400, 500, 600, 800] },
  { id: '06-tour-step-change', file: 'Tour.dc.html', w: 390, h: 844, click: 'Next', times: [0, 80, 160, 250, 400] },
  { id: '07-feed-caught-up', file: 'FeedCaughtUp.dc.html', w: 390, h: 844, times: [0, 250, 450, 650, 900, 1300, 1800] },
  { id: '08-signout-sheet', file: 'SignOut.dc.html', w: 390, h: 844, times: [0, 80, 160, 240, 350] },
  { id: '09-skeleton-pulse', file: 'Skeleton.dc.html', w: 390, h: 844, times: [0, 450, 900] },
  { id: '10-landing-hero', file: 'Landing.dc.html', w: 1440, h: 900, times: [0, 300, 700, 1100, 1500, 2000, 2600, 3500, 5000, 9000] },
];

// Temporary wrappers so Tour steps 5 and 9 can be captured directly.
const fs0 = require('fs');
function wrappers(on) {
  for (const s of [5, 9]) {
    const f = path.join(SCREENS, `TourStep${s}.dc.html`);
    if (!on) { try { fs0.unlinkSync(f); } catch (e) {} continue; }
    let w = fs0.readFileSync(path.join(SCREENS, 'TourDark.dc.html'), 'utf8')
      .replace('dark="{{yes}}"', 'dark="{{no}}"').replace('return { yes: true', 'return { no: false')
      .replace('"default":"5"', `"default":"${s}"`).replace("?? '5'", `?? '${s}'`);
    fs0.writeFileSync(f, w);
  }
}

(async () => {
  const http = require('http');
  const server = http.createServer((req, res) => {
    const p = path.join(SCREENS, decodeURIComponent(req.url.split('?')[0]));
    fs0.readFile(p, (err, data) => {
      if (err) { res.writeHead(404); return res.end(); }
      const ext = path.extname(p);
      res.writeHead(200, { 'Content-Type': { '.html': 'text/html', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json' }[ext] || 'application/octet-stream' });
      res.end(data);
    });
  }).listen(PORT);
  wrappers(true);
  const browser = await chromium.launch();
  const only = process.argv[2];
  for (const job of JOBS) {
    if (only && job.id !== only) continue;
    const ctx = await browser.newContext({ viewport: { width: job.w, height: job.h } });
    const page = await ctx.newPage();
    // Hold every CSS animation at 0 until fonts are in, so t=0 is the real start.
    await page.goto(BASE + job.file);
    await page.waitForFunction(() => document.fonts.status === 'loaded' && document.body.innerText.length > 20, null, { timeout: 15000 });
    await page.waitForTimeout(150);
    if (job.click) {
      await page.waitForTimeout(800);
    } else {
      // restart all animations from zero now that layout + fonts are ready
      await page.evaluate(() => document.getAnimations().forEach(a => { try { a.cancel(); a.play(); } catch (e) {} }));
    }
    const dir = `${OUT}/${job.id}`; fs.mkdirSync(dir, { recursive: true });
    let t0 = Date.now();
    if (job.click) {
      await page.screenshot({ path: `${dir}/t0000.png` });
      await page.getByText(job.click, { exact: true }).first().click();
      t0 = Date.now();
    }
    const got = [];
    for (const t of job.times) {
      if (job.click && t === 0) { got.push(0); continue; }
      const wait = t - (Date.now() - t0); if (wait > 0) await page.waitForTimeout(wait);
      const real = Date.now() - t0;
      await page.screenshot({ path: `${dir}/t${String(t).padStart(4, '0')}.png` });
      got.push(real);
    }
    fs.writeFileSync(`${dir}/times.json`, JSON.stringify({ planned: job.times, actual: got }));
    console.log(job.id, got.join(','));
    await ctx.close();
  }
  await browser.close();
  wrappers(false);
  server.close();
  console.log('Frames in', OUT, '- now run: python3 strip.py');
})();
