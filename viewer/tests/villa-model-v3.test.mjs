import test from 'node:test';
import assert from 'node:assert/strict';
import {applyVillaModelV3, VILLA_MODEL_V3} from '../src/villa-model-v3.js';
import {DEFAULT_FEATURES} from '../src/features.js';

// 26.09.2026 yüklemesi: ürün sahibinin kendi malzeme yazarlığını yaptığı
// BUILDING-opt-v3 / GARDEN-opt-v2 / INTERIOR-opt-v2. Değişim manifest
// seviyesinde: yalnız üç parçanın dosya adı. Eskiler silinmiyor, bayrak
// kapanınca teslimat bire bir eskiye dönüyor.

const manifest = () => ({
  batched: true,
  parts: [
    {name: 'architecture', file: 'architecture.glb', gpu_sha256: 'a'.repeat(64), bytes: 5856884},
    {name: 'interior', file: 'interior.glb', gpu_sha256: 'b'.repeat(64), bytes: 2306867},
    {name: 'garden', file: 'garden.glb', gpu_sha256: 'c'.repeat(64), bytes: 62914},
    {name: 'context-ground', file: 'context-ground.glb', gpu_sha256: 'd'.repeat(64), bytes: 570068},
    {name: 'context-buildings', file: 'context-buildings.glb', gpu_sha256: 'e'.repeat(64), bytes: 8081560},
    {name: 'context-plants', file: 'context-plants.glb', gpu_sha256: 'f'.repeat(64), bytes: 5559000},
  ],
});

test('üç villa parçası değişir, ÇEVRE parçalarına dokunulmaz', () => {
  const m = manifest();
  const swapped = applyVillaModelV3(m);
  assert.deepEqual(swapped.sort(), ['architecture', 'garden', 'interior']);

  const byName = Object.fromEntries(m.parts.map(p => [p.name, p]));
  assert.equal(byName.architecture.file, '../../26092026/BUILDING-opt-v4.glb');
  assert.equal(byName.garden.file, '../../26092026/GARDEN-opt-v2.glb');
  assert.equal(byName.interior.file, '../../26092026/INTERIOR-opt-v2.glb');

  // çevre aynen kalmalı - villa değişimi mahalleyi ellemez
  for (const name of ['context-ground', 'context-buildings', 'context-plants']) {
    assert.equal(byName[name].file, name + '.glb', name + ' dokunulmamalı');
    assert.ok(byName[name].gpu_sha256, name + ' hash durmalı');
  }
});

test('eski gpu_sha256 SİLİNİR - yoksa yanlış önbellek anahtarı yazılır', () => {
  const m = manifest();
  applyVillaModelV3(m);
  for (const part of m.parts) {
    if (!VILLA_MODEL_V3[part.name]) continue;
    assert.equal(part.gpu_sha256, undefined,
      part.name + ': hash eski dosyanın içeriğiydi, acquire onu ?v= olarak yazardı');
  }
});

test('bytes gerçek dosya boyutuna güncellenir (ilerleme çubuğu ağırlığı)', () => {
  const m = manifest();
  applyVillaModelV3(m);
  const byName = Object.fromEntries(m.parts.map(p => [p.name, p]));
  assert.equal(byName.architecture.bytes, 5999548);
  assert.equal(byName.garden.bytes, 7071908);
  assert.equal(byName.interior.bytes, 4770284);
});

test('batched olmayan veya parçasız manifest ellenmez', () => {
  const classic = {batched: false, parts: [{name: 'architecture', file: 'architecture.gltf'}]};
  assert.deepEqual(applyVillaModelV3(classic), []);
  assert.equal(classic.parts[0].file, 'architecture.gltf');
  assert.deepEqual(applyVillaModelV3({}), []);
  assert.deepEqual(applyVillaModelV3(null), []);
});

// MOBİL İŞ EMRİ İŞ 1+2: telefon aynı üç modeli 256 px ETC1S KTX2 dokulu
// kopyalardan alır (26092026/mobile/). Kaynak dosyalara dokunulmaz;
// masaüstü eşlemesi bire bir aynı kalır.
test('mobil eşleme KTX2 kopyaları gösterir, çevre yine ellenmez', () => {
  const m = manifest();
  const swapped = applyVillaModelV3(m, {mobile: true});
  assert.deepEqual(swapped.sort(), ['architecture', 'garden', 'interior']);
  const byName = Object.fromEntries(m.parts.map(p => [p.name, p]));
  assert.equal(byName.architecture.file, '../../26092026/mobile/BUILDING-opt-v4.ktx2.glb');
  assert.equal(byName.garden.file, '../../26092026/mobile/GARDEN-opt-v2.ktx2.glb');
  assert.equal(byName.interior.file, '../../26092026/mobile/INTERIOR-opt-v2.ktx2.glb');
  assert.equal(byName.architecture.bytes, 3694708);
  assert.equal(byName.garden.bytes, 4947588);
  assert.equal(byName.interior.bytes, 4229468);
  assert.equal(byName.architecture.gpu_sha256, undefined);
  for (const name of ['context-ground', 'context-buildings', 'context-plants']) {
    assert.equal(byName[name].file, name + '.glb', name + ' dokunulmamalı');
  }
});

test('mobil bayrak açık ship ediliyor (villaModelV3Mobile)', () => {
  assert.equal(DEFAULT_FEATURES.villaModelV3Mobile, true);
});

test('bayrak açık ship ediliyor ve tek bayrakla geri alınabilir', () => {
  assert.equal(DEFAULT_FEATURES.villaModelV3, true);
  // kapalıyken manifest'e hiç dokunulmadığı main tarafında şart; burada
  // değişimin YERİNDE ve geri dönülebilir olduğu garanti altına alınıyor:
  // dosya adı dışında parça kimliği (name) korunur, yoksa teslimat sırası
  // ve görünürlük kuralları ('interior' adına bakıyorlar) bozulurdu.
  const m = manifest();
  const before = m.parts.map(p => p.name);
  applyVillaModelV3(m);
  assert.deepEqual(m.parts.map(p => p.name), before, 'parça adları ve sıra korunmalı');
});

// 27.09 çevre v2 - villadan ayrı, kendi bayrağıyla.
import {applyContextV2} from '../src/villa-model-v3.js';
test('çevre v2: komşu ve zemin dosyası değişir, eski ağaç parçası çıkar, villa ellenmez', () => {
  const m = manifest();
  const changed = applyContextV2(m);
  assert.deepEqual(changed.sort(), ['-context-plants', 'context-buildings', 'context-ground']);
  const byName = Object.fromEntries(m.parts.map(p => [p.name, p]));
  assert.equal(byName['context-buildings'].file, '../../26092026/KOMSULAR-opt-v2.glb');
  assert.equal(byName['context-ground'].file, '../../26092026/CEVRE-YOL-opt-v2.glb');
  assert.equal(byName['context-plants'], undefined);
  assert.equal(byName.architecture.file, 'architecture.glb');
  const mobile = manifest(); applyContextV2(mobile, {mobile: true});
  assert.match(mobile.parts.find(p => p.name === 'context-buildings').file, /mobile\/KOMSULAR-opt-v2\.ktx2\.glb$/);
  assert.equal(DEFAULT_FEATURES.contextV2, true);
});
