// R41 | Photograph the delivery through the page the owner opens.
//
// tools/render_r39.html lights with a bare sky dome, which is fine for geometry
// and useless for a finish: a dark surface under it takes the sky's colour
// rather than its own. This drives the shipped viewer instead - its own
// lighting, post pipeline and material handling.
//
// Clicks go through evaluate() because Playwright's click waits for navigations
// that never settle against a continuous render loop, and frames come from the
// app's own capture button because the renderer keeps no preserved drawing
// buffer. It opens on ?view=f3, part of the viewer's own share state, rather
// than clicking the floor and waiting out the transition.
//
// MODEL_ROOT serves build/web/full from somewhere else, so two builds of the
// delivery can be photographed down the identical code path and the difference
// between the frames is the build rather than the route taken to it. An A/B
// taken two different ways is not an A/B: an earlier pair differed in 43310
// pixels with peaks over 100 levels, all of it geometry shifting under a
// slightly different camera. FRAME_NAME names the frame.
//
//   MODEL_ROOT=/somewhere FRAME_NAME='01 before' node tools/capture_viewer_frames_r41.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const ROOT = '/home/user/angora';
const OUT = ROOT + '/build/renders/r41-app';
fs.mkdirSync(OUT, { recursive: true });

const server = createServer((req, res) => {
  const path = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  const models = process.env.MODEL_ROOT;
  const base = models && path.startsWith('/build/web/full/') ? models : ROOT;
  const file = join(base, path === '/' ? 'index.html' : path);
  if (!file.startsWith(base)) { res.statusCode = 403; return res.end(); }
  try {
    const body = fs.readFileSync(file);
    res.setHeader('content-type', {'.html':'text/html','.js':'text/javascript','.css':'text/css',
      '.json':'application/json','.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg',
      '.webp':'image/webp','.hdr':'application/octet-stream','.svg':'image/svg+xml',
      '.ktx2':'image/ktx2','.wasm':'application/wasm'}[extname(file)] ?? 'application/octet-stream');
    res.end(body);
  } catch { res.statusCode = 404; res.end(); }
});
await new Promise((r) => server.listen(9317, r));

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const context = await browser.newContext({ viewport: { width: 1100, height: 760 }, acceptDownloads: true });
const page = await context.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 160)));

const click = (selector) => page.evaluate((s) => {
  const el = document.querySelector(s);
  if (!el) throw new Error('missing ' + s);
  el.click();
}, selector);

async function capture(name) {
  const wait = page.waitForEvent('download', { timeout: 300000 });
  await click('#qa-screenshot');
  const download = await wait;
  await download.saveAs(`${OUT}/${name}.png`);
  console.log('OK', name);
}

// ?view=f3 is part of the viewer's own share state, so the attic is selected
// before the first frame is drawn rather than through a click and a transition
await page.goto('http://127.0.0.1:9317/?view=f3', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(
  () => document.querySelector('#qa-screenshot') && !document.querySelector('#qa-screenshot').disabled,
  null, { timeout: 1200000 });
console.log('scene ready');


await capture(process.env.FRAME_NAME || '01 attic-plan-retoned');
console.log('DONE');
await browser.close();
server.close();
