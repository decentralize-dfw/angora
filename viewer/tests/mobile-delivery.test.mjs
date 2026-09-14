import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// The phone opens the same scene through a derived manifest: simplified
// geometry, capped textures, no relief maps. These checks keep the derived
// set honest against the full one - same identity, strictly smaller cost.
const FULL = new URL('../public/models/full/', import.meta.url);
const full = JSON.parse(readFileSync(new URL('manifest.json', FULL), 'utf8'));
const mobile = JSON.parse(readFileSync(new URL('manifest-mobile.json', FULL), 'utf8'));

test('The mobile manifest is the full manifest, lighter and nothing else', () => {
  assert.equal(mobile.profile, 'mobile');
  assert.equal(full.profile, 'full');
  assert.equal(mobile.assets.length, 3);
  assert.deepEqual(mobile.assets.map((a) => a.id), full.assets.map((a) => a.id));
  // the walk and the lift bind to the same native revision either way
  assert.equal(mobile.source_native_sha256, full.source_native_sha256);
  assert.deepEqual(mobile.navigation, full.navigation);
  for (const asset of mobile.assets) {
    assert.match(asset.file, /-m\.glb$/);
    const fullAsset = full.assets.find((a) => a.id === asset.id);
    assert.ok(asset.triangles < fullAsset.triangles, `${asset.id}: ${asset.triangles} < ${fullAsset.triangles}`);
    assert.ok(asset.bytes < fullAsset.bytes, `${asset.id} bytes shrink`);
  }
  const totalTris = mobile.assets.reduce((s, a) => s + a.triangles, 0);
  assert.ok(totalTris < 2_100_000, `${totalTris} triangles fits a phone budget`);
});

test('Every mobile file is present, hashed, and byte-identical across mirrors', () => {
  for (const asset of mobile.assets) {
    const bytes = readFileSync(new URL(asset.file, FULL));
    assert.equal(bytes.length, asset.bytes, `${asset.file} size`);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256, `${asset.file} sha`);
    const delivery = readFileSync(new URL(`../../build/web/full/${asset.file}`, import.meta.url));
    assert.ok(bytes.equals(delivery), `${asset.file} mirror matches delivery`);
  }
});

test('The viewer selects the mobile manifest by device and honours overrides', () => {
  const source = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  assert.match(source, /manifest-mobile\.json/);
  assert.match(source, /model.*full|forcedModel/s);
  assert.match(source, /pointer: coarse/);
});
