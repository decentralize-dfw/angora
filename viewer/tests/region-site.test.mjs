import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = p => JSON.parse(fs.readFileSync(new URL(p, import.meta.url)));
const site = read('../src/region-site.json');
const streets = read('../src/region-streets.json');
const labels = read('../src/street-labels.json');

// 28.09: bölge haritasının sitesi modelden, OSM'e ölçülerek hizalı.
test('site katmanı: ölçülmüş dönüşüm, villa kendi yerinde, OSM kopyaları işaretli', () => {
  const {deg, tx, ty} = site.transform;
  assert.ok(Math.abs(deg + 164.25) < 1e-9 && tx === 31.5 && ty === 21);
  const [vx, vy] = site.villa.reduce((a, [x, y]) => [a[0] + x / site.villa.length, a[1] + y / site.villa.length], [0, 0]);
  assert.ok(Math.hypot(vx - tx, vy - ty) < 8, 'villa merkezi model orijininin haritadaki yerinde');
  assert.ok(site.houses.length >= 25, 'komşu evler');
  assert.ok(site.osm.hideBuildings.length > 20 && site.osm.hideBuildings.every(i => i >= 0 && i < streets.buildings.length));
  assert.ok(site.osm.replacedRoads.every(i => i >= 0 && i < streets.roads.length));
  for (const ring of [...site.houses, site.villa, site.plot, ...site.roads])
    for (const [x, y] of ring) assert.ok(Number.isFinite(x) && Number.isFinite(y));
});

test('sokak adları: sayısal yerleşim, soldan sağa okunur', () => {
  assert.ok(labels.labels.length >= 1);
  for (const l of labels.labels) {
    assert.ok(l.name && [l.x, l.y, l.z, l.angle, l.length, l.rise].every(Number.isFinite), l.name);
    assert.ok(l.angle > -Math.PI / 2 - 1e-9 && l.angle <= Math.PI / 2 + 1e-9, 'okuma yönü +x');
  }
  assert.ok(labels.labels.some(l => l.name === 'Hatırlı Sokak'));
});
