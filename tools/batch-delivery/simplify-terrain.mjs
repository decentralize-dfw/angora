// Task 2.4 — terrain tessellation, not terrain SHAPE. context-ground ships
// 311 k triangles whose density describes nothing a 5 cm tolerance cares
// about. Simplify with locked borders, then PROVE the levels survived: the
// plan protects real datums (pool side ~2 m up on the left, 5-6 m down on
// the right, the front/back grade, the lower garden, every road/retaining
// relationship), so the tool refuses to write unless sampled heights match
// the original within 5 cm.
//
//   node tools/batch-delivery/simplify-terrain.mjs [--ratio 0.15]
//     [--error 0.0005] [--out <dir>] [--apply]
//
// Default is a DRY run into --out (scratch): the delivery only changes with
// --apply, and only after every sample passes.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {weld, simplify, draco} from '@gltf-transform/functions';
import {MeshoptSimplifier} from 'meshoptimizer';
import draco3d from 'draco3dgltf';
import * as THREE from 'three';

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const at = args.indexOf('--' + name);
  return at >= 0 ? args[at + 1] : fallback;
};
const apply = args.includes('--apply');
const ratio = Number(option('ratio', '0.15'));
const error = Number(option('error', '0.0005'));
const repo = fileURLToPath(new URL('../../', import.meta.url));
const outBase = option('out', path.join(repo, 'build/qa/terrain-trial'));
const TOLERANCE_M = 0.05;

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});

// The datum witnesses: plot boundary polygon + every context placement
// point, plus a coarse grid over the terrain bounds.
async function samplePoints() {
  const points = [];
  const boundary = JSON.parse(await fs.readFile(path.join(repo, 'build/web/native-current/plot-boundary.json'), 'utf8'));
  for (const [x, y] of boundary.polygon_native_xy ?? []) points.push([x, y]);
  try {
    const placement = JSON.parse(await fs.readFile(path.join(repo, 'build/web/batched/context-placement.json'), 'utf8'));
    for (const entry of placement.buildings ?? placement ?? []) {
      const p = entry.position ?? entry.origin ?? null;
      if (Array.isArray(p)) points.push([p[0], p[2] ?? p[1]]);
    }
  } catch { /* placement optional */ }
  return points;
}

function toThreeMesh(document) {
  const group = new THREE.Group();
  for (const mesh of document.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const positions = prim.getAttribute('POSITION');
      if (!positions) continue;
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions.getArray()), 3));
      const indices = prim.getIndices();
      if (indices) geometry.setIndex(new THREE.BufferAttribute(indices.getArray().slice(), 1));
      group.add(new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({side: THREE.DoubleSide})));
    }
  }
  group.updateMatrixWorld(true);
  return group;
}

function heightAt(group, x, z, ray, down) {
  ray.set(new THREE.Vector3(x, 500, z), down);
  const hits = ray.intersectObjects(group.children, true);
  return hits.length ? hits[0].point.y : null;
}

const summary = [];
for (const profile of ['desktop', 'mobile']) {
  const file = path.join(repo, 'build/web/batched', profile, 'context-ground.glb');
  const original = await io.read(file);
  const source = toThreeMesh(original);
  const before = original.getRoot().listMeshes().flatMap(m => m.listPrimitives())
    .reduce((sum, p) => sum + (p.getIndices()?.getCount() ?? 0) / 3, 0);

  const doc = await io.read(file);
  await MeshoptSimplifier.ready;
  await doc.transform(
    weld({tolerance: 0}),
    simplify({simplifier: MeshoptSimplifier, ratio, error, lockBorder: true}),
  );
  const after = doc.getRoot().listMeshes().flatMap(m => m.listPrimitives())
    .reduce((sum, p) => sum + (p.getIndices()?.getCount() ?? 0) / 3, 0);
  const simplified = toThreeMesh(doc);

  // Witness sampling: named datums + a 12 m grid across the terrain bounds.
  const box = new THREE.Box3().setFromObject(source);
  const points = await samplePoints();
  for (let x = box.min.x; x <= box.max.x; x += 12)
    for (let z = box.min.z; z <= box.max.z; z += 12) points.push([x, z]);
  const ray = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0);
  let worst = 0, tested = 0, failed = 0;
  for (const [x, z] of points) {
    const a = heightAt(source, x, z, ray, down);
    const b = heightAt(simplified, x, z, ray, down);
    if (a === null || b === null) continue;   // off the mesh either way
    tested++;
    const dz = Math.abs(a - b);
    if (dz > worst) worst = dz;
    if (dz > TOLERANCE_M) failed++;
  }

  await doc.transform(draco());
  const outDir = apply ? path.join(repo, 'build/web/batched', profile) : path.join(outBase, profile);
  await fs.mkdir(outDir, {recursive: true});
  const bytes = await io.writeBinary(doc);
  const ok = failed === 0 && tested > 100;
  summary.push({profile, before, after, tested, worst: Number(worst.toFixed(4)), failed, bytes: bytes.length, ok});
  if (!ok) {
    console.error(`${profile}: REFUSED - ${failed}/${tested} samples over ${TOLERANCE_M} m (worst ${worst.toFixed(3)} m)`);
    continue;
  }
  const target = path.join(outDir, 'context-ground.glb');
  await fs.writeFile(target, bytes);
  if (apply) {
    const manifestPath = path.join(repo, 'build/web/batched', profile, 'manifest.json');
    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    const part = manifest.parts.find(p => p.name === 'context-ground');
    part.bytes = bytes.length;
    part.gpu_sha256 = createHash('sha256').update(bytes).digest('hex');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 1));
  }
  console.log(`${profile}: ${before} -> ${after} tris, worst ${worst.toFixed(3)} m over ${tested} samples, ${(bytes.length / 1e6).toFixed(2)} MB ${apply ? 'APPLIED' : '(dry)'}`);
}
await fs.writeFile(path.join(outBase, 'terrain-simplify-report.json'), JSON.stringify({ratio, error, toleranceM: TOLERANCE_M, apply, summary}, null, 2)).catch(() => {});
console.log(JSON.stringify(summary));
