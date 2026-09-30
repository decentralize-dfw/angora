// Fotoğraf kamerası <-> model karşılaştırması (GPU'lu makinede çalışır).
//   node tools/qa/foto-karsilastir.mjs <site-url> <çıkış-klasörü> [id,id,...]
// Her iç mekân fotoğrafı için: sitede o fotoğrafın kamerasına geçilir (?stats=1 QA kancası
// __angoraQA.photoView), model görüntüsü alınır, gerçek fotoğrafla yan yana kNN.jpg yazılır.
// olcum.json: her çift için fotoğraf ve model ortalama rengi (tüm kare + 3x3 bölge, sRGB 0-255).
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
// bağımlılıklar mevcut paketlerden: playwright viewer/, sharp tools/batch-delivery/ (npm ci ile kurulu)
const {chromium} = createRequire(path.join(ROOT, 'viewer/package.json'))('playwright');
const sharp = createRequire(path.join(ROOT, 'tools/batch-delivery/package.json'))('sharp');
const {PHOTO_POINTS} = await import(path.join(ROOT, 'viewer/src/photo-points.js'));
const [url, outDir, ids] = process.argv.slice(2);
if (!url || !outDir) throw Error('kullanım: node tools/qa/foto-karsilastir.mjs <url> <klasör> [id,...]');
fs.mkdirSync(outDir, {recursive: true});
const list = (ids ? ids.split(',').map(Number) : PHOTO_POINTS.filter(p => !p.outdoor).map(p => p.id));
const W = 960, H = 720;
const b = await chromium.launch({headless: false, args: ['--ignore-gpu-blocklist', '--enable-gpu-rasterization']});
const p = await b.newPage({viewport: {width: W, height: H}});
p.on('pageerror', e => console.log('[sayfa hatası]', e.message));
await p.goto(url + (url.includes('?') ? '&' : '?') + 'stats=1', {waitUntil: 'load', timeout: 180000});
await p.waitForFunction(() => window.__angoraQA, null, {timeout: 300000});
const gpu = await p.evaluate(() => {const c = document.createElement('canvas').getContext('webgl2'); const d = c?.getExtension('WEBGL_debug_renderer_info'); return d ? c.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'bilinmiyor';});
console.log('GPU:', gpu);
if (/swiftshader|llvmpipe|software/i.test(gpu)) throw Error('Tarayıcı GPU kullanmıyor: ' + gpu);
await p.evaluate(() => {try {sessionStorage.setItem('angora-welcome', '1');} catch {}});
const stats = async buf => {
  const {data, info} = await sharp(buf).resize(W, H, {fit: 'contain', background: '#000'}).removeAlpha().raw().toBuffer({resolveWithObject: true});
  const cell = (x0, y0, x1, y1) => {let r = 0, g = 0, bl = 0, n = 0;
    for (let y = y0; y < y1; y += 2) for (let x = x0; x < x1; x += 2) {const i = (y * info.width + x) * 3; if (data[i] + data[i + 1] + data[i + 2] < 6) continue; r += data[i]; g += data[i + 1]; bl += data[i + 2]; n++;}
    return n ? [r / n, g / n, bl / n].map(v => Math.round(v)) : null;};
  const grid = []; for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) grid.push(cell(i * W / 3 | 0, j * H / 3 | 0, (i + 1) * W / 3 | 0, (j + 1) * H / 3 | 0));
  return {tum: cell(0, 0, W, H), bolge3x3: grid};
};
const olcum = {};
for (const id of list) {
  const pt = PHOTO_POINTS.find(q => q.id === id); if (!pt || pt.outdoor) continue;
  try {
    let ok = false;
    for (let i = 0; i < 30 && !ok; i++) {try {await p.evaluate(x => window.__angoraQA.photoView(x), id); ok = true;} catch {await p.waitForTimeout(3000);}}
    if (!ok) {console.log(id, 'kameraya geçilemedi'); continue;}
    await p.evaluate(() => {for (const el of document.querySelectorAll('#welcome,.topbar,.dock,#walk-panel,.walk-panel,#hotspots,.hotspots,.walk-arrows')) el.style.visibility = 'hidden';});
    await p.waitForTimeout(8000);                                   // dokular + ışık haritası otursun
    const shot = await p.screenshot();
    const photo = await sharp(path.join(ROOT, 'photogallery', pt.file)).resize(W, H, {fit: 'contain', background: '#000'}).png().toBuffer();
    const name = `k${String(id).padStart(2, '0')}.jpg`;
    await sharp({create: {width: W * 2 + 10, height: H, channels: 3, background: '#000'}})
      .composite([{input: photo, left: 0, top: 0}, {input: shot, left: W + 10, top: 0}]).jpeg({quality: 85}).toFile(path.join(outDir, name));
    olcum[id] = {dosya: name, oda: pt.tr, foto: await stats(photo), model: await stats(shot)};
    console.log(id, pt.tr, 'tamam');
  } catch (e) {console.log(id, 'HATA', e.message.split('\n')[0]);}
}
fs.writeFileSync(path.join(outDir, 'olcum.json'), JSON.stringify({url, gpu, tarih: new Date().toISOString(), olcum}, null, 1));
await b.close();
console.log('bitti:', Object.keys(olcum).length, 'çift');
