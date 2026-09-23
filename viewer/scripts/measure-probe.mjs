// KAPANIŞ EMRİ İŞ 1/2 - flag-cost probe. NOT a capture: no screenshots,
// no gate; one page load per row, the numbers the order asks for
// (programs / draw calls / triangles / estimated VRAM / console errors /
// first-interactive bytes), printed as one JSON table for PROGRESS.md.
//
//   node scripts/measure-probe.mjs --out build/qa/flag-costs.json \
//     [--rows '[{"label":"...","quality":"desktop-high","camera":"C03","features":"..."}]']
//
// Default rows: the İŞ 1 ladder (baseline + six FAZ 7 flags, one at a
// time, cinemaStill OFF throughout) + İŞ 2.1 mobile-high + İŞ 2.4 mobile
// shadow. SwiftShader wall time is NOT recorded as a device number.
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
const out = option('out', 'build/qa/flag-costs.json');

const IS1 = [
  {label: 'faz7-baseline', quality: 'desktop-high', camera: 'C03', features: ''},
  {label: 'materialResponseV2', quality: 'desktop-high', camera: 'C03', features: 'materialResponseV2:1'},
  {label: 'proceduralDetailHigh', quality: 'desktop-high', camera: 'C03', features: 'proceduralDetailHigh:1'},
  {label: 'windowPortalLight', quality: 'desktop-high', camera: 'C10', features: 'windowPortalLight:1'},
  {label: 'windowPortalLight-base', quality: 'desktop-high', camera: 'C10', features: ''},
  {label: 'softShadowsV2', quality: 'desktop-high', camera: 'C03', features: 'softShadowsV2:1'},
  {label: 'gtaoFullRes', quality: 'desktop-high', camera: 'C03', features: 'gtaoFullRes:1'},
  {label: 'screenSpaceReflection', quality: 'desktop-high', camera: 'C03', features: 'screenSpaceReflection:1'},
];
const IS2 = [
  {label: 'mobile-high-today', quality: 'mobile-high', camera: 'C03', features: ''},
  {label: 'mobile-high-shadow', quality: 'mobile-high', camera: 'C03', features: 'mobileSunShadow:1', shadowProbe: true},
];
const rows = option('rows') ? JSON.parse(option('rows')) : [...IS1, ...IS2];

const server = await servePages(repoRoot);
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_BROWSERS_PATH ? '/opt/pw-browsers/chromium' : undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const results = [];
for (const row of rows) {
  const mobile = row.quality.startsWith('mobile');
  const page = await browser.newPage({viewport: mobile
    ? {width: 393, height: 852} : {width: 1600, height: 900}});
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  page.on('pageerror', e => errors.push(String(e).slice(0, 200)));
  const features = 'cinemaStill:0' + (row.features ? ',' + row.features : '');
  // KAPANIŞ İŞ 2.4: neighborhood'da desktopOnlyShadow mobil gölgeyi kapatır -
  // gölge ölçümü kat/villa görünümünde yapılır (row.view).
  const url = `http://127.0.0.1:${server.port}/?view=${row.view ?? 'neighborhood'}&hour=13.5&season=172&light=sun` +
    `&profile=${mobile ? 'mobile' : 'desktop'}&camera=${row.camera}&stats=1&quality=${row.quality}` +
    `&features=${features}`;
  const started = Date.now();
  try {
    await page.goto(url, {waitUntil: 'domcontentloaded'});
    await page.waitForFunction(
      () => JSON.parse(document.querySelector('#viewport')?.dataset.qaReport ?? 'null')?.camera,
      null, {timeout: 1_500_000});
    await page.waitForTimeout(800);
    const stats = await page.evaluate(() => window.__angoraQA.stats());
    const report = JSON.parse(await page.evaluate(() =>
      document.querySelector('#viewport').dataset.qaReport));
    const entry = {label: row.label, quality: row.quality, camera: row.camera,
      features, consoleErrors: errors,
      programs: stats.programs, drawCalls: stats.calls, triangles: stats.triangles,
      textureMiB: report.memory?.estimatedTextureMiB ?? null,
      geometryMiB: report.memory?.estimatedGeometryMiB ?? null,
      firstInteractiveBytes: report.network?.firstInteractiveBytes ?? null,
      loadSecondsSwiftshaderOnly: Math.round((Date.now() - started) / 1000)};
    if (row.shadowProbe) entry.shadowUpdate = await page.evaluate(() => window.__angoraQA.debugShadow?.());
    results.push(entry);
    console.log(JSON.stringify(entry));
  } catch (error) {
    results.push({label: row.label, error: String(error?.message ?? error).slice(0, 200), consoleErrors: errors});
    console.log(row.label, 'FAILED', error.message);
  }
  await page.close();
}
await browser.close();
await server.close();
await mkdir(path.dirname(path.join(repoRoot, out)), {recursive: true});
await writeFile(path.join(repoRoot, out), JSON.stringify({capturedAt: new Date().toISOString(),
  softwareRaster: true, note: 'wall time is NOT a device number', rows: results}, null, 1));
console.log('Wrote', out);
