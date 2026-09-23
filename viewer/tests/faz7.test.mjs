import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {detailFragment, DETAIL_TABLE, detailFor} from '../src/procedural-detail.js';
import {prepareBatchedMaterial} from '../src/batched-material.js';
import {effectiveQuality} from '../src/quality-profile.js';
import {responseMasksFor, applyMaterialResponse} from '../src/material-response-v2.js';
import {createIdleRefine} from '../src/idle-refine.js';

// FAZ 7 (FAZ-7-MASAUSTU.md). The one structural promise every test here
// enforces: mobile rows NEVER move. Desktop equalizes UP behind flags.

const FAZ7 = {postfxV2: true, hybridSunShadow: true, softShadowsV2: true,
  gtaoFullRes: true, screenSpaceReflection: true, exteriorGtao: true};

test('İŞ 4: octave 3 and 4 CODE appears only past the mobile pair, in order', () => {
  const two = detailFragment({octaves: 2, count: 4});
  const four = detailFragment({octaves: 4, count: 4});
  assert.equal((four.match(/angoraNoise\(/g)).length - (two.match(/angoraNoise\(/g)).length, 2);
  assert.ok(!two.includes('*13.9') && !two.includes('*51.7'), 'mobile/2-octave form carries no high octaves');
  assert.ok(four.indexOf('*3.7') < four.indexOf('*13.9') && four.indexOf('*13.9') < four.indexOf('*51.7'));
});

test('İŞ 4: detailBoost scales the uniform (roughness hardest), table stays pristine', () => {
  const material = new THREE.MeshStandardMaterial();
  material.userData.angoraBatch = {grid: 1, pad: 0.0078, inner: 0.9844, materials: ['STRUCCO']};
  prepareBatchedMaterial(material, {proceduralDetail: true, detailOctaves: 4,
    detailBoost: {albedo: 1.5, roughness: 2}});
  const shader = {uniforms: {}, vertexShader: '#include <begin_vertex>',
    fragmentShader: '#include <map_fragment>\n#include <roughnessmap_fragment>'};
  material.onBeforeCompile(shader, null);
  const cell = shader.uniforms.uDetail.value[0];
  const stucco = detailFor('STRUCCO');
  assert.ok(Math.abs(cell.x - stucco.x * 1.5) < 1e-9);
  assert.ok(Math.abs(cell.y - stucco.y * 2) < 1e-9);
  assert.equal(stucco.x, 0.05, 'DETAIL_TABLE vector not mutated');
  assert.match(material.customProgramCacheKey(), /\|pdetail-v1:4/);
});

test('İŞ 2+5+1: desktop rows equalize UP behind flags; both desktops identical', () => {
  for (const tier of ['desktop-balanced', 'desktop-high']) {
    const q = effectiveQuality(tier, 'villa', {features: FAZ7});
    assert.equal(q.shadowType, 'pcss', tier);
    assert.equal(q.shadowMapSize, 4096, tier);
    assert.equal(q.gtaoResolutionScale, 1, tier);
    assert.equal(q.ssr, true, tier);
    assert.equal(q.planarPoolReflection, 0.5, tier);
  }
  const off = effectiveQuality('desktop-balanced', 'villa', {features: {postfxV2: true, hybridSunShadow: true}});
  assert.equal(off.shadowType, 'pcfsoft', 'flags off = FAZ 6 exactly');
  assert.equal(off.shadowMapSize, 2048);
  assert.equal(off.gtaoResolutionScale, 0.5);
  assert.equal(off.ssr, undefined);
  assert.equal(off.planarPoolReflection, 0.25);
});

test('KURAL: mobile rows are byte-identical with every FAZ 7 flag on', () => {
  const base = {postfxV2: true, hybridSunShadow: true};
  const all = {...base, softShadowsV2: true, gtaoFullRes: true, screenSpaceReflection: true,
    windowPortalLight: true, proceduralDetailHigh: true, materialResponseV2: true, cinemaDof: true};
  for (const tier of ['mobile-low', 'mobile-high']) {
    for (const view of ['region', 'neighborhood', 'floor', 'interior', 'plan']) {
      assert.deepEqual(effectiveQuality(tier, view, {features: all}),
        effectiveQuality(tier, view, {features: base}), `${tier}/${view}`);
    }
  }
});

test('İŞ 6: family masks - lacquer coats, fabric sheens, metals and glass stay out', () => {
  const masks = responseMasksFor({materials: ['wood_floor.001', 'WHT', 'blue_fabric',
    'FINISH | Silver mirror', 'glass', 'R31 | R33 sofa feet walnut']});
  assert.deepEqual(masks.coat, [1, 0, 0, 0, 0, 0]);
  assert.deepEqual(masks.sheen, [0, 0, 1, 0, 0, 0], 'sofa FEET are walnut, not fabric');
  assert.equal(responseMasksFor({materials: ['STRUCCO', 'metal']}).coat, null);
});

test('İŞ 6: upgrade keeps batch + maps, injects per-cell gates, keys the program', () => {
  const map = new THREE.Texture();
  const material = new THREE.MeshStandardMaterial({map, roughness: 0.7});
  material.userData.angoraBatch = {grid: 2, pad: 0.0039, inner: 0.2422,
    materials: ['wood_floor.001', 'blue_fabric', 'WHT']};
  const physical = applyMaterialResponse(material);
  assert.notEqual(physical, material);
  assert.ok(physical.isMeshPhysicalMaterial);
  assert.equal(physical.map, map, 'texture reference carried');
  assert.deepEqual(physical.userData.angoraBatch.materials, material.userData.angoraBatch.materials);
  assert.equal(physical.roughness, 0.7);
  assert.ok(physical.clearcoat > 0 && physical.sheen > 0);
  const shader = {uniforms: {}, vertexShader: '', fragmentShader: '#include <lights_physical_fragment>'};
  physical.onBeforeCompile(shader, null);
  assert.deepEqual(shader.uniforms.uCoatCell.value, [1, 0, 0]);
  assert.deepEqual(shader.uniforms.uSheenCell.value, [0, 1, 0]);
  assert.match(shader.fragmentShader, /material\.clearcoat\*=uCoatCell/);
  assert.match(shader.fragmentShader, /material\.sheenColor\*=uSheenCell/);
  assert.match(physical.customProgramCacheKey(), /\|mrv2:100\.010/);
  // a batch with no family member is returned UNTOUCHED - zero trace
  const plain = new THREE.MeshStandardMaterial();
  plain.userData.angoraBatch = {grid: 1, materials: ['STRUCCO']};
  assert.equal(applyMaterialResponse(plain), plain);
});

test('İŞ 7: the aperture walk keeps the FOCUS plane pixel-fixed and blurs off-plane', () => {
  const refine = createIdleRefine({renderer: {getDrawingBufferSize: v => v.set(1600, 900)}});
  const camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.1, 500);
  camera.position.set(0, 0, 0);
  camera.updateMatrixWorld();
  camera.updateProjectionMatrix();
  const focus = 26;
  refine.setDof({focus, aperture: 0.12});
  const focusPoint = new THREE.Vector3(3, 1, -focus);
  const farPoint = new THREE.Vector3(3, 1, -200);
  const focusHome = focusPoint.clone().project(camera);
  const farHome = farPoint.clone().project(camera);
  let farMoved = 0;
  for (let i = 0; i < 8; i++) {
    const shift = refine.dofShift(camera);
    assert.ok(shift, 'dof armed');
    const ndc = focusPoint.clone().project(camera);
    assert.ok(Math.abs(ndc.x - focusHome.x) < 1e-6 && Math.abs(ndc.y - focusHome.y) < 1e-6,
      `focus plane fixed (sample ${i}: ${ndc.x - focusHome.x})`);
    const far = farPoint.clone().project(camera);
    farMoved = Math.max(farMoved, Math.hypot(far.x - farHome.x, far.y - farHome.y));
    refine.undoDofShift(camera, shift);
  }
  assert.ok(farMoved > 1e-4, `far point walks the aperture disc (${farMoved})`);
  // disarmed = no-op
  refine.setDof(null);
  assert.equal(refine.dofShift(camera), null);
});

test('İŞ 2: the PCSS rewrite is anchored, reversible and idempotent', async () => {
  const {pcssShadowChunk, installPcss, uninstallPcss} = await import('../src/pcss.js');
  const pristine = THREE.ShaderChunk.shadowmap_pars_fragment;
  const patched = pcssShadowChunk();
  assert.ok(patched.includes('angoraPenumbra') && patched.includes('angoraPCSS'));
  assert.ok(patched.indexOf('angoraPCSS(') < patched.indexOf('#if defined( SHADOWMAP_TYPE_PCF )'),
    'early return lands before the constant-radius PCF branch');
  assert.ok(patched.indexOf('float getShadow') < patched.indexOf('return angoraPCSS'),
    'the return sits INSIDE getShadow');
  assert.ok(patched.includes('SHADOWMAP_TYPE_VSM'), 'other branches survive');
  assert.equal(installPcss(), true);
  assert.equal(installPcss(), false, 'idempotent');
  assert.ok(THREE.ShaderChunk.shadowmap_pars_fragment.includes('angoraPCSS'));
  uninstallPcss();
  assert.equal(THREE.ShaderChunk.shadowmap_pars_fragment, pristine, 'flag-off chunk byte-identical');
});

test('İŞ 3: glazing panes cluster into per-opening portals; skylights and slivers drop', async () => {
  const {collectWindowPortals, orientPortalsInward, portalIntensity} =
    await import('../src/window-portals.js');
  const wallWindow = (x, z = 0) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.2));
    mesh.position.set(x, 1.5, z);           // pane facing +z
    mesh.updateMatrixWorld();
    return mesh;
  };
  const skylight = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  skylight.rotation.x = -Math.PI / 2; skylight.position.set(0, 9, 0);
  skylight.updateMatrixWorld();
  const sliver = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3));
  sliver.position.set(20, 1.5, 0); sliver.updateMatrixWorld();
  // a mullioned pair 0.8 m apart = ONE opening
  const portals = collectWindowPortals([wallWindow(0), wallWindow(0.8), wallWindow(8), skylight, sliver]);
  assert.equal(portals.length, 2, `mullion merged, skylight+sliver dropped: ${portals.length}`);
  assert.ok(portals[0].area > portals[1].area, 'sorted by area');
  orientPortalsInward(portals, new THREE.Vector3(0, 0, -10));   // building behind the panes
  for (const portal of portals) {
    assert.ok(portal.normal.z < 0, 'light points INTO the building');
    assert.ok(portal.outward.z > 0.6, 'outward recorded');
  }
  const sunOn = portalIntensity(portals[0], {altitude: 40, sunDirection: new THREE.Vector3(0, 0.6, 0.8).normalize()});
  const sunOff = portalIntensity(portals[0], {altitude: 40, sunDirection: new THREE.Vector3(0, 0.6, -0.8).normalize()});
  const night = portalIntensity(portals[0], {altitude: -5, sunDirection: new THREE.Vector3(0, 0.6, 0.8).normalize()});
  assert.ok(sunOn > sunOff && sunOff > 0, 'sun-facing window carries the sun, the rest carry sky');
  assert.equal(night, 0, 'no portal light at night');
});
