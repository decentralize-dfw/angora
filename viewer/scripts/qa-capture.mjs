// FAZ 0 · Task 0.4 — deterministic capture into build/qa/<tag>/.
//
//   node scripts/qa-capture.mjs --tag <name> [--gate] [--base http://...]
//     [--tiers desktop-balanced,mobile-high] [--cameras C01,C03] [--measure 5]
//
// --gate is THE regression gate (FAZ 6 EK Bölüm 3 form): ALL TWELVE cameras
// on ALL FOUR quality tiers, forced through the product's own ?quality=
// override. The audit (DENETIM.md A1/A4) found every earlier capture had
// silently run desktop-balanced — the "mobile" folders were just a phone
// viewport on the desktop tier — and that C04/C11/C12 never passed a gate.
// So each run now records under build/qa/<tag>/<tier>/ and FAILS if the
// page's own report.tier disagrees with the forced tier. A gate without a
// mobile-high folder is invalid. C03 additionally captures at dpr 2 on
// desktop-balanced only (the one frame where the pixel budget bites).
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
const gate = args.includes('--gate');
// Tier -> viewport family. SwiftShader cannot measure FPS on any of them,
// but forcing ?quality= decides WHICH CODE RUNS — the mobile render path
// (no shadow, no postfx) had never been photographed before this (A1).
const TIER_PROFILE = {
  'desktop-balanced': 'desktop', 'desktop-high': 'desktop',
  'mobile-high': 'mobile', 'mobile-low': 'mobile',
};
const tiers = (option('tiers') ?? (gate
  ? 'desktop-balanced,desktop-high,mobile-high,mobile-low'
  : 'desktop-balanced')).split(',');
for (const tier of tiers) if (!TIER_PROFILE[tier]) {
  console.error('Unknown tier ' + tier); process.exit(1);
}
// FAZ 6: a gate may exercise a default-off flag (e.g. runtimeVertexAO)
// without shipping it on - the string is appended verbatim to every page
// URL as &features=..., which resolveFeatures already understands.
const featuresAt = args.indexOf('--features');
const featuresParam = featuresAt >= 0 ? args[featuresAt + 1] : null;
// A gate runs every camera — C04/C11/C12 had never been gated (A4) and the
// two interiors are exactly where the complaint lives. --cameras narrows
// only for debugging runs, never for a verdict.
const only = option('cameras') ? new Set(option('cameras').split(',')) : null;
const scalesFor = (camera, tier) =>
  (gate && camera.id === 'C03' && tier === 'desktop-balanced') ? [1, 2] : [1];
// DAİMİ EMİR A1 / kapanış md. 16: the gate also shoots REAL night frames -
// hour=21 (sun below the horizon on day 172) + the product's own lamp
// state via __angoraQA.nightScene(). gate-f342's "night" png was a
// lamps-on day frame; this is the one that can actually answer FAZ 3
// kabul md. 9 (windows read lit, scene reads GI, no point-light bloom).
// Two cameras (pool facade + interior walk) on the two verdict tiers.
const NIGHT_CAMERAS = new Set(['C04', 'C10']);
const NIGHT_TIERS = new Set(['desktop-balanced', 'mobile-high']);
const measureSeconds = Number(option('measure', '0'));
const outDir = path.join(repoRoot, 'build/qa', tag);

let base = option('base');
let staticServer = null;
if (!base) {
  // --root serves any checkout (e.g. a git worktree of an old commit) the
  // same way the repo root is served - one process, no server juggling.
  const serveRoot = option('root', repoRoot);
  staticServer = await servePages(serveRoot);
  base = `http://127.0.0.1:${staticServer.port}/`;
  console.log('Serving', serveRoot, 'at', base);
}

const summary = {tag, commit, base, gate, tiers, capturedAt: new Date().toISOString(),
  softwareRaster: true, emulated: true, runs: []};

for (const tier of tiers) {
  const profile = TIER_PROFILE[tier];
  await mkdir(path.join(outDir, tier), {recursive: true});
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_BROWSERS_PATH ? '/opt/pw-browsers/chromium' : undefined,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  for (const camera of CAMERAS) {
    if (only && !only.has(camera.id)) continue;
    const variants = scalesFor(camera, tier).map(scale =>
      ({scale, suffix: scale === 1 ? '' : '@2x', night: false}));
    if (gate && NIGHT_CAMERAS.has(camera.id) && NIGHT_TIERS.has(tier)) {
      variants.push({scale: 1, suffix: '-night', night: true});
    }
    for (const {scale, suffix, night} of variants) {
      const page = await browser.newPage({viewport: VIEWPORTS[profile], deviceScaleFactor: scale});
      const errors = [];
      const infos = [];
      page.on('console', m => {
        if (m.type() === 'error') errors.push(m.text());
        else if (m.type() === 'info') infos.push(m.text());
      });
      page.on('pageerror', e => errors.push(String(e)));
      const url = base + search(camera, profile,
        night ? {quality: tier, hour: '21'} : {quality: tier}) +
        (featuresParam ? '&features=' + featuresParam : '');
      const started = Date.now();
      try {
        await page.goto(url, {waitUntil: 'domcontentloaded'});
        await page.waitForFunction(
          () => JSON.parse(document.querySelector('#viewport')?.dataset.qaReport ?? 'null')?.camera,
          null, {timeout: 480_000});
        if (night) {
          await page.evaluate(() => window.__angoraQA.nightScene());
          await page.waitForTimeout(600);
        }
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
        // The one check whose absence let five phases pass on the wrong
        // tier: the page must have actually RUN the tier we asked for.
        if (report.tier !== tier) {
          throw new Error(`tier mismatch: forced ${tier}, page ran ${report.tier}`);
        }
        report.commit = commit;
        report.softwareRaster = true;   // frame numbers are NOT device numbers
        report.emulated = true;
        report.viewport = VIEWPORTS[profile];
        report.deviceScaleFactor = scale;
        report.captureMs = Date.now() - started;
        report.consoleErrors = errors;
        // console.info lines are coverage EVIDENCE (e.g. "Exterior grade
        // revived on N materials", vertex-AO skip logs) — counted, not claimed.
        report.consoleInfo = infos;
        await page.screenshot({path: path.join(outDir, tier, camera.id + suffix + '.png'), timeout: 120_000});
        await writeFile(path.join(outDir, tier, camera.id + suffix + '.json'), JSON.stringify(report, null, 2));
        summary.runs.push({tier, profile, camera: camera.id, scale, ok: true,
          drawCalls: report.renderer.drawCalls, triangles: report.renderer.triangles,
          pixelRatio: report.renderer.pixelRatio, drawingBuffer: report.renderer.drawingBuffer,
          textureMiB: report.memory.estimatedTextureMiB, geometryMiB: report.memory.estimatedGeometryMiB,
          fps: report.frame?.fps ?? null, errors: errors.length});
        console.log(`${tier}/${camera.id}${suffix}  calls=${report.renderer.drawCalls} tris=${report.renderer.triangles} ratio=${report.renderer.pixelRatio} buffer=${report.renderer.drawingBuffer.join('x')}${errors.length ? '  ⚠ ' + errors.length + ' console errors' : ''}`);
      } catch (error) {
        summary.runs.push({tier, profile, camera: camera.id, scale, ok: false, error: String(error?.message ?? error), errors});
        console.log(`${tier}/${camera.id}${suffix}  FAILED: ${error.message}`);
        await page.screenshot({path: path.join(outDir, tier, camera.id + suffix + '-failed.png')}).catch(() => {});
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
