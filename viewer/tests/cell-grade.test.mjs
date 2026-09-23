import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {applyCellGrade, cellRuleFor, FAMILY_LAYERS} from '../src/cell-grade.js';
import {reviveBatchedGrade} from '../src/exterior-grade.js';

// KAPANIŞ İŞ 4 (gradeAnyGridV1 v2): family texture ARRAYS - the sampler
// budget that killed the first attempt is structural now: 3 units total,
// whatever the batch carries.

const fakeFamilies = () => Object.fromEntries(Object.entries(FAMILY_LAYERS)
  .map(([channel, names]) => [channel,
    {texture: {anisotropy: 1}, layers: new Map(names.map((n, i) => [n, i]))}]));

const SHEET_KEYS = ['clayTileMap', 'clayTileNormal', 'clayTileOrm', 'grassMap', 'grassNormal',
  'grassOrm', 'asphaltMap', 'asphaltNormal', 'asphaltOrm', 'travertineMap', 'travertineNormal',
  'travertineOrm', 'stuccoMap', 'stuccoMapSoft', 'stuccoNormal', 'stuccoOrm', 'limestoneMap',
  'limestoneNormal', 'limestoneOrm', 'timberMap', 'timberNormal', 'timberOrm', 'metalNormal', 'metalOrm'];
const fakeSets = () => Object.fromEntries(SHEET_KEYS
  .map(name => [name, Object.assign(new THREE.Texture(), {repeat: new THREE.Vector2(1, 1)})]));

function batched(members, grid) {
  const material = new THREE.MeshStandardMaterial();
  material.userData.angoraBatch = {grid, pad: 0.0039, inner: 0.2422, materials: members};
  return material;
}

test('rules: ground world-space+upOnly, roofs world 2.4 shared, water/glass never match', () => {
  assert.equal(cellRuleFor('R31 | R39 continuous grass ground').world, 4.5);
  const roof = cellRuleFor('roof.004');
  assert.equal(roof.world, 2.4, 'dünya-uzayı: her çatıda aynı 34 cm karo');
  assert.equal(cellRuleFor('Neighbor 20 green tiles'), roof);
  assert.equal(cellRuleFor('roof-7'), roof);
  for (const name of ['water', 'glass', 'Context glazing', 'Lift | Photographed rose glass 80 percent']) {
    assert.equal(cellRuleFor(name), null, name);
  }
});

test('İŞ 4.1: THREE array units, layer-indexed - no per-cell samplers anywhere', () => {
  const material = batched(['roof.004', 'water', 'R31 | R39 continuous grass ground',
    'R31 | R39 boundary limestone top'], 2);
  const applied = applyCellGrade(material, fakeFamilies());
  assert.equal(applied, 3, 'roof + grass + limestone; water untouched');
  const shader = {uniforms: {}, vertexShader: '#include <begin_vertex>',
    fragmentShader: ['#include <uv_pars_fragment>', '#include <color_fragment>',
      '#include <emissivemap_fragment>'].join('\n')};
  material.onBeforeCompile(shader, null);
  const samplers = (shader.fragmentShader.match(/uniform highp sampler2DArray/g) ?? []).length;
  assert.equal(samplers, 3, 'exactly three units: color/normal/orm arrays');
  assert.ok(!shader.fragmentShader.includes('uCellTex'), 'per-cell samplers are gone');
  assert.ok(shader.uniforms.uCellColor && shader.uniforms.uCellOrm && shader.uniforms.uCellNormal);
  assert.equal(shader.uniforms.uCellP.value[1].x, 0, 'water cell inactive');
  assert.ok(shader.fragmentShader.includes('roughnessFactor=clamp(cgOrm.g'), 'ORM overrides the flat response');
  assert.ok(shader.fragmentShader.includes('an.x>an.z?vCellWorld.zy'), 'dominant-axis wall projection');
  assert.ok(shader.fragmentShader.indexOf('angoraCellUv') >
            shader.fragmentShader.indexOf('#include <uv_pars_fragment>'), 'helper after three varyings');
  assert.match(material.customProgramCacheKey(), /\|cell-grade-v2:/);
  assert.equal(applyCellGrade(material, fakeFamilies()), 0, 'idempotent');
});

test('kabul: revive applied >= 14 over the delivery layout, arrays via closure', () => {
  const group = new THREE.Group();
  for (const name of ['Clay tile', 'STRUCCO', 'stone_tile', 'ceiling.004',
    'neighbor_wall', 'Retaining wall rough limestone.001', 'metal', 'wood_dark.002']) {
    const material = batched([name], 1);
    material.userData.angoraBatch.pad = 4 / 512;
    material.userData.angoraBatch.inner = 504 / 512;
    group.add(new THREE.Mesh(new THREE.BoxGeometry(), material));
  }
  group.add(new THREE.Mesh(new THREE.BoxGeometry(),
    batched(['R31 | R39 continuous grass ground', 'R31 | R37 fine asphalt aggregate',
      'Entrance coursed limestone.001', 'R31 | R39 boundary limestone top'], 2)));
  group.add(new THREE.Mesh(new THREE.BoxGeometry(),
    batched(['roof.004', 'Neighbor 20 green tiles'], 2)));
  group.add(new THREE.Mesh(new THREE.BoxGeometry(),
    batched(['roof-7', 'white_trim (5)', 'canopy.001', 'chrome (5)', 'metal (5)', 'gravel', 'x', 'y'], 4)));
  const families = fakeFamilies();
  const applied = reviveBatchedGrade(new Map([['a', group]]), fakeSets(),
    {anyGrid: true, cellGrade: (m, _s, o) => applyCellGrade(m, families, o)});
  assert.ok(applied >= 14, `applied ${applied} >= 14`);
});

test('KAPANIŞ 4.3: STRUCCO keeps its colour - no albedo binding on the facade', () => {
  const group = new THREE.Group();
  const material = batched(['STRUCCO'], 1);
  material.color.setRGB(0.9, 0.86, 0.8);
  group.add(new THREE.Mesh(new THREE.BoxGeometry(), material));
  reviveBatchedGrade(new Map([['a', group]]), fakeSets());
  assert.equal(material.map, null, 'no colour sheet on the facade');
  assert.ok(Math.abs(material.color.r - 0.9) < 1e-6, 'facade colour untouched');
  assert.ok(material.roughnessMap, 'flatness broken by ORM instead');
  assert.ok(material.normalMap, 'relief kept');
});
