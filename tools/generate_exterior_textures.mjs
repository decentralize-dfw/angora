// Seamless exterior detail maps, authored procedurally from the listing-photo
// material spec (docs of the audit live in the session log). The optimised
// GLB delivery collapsed its hero exterior textures to 4x4 placeholder stubs
// - roof clay tile, facade colour, grass, asphalt, terrace pavers - and no
// usable tileable replacements exist in assets/pbr (roof does not wrap,
// asphalt/travertine were never baked). These are drawn to the photo's hue
// palette and modules, wrap-perfect by modular arithmetic, and carry no
// third-party content.
//
//   node tools/generate_exterior_textures.mjs   -> assets/textures/*.png
import {deflateSync} from 'node:zlib';
import {writeFileSync, mkdirSync} from 'node:fs';

const SIZE = 512;
const OUT = new URL('../assets/textures/', import.meta.url);
mkdirSync(OUT, {recursive: true});

// ---- minimal PNG writer (RGB8) -------------------------------------------
const CRC_TABLE = Array.from({length: 256}, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = bytes => {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const head = Buffer.concat([Buffer.from(type), data]);
  const out = Buffer.alloc(head.length + 8);
  out.writeUInt32BE(data.length, 0); head.copy(out, 4);
  out.writeUInt32BE(crc32(head), head.length + 4);
  return out;
};
function writePNG(name, rgb) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE, 0); ihdr.writeUInt32BE(SIZE, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB
  const raw = Buffer.alloc(SIZE * (SIZE * 3 + 1));
  for (let y = 0; y < SIZE; y++) {
    raw[y * (SIZE * 3 + 1)] = 0; // filter none
    rgb.copy(raw, y * (SIZE * 3 + 1) + 1, y * SIZE * 3, (y + 1) * SIZE * 3);
  }
  const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, {level: 9})), chunk('IEND', Buffer.alloc(0))]);
  writeFileSync(new URL(name, OUT), png);
  console.log(name, png.length, 'bytes');
}

// ---- deterministic tileable noise ----------------------------------------
const hash2 = (x, y, seed = 0) => {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 2246822519)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const fade = t => t * t * (3 - 2 * t);
// value noise on a lattice of `period` cells, wrapping - tileable by build
function noise(u, v, period, seed = 0) {
  const x = u * period, y = v * period;
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const fx = fade(x - x0), fy = fade(y - y0);
  const at = (ix, iy) => hash2(((ix % period) + period) % period, ((iy % period) + period) % period, seed);
  const a = at(x0, y0), b = at(x0 + 1, y0), c = at(x0, y0 + 1), d = at(x0 + 1, y0 + 1);
  return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
}
const fbm = (u, v, base, seed) =>
  (noise(u, v, base, seed) * .5 + noise(u, v, base * 2, seed + 1) * .3 + noise(u, v, base * 4, seed + 2) * .2);

const hex = s => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const put = (buf, x, y, rgb) => {
  const i = (y * SIZE + x) * 3;
  buf[i] = Math.max(0, Math.min(255, Math.round(rgb[0])));
  buf[i + 1] = Math.max(0, Math.min(255, Math.round(rgb[1])));
  buf[i + 2] = Math.max(0, Math.min(255, Math.round(rgb[2])));
};
// central-difference normal map from a wrapping height field, Y-up green
function normalFrom(height, strength, name) {
  const buf = Buffer.alloc(SIZE * SIZE * 3);
  const at = (x, y) => height[((y + SIZE) % SIZE) * SIZE + ((x + SIZE) % SIZE)];
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
    const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
    const inv = 1 / Math.hypot(dx, dy, 1);
    put(buf, x, y, [(-dx * inv * .5 + .5) * 255, (-dy * inv * .5 + .5) * 255, (inv * .5 + .5) * 255]);
  }
  writePNG(name, buf);
}

