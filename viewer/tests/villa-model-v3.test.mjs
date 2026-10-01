import test from 'node:test';
import assert from 'node:assert/strict';
import {applyVillaModelV3, VILLA_MODEL_V3} from '../src/villa-model-v3.js';
import {DEFAULT_FEATURES} from '../src/features.js';
import {applyTur10, TUR10_MODELS, TUR10_MODELS_MOBILE} from '../src/villa-model-v3.js';

test('main delivers Tur 10: desktop 512px UASTC, mobile 512px ETC1S copies of the same geometry', () => {
  assert.equal(DEFAULT_FEATURES.tur10, true);
  assert.equal(DEFAULT_FEATURES.lightmaps, true);
  for (const mobile of [false, true]) {
    const m = manifest();
    applyTur10(m, {mobile});
    for (const name of ['architecture', 'interior', 'garden']) {
      const part = m.parts.find(p => p.name === name);
      assert.equal(part.file, '../../26092026/' + (mobile ? TUR10_MODELS_MOBILE : TUR10_MODELS)[name].file);
      assert.match(part.file, mobile ? /\/mobile-tur10\/.*\.ktx2\.glb$/ : /\/ktx512\/.*\.ktx2\.glb$/);
      assert.equal(part.gpu_sha256, undefined);
    }
  }
});

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
  assert.equal(byName['context-buildings'].file, '../../26092026/ktx512/KOMSULAR-opt-v2.ktx2.glb');
  assert.equal(byName['context-ground'].file, '../../26092026/CEVRE-YOL-opt-v2.glb');
  assert.equal(byName['context-plants'], undefined);
  assert.equal(byName.architecture.file, 'architecture.glb');
  const mobile = manifest(); applyContextV2(mobile, {mobile: true});
  assert.match(mobile.parts.find(p => p.name === 'context-buildings').file, /mobile-tur10\/KOMSULAR-opt-v2\.ktx2\.glb$/);
  assert.equal(DEFAULT_FEATURES.contextV2, true);
});

// 28.09 zemin v3: yalnız zemin dosyası değişir, bayrakla v2'ye dönülür.
test('zemin v3: arazi normalli dosya, bayrak kapalıyken v2', () => {
  const m = manifest(); applyContextV2(m, {groundV3: true});
  assert.equal(m.parts.find(p => p.name === 'context-ground').file, '../../26092026/ktx512/CEVRE-YOL-opt-v3.ktx2.glb');
  assert.equal(m.parts.find(p => p.name === 'context-ground').bytes, 1991564);
  assert.equal(m.parts.find(p => p.name === 'context-buildings').file, '../../26092026/ktx512/KOMSULAR-opt-v2.ktx2.glb');
  const mobile = manifest(); applyContextV2(mobile, {mobile: true, groundV3: true});
  assert.match(mobile.parts.find(p => p.name === 'context-ground').file, /mobile-tur10\/CEVRE-YOL-opt-v3\.ktx2\.glb$/);
  const old = manifest(); applyContextV2(old, {groundV3: false});
  assert.equal(old.parts.find(p => p.name === 'context-ground').file, '../../26092026/CEVRE-YOL-opt-v2.glb');
  assert.equal(DEFAULT_FEATURES.terrainNormalsV3, true);
});

