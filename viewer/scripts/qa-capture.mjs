// FAZ 0 · Task 0.4 — deterministic capture: 12 QA cameras x 2 delivery
// profiles, screenshot + qaReport JSON each, into build/qa/<tag>/.
//
//   node scripts/qa-capture.mjs --tag baseline-<commit> [--base http://...]
//     [--profiles desktop,mobile] [--cameras C01,C03] [--measure 5]
//
// Without --base it builds nothing and serves the REPOSITORY ROOT (the
// committed pages build) through serve-pages.mjs - run `npm run build:pages`
// first when the source has changed.
//
// ⚠ SwiftShader is a software rasteriser. Screenshots, draw calls, triangle
// counts, byte counts and shader compilation are valid evidence; FPS and
// frame times are NOT device numbers. Every saved report is stamped
// softwareRaster:true and emulated:true and must never fill the ratchet.
import {chromium} from 'playwright';
import {mkdir, writeFile} from 'node:fs/promises';
import {execSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {CAMERAS, VIEWPORTS, search} from '../src/qa-cameras.js';
import {servePages} from './serve-pages.mjs';

const args = process.argv.slice(2);
const option = (name, fallback = null) => {
  const at = args.indexOf('--' + name);
  return at >= 0 ? args[at + 1] : fallback;
};
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const commit = execSync('git rev-parse --short HEAD', {cwd: repoRoot}).toString().trim();
const tag = option('tag', 'capture-' + commit);
const profiles = option('profiles', 'desktop,mobile').split(',');
const only = option('cameras') ? new Set(option('cameras').split(',')) : null;
const measureSeconds = Number(option('measure', '0'));
const outDir = path.join(repoRoot, 'build/qa', tag);

let base = option('base');
let staticServer = null;
if (!base) {
  staticServer = await servePages(repoRoot);
  base = `http://127.0.0.1:${staticServer.port}/`;
  console.log('Serving pages root at', base);
}

// One browser PER capture. SwiftShader in a shared browser process rasterises
// thin edges (railings, section hatches) with run-order-dependent sub-pixel
// results - measured at up to ~35 px per frame - while fresh single-page
// processes are pixel-identical across runs. Isolation buys determinism for
// a second or two per camera.
const launchBrowser = () => chromium.launch({
  executablePath: process.env.PLAYWRIGHT_BROWSERS_PATH ? '/opt/pw-browsers/chromium' : undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

const summary = {tag, commit, base, capturedAt: new Date().toISOString(),
  softwareRaster: true, emulated: true, runs: []};

for (const profile of profiles) {
  await mkdir(path.join(outDir, profile), {recursive: true});
  for (const camera of CAMERAS) {
    if (only && !only.has(camera.id)) continue;
    const browser = await launchBrowser();
    const page = await browser.newPage({viewport: VIEWPORTS[profile]});
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push(String(e)));
    const url = base + search(camera, profile);
    const started = Date.now();
    try {
      await page.goto(url, {waitUntil: 'domcontentloaded'});
      await page.waitForFunction(
        () => JSON.parse(document.querySelector('#viewport')?.dataset.qaReport ?? 'null')?.camera,
        null, {timeout: 300_000});
      if (measureSeconds > 0) {
        await page.evaluate(seconds => window.__angoraQA.measure(seconds), measureSeconds);
        // measure() re-snapshots; give the settled frame a beat before the shot
        await page.evaluate(() => window.__angoraQA.snapshot());
        await page.waitForTimeout(400);
      }
      // Let DOM label/CSS transitions finish and the settled frame land, then
      // re-render once more so the screenshot is the steady state, not a fade.
      await page.waitForTimeout(900);
      await page.evaluate(() => window.__angoraQA.snapshot());
      await page.waitForTimeout(200);
      const report = JSON.parse(await page.evaluate(() => document.querySelector('#viewport').dataset.qaReport));
      report.commit = commit;
      report.softwareRaster = true;   // frame numbers are NOT device numbers
      report.emulated = true;
      report.viewport = VIEWPORTS[profile];
      report.captureMs = Date.now() - started;
      report.consoleErrors = errors;
      await page.screenshot({path: path.join(outDir, profile, camera.id + '.png'), timeout: 90_000});
      await writeFile(path.join(outDir, profile, camera.id + '.json'), JSON.stringify(report, null, 2));
      summary.runs.push({profile, camera: camera.id, ok: true,
        drawCalls: report.renderer.drawCalls, triangles: report.renderer.triangles,
        textureMiB: report.memory.estimatedTextureMiB, geometryMiB: report.memory.estimatedGeometryMiB,
        fps: report.frame?.fps ?? null, errors: errors.length});
      console.log(`${profile}/${camera.id}  calls=${report.renderer.drawCalls} tris=${report.renderer.triangles} tex=${report.memory.estimatedTextureMiB}MiB${errors.length ? '  ⚠ ' + errors.length + ' console errors' : ''}`);
    } catch (error) {
      summary.runs.push({profile, camera: camera.id, ok: false, error: String(error?.message ?? error), errors});
      console.log(`${profile}/${camera.id}  FAILED: ${error.message}`);
      await page.screenshot({path: path.join(outDir, profile, camera.id + '-failed.png')}).catch(() => {});
    }
    await page.close();
    await browser.close();
  }
}

await writeFile(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
console.log('Wrote', path.join(outDir, 'summary.json'));
await staticServer?.close();
const failed = summary.runs.filter(r => !r.ok).length;
if (failed) { console.error(failed + ' captures failed'); process.exit(1); }
