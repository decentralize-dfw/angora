import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {applyCellGrade, cellRuleFor} from '../src/cell-grade.js';
import {reviveBatchedGrade} from '../src/exterior-grade.js';

// MALZEME İŞ 2 (gradeAnyGridV1): the grid===1 wall falls. Coverage is
// COUNTED against fake deliveries mirroring the shipped batch layout.

const sets = () => Object.fromEntries(['clayTileMap','clayTileNormal','clayTileOrm','grassMap','grassNormal','grassOrm','asphaltMap','asphaltNormal','asphaltOrm','travertineMap','travertineNormal','travertineOrm','stuccoMap','stuccoMapSoft','stuccoNormal','stuccoOrm','limestoneMap','limestoneNormal','limestoneOrm','timberMap','timberNormal','timberOrm','metalNormal','metalOrm']
  .map(name => [name, Object.assign(new THREE.Texture(), {repeat: new THREE.Vector2(1, 1)})]));

function batched(members, grid) {
  const material = new THREE.MeshStandardMaterial();
  material.userData.angoraBatch = {grid, pad: 0.0039, inner: 0.2422, materials: members};
  return material;
}

test('cell rules: every cell projects from world space, water/glass never match', () => {
  // The owner saw the first pass: 2 m tiled visibly across a field, and the
  // roofs - on the villa's authored repeat, which is calibrated to the villa
  // mesh's UV density - came out as giant blobs on meshes scaled otherwise.
  // Metres are the only figure that means the same thing on every mesh.
  assert.equal(cellRuleFor('R31 | R39 continuous grass ground').world, 7);
  assert.equal(cellRuleFor('R31 | R37 fine asphalt aggregate').world, 5);
  const roof = cellRuleFor('roof.004');
  assert.equal(roof.world, 0.9, 'bir kiremit sırası, mesh UV\'sinden bağımsız');
  assert.equal(roof.repeat, undefined, 'authored UV yolu bırakıldı');
  // The ground sheet is a real grass texture now, not a wash over the
  // delivered green: the owner asked for the texture itself, so blend 1.
  assert.equal(cellRuleFor('R31 | R39 continuous grass ground').blend, 1);
  assert.ok(roof.blend >= 0.9);
  assert.equal(cellRuleFor('Neighbor 20 green tiles'), roof);
  assert.equal(cellRuleFor('roof-7'), roof);
  for (const name of ['water', 'glass', 'Context glazing', 'Lift | Photographed rose glass 80 percent']) {
    assert.equal(cellRuleFor(name), null, name);
  }
});

test('applyCellGrade: per-cell samplers, batchId gate, both anchors survive the batched chain', () => {
  const material = batched(['roof.004', 'water', 'R31 | R39 continuous grass ground', 'STONE-TILE'], 2);
  const applied = applyCellGrade(material, sets());
  assert.equal(applied, 2, 'roof + grass; water and STONE-TILE untouched');
  const shader = {uniforms: {}, vertexShader: '#include <begin_vertex>',
    fragmentShader: '#include <color_fragment>\n#include <emissivemap_fragment>'};
  material.onBeforeCompile(shader, null);
  assert.equal(shader.uniforms.uCellP.value.length, 4);
  assert.equal(shader.uniforms.uCellP.value[1].x, 0, 'water cell inactive');
  assert.equal(shader.uniforms.uCellP.value[2].y, 7, 'grass = world module 7 m');
  assert.equal(shader.uniforms.uCellP.value[2].z, 1, 'grass sheet replaces, not washes');
  assert.equal(shader.uniforms.uCellP.value[0].y, 0.9, 'roof = 0.9 m world course');
  assert.ok(shader.fragmentShader.includes('diffuseColor.rgb=mix('), 'albedo blends in');
  assert.ok(shader.fragmentShader.includes('getTangentFrame'), 'roof normal path in');
  assert.ok(shader.fragmentShader.includes('cgFn.y>=max'), 'per-pixel up-facing guard for world cells');
  assert.match(material.customProgramCacheKey(), /\|cell-grade-v1:/);
  assert.equal(applyCellGrade(material, sets()), 0, 'idempotent');
});

test('kabul: revive applied 8 -> >=14 with anyGrid over the delivery layout', () => {
  const group = new THREE.Group();
  const singles = ['Clay tile', 'STRUCCO', 'stone_tile', 'ceiling.004',
    'neighbor_wall', 'Retaining wall rough limestone.001', 'metal', 'wood_dark.002'];
  for (const name of singles) {
    const material = batched([name], 1);
    material.userData.angoraBatch.pad = 4 / 512;
    material.userData.angoraBatch.inner = 504 / 512;
    group.add(new THREE.Mesh(new THREE.BoxGeometry(), material));
  }
  // the shipped grid>1 batches that carry the complaint surfaces
  group.add(new THREE.Mesh(new THREE.BoxGeometry(),
    batched(['R31 | R39 continuous grass ground', 'R31 | R37 fine asphalt aggregate',
      'Entrance coursed limestone.001', 'R31 | R39 boundary limestone top'], 2)));
  group.add(new THREE.Mesh(new THREE.BoxGeometry(),
    batched(['roof.004', 'Neighbor 20 green tiles'], 2)));
  group.add(new THREE.Mesh(new THREE.BoxGeometry(),
    batched(['roof-7', 'white_trim (5)', 'canopy.001', 'x', 'y', 'z', 'w', 'v'], 4)));
  const models = new Map([['a', group]]);
  const off = reviveBatchedGrade(models, sets());
  assert.equal(off, 8, 'anyGrid kapalı: eski sayı');
  // fresh group (idempotence guards would hide the count otherwise)
  for (const mesh of group.children) {
    delete mesh.material.userData.exteriorGradeDetail;
    delete mesh.material.userData.exteriorGradeScalar;
    delete mesh.material.userData.cellGrade;
    delete mesh.userData.exteriorGradeUV;
  }
  const on = reviveBatchedGrade(models, sets(), {anyGrid: true, cellGrade: applyCellGrade});
  assert.ok(on >= 14, `applied ${on} >= 14 (8 grid1 + çim+asfalt+giriş+2 komşu çatı+roof-7)`);
});
