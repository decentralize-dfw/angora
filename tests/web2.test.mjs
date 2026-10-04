// Budget and structure checks for web2.html. Run: node --test tests/web2.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('web2.html'), css = read('web2.css'), js = read('web2.js');

test('every local asset referenced by web2.html exists', () => {
  const refs = [...html.matchAll(/(?:src|href|srcset|poster)="([^"]+)"/g)].flatMap(m => m[1].split(',').map(s => s.trim().split(' ')[0]));
  const local = refs.filter(r => r.startsWith('./')).map(r => r.split('?')[0].split('#')[0]);
  const missing = [...new Set(local)].filter(r => !fs.existsSync(path.join(root, r)));
  assert.deepEqual(missing, []);
});

test('no single page asset exceeds 2 MB', () => {
  const refs = [...html.matchAll(/(?:src|href|srcset|poster)="([^"]+)"/g)].flatMap(m => m[1].split(',').map(s => s.trim().split(' ')[0])).filter(r => r.startsWith('./'));
  const big = [...new Set(refs)].filter(r => fs.existsSync(path.join(root, r)) && fs.statSync(path.join(root, r)).size > 2 * 1024 * 1024);
  assert.deepEqual(big, []);
});

test('frame sequences stay within budget per clip', () => {
  for (const clip of ['approach', 'orbit', 'garden-return']) {
    for (const [variant, limit] of [['d', 5 * 1024 * 1024], ['m', 2.2 * 1024 * 1024]]) {
      const dir = path.join(root, 'assets/web2/films', clip, variant);
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.webp'));
      assert.equal(files.length, 41, `${clip}/${variant} has 41 frames`);
      const total = files.reduce((s, f) => s + fs.statSync(path.join(dir, f)).size, 0);
      assert.ok(total <= limit, `${clip}/${variant} is ${(total / 1048576).toFixed(2)} MB`);
    }
  }
  for (const level of [1, 2, 3]) for (const variant of ['d', 'm']) {
    const dir = path.join(root, 'assets/web2/chapters', `level-${level}`, variant);
    assert.equal(fs.readdirSync(dir).filter(f => f.endsWith('.webp')).length, 22);
  }
});

test('photographs ship in four responsive widths', () => {
  const names = [...html.matchAll(/assets\/web2\/photos\/([a-z0-9_-]+)-1200\.webp/g)].map(m => m[1]);
  assert.ok(names.length >= 20);
  for (const name of new Set(names)) for (const w of [480, 800, 1200, 1600]) assert.ok(fs.existsSync(path.join(root, `assets/web2/photos/${name}-${w}.webp`)), `${name}-${w}`);
  const imgs = [...html.matchAll(/<img [^>]*class="[^"]*-photo[^"]*"[^>]*>/g)].map(m => m[0]);
  for (const tag of imgs) { assert.match(tag, /srcset=/); assert.match(tag, /sizes=/); assert.match(tag, /width="\d+"/); assert.match(tag, /loading="lazy"/); }
});

test('stylesheet has no !important and no font size below 11px', () => {
  assert.equal((css.match(/!important/g) || []).length, 0);
  const sizes = [...css.matchAll(/font(?:-size)?:\s*(?:\d+\s+)?(\d+(?:\.\d+)?)px/g)].map(m => Number(m[1]));
  assert.ok(sizes.every(s => s >= 11), `smallest declared size ${Math.min(...sizes)}px`);
});

test('fonts are subset WOFF2 under 30 KB each', () => {
  const dir = path.join(root, 'assets/web2/fonts');
  const fonts = fs.readdirSync(dir).filter(f => f.endsWith('.woff2'));
  assert.equal(fonts.length, 6);
  for (const f of fonts) assert.ok(fs.statSync(path.join(dir, f)).size < 30 * 1024, f);
});

test('scroll is never hijacked: no preventDefault on wheel or touch', () => {
  assert.ok(!/addEventListener\('(wheel|touchmove)'/.test(js));
  assert.ok(!/preventDefault\(\)[^\n]*wheel/.test(js));
  assert.ok(/directional: false/.test(js), 'snap points are not directional');
});

test('header is always rendered and themed per section', () => {
  assert.match(html, /<header class="header" data-theme="dark">/);
  assert.ok(!/\.header\{[^}]*transform:translateY\(-1/.test(css));
  const sections = [...html.matchAll(/<section [^>]*id="([a-z-]+)"[^>]*data-theme="(dark|light)"/g)];
  assert.ok(sections.length >= 12, `${sections.length} themed sections`);
});
