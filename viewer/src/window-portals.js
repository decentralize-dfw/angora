import * as THREE from 'three';

// FAZ 7 İŞ 3 - window portal lights. The interior reads flat because it
// is lit by IBL + four spots; a V-Ray interior is lit by its WINDOWS:
// directional, soft, window-shaped. The real fix is the H2 lightmap
// rebake; this is the runtime stand-in the order asks for - a LTC rect
// area light per window opening, positions and normals read off the
// delivered glazing geometry itself (the batched glass mesh carries
// every pane; nothing else in the scene knows where windows are).
//
// Clustering: glazing triangles -> world centroids+areas -> 1.2 m grid
// cells -> connected cells merge into one portal per opening. Skylights
// (|ny| >= 0.6) are dropped; tiny panes (< 0.5 m²) are noise. Per-band
// dedupe keeps the biggest portal of any 2.5 m neighbourhood so a
// mullioned window becomes ONE light, not six - the "oda başına 1-2"
// budget by construction.

const CELL = 1.2;

export function collectWindowPortals(meshes, {minArea = 0.5, dedupe = 2.5} = {}) {
  const cells = new Map();
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const ab = new THREE.Vector3(), ac = new THREE.Vector3(), n = new THREE.Vector3();
  for (const mesh of meshes) {
    const position = mesh.geometry.getAttribute('position');
    const index = mesh.geometry.getIndex();
    const count = index ? index.count : position.count;
    mesh.updateWorldMatrix(true, false);
    for (let i = 0; i < count; i += 3) {
      const ia = index ? index.getX(i) : i, ib = index ? index.getX(i + 1) : i + 1,
        ic = index ? index.getX(i + 2) : i + 2;
      a.fromBufferAttribute(position, ia).applyMatrix4(mesh.matrixWorld);
      b.fromBufferAttribute(position, ib).applyMatrix4(mesh.matrixWorld);
      c.fromBufferAttribute(position, ic).applyMatrix4(mesh.matrixWorld);
      ab.subVectors(b, a); ac.subVectors(c, a); n.crossVectors(ab, ac);
      const area = n.length() / 2;
      if (area < 1e-4) continue;
      n.divideScalar(area * 2);
      if (Math.abs(n.y) >= 0.6) continue;               // skylight/floor glass
      const cx = (a.x + b.x + c.x) / 3, cy = (a.y + b.y + c.y) / 3, cz = (a.z + b.z + c.z) / 3;
      const key = `${Math.round(cx / CELL)},${Math.round(cy / CELL)},${Math.round(cz / CELL)}`;
      const cell = cells.get(key) ?? {area: 0, x: 0, y: 0, z: 0, nx: 0, ny: 0, nz: 0,
        min: new THREE.Vector3(Infinity, Infinity, Infinity),
        max: new THREE.Vector3(-Infinity, -Infinity, -Infinity)};
      cell.area += area;
      cell.x += cx * area; cell.y += cy * area; cell.z += cz * area;
      cell.nx += n.x * area; cell.ny += n.y * area; cell.nz += n.z * area;
      for (const p of [a, b, c]) {cell.min.min(p); cell.max.max(p);}
      cells.set(key, cell);
    }
  }
  // merge adjacent cells (one window often straddles a cell edge)
  const keys = [...cells.keys()];
  const parent = new Map(keys.map(k => [k, k]));
  const find = k => {while (parent.get(k) !== k) k = parent.get(k); return k;};
  for (const key of keys) {
    const [x, y, z] = key.split(',').map(Number);
    for (const [dx, dy, dz] of [[1, 0, 0], [0, 1, 0], [0, 0, 1]]) {
      const other = `${x + dx},${y + dy},${z + dz}`;
      if (cells.has(other)) parent.set(find(other), find(key));
    }
  }
  const merged = new Map();
  for (const key of keys) {
    const root = find(key);
    const cell = cells.get(key);
    const into = merged.get(root);
    if (!into) {merged.set(root, cell); continue;}
    into.area += cell.area;
    into.x += cell.x; into.y += cell.y; into.z += cell.z;
    into.nx += cell.nx; into.ny += cell.ny; into.nz += cell.nz;
    into.min.min(cell.min); into.max.max(cell.max);
  }
  let portals = [...merged.values()]
    .filter(cell => cell.area >= minArea)
    .map(cell => {
      const center = new THREE.Vector3(cell.x, cell.y, cell.z).divideScalar(cell.area);
      const normal = new THREE.Vector3(cell.nx, cell.ny, cell.nz).normalize();
      const size = new THREE.Vector3().subVectors(cell.max, cell.min);
      return {center, normal, area: cell.area,
        width: Math.max(0.4, Math.min(6, Math.max(size.x, size.z))),
        height: Math.max(0.4, Math.min(4, size.y))};
    })
    .sort((p, q) => q.area - p.area);
  // dedupe: the largest portal claims its neighbourhood
  const kept = [];
  for (const portal of portals) {
    if (kept.some(other => other.center.distanceTo(portal.center) < dedupe)) continue;
    kept.push(portal);
  }
  return kept;
}

// The glazing normal has no authored orientation promise; point every
// light INTO the building (away from the exterior) using the plan-view
// centroid of the building bounds.
export function orientPortalsInward(portals, buildingCenter) {
  for (const portal of portals) {
    const outward = new THREE.Vector3(portal.center.x - buildingCenter.x, 0,
      portal.center.z - buildingCenter.z).normalize();
    if (portal.normal.dot(outward) > 0) portal.normal.multiplyScalar(-1);
    portal.outward = outward;
  }
  return portals;
}

// Daylight response: a window facing the sun carries it; every window
// carries the sky. Called from setTime with the live solar state.
export function portalIntensity(portal, {altitude, sunDirection, gain = 1}) {
  const day = Math.max(0, Math.sin(Math.max(0, altitude * Math.PI / 180)));
  const facing = sunDirection
    ? Math.max(0, portal.outward?.dot(sunDirection) ?? 0)
    : 0;
  return gain * (0.55 * day + 1.1 * day * facing);
}

export function createPortalLights(portals, {gain = 1, max = 24} = {}) {
  const group = new THREE.Group();
  group.name = 'Window portal lights';
  for (const portal of portals.slice(0, max)) {
    const light = new THREE.RectAreaLight(0xffffff, 0, portal.width, portal.height);
    light.position.copy(portal.center).addScaledVector(portal.normal, 0.12);
    light.lookAt(portal.center.clone().addScaledVector(portal.normal, 2));
    light.userData.portal = portal;
    light.userData.gain = gain;
    group.add(light);
  }
  return group;
}
