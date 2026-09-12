// Drive the shipped viewer itself - its own EDETRI lighting, post pipeline and
// material handling - into the attic and photograph a door. The R39 render
// harness lights with a bare sky dome, which is why dark joinery reads cool in
// it; this is the only way to see what the delivery actually looks like.
//
// Clicks go through evaluate() rather than Playwright's click, whose auto-wait
// for "scheduled navigations" never settles against a continuous render loop,
// and frames come from the app's own capture button (which re-renders and reads
// the pixels back) rather than a canvas screenshot, because the renderer keeps
// no preserved drawing buffer.
import { chromium } from 'playwright';
import fs from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const ROOT = '/home/user/angora';
const OUT = ROOT + '/build/renders/r41-app';
fs.mkdirSync(OUT, { recursive: true });

const server = createServer((req, res) => {
  const path = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  const file = join(ROOT, path === '/' ? 'index.html' : path);
  if (!file.startsWith(ROOT)) { res.statusCode = 403; return res.end(); }
  try {
    const body = fs.readFileSync(file);
    res.setHeader('content-type', {'.html':'text/html','.js':'text/javascript','.css':'text/css',
      '.json':'application/json','.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg',
      '.webp':'image/webp','.hdr':'application/octet-stream','.svg':'image/svg+xml',
      '.ktx2':'image/ktx2','.wasm':'application/wasm'}[extname(file)] ?? 'application/octet-stream');
    res.end(body);
  } catch { res.statusCode = 404; res.end(); }
});
await new Promise((r) => server.listen(9107, r));

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
await page.goto('http://127.0.0.1:9107/?view=f3', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(
  () => document.querySelector('#qa-screenshot') && !document.querySelector('#qa-screenshot').disabled,
  null, { timeout: 1200000 });
console.log('scene ready');


// Start the walk at the attic bedroom's station. The tags are laid out per
// frame and are hidden while the view is still moving, so this waits for one
// to actually be on screen instead of clicking into an empty list - which is
// what a first attempt did, returning a second copy of the plan view.
const started = await page.waitForFunction(() => {
  const tags = [...document.querySelectorAll('button.room-label')]
    .filter((b) => !b.disabled && !b.hidden && /Yatak odası/.test(b.textContent));
  if (!tags.length) return null;
  const tag = tags.at(-1);
  tag.click();
  return tag.textContent.trim();
}, null, { timeout: 180000, polling: 2000 }).then((h) => h.jsonValue());
console.log('walk started at', started);
await page.waitForTimeout(9000);
await capture('02 attic-walk');

// sweep the view so the door comes into frame
const box = await page.locator('canvas').boundingBox();
for (let step = 1; step <= 3; step++) {
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 - 210, box.y + box.height / 2, { steps: 14 });
  await page.mouse.up();
  await page.waitForTimeout(5000);
  await capture(`03 attic-turn-${step}`);
}
console.log('DONE');
await browser.close();
server.close();
