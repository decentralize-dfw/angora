// R44 | The Bölge map's places, from uzakolcek.html itself.
//
// uzakolcek.html (repo root, merged from main) is the 'Hatırlı Sokak No:10
// Kentsel Donatı Atlası': 1 580 OSM/Google/Yandex amenities inside 3 250 m
// of the villa's own address point, packed as JSON in its #poi-data tag.
// Its INFORMATION feeds the map - never its design. This tool:
//   - takes the atlas centre as the map origin (the villa's coordinate),
//   - curates one named chip per daily need by nearest-real-distance,
//   - thins the named amenities into a quiet dot field,
// and writes viewer/src/region-places.json for region-map.js.
import { readFileSync, writeFileSync } from 'node:fs';

const ROOT = '/home/user/angora';
const html = readFileSync(ROOT + '/uzakolcek.html', 'utf8');
const packedMatch = html.match(/<script[^>]*id="poi-data"[^>]*>([\s\S]*?)<\/script>/);
if (!packedMatch) throw new Error('uzakolcek.html carries no #poi-data');
const packed = JSON.parse(packedMatch[1]);
const FIELDS = ['id', 'name', 'category', 'subtype', 'iconKey', 'lat', 'lon', 'distanceM', 'bearing', 'tier',
  'address', 'phone', 'website', 'openingHours', 'access', 'osmUrl', 'googleUrl', 'yandexUrl',
  'possibleDuplicate', 'stale', 'lastEdit', 'source'];
const pois = packed.rows.map((row) => Object.fromEntries(FIELDS.map((k, i) => [k, row[i]])));
const center = packed.metadata.center;
const M_LAT = 111132;
const M_LON = 111320 * Math.cos((center.lat * Math.PI) / 180);
const toXY = (p) => [
  +(((p.lon - center.lon) * M_LON)).toFixed(0),
  +((-(p.lat - center.lat) * M_LAT)).toFixed(0),   // map y grows southward
];

// ---- curated chips: for each daily need, the nearest named real place.
// prefer: optional name regex raising campus-representative entries.
const NEEDS = [
  { key: 'durak', category: 'public_transport', subtypes: ['platform', 'bus_stop'], prefix: 'Durak · ' },
  { key: 'anaokulu', category: 'education_research', subtypes: ['kindergarten'] },
  { key: 'park', category: 'parks_recreation', subtypes: ['park'] },
  { key: 'kafe', category: 'food_drink', subtypes: ['cafe', 'bakery'] },
  { key: 'lise', category: 'education_research', subtypes: ['school'] },
  { key: 'spor', category: 'sport', subtypes: ['pitch', 'sports_centre'] },
  { key: 'market', category: 'retail', subtypes: ['convenience', 'supermarket'] },
  { key: 'akaryakit', category: 'mobility_parking', subtypes: ['fuel'] },
  { key: 'cami', category: 'religion', subtypes: ['place_of_worship'] },
  { key: 'eczane', category: 'health', subtypes: ['pharmacy'] },
  { key: 'saglik', category: 'health', subtypes: ['clinic', 'doctors'] },
  { key: 'kampus', category: 'education_research', subtypes: ['university'], prefer: /Fakülte|Kampüs|Üniversite/i },
  { key: 'supermarket', category: 'retail', subtypes: ['supermarket'], prefer: /Migros|A101|Şok|CarrefourSA/i },
  { key: 'ptt', category: 'business_services', subtypes: ['post_office'] },
  { key: 'banka', category: 'finance', subtypes: ['bank'] },
  { key: 'hastane', category: 'health', subtypes: ['hospital'] },
];
const named = pois.filter((p) => p.tier === 'named_place' && p.name && !p.possibleDuplicate);
const used = new Set();
const curated = [];
for (const need of NEEDS) {
  const pool = named
    .filter((p) => p.category === need.category && need.subtypes.includes(p.subtype) && !used.has(p.name))
    .sort((a, b) => a.distanceM - b.distanceM);
  const pick = (need.prefer && pool.find((p) => need.prefer.test(p.name))) || pool[0];
  if (!pick) continue;
  used.add(pick.name);
  const [x, y] = toXY(pick);
  curated.push({
    name: (need.prefix || '') + pick.name,
    kind: need.key, category: pick.category,
    d: Math.round(pick.distanceM), x, y,
  });
}

// ---- quiet dot field: named amenities only, de-cluttered on a 30 m grid.
const GROUPS = [
  { match: /education_research/, color: '#8298b4' },
  { match: /health|emergency/, color: '#c08e9a' },
  { match: /food_drink/, color: '#c8a976' },
  { match: /retail/, color: '#b7a06c' },
  { match: /sport|parks_recreation/, color: '#8fae8b' },
  { match: /business_services|finance|culture_tourism|religion|public_civic|animal_pet/, color: '#a2a8a2' },
];
const groupOf = (cat) => GROUPS.findIndex((g) => g.match.test(cat));
const cells = new Set();
const dots = [];
for (const p of named.sort((a, b) => a.distanceM - b.distanceM)) {
  if (p.distanceM > 2600) continue;
  const g = groupOf(p.category);
  if (g < 0) continue;                       // stops, street furniture, bins, parking stay off the map
  const [x, y] = toXY(p);
  const cell = `${Math.round(x / 30)},${Math.round(y / 30)}`;
  if (cells.has(cell)) continue;
  cells.add(cell);
  dots.push([x, y, g]);
}

const out = {
  generated_for: 'R44 region map',
  source: 'uzakolcek.html · Hatırlı Sokak No:10 Kentsel Donatı Atlası (OSM + Google/Yandex)',
  atlas_generated_at: packed.metadata.generated_at,
  center,
  radius_m: packed.metadata.radius_m,
  total: packed.metadata.total,
  named: packed.metadata.named,
  groups: GROUPS.map((g) => g.color),
  curated,
  dots,
};
writeFileSync(ROOT + '/viewer/src/region-places.json', JSON.stringify(out));
console.log(`region-places.json: ${curated.length} chips, ${dots.length} dots, centre ${center.lat},${center.lon}`);
for (const c of curated) console.log(`  ${c.kind}: ${c.name} (${c.d} m)`);
