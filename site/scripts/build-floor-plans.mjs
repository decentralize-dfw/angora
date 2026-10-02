// Floor plans for the presentation site, drawn from the delivery's own room
// polygons (build/web/full/room-spaces.json) and room labels
// (build/web/full/rooms.json). Nothing is traced by hand: every outline is a
// closed space the R40 wall solids enclose, every area is the one the viewer
// shows, and labels sit where the viewer places them. Output: ../en/media/plan-f0..3.svg
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const spaces = read('build/web/full/room-spaces.json');
const rooms = read('build/web/full/rooms.json');

// Drawing names stay the source of truth; only their language changes
// (same table as viewer/src/i18n.js ROOM_TERMS, plus the basement's garden room).
const EN = [
  [/^bahçe salonu$/i, 'Garden living room'], [/^salon$/i, 'Living room'], [/^mutfak$/i, 'Kitchen'],
  [/^yemek alanı$/i, 'Dining area'], [/^oturma alanı$/i, 'Sitting area'], [/^antre$/i, 'Entry hall'],
  [/^giriş$/i, 'Entrance'], [/^kat holü$/i, 'Landing'], [/^hol$/i, 'Hall'], [/^oda$/i, 'Room'],
  [/^yatak odası$/i, 'Bedroom'], [/^ebeveyn yatak odası$/i, 'Primary bedroom'],
  [/^ebeveyn banyosu$/i, 'En-suite bathroom'], [/^banyo$/i, 'Bathroom'], [/^wc$/i, 'WC'],
  [/^garaj$/i, 'Garage'], [/^tesisat odası$/i, 'Utility room'], [/^balkon$/i, 'Balcony'],
  [/^giyinme odası$/i, 'Dressing room'],
];
const en = (name) => (EN.find(([rx]) => rx.test(name.trim())) ?? [null, name])[1];

const FLOORS = [
  {i: 0, slug: 'f0', title: 'Basement'},
  {i: 1, slug: 'f1', title: 'Ground floor'},
  {i: 2, slug: 'f2', title: 'First floor'},
  {i: 3, slug: 'f3', title: 'Attic floor'},
];
const PX = 40;      // pixels per metre
const PAD = 1.0;    // metres of air around the union of all floors

// One frame for all four floors so the plans sit on top of each other when
// the page crossfades between them.
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
const take = (x, z) => {minX = Math.min(minX, x); maxX = Math.max(maxX, x); minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);};
for (const s of spaces.spaces) for (const [x, z] of s.boundary_xz) take(x, z);
for (const r of rooms.rooms) take(r.position[0], r.position[2]);
const W = Math.round((maxX - minX + 2 * PAD) * PX), H = Math.round((maxZ - minZ + 2 * PAD) * PX);
// glTF is Y-up: a plan is the X–Z plane seen from above, x to the right and
// z down the page. The street side (positive z) lands at the bottom, the
// pool side at the top.
const sx = (x) => +((x - minX + PAD) * PX).toFixed(1);
const sy = (z) => +((z - minZ + PAD) * PX).toFixed(1);
const ring = (pts) => pts.map(([x, z], k) => `${k ? 'L' : 'M'}${sx(x)} ${sy(z)}`).join('') + 'Z';
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const m2 = (v) => v.toLocaleString('en-GB', {maximumFractionDigits: 1}) + ' m²';

const style = `
  .room{fill:var(--plan-room,#faf8f3);stroke:var(--plan-wall,#1a1c1d);stroke-width:4.5;stroke-linejoin:miter;transition:fill .35s ease}
  .room.is-hover,.room:hover{fill:var(--plan-room-hover,#e3dccd)}
  text{font-family:inherit;fill:currentColor;text-anchor:middle;pointer-events:none}
  .lbl{font-size:10px;font-weight:600;letter-spacing:.02em}
  .lbl.small{font-size:9px}
  .area{font-size:9.5px;font-weight:400;opacity:.72}
  .open{font-size:9.5px;font-style:italic;opacity:.7}
  .scale line{stroke:currentColor;stroke-width:1.2}
  .scale text{font-size:9px;text-anchor:start;opacity:.7}
  .title{font-size:10px;letter-spacing:.22em;text-transform:uppercase;text-anchor:start;opacity:.6}
`;

const roomsById = new Map(rooms.rooms.map((r) => [r.id, r]));
for (const floor of FLOORS) {
  const floorSpaces = spaces.spaces.filter((s) => s.floor_index === floor.i);
  const floorRooms = rooms.rooms.filter((r) => r.floor_index === floor.i);
  const withPolygon = new Set(floorSpaces.flatMap((s) => s.members));
  const paths = floorSpaces.map((s) => {
    const names = s.members.map((id) => en(roomsById.get(id)?.name ?? id));
    const d = [ring(s.boundary_xz), ...(s.holes_xz ?? []).map(ring)].join('');
    return `  <path class="room" fill-rule="evenodd" data-space="${s.space_id}" data-rooms="${esc(s.members.join(' '))}" data-name="${esc(names.join(' · '))}" data-area="${s.area_m2}" d="${d}"><title>${esc(names.join(' · '))} · ${m2(s.area_m2)}</title></path>`;
  });
  const labels = floorRooms.map((r) => {
    const [x, , z] = r.position;
    const name = en(r.name);
    const area = typeof r.area_m2 === 'number' ? r.area_m2 : null;
    const small = area !== null && area < 6;
    const cls = withPolygon.has(r.id) ? 'lbl' : 'open';
    // Long names wrap onto two lines so they stay inside narrow rooms.
    const words = name.split(' ');
    const wrap = name.length > 10 && words.length > 1 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [name];
    const lineH = small ? 10 : 12, block = wrap.length * lineH + (area !== null && !small ? 11 : 0);
    const y0 = sy(z) - block / 2 + lineH - 3;
    const tspans = wrap.map((w, k) => `<tspan x="${sx(x)}" dy="${k ? lineH : 0}">${esc(w)}</tspan>`).join('');
    const lines = [`<text class="${cls}${small ? ' small' : ''}" x="${sx(x)}" y="${y0}" data-room="${r.id}">${tspans}</text>`];
    if (area !== null && !small) lines.push(`<text class="area" x="${sx(x)}" y="${y0 + wrap.length * lineH}">${m2(area)}</text>`);
    return '  ' + lines.join('');
  });
  const barX = 18, barY = H - 18;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t-${floor.slug}" data-floor="${floor.i}">
  <title id="t-${floor.slug}">${floor.title} plan · Angora 21</title>
  <style>${style}</style>
  <text class="title" x="18" y="22">${floor.title}</text>
${paths.join('\n')}
${labels.join('\n')}
  <g class="scale"><line x1="${barX}" y1="${barY}" x2="${barX + 2 * PX}" y2="${barY}"/><line x1="${barX}" y1="${barY - 4}" x2="${barX}" y2="${barY + 4}"/><line x1="${barX + 2 * PX}" y1="${barY - 4}" x2="${barX + 2 * PX}" y2="${barY + 4}"/><text x="${barX + 2 * PX + 6}" y="${barY + 3}">2 m</text></g>
</svg>
`;
  const out = path.join(root, 'en/media', `plan-${floor.slug}.svg`);
  fs.writeFileSync(out, svg);
  console.log(`${path.relative(root, out)}  ${floorSpaces.length} spaces, ${floorRooms.length} labels`);
}
console.log(`frame ${W}×${H} px · x ${minX.toFixed(2)}…${maxX.toFixed(2)} m · z ${minZ.toFixed(2)}…${maxZ.toFixed(2)} m`);
