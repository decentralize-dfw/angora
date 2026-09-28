// Komşu ev taban izleri (KOMSULAR-opt-v2) - XZ ızgarasına rasterlanıp bağlı
// bölgelere ayrılır. Çıktı: [{cx, cz, area, cells}] ve ızgara (0,25 m).
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
export async function readTriangles(file, filter = () => true) {
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.decoder': await draco3d.createDecoderModule()});
  const doc = await io.read(file);
  const tris = [];
  for (const node of doc.getRoot().listNodes()) {
    const mesh = node.getMesh(); if (!mesh) continue;
    const M = node.getWorldMatrix();
    for (const prim of mesh.listPrimitives()) {
      const name = prim.getMaterial()?.getName() ?? '';
      if (!filter(name)) continue;
      const P = prim.getAttribute('POSITION').getArray(), I = prim.getIndices().getArray();
      const w = (i) => { const x = P[i*3], y = P[i*3+1], z = P[i*3+2];
        return [M[0]*x+M[4]*y+M[8]*z+M[12], M[1]*x+M[5]*y+M[9]*z+M[13], M[2]*x+M[6]*y+M[10]*z+M[14]]; };
      for (let t = 0; t < I.length; t += 3) tris.push([w(I[t]), w(I[t+1]), w(I[t+2]), name]);
    }
  }
  return tris;
}
export function rasterize(tris, cell = 0.25) {
  let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
  for (const t of tris) for (const p of t.slice(0, 3)) { minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]); minZ = Math.min(minZ, p[2]); maxZ = Math.max(maxZ, p[2]); }
  const W = Math.ceil((maxX - minX) / cell) + 2, H = Math.ceil((maxZ - minZ) / cell) + 2;
  const grid = new Uint8Array(W * H);
  for (const [a, b, c] of tris) {
    const x0 = Math.floor((Math.min(a[0], b[0], c[0]) - minX) / cell), x1 = Math.ceil((Math.max(a[0], b[0], c[0]) - minX) / cell);
    const z0 = Math.floor((Math.min(a[2], b[2], c[2]) - minZ) / cell), z1 = Math.ceil((Math.max(a[2], b[2], c[2]) - minZ) / cell);
    const area = (b[0]-a[0])*(c[2]-a[2]) - (c[0]-a[0])*(b[2]-a[2]);
    for (let gz = z0; gz <= z1; gz++) for (let gx = x0; gx <= x1; gx++) {
      const px = minX + (gx + .5) * cell, pz = minZ + (gz + .5) * cell;
      if (Math.abs(area) < 1e-9) { continue; }
      const w0 = ((b[0]-px)*(c[2]-pz) - (c[0]-px)*(b[2]-pz)) / area, w1 = ((c[0]-px)*(a[2]-pz) - (a[0]-px)*(c[2]-pz)) / area, w2 = 1 - w0 - w1;
      if (w0 >= -1e-6 && w1 >= -1e-6 && w2 >= -1e-6) grid[gz * W + gx] = 1;
    }
  }
  return {grid, W, H, minX, minZ, cell};
}
export function components({grid, W, H, minX, minZ, cell}, minArea = 20) {
  const label = new Int32Array(W * H).fill(-1), out = [];
  for (let s = 0; s < W * H; s++) {
    if (!grid[s] || label[s] >= 0) continue;
    const id = out.length, stack = [s]; label[s] = id; let n = 0, sx = 0, sz = 0; const cells = [];
    while (stack.length) { const k = stack.pop(); n++; const x = k % W, z = (k / W) | 0; sx += x; sz += z; cells.push(k);
      for (const [dx, dz] of [[1,0],[-1,0],[0,1],[0,-1]]) { const nx = x + dx, nz = z + dz; if (nx < 0 || nz < 0 || nx >= W || nz >= H) continue; const q = nz * W + nx; if (grid[q] && label[q] < 0) { label[q] = id; stack.push(q); } } }
    out.push({id, area: n * cell * cell, cx: minX + (sx / n + .5) * cell, cz: minZ + (sz / n + .5) * cell, cells});
  }
  return {label, comps: out.filter(c => c.area >= minArea)};
}
