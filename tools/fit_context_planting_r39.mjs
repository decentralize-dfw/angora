// Context planting and neighbour-block corrections, applied on top of the
// curb re-projection (tools/reproject_curb_to_ground: see docs). Everything
// here is node-level surgery on the delivered context.glb:
//
//  - B19's four roof nodes take the green-tile mesh family B20 already uses:
//    the two blocks share the plan's green-roof note, and B19 alone shipped
//    with the terracotta family
//  - the three duplicate trees (each within 0.8 m of its twin) and the one
//    tree standing in the carriageway are removed - 4 x 24 nodes
//  - the remaining trees drop or rise onto the terrain under them
//    (trunk base = terrain + 0.040), by the measured per-tree deltas
//  - the 20 canopy meshes collapse onto the 2 shapes they all are (measured
//    max deviation 0.3 mm): 18 meshes freed, ~648k triangles shared
//
// Usage: node fit_context_planting_r39.mjs <in.glb> <out.glb> <register.json>
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {prune} from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import fs from 'node:fs';

const [input, output, registerPath] = process.argv.slice(2);
const register = JSON.parse(fs.readFileSync(registerPath));
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});
const document = await io.read(input);
const root = document.getRoot();
const nodes = root.listNodes();
const byName = new Map(nodes.map(node => [node.getName(), node]));

// ---- B19 roof onto the green-tile family ----
let recoloured = 0;
for (const suffix of ['', '.001', '.002', '.003']) {
  const b19 = byName.get('B19 | ÇATII' + suffix), b20 = byName.get('B20 | ÇATII' + suffix);
  if (!b19 || !b20) throw Error('B19/B20 roof pair missing at ' + (suffix || '(base)'));
  b19.setMesh(b20.getMesh());
  recoloured++;
}
const green = root.listMaterials().find(m => m.getName() === 'Neighbor 20 green tiles');
if (!green || green.listParents().length < 2) throw Error('green tile family did not take');
console.log('B19 roof nodes onto the green family:', recoloured);

// ---- tree clusters around each trunk ----
const trunks = nodes.filter(n => /^Tree trunk(\.\d+)?$/.test(n.getName() || ''));
const meshCentre = node => {
  let lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  for (const primitive of node.getMesh().listPrimitives()) {
    const a = primitive.getAttribute('POSITION').getMin([]), b = primitive.getAttribute('POSITION').getMax([]);
    for (let i = 0; i < 3; i++) {lo[i] = Math.min(lo[i], a[i]); hi[i] = Math.max(hi[i], b[i]);}
  }
  const t = node.getTranslation();
  return [(lo[0] + hi[0]) / 2 + t[0], lo[1] + t[1], (lo[2] + hi[2]) / 2 + t[2]];
};
const PART = /^(Tree (trunk|branch|main branch)|Individual folded leaves)(\.\d+)?$/;
const clusters = trunks.map(trunk => {
  const [x, , z] = meshCentre(trunk);
  const index = Number((trunk.getName().match(/\.(\d+)$/) || [, '0'])[1]);
  return {index, trunk, x, z, members: []};
});
for (const node of nodes) {
  if (!PART.test(node.getName() || '') || !node.getMesh()) continue;
  const [x, , z] = meshCentre(node);
  let best = null, bestD = 1e9;
  for (const cluster of clusters) {
    const d = Math.hypot(x - cluster.x, z - cluster.z);
    if (d < bestD) {bestD = d; best = cluster;}
  }
  if (bestD < 6) best.members.push(node);
}
for (const cluster of clusters) if (cluster.members.length !== 24)
  console.log(`  note: CTX${String(cluster.index).padStart(2, '0')} clusters ${cluster.members.length} nodes`);

// ---- remove the duplicates and the carriageway tree ----
const REMOVE = new Set([8, 16, 20, 17]);
let removedTrees = 0;
for (const cluster of clusters) {
  if (!REMOVE.has(cluster.index)) continue;
  for (const node of cluster.members) node.dispose();
  removedTrees++;
}
console.log('trees removed (duplicates + carriageway):', removedTrees);

// ---- canopy instancing: 20 nodes onto shape A / shape B ----
const shapeByName = new Map();
for (const entry of register.context_canopy_instancing_spec) {
  const node = byName.get(entry.node);
  if (!node || node.getMesh() === null) continue; // removed trees fall out here
  const shared = shapeByName.get(entry.shared_mesh) ?? byName.get(entry.shared_mesh)?.getMesh();
  if (!shared) throw Error('shared canopy mesh missing: ' + entry.shared_mesh);
  shapeByName.set(entry.shared_mesh, shared);
  if (node.getMesh() !== shared) {
    node.setMesh(shared);
    node.setTranslation(entry.translation);
    node.setScale(entry.scale);
  }
}
console.log('canopy nodes on shared shapes:', register.context_canopy_instancing_spec.length);

// ---- re-ground: measured per-tree deltas, base = terrain + 0.040 ----
let regrounded = 0;
for (const row of register.context_tree_vertical_fix) {
  const [index, , , terrainTop, , currentBase, targetBase, delta] = row;
  if (REMOVE.has(index)) continue;
  if (Math.abs(delta) < 0.02) continue;
  if (Math.abs(targetBase - (terrainTop + 0.040)) > 0.001) throw Error('register row ' + index + ' is not terrain+0.040');
  const cluster = clusters.find(c => c.index === index);
  if (!cluster) throw Error('no cluster for CTX' + index);
  for (const node of cluster.members) {
    const t = node.getTranslation(); t[1] += delta; node.setTranslation(t);
  }
  regrounded++;
}
console.log('trees re-grounded:', regrounded);

await document.transform(prune());
for (const extension of root.listExtensionsUsed()) if (extension.extensionName === 'KHR_draco_mesh_compression') extension.dispose();
await io.write(output, document);
const meshes = root.listMeshes().length;
console.log('written', output, '- meshes now', meshes);
