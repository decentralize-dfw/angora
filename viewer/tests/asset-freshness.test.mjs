import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// The bundle carries a content hash in its filename, but the model files do
// not: build/web/full/level-0.glb keeps its name when the geometry changes. A
// returning visitor could otherwise pair a new bundle with models cached before
// the surface repair. Large files are versioned from their manifest hash; the
// two that have no manifest entry are revalidated instead. Neither may be
// requested plain.
const source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');

test('No model file is requested without a version or a revalidation',()=>{
  const inlineFetches=[...source.matchAll(/fetch\(new URL\([^;]*?\)\s*(,\s*\{[^}]*\})?\s*\)/g)];
  assert.ok(inlineFetches.length>=3,'expected the manifest, site context and fallback rooms fetches');
  for(const [call] of inlineFetches){
    assert.ok(call.includes("cache:'no-cache'"),`URL built inline must revalidate: ${call.replace(/\s+/g,' ').slice(0,90)}`);
  }
});

test('Manifest-listed files are requested with their content hash',()=>{
  // Every asset, plus the section atlas, room annotations and navigation.
  const versioned=[...source.matchAll(/searchParams\.set\(\s*'v'\s*,\s*([^)]+)\)/g)].map(m=>m[1]);
  // four data files plus the optional section-caps fetch all carry ?v=<hash>
  assert.equal(versioned.length,5);
  for(const argument of versioned)assert.match(argument,/sha256/);
  // A hash prefix long enough that two builds cannot collide in practice.
  for(const argument of versioned)assert.match(argument,/slice\(0,\s*12/);
});
