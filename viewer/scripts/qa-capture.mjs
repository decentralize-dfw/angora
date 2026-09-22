// FAZ 0 · Task 0.4 — deterministic capture into build/qa/<tag>/.
//
//   node scripts/qa-capture.mjs --tag <name> [--gate] [--base http://...]
//     [--profiles desktop,mobile] [--cameras C01,C03] [--measure 5]
//
// --gate is THE regression gate for every FAZ 1 merge: C03 (facade), the
// FOUR storey cuts C05-C08 (a wall lost to back-face culling shows ONLY
// when a cut looks at the shell's inner skin - C07 alone missed exactly
// that once), C09 (plan), C10 (walk) at dpr 1, plus C03 at dpr 2 - the one
// frame where the pixel budget actually bites (legacy desktop ratio
// ≈ 1.86). Sixteen frames across the two delivery profiles; the full
// 12-camera archive is opt-in, not routine.
//
// Without --base it serves the REPOSITORY ROOT (the committed pages build)
// through serve-pages.mjs - run `npm run build:pages` first when the source
// has changed.
//
// One browser per profile, one page per camera: cheap, and within the
// diff tolerance tools/qa/diff-captures.py already applies for SwiftShader's
// sub-pixel jitter on thin geometry (bounded at 0.005% of a frame).
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
const gate = args.includes('--gate');
const only = gate ? new Set(['C03', 'C05', 'C06', 'C07', 'C08', 'C09', 'C10'])
  : option('cameras') ? new Set(option('cameras').split(',')) : null;
const scalesFor = camera => (gate && camera.id === 'C03') ? [1, 2] : [1];
const measureSeconds = Number(option('measure', '0'));
const outDir = path.join(repoRoot, 'build/qa', tag);

let base = option('base');
let staticServer = null;
if (!base) {
  staticServer = await servePages(repoRoot);
  base = `http://127.0.0.1:${staticServer.port}/`;
  console.log('Serving pages root at', base);
}

const summary = {tag, commit, base, gate, capturedAt: new Date().toISOString(),
  softwareRaster: true, emulated: true, runs: []};

for (const profile of profiles) {
  await mkdir(path.join(outDir, profile), {recursive: true});
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_BROWSERS_PATH ? '/opt/pw-browsers/chromium' : undefined,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  for (const camera of CAMERAS) {
    if (only && !only.has(camera.id)) continue;
    for (const scale of scalesFor(camera)) {
      const suffix = scale === 1 ? '' : '@2x';
      const page = await browser.newPage({viewport: VIEWPORTS[profile], deviceScaleFactor: scale});
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
          await page.evaluate(() => window.__angoraQA.snapshot());
          await page.waitForTimeout(400);
        }
        // Let DOM label/CSS transitions finish and the settled frame land.
        await page.waitForTimeout(900);
        await page.evaluate(() => window.__angoraQA.snapshot());
        await page.waitForTimeout(200);
        const report = JSON.parse(await page.evaluate(() => document.querySelector('#viewport').dataset.qaReport));
        report.commit = commit;
        report.softwareRaster = true;   // frame numbers are NOT device numbers
        report.emulated = true;
        report.viewport = VIEWPORTS[profile];
        report.deviceScaleFactor = scale;
        report.captureMs = Date.now() - started;
        report.consoleErrors = errors;
        await page.screenshot({path: path.join(outDir, profile, camera.id + suffix + '.png'), timeout: 120_000});
        await writeFile(path.join(outDir, profile, camera.id + suffix + '.json'), JSON.stringify(report, null, 2));
        summary.runs.push({profile, camera: camera.id, scale, ok: true,
          drawCalls: report.renderer.drawCalls, triangles: report.renderer.triangles,
          pixelRatio: report.renderer.pixelRatio, drawingBuffer: report.renderer.drawingBuffer,
          textureMiB: report.memory.estimatedTextureMiB, geometryMiB: report.memory.estimatedGeometryMiB,
          fps: report.frame?.fps ?? null, errors: errors.length});
        console.log(`${profile}/${camera.id}${suffix}  calls=${report.renderer.drawCalls} tris=${report.renderer.triangles} ratio=${report.renderer.pixelRatio} buffer=${report.renderer.drawingBuffer.join('x')}${errors.length ? '  ⚠ ' + errors.length + ' console errors' : ''}`);
      } catch (error) {
        summary.runs.push({profile, camera: camera.id, scale, ok: false, error: String(error?.message ?? error), errors});
        console.log(`${profile}/${camera.id}${suffix}  FAILED: ${error.message}`);
        await page.screenshot({path: path.join(outDir, profile, camera.id + suffix + '-failed.png')}).catch(() => {});
      }
      await page.close();
    }
  }
  await browser.close();
}

await writeFile(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
console.log('Wrote', path.join(outDir, 'summary.json'));
await staticServer?.close();
const failed = summary.runs.filter(r => !r.ok).length;
if (failed) { console.error(failed + ' captures failed'); process.exit(1); }
