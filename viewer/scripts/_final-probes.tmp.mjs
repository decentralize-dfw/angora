import {chromium} from 'playwright';
import {servePages} from './serve-pages.mjs';
import {fileURLToPath} from 'node:url';
import {writeFileSync} from 'node:fs';

const scratch = '/tmp/claude-0/-home-user-angora/591651d5-f6a7-50e3-9a0c-efc8f6731aca/scratchpad';
const server = await servePages(fileURLToPath(new URL('../../', import.meta.url)));
const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});

const out = {};
async function page(url, {dsf = 1} = {}) {
  const p = await browser.newPage({viewport: {width: 1600, height: 900}, deviceScaleFactor: dsf});
  p.on('console', m => {if (m.type() === 'error') (out.consoleErrors ??= []).push(m.text().slice(0, 160));});
  await p.goto(`http://127.0.0.1:${server.port}/${url}`, {waitUntil: 'domcontentloaded'});
  await p.waitForFunction(() => JSON.parse(document.querySelector('#viewport')?.dataset.qaReport ?? 'null')?.camera, null, {timeout: 900000});
  return p;
}

// 1 — the timed-out desktop C03@2x, retried once with a 15 min window.
{
  const t0 = Date.now();
  const p = await page('?view=neighborhood&hour=16.5&season=172&light=sun&profile=desktop&camera=C03&stats=1', {dsf: 2});
  const report = await p.evaluate(() => JSON.parse(document.querySelector('#viewport').dataset.qaReport));
  await p.screenshot({path: '/home/user/angora/build/qa/gate-f342/desktop/C03@2x.png', timeout: 240000});
  writeFileSync('/home/user/angora/build/qa/gate-f342/desktop/C03@2x.json', JSON.stringify(report, null, 2));
  out.c03at2x = {seconds: Math.round((Date.now() - t0) / 1000), calls: report.renderer.drawCalls,
    tris: report.renderer.triangles, ratio: report.renderer.pixelRatio, buffer: report.renderer.drawingBuffer};
  await p.close();
}

// 2 — villa-pool camera: water shader evidence + a frame for the eye.
{
  const p = await page('?view=neighborhood&hour=16.5&season=172&light=sun&profile=desktop&camera=C04&stats=1');
  out.water = await p.evaluate(() => {
    const qa = window.__angoraQA;
    return qa.report.view === undefined ? null : (() => {
      let applied = 0, materials = 0;
      // walk the scene through the runtime dataset instead of hooks
      return {note: 'scene walk unavailable without hooks', applied: null};
    })();
  });
  await p.screenshot({path: scratch + '/final-C04.png'});
  // texture top-10 through renderer.info is unavailable without hooks; the
  // report's memory estimate stands in.
  out.c04memory = await p.evaluate(() => JSON.parse(document.querySelector('#viewport').dataset.qaReport).memory);
  // 3 — night variants on the pool side (Task 3.4g measurement).
  out.night = await p.evaluate(() => window.__angoraQA.nightProbe());
  await p.screenshot({path: scratch + '/final-C04-night.png'});
  await p.close();
}

// 4 — 2.1-e: does memory come back after a floor round trip?
{
  const p = await page('?view=neighborhood&hour=16.5&season=172&light=sun&profile=desktop&camera=C03&stats=1');
  out.memoryReturn = await p.evaluate(async () => {
    const qa = window.__angoraQA;
    const before = JSON.parse(document.querySelector('#viewport').dataset.runtime);
    for (const cam of ['C05', 'C07', 'C08', 'C03']) await qa.applyCamera(cam);
    const after = JSON.parse(document.querySelector('#viewport').dataset.runtime);
    return {before: {textures: before.textures, geometries: before.geometries},
            after: {textures: after.textures, geometries: after.geometries}};
  });
  await p.close();
}

writeFileSync(scratch + '/final-probes.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
await browser.close(); await server.close();
