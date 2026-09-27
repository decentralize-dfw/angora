// MOBİL İŞ EMRİ İŞ 1+2 kabul ölçümü. Mobil taklitte (iPhone boyutu,
// profile=mobile) A/B: villaModelV3Mobile:0 (eski batched teslimat) vs :1
// (26092026/mobile 256 px KTX2 seti). Satır başına:
//   estimatedTextureMiB / estimatedGeometryMiB (qaReport)
//   usedJSHeapSize (CDP HeapProfiler.collectGarbage SONRASI - zorlanmış GC A/B)
//   konsol hataları + ekran görüntüsü (compositor üzerinden; canvas okuma
//   preserveDrawingBuffer kapalı olduğu için HEP siyah döner, kullanma)
// SwiftShader: bayt/bellek sayıları geçerli, süre/FPS GEÇERSİZ.
//
//   node scripts/mobile-ab.mjs [--out build/qa/mobil-ab]
import {chromium} from 'playwright';
import {writeFile, mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {servePages} from './serve-pages.mjs';

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const args = process.argv.slice(2);
const outDir = args.includes('--out') ? args[args.indexOf('--out') + 1] : 'build/qa/mobil-ab';

const ROWS = [
  {label: 'eski-teslimat', features: 'villaModelV3Mobile:0', camera: 'C03', view: 'neighborhood'},
  {label: 'ktx2-teslimat', features: 'villaModelV3Mobile:1', camera: 'C03', view: 'neighborhood'},
  {label: 'eski-interior', features: 'villaModelV3Mobile:0', camera: 'C10', view: 'f1'},
  {label: 'ktx2-interior', features: 'villaModelV3Mobile:1', camera: 'C10', view: 'f1'},
];

const server = await servePages(repoRoot);
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_BROWSERS_PATH ? '/opt/pw-browsers/chromium' : undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
await mkdir(path.join(repoRoot, outDir), {recursive: true});
const results = [];
for (const row of ROWS) {
  const context = await browser.newContext({
    viewport: {width: 390, height: 844}, deviceScaleFactor: 3,
    isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  page.on('pageerror', e => errors.push(String(e).slice(0, 200)));
  const url = `http://127.0.0.1:${server.port}/?view=${row.view}&hour=13.5&season=172&light=sun` +
    `&profile=mobile&camera=${row.camera}&stats=1&quality=mobile-high&features=cinemaStill:0,${row.features}`;
  try {
    await page.goto(url, {waitUntil: 'domcontentloaded'});
    await page.waitForFunction(
      () => JSON.parse(document.querySelector('#viewport')?.dataset.qaReport ?? 'null')?.camera,
      null, {timeout: 1_500_000});
    await page.waitForTimeout(1200);
    const report = JSON.parse(await page.evaluate(() =>
      document.querySelector('#viewport').dataset.qaReport));
    const cdp = await context.newCDPSession(page);
    await cdp.send('HeapProfiler.enable');
    await cdp.send('HeapProfiler.collectGarbage');
    await page.waitForTimeout(400);
    await cdp.send('HeapProfiler.collectGarbage');
    const heap = await page.evaluate(() => performance.memory?.usedJSHeapSize ?? null);
    const shot = path.join(repoRoot, outDir, row.label + '.png');
    await page.screenshot({path: shot});
    const entry = {label: row.label, camera: row.camera, features: row.features,
      textureMiB: report.memory?.estimatedTextureMiB ?? null,
      geometryMiB: report.memory?.estimatedGeometryMiB ?? null,
      firstInteractiveBytes: report.network?.firstInteractiveBytes ?? null,
      jsHeapAfterGcMiB: heap == null ? null : +(heap / 1048576).toFixed(1),
      consoleErrors: errors, screenshot: path.relative(repoRoot, shot)};
    results.push(entry);
    console.log(JSON.stringify(entry));
  } catch (error) {
    results.push({label: row.label, error: String(error?.message ?? error).slice(0, 200), consoleErrors: errors});
    console.log(row.label, 'FAILED', error.message);
  }
  await context.close();
}
await browser.close();
await server.close();
await writeFile(path.join(repoRoot, outDir, 'mobil-ab.json'), JSON.stringify({
  capturedAt: new Date().toISOString(), softwareRaster: true,
  note: 'SwiftShader - bayt/bellek gecerli, sure/FPS gecersiz', rows: results}, null, 1));
console.log('Wrote', outDir + '/mobil-ab.json');
