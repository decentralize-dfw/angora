// MOBİL İŞ EMRİ İŞ 3 ölçümü - açılışta ana iş parçacığı kilidi.
// Mobil taklit + 6x CPU kısma + PerformanceObserver('longtask').
// İki sayı raporlar:
//   1. hoşgeldin kartı göründükten sonraki İLK 10 SANİYEDEKİ uzun görevler
//      (hedef: >200 ms blok kalmasın)
//   2. dokunma gecikmesi: kartın × düğmesine tıklama -> kartın kapanması
//      (hedef: ilk saniyede tepki)
// SwiftShader + kısma: SÜRELER cihaz sayısı değildir; önce/sonra kıyası
// aynı ortamda geçerlidir (emrin referansı: 15 uzun görev / 79,7 s blok).
//
//   node scripts/boot-longtasks.mjs [--features "..."] [--label ad] [--out dosya]
import {chromium} from 'playwright';
import {writeFile, mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {servePages} from './serve-pages.mjs';

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const args = process.argv.slice(2);
const option = (name, fallback = null) => {
  const at = args.indexOf('--' + name);
  return at >= 0 ? args[at + 1] : fallback;
};
const extraFeatures = option('features', '');
const label = option('label', 'boot');
const out = option('out', 'build/qa/boot-longtasks-' + label + '.json');

const server = await servePages(repoRoot);
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_BROWSERS_PATH ? '/opt/pw-browsers/chromium' : undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const context = await browser.newContext({
  viewport: {width: 390, height: 844}, deviceScaleFactor: 3,
  isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
});
const page = await context.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
page.on('pageerror', e => errors.push(String(e).slice(0, 200)));
await page.addInitScript(() => {
  window.__long = [];
  new PerformanceObserver(l => { for (const e of l.getEntries())
    window.__long.push({s: Math.round(e.startTime), d: Math.round(e.duration)}); })
    .observe({entryTypes: ['longtask']});
});
const cdp = await context.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', {rate: 6});

const features = 'cinemaStill:0' + (extraFeatures ? ',' + extraFeatures : '');
await page.goto(`http://127.0.0.1:${server.port}/?profile=mobile&quality=mobile-high&features=${features}`,
  {waitUntil: 'domcontentloaded'});
// Kart görünene kadar bekle (model hazır -> welcome hidden kalkar).
await page.waitForSelector('#welcome:not([hidden])', {timeout: 1_500_000});
const cardShownAt = await page.evaluate(() => performance.now());
// İlk saniye tepkisi: kart göründükten hemen sonra x'e dokun ve kapanmayı ölç.
const tapStart = Date.now();
await page.tap('#welcome-close', {timeout: 30_000});
await page.waitForFunction(() => {
  const w = document.querySelector('#welcome');
  return !w || w.hidden || !w.offsetParent;
}, null, {timeout: 120_000});
const tapToCloseMs = Date.now() - tapStart;
// Kart sonrası ilk 10 saniyenin uzun görevleri (kısılmış zamanda).
await page.waitForTimeout(10_000);
const long = await page.evaluate(() => window.__long);
const after = long.filter(e => e.s >= 0);
const postCard = long.filter(e => e.s >= cardShownAt - 50);
const over200 = postCard.filter(e => e.d > 200);
const result = {
  label, features, softwareRaster: true, cpuThrottle: 6,
  note: 'sureler cihaz sayisi DEGIL; ayni ortamda once/sonra kiyasi icindir',
  consoleErrors: errors,
  cardShownAtMs: Math.round(cardShownAt),
  tapToCloseMs,
  longTasksTotal: {count: after.length, blockedMs: after.reduce((a, e) => a + e.d, 0)},
  longTasksAfterCard10s: {
    count: postCard.length,
    blockedMs: postCard.reduce((a, e) => a + e.d, 0),
    over200ms: over200.length,
    worst: postCard.slice().sort((a, b) => b.d - a.d).slice(0, 8),
  },
};
console.log(JSON.stringify(result, null, 1));
await mkdir(path.dirname(path.join(repoRoot, out)), {recursive: true});
await writeFile(path.join(repoRoot, out), JSON.stringify(result, null, 1));
await browser.close();
await server.close();
console.log('Wrote', out);
