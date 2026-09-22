import * as THREE from 'three';

// Task 1.4 — frustum culling for the batched planting.
//
// context-plants ships as ONE Draco mesh (514 k triangles desktop), so the
// culler sees one bound the size of the settlement and every walk frame pays
// for every tree. context-batch.js already splits the LEGACY delivery on a
// 48 m grid, but it works mesh-by-mesh and rebuilds vertex data; the batched
// part is a single mesh whose extra attributes (_batchid) it refuses anyway.
//
// This splitter works at the triangle level and copies NOTHING: every chunk
// shares the original BufferAttributes - the renderer uploads a shared
// attribute once - and only the index is re-bucketed. Bounds are computed
// from each chunk's own indexed vertices; three's computeBoundingSphere
// reads the whole position attribute and would hand every chunk the whole
// field's bound, which is exactly the null result this exists to avoid.
const CHUNK_M = 48;

export function chunkBatchedMesh(mesh, {chunk = CHUNK_M, minChunks = 4} = {}) {
  const geometry = mesh.geometry, index = geometry.index, position = geometry.attributes.position;
  if (!index || !position) return null;
  const cells = new Map();
  for (let i = 0; i < index.count; i += 3) {
    const a = index.getX(i), b = index.getX(i + 1), c = index.getX(i + 2);
    // 48 m cells forgive a centroid approximated by one corner.
    const key = Math.floor(position.getX(a) / chunk) + ',' + Math.floor(position.getZ(a) / chunk);
    let list = cells.get(key);
    if (!list) { list = []; cells.set(key, list); }
    list.push(a, b, c);
  }
  if (cells.size < minChunks) return null;
  const group = new THREE.Group();
  group.name = mesh.name + ' · ' + cells.size + ' chunks';
  group.position.copy(mesh.position); group.quaternion.copy(mesh.quaternion); group.scale.copy(mesh.scale);
  const vertex = new THREE.Vector3();
  for (const list of cells.values()) {
    const chunkGeometry = new THREE.BufferGeometry();
    for (const [name, attribute] of Object.entries(geometry.attributes)) chunkGeometry.setAttribute(name, attribute);
    chunkGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(list), 1));
    const box = new THREE.Box3();
    for (const i of list) box.expandByPoint(vertex.fromBufferAttribute(position, i));
    chunkGeometry.boundingBox = box;
    chunkGeometry.boundingSphere = box.getBoundingSphere(new THREE.Sphere());
    const piece = new THREE.Mesh(chunkGeometry, mesh.material);
    piece.name = mesh.name;
    piece.userData = {...mesh.userData};
    group.add(piece);
  }
  return group;
}

// Replace every heavy single-mesh under root with its chunked group.
// Returns how many meshes were split, so the caller can log the evidence.
export function chunkModelInPlace(root, {chunk = CHUNK_M, minTriangles = 100_000} = {}) {
  const targets = [];
  root.traverse(object => {
    if (object.isMesh && (object.geometry.index?.count ?? 0) / 3 >= minTriangles) targets.push(object);
  });
  let split = 0;
  for (const mesh of targets) {
    const replacement = chunkBatchedMesh(mesh, {chunk});
    if (!replacement) continue;
    mesh.parent.add(replacement);
    mesh.parent.remove(mesh);
    // The shared attributes live on in the chunks; only the old index dies.
    mesh.geometry.index = null;
    split++;
  }
  return split;
}