import * as THREE from 'three';
import {retileTur10} from '../src/villa-model-v3.js';
test('antre: WC seramiğinin antre yüzü beyaz duvara çevrilir, WC içine bakan seramik kalır, ışık UV ve atlas korunur', () => {
  const model = new THREE.Group();
  const tri = (pts) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts.flat(), 3));
    g.setAttribute('uv1', new THREE.Float32BufferAttribute(pts.map((p, i) => [i * .1, p[1] * .01]).flat(), 2)); g.setIndex(pts.map((_, i) => i)); return g; };
  // antreye (-x) bakan panel üçgeni + WC'nin içine (+x) bakan kendi seramiği
  const ceramic = new THREE.Mesh(tri([[2.938, 3.4, 0.4], [2.938, 3.4, 1.4], [2.938, 5.8, 1.4], [3.098, 4.3, 0.6], [3.098, 5.7, 0.6], [3.098, 4.3, 1.5]]),
    new THREE.MeshStandardMaterial({name: 'R31 | R33 ivory wall ceramic'}));
  ceramic.userData.lightmap = {atlas: 'zemin', texcoord: 1};
  const white = new THREE.Mesh(tri([[0, 0, 0], [0, 1, 0], [0, 0, 1]]), new THREE.MeshStandardMaterial({name: 'Simple White Wall', color: 0xf0eee8}));
  white.userData.lightmap = {atlas: 'duvar', texcoord: 1};
  model.add(ceramic, white);
  const n = new THREE.Vector3();
  const a = new THREE.Vector3(2.938, 3.4, 0.4), b = new THREE.Vector3(2.938, 3.4, 1.4), c = new THREE.Vector3(2.938, 5.8, 1.4);
  n.subVectors(b, a).cross(c.clone().sub(a)).normalize();
  assert.ok(n.x < -0.98, 'test üçgeni -x yönüne bakmalı');
  assert.equal(retileTur10(model), 1);
  assert.equal(ceramic.geometry.index.count, 3);
  const added = model.children.find(o => o.name.endsWith('_yeni_yuz'));
  assert.ok(added); assert.equal(added.material.name, 'Simple White Wall'); assert.notEqual(added.material, white.material);
  assert.deepEqual(added.userData.lightmap, {atlas: 'zemin', texcoord: 1});
  const p = added.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) assert.ok(Math.abs(p.getX(i) - 2.938) < 1e-6);
  assert.equal(p.count, 3);
  assert.ok(added.geometry.attributes.uv1);
  assert.equal(p.count % 3, 0);
});
import {borrowTur10} from '../src/villa-model-v3.js';
test('garaj: açıklığın çevresi sağ ayağın cephe sıvasına ve cephe ışığına bağlanır, garajın içine bakan yüz kalır', () => {
  const model = new THREE.Group();
  const mk = (pts, uv1, name, atlas) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts.flat(), 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(pts.map(p => [p[0], p[1]]).flat(), 2));
    g.setAttribute('uv1', new THREE.Float32BufferAttribute(uv1.flat(), 2)); g.setIndex(pts.map((_, i) => i));
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({name})); m.name = 'LM_' + atlas; m.userData.lightmap = {atlas, texcoord: 1}; return m; };
  // kaynak: sağ ayağın ön yüzü (+z), cephe atlasında UV1 0,5..0,6
  const post = mk([[7.1, 3.1, 1.40], [7.5, 3.1, 1.40], [7.5, 5.9, 1.40]], [[0.5, 0.5], [0.6, 0.5], [0.6, 0.6]], 'Stucco painted wall', 'cephe');
  // hedef: sol sövenin dışa bakan yüzü (+z) ve garajın içine bakan yüzü (-z)
  const frame = mk([[4.35, 3.1, 1.37], [4.55, 3.1, 1.37], [4.55, 5.5, 1.37], [4.35, 3.1, 1.17], [4.35, 5.5, 1.17], [4.55, 3.1, 1.17]],
    [[0.1, 0.1], [0.2, 0.1], [0.2, 0.2], [0.1, 0.1], [0.1, 0.2], [0.2, 0.1]], 'WHT.001', 'zemin');
  model.add(post, frame);
  assert.equal(borrowTur10(model), 1);
  assert.equal(frame.geometry.index.count, 3, 'içe bakan yüz yerinde kalır');
  const added = model.children.find(o => o.name === 'LM_zemin_cephe_isigi');
  assert.ok(added); assert.equal(added.material, post.material); assert.deepEqual(added.userData.lightmap, {atlas: 'cephe', texcoord: 1});
  const u1 = added.geometry.attributes.uv1;
  for (let i = 0; i < u1.count; i++) { assert.ok(u1.getX(i) >= 0.5 - 1e-6 && u1.getX(i) <= 0.6 + 1e-6); assert.ok(u1.getY(i) >= 0.5 - 1e-6 && u1.getY(i) <= 0.6 + 1e-6); }
  assert.equal(post.geometry.index.count, 3, 'kaynak üçgen yerinde');
});
