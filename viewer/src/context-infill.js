import * as THREE from 'three';
import plan from './context-infill.json';

const PAD = 0.35;

function cutDonor(root, bounds) {
  const min = new THREE.Vector3(bounds[0][0] - PAD, bounds[0][1] - PAD, bounds[0][2] - PAD);
  const max = new THREE.Vector3(bounds[1][0] + PAD, bounds[1][1] + PAD, bounds[1][2] + PAD);
  const centre = new THREE.Vector3((min.x + max.x) / 2, bounds[0][1], (min.z + max.z) / 2);
  const inverse = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const local = new THREE.Matrix4(), normals = new THREE.Matrix3();
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const na = new THREE.Vector3(), nb = new THREE.Vector3(), nc = new THREE.Vector3();
  const parts = [];
  root.traverse(source => {
    if (!source.isMesh || source.userData.contextInfill) return;
    const position = source.geometry.attributes?.position;
    if (!position) return;
    local.multiplyMatrices(inverse, source.matrixWorld);
    normals.getNormalMatrix(local);
    const normal = source.geometry.attributes.normal, uv = source.geometry.attributes.uv;
    const index = source.geometry.index;
    const triangles = Math.floor((index ? index.count : position.count) / 3);
    const px = [], nx = [], tx = [];
    for (let t = 0; t < triangles; t++) {
      const i0 = index ? index.getX(t * 3) : t * 3;
      const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1;
      const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2;
      a.fromBufferAttribute(position, i0).applyMatrix4(local);
      b.fromBufferAttribute(position, i1).applyMatrix4(local);
      c.fromBufferAttribute(position, i2).applyMatrix4(local);
      const cx = (a.x + b.x + c.x) / 3, cy = (a.y + b.y + c.y) / 3, cz = (a.z + b.z + c.z) / 3;
      if (cx < min.x || cx > max.x || cy < min.y || cy > max.y || cz < min.z || cz > max.z) continue;
      for (const v of [a, b, c]) px.push(v.x - centre.x, v.y - centre.y, v.z - centre.z);
      if (normal) {
        na.fromBufferAttribute(normal, i0).applyMatrix3(normals).normalize();
        nb.fromBufferAttribute(normal, i1).applyMatrix3(normals).normalize();
        nc.fromBufferAttribute(normal, i2).applyMatrix3(normals).normalize();
        for (const v of [na, nb, nc]) nx.push(v.x, v.y, v.z);
      }
      if (uv) for (const i of [i0, i1, i2]) tx.push(uv.getX(i), uv.getY(i));
    }
    if (px.length < 9) return;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(px), 3));
    if (nx.length === px.length) geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nx), 3));
    else geometry.computeVertexNormals();
    if (tx.length / 2 === px.length / 3) geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(tx), 2));
    parts.push({geometry, source, triangles: px.length / 9});
  });
  return {parts, centre};
}

export function createContextInfill(root) {
  root.updateMatrixWorld(true);
  const {parts, centre} = cutDonor(root, plan.donor.bounds);
  const group = new THREE.Group(); group.name = 'R50 context infill';
  group.userData.contextInfill = true;
  const added = [];
  if (!parts.length) return {group, added, parts: 0, triangles: 0};
  let triangles = 0;
  for (const entry of plan.entries) {
    const block = new THREE.Group();
    block.name = `R50 infill ${entry.number ?? entry.evidence}`;
    block.position.set(centre.x + entry.offset[0], centre.y + entry.offset[1], centre.z + entry.offset[2]);
    for (const part of parts) {
      const mesh = new THREE.Mesh(part.geometry, part.source.material);
      mesh.userData.contextInfill = true;
      mesh.userData.aoExcluded = part.source.userData.aoExcluded ?? true;
      mesh.userData.clipPlanes = part.source.userData.clipPlanes ?? [];
      mesh.castShadow = part.source.castShadow;
      mesh.receiveShadow = part.source.receiveShadow;
      mesh.renderOrder = part.source.renderOrder;
      block.add(mesh);
      triangles += part.triangles;
    }
    group.add(block);
    added.push({number: entry.number, bounds: entry.bounds ?? null, label: entry.label ?? null,
      evidence: entry.evidence});
  }
  root.add(group);
  return {group, added, parts: parts.length, triangles};
}

export function infillBuildings(added) {
  return added.filter(entry => entry.number != null && entry.label).map(entry => ({
    number: entry.number, position: entry.label, bounds: entry.bounds,
    role: 'neighbour', in_context_glb: false, footprint_status: entry.evidence,
    height_status: 'donor_typology_copy', typology_mirrored: true,
  }));
}