// ---- 1. clay roof tile: 4 tiles x 3 courses per repeat (0.8 m x 1.0 m) ----
// Photo palette: per-tile lottery salmon/rust/weathered/sooty, course shadow
// at each overlap, soft barrel roll per tile, cream mortar only on ridge caps
// (not drawn - ridges are separate geometry).
{
  const palette = [hex('#D08A55'), hex('#C97C4A'), hex('#B76840'), hex('#A85E38'), hex('#8A5333'), hex('#5E3F2C')];
  const weights = [.3, .24, .2, .14, .08, .04];
  const TILES_X = 4, COURSES = 3;
  const tw = SIZE / TILES_X, ch = SIZE / COURSES;
  const buf = Buffer.alloc(SIZE * SIZE * 3);
  const height = new Float32Array(SIZE * SIZE);
  const pickColour = (cx, cy) => {
    let r = hash2(cx, cy, 7), i = 0;
    while (i < weights.length - 1 && r > weights[i]) r -= weights[i++];
    return palette[i];
  };
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const course = Math.floor(y / ch);
    // half-tile stagger on odd courses, wrapped
    const shift = course % 2 ? tw / 2 : 0;
    const xs = (x + shift) % SIZE;
    const tile = Math.floor(xs / tw);
    let rgb = pickColour(tile, course).slice();
    // per-tile brightness lottery on top of the hue lottery
    const jitter = (hash2(tile, course, 11) - .5) * .12;
    rgb = rgb.map(v => v * (1 + jitter));
    // barrel roll across the tile: highlight at the crown, shade in the pan
    const tx = (xs % tw) / tw;
    const roll = Math.sin(tx * Math.PI);
    rgb = rgb.map(v => v * (.92 + .14 * roll));
    // course overlap: the lower edge of each course shades the one below
    const ty = (y % ch) / ch;
    if (ty > .86) rgb = rgb.map(v => v * (1 - (ty - .86) * 2.2));
    if (ty < .06) rgb = rgb.map(v => v * .82);
    // vertical joints between tiles
    if (tx < .03 || tx > .97) rgb = rgb.map(v => v * .7);
    // dust film and firing variation
    const n = fbm(x / SIZE, y / SIZE, 24, 3);
    rgb = mix(rgb, hex('#8A7455'), (n - .5) * .2);
    put(buf, x, y, rgb);
    height[y * SIZE + x] = roll * .75 + (ty > .86 ? -(ty - .86) * 5 : 0) - (tx < .03 || tx > .97 ? .5 : 0);
  }
  writePNG('clay-tile-basecolor.png', buf);
  normalFrom(height, 3.2, 'clay-tile-normal.png');
}

// ---- 2. meadow grass: ~2 m repeat, patchy greens with straw ---------------
{
  const green = hex('#47711F'), yellowGreen = hex('#6A852D'), deep = hex('#2E4A1E'), straw = hex('#937442');
  const buf = Buffer.alloc(SIZE * SIZE * 3);
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const u = x / SIZE, v = y / SIZE;
    const patch = fbm(u, v, 5, 21);          // broad patchiness
    const blade = noise(u, v, 96, 22);       // fine blade speckle
    const dry = Math.max(0, fbm(u, v, 3, 23) - .62) * 2.2; // occasional straw
    let rgb = mix(deep, green, Math.min(1, patch * 1.6));
    rgb = mix(rgb, yellowGreen, Math.max(0, patch - .55) * 1.4);
    rgb = mix(rgb, straw, Math.min(.5, dry));
    rgb = rgb.map(vv => vv * (.82 + blade * .36));
    put(buf, x, y, rgb);
  }
  writePNG('grass-basecolor.png', buf);
}

// ---- 3. asphalt: ~3 m repeat, sun-bleached grey with patch seams ----------
{
  const base = hex('#8F8A82'), dark = hex('#6E6A64');
  const buf = Buffer.alloc(SIZE * SIZE * 3);
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const u = x / SIZE, v = y / SIZE;
    const grain = noise(u, v, 128, 31);
    const blotch = fbm(u, v, 4, 32);
    let rgb = mix(base, dark, Math.max(0, blotch - .5) * 1.2);
    rgb = rgb.map(vv => vv * (.9 + grain * .2));
    put(buf, x, y, rgb);
  }
  writePNG('asphalt-basecolor.png', buf);
}

// ---- 4. travertine pavers: 2x2 flags per repeat (0.8 m => 0.4 m flags) ----
// Blush/cream/greige flag lottery with light mortar joints, per the entrance
// courtyard and pool terrace photos.
{
  const flags = [hex('#DFC8BC'), hex('#E2D3C5'), hex('#CFC8BE'), hex('#D5CCC0')];
  const joint = hex('#8A8178');
  const N = 2, cell = SIZE / N, JOINT = 5;
  const buf = Buffer.alloc(SIZE * SIZE * 3);
  const height = new Float32Array(SIZE * SIZE);
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const cx = Math.floor(x / cell), cy = Math.floor(y / cell);
    const lx = x % cell, ly = y % cell;
    const inJoint = lx < JOINT || ly < JOINT;
    let rgb;
    if (inJoint) {
      rgb = joint.map(v => v * (.9 + noise(x / SIZE, y / SIZE, 64, 41) * .2));
      height[y * SIZE + x] = -1;
    } else {
      rgb = flags[Math.floor(hash2(cx, cy, 43) * flags.length)].slice();
      const mottle = fbm(x / SIZE, y / SIZE, 12, 44);
      const speck = noise(x / SIZE, y / SIZE, 160, 45);
      rgb = mix(rgb, hex('#B7A493'), (mottle - .5) * .5);
      rgb = rgb.map(v => v * (.94 + speck * .1));
      height[y * SIZE + x] = 0;
    }
    put(buf, x, y, rgb);
  }
  writePNG('travertine-basecolor.png', buf);
  normalFrom(height, 1.6, 'travertine-normal.png');
}

writeFileSync(new URL('source.json', OUT), JSON.stringify({
  generated_by: 'tools/generate_exterior_textures.mjs',
  content: 'procedural, project-authored; no third-party imagery',
  spec_source: 'listing photographs in the repository root, kat_1_bahce and kat_2_on_giris',
  modules_m: {clay_tile: [0.8, 1.0], grass: 2.0, asphalt: 3.0, travertine: 0.8},
}, null, 1));
console.log('source.json written');
