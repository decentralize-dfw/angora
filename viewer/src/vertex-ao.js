import * as THREE from 'three';

// FAZ 6 İŞ C - contact darkening. The single biggest V-Ray tell left:
// a wall meets the floor, an eave meets the facade, a shrub meets the
// soil, and the brightness never acknowledges it. hybridSunShadow is a
// DIRECTIONAL term, desktop-only; ambient occlusion at the junctions is a
// different quantity and phones need it too.
//
// Per-vertex, once, off the critical path: the whole settlement is stamped
// into a coarse occupancy grid (one byte per 0.75 m voxel), then every
// receiver vertex casts a small fixed hemisphere of DDA rays through it.
// The result is stored INVERTED (occlusion, 0 = open sky) in a float
// attribute, so a mesh that never got the pass - or a program bound to a
// geometry without the attribute, which three feeds a zero default - reads
// as "no darkening", never as black. The shader multiplies the indirect
// terms only: contact shade is an ambient statement, the sun stays crisp.
//
// The bakes stay authoritative: no geometry is touched, ground-light /
// floor-light / room probes / sourceGeometryHashes are not involved.

export const VOXEL_M = 0.75;
export const RAY_RANGE_M = 4.5;
export const SKIP_TRIANGLES = 200_000;

// Fixed cosine-ish hemisphere fan, built once: azimuth golden-angle walk,
// elevation biased low - the junctions this exists for are sideways and
// downward-adjacent masses, not the zenith.
function hemisphere(count) {
  const rays = [];
  for (let i = 0; i < count; i++) {
    const az = i * 2.399963, el = 0.35 + 0.45 * ((i % 4) / 3);
    rays.push(new THREE.Vector3(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)));
  }
  return rays;
}

export function buildOccupancy(models, {voxel = VOXEL_M} = {}) {
  const box = new THREE.Box3();
  const meshes = [];
  for (const model of models.values()) {
    model.updateWorldMatrix(true, true);
    model.traverse(o => {
      if (!o.isMesh || !o.geometry?.attributes.position) return;
      const materials = Array.isArray(o.material) ? o.material : [o.material];
      // Glass and water do not shade; everything else does, planting included -
      // the soil under a shrub is exactly the point.
      if (materials.every(m => m && (m.transparent || /glass|water|mirror/i.test(m.name)))) return;
      meshes.push(o);
      o.geometry.computeBoundingBox();
      box.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));
    });
  }
  if (meshes.length === 0 || box.isEmpty()) return null;
  box.expandByScalar(voxel);
  const size = box.getSize(new THREE.Vector3());
  const nx = Math.min(512, Math.ceil(size.x / voxel)),
        ny = Math.min(128, Math.ceil(size.y / voxel)),
        nz = Math.min(512, Math.ceil(size.z / voxel));
  const cells = new Uint8Array(nx * ny * nz);
  const v = new THREE.Vector3();
  const stamp = (x, y, z) => {
    const ix = Math.floor((x - box.min.x) / voxel), iy = Math.floor((y - box.min.y) / voxel),
          iz = Math.floor((z - box.min.z) / voxel);
    if (ix >= 0 && iy >= 0 && iz >= 0 && ix < nx && iy < ny && iz < nz) cells[(iy * nz + iz) * nx + ix] = 1;
  };
  for (const mesh of meshes) {
    const position = mesh.geometry.attributes.position, index = mesh.geometry.index;
    const count = index ? index.count : position.count;
    const at = i => v.fromBufferAttribute(position, index ? index.getX(i) : i).applyMatrix4(mesh.matrixWorld);
    for (let i = 0; i + 2 < count; i += 3) {
      const a = at(i).clone(), b = at(i + 1).clone(), c = at(i + 2);
      stamp(a.x, a.y, a.z); stamp(b.x, b.y, b.z); stamp(c.x, c.y, c.z);
      stamp((a.x + b.x + c.x) / 3, (a.y + b.y + c.y) / 3, (a.z + b.z + c.z) / 3);
      // long edges leak between voxels; one midpoint per edge closes most gaps
      stamp((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
      stamp((b.x + c.x) / 2, (b.y + c.y) / 2, (b.z + c.z) / 2);
      stamp((a.x + c.x) / 2, (a.y + c.y) / 2, (a.z + c.z) / 2);
    }
  }
  return {cells, box, voxel, nx, ny, nz,
    occupied(x, y, z) {
      const ix = Math.floor((x - box.min.x) / voxel), iy = Math.floor((y - box.min.y) / voxel),
            iz = Math.floor((z - box.min.z) / voxel);
      if (ix < 0 || iy < 0 || iz < 0 || ix >= nx || iy >= ny || iz >= nz) return false;
      return cells[(iy * nz + iz) * nx + ix] === 1;
    }};
}

// Wall clock, not the idle callback's timeRemaining(): Safari has no
// requestIdleCallback at all, so the fallback used to hand the scheduler a
// FABRICATED `timeRemaining: () => 50` and it never yielded honestly.
const now = () => (globalThis.performance?.now?.() ?? Date.now());

// Reading the clock costs more than a vertex does, so it is read once per
// slice rather than once per vertex.
const CLOCK_EVERY = 256;

// How long one callback may hold the main thread, and how long it steps
// aside for when the browser gives us no idle signal. 8 ms leaves a 60 Hz
// frame its budget; the 12 ms gap keeps the duty cycle around 40% so a
// drag still lands while the bake is running.
const BUDGET_MS = 8;
const GAP_MS = 12;

// One mesh's receivers, RESUMABLE. The loop body is identical to the old
// one-shot bake; what is new is that it can stop at a wall-clock budget and
// pick up at the same vertex.
//
// Why: the scheduler below used to check its deadline BETWEEN meshes, then
// hand a whole mesh to this function. A receiver just under SKIP_TRIANGLES
// carries ~200k vertices; at 10 rays x 6 steps that is ~12 million grid
// lookups in ONE uninterruptible block - measured at 3,3 s per mesh under
// 6x CPU throttling, repeating for every such mesh. The scene rendered and
// then refused every touch, which is exactly what the phone showed. The
// deadline check was real; its granularity was the bug.
//
// Returns null when the mesh opts out (too big, no normals, already baked).
export function createMeshBake(mesh, grid, {rays = 12, strength = 0.55} = {}) {
  const geometry = mesh.geometry;
  const position = geometry?.attributes.position, normal = geometry?.attributes.normal;
  if (!position || !normal || geometry.attributes._contactOcc) return null;
  const triangles = (geometry.index ? geometry.index.count : position.count) / 3;
  if (triangles > SKIP_TRIANGLES) {
    console.info(`Contact AO skipped ${mesh.name || 'mesh'}: ${Math.round(triangles)} tris > ${SKIP_TRIANGLES}`);
    return null;
  }
  const fan = hemisphere(rays);
  const out = new Float32Array(position.count);
  const p = new THREE.Vector3(), n = new THREE.Vector3(), dir = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion();
  const steps = Math.ceil(RAY_RANGE_M / grid.voxel);
  let i = 0;
  return {
    count: position.count,
    // true when the mesh is finished and the attribute is written.
    step(budgetMs = Infinity) {
      const until = now() + budgetMs;
      while (i < position.count) {
        const slice = Math.min(position.count, i + CLOCK_EVERY);
        for (; i < slice; i++) {
          p.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld);
          n.fromBufferAttribute(normal, i).transformDirection(mesh.matrixWorld);
          // lift the origin one voxel off the surface: the receiver's OWN slab
          // of occupied cells must never read as its occluder
          p.addScaledVector(n, grid.voxel * 0.9);
          q.setFromUnitVectors(up, n);
          let hits = 0;
          for (const ray of fan) {
            dir.copy(ray).applyQuaternion(q);
            for (let s = 1; s <= steps; s++) {
              const d = (s + 0.35) * grid.voxel;
              if (grid.occupied(p.x + dir.x * d, p.y + dir.y * d, p.z + dir.z * d)) {
                // near hits shade harder than far ones
                hits += 1 - (s - 1) / steps;
                break;
              }
            }
          }
          out[i] = Math.min(1, (hits / rays) * strength * 1.6);
        }
        if (i < position.count && now() >= until) return false;
      }
      geometry.setAttribute('_contactOcc', new THREE.BufferAttribute(out, 1));
      return true;
    },
  };
}

// One mesh, all at once. Same numbers as before - the resumable bake run
// with no budget. Kept for the late path and the tests.
export function bakeMeshContactOcclusion(mesh, grid, options = {}) {
  const bake = createMeshBake(mesh, grid, options);
  if (!bake) return 0;
  bake.step();
  return bake.count;
}

// Fragment-side application: indirect terms only, guarded so a material
// whose geometry lacks the attribute (default 0) is untouched.
export const CONTACT_VERTEX = {
  declare: 'attribute float _contactOcc;\nvarying float vContactOcc;\n',
  assign: '\nvContactOcc=_contactOcc;',
};
export const CONTACT_FRAGMENT = `
float contactShade=1.0-vContactOcc;
reflectedLight.indirectDiffuse*=contactShade;
reflectedLight.indirectSpecular*=mix(1.0,contactShade,0.6);`;

// AYDINLIK İŞ 3: üç kapanma terimi (contact x aoMap x GTAO) çarpılınca
// köşeler deliğe döner. warm modda contact, aoMap'in payını GERİ ALIP
// ikisinin EN KOYUSUNU uygular (min) - üstelenme biter; GTAO'nun payı
// yakın çevrede ayrıca yarıya iner (lighting.frame).
export const CONTACT_FRAGMENT_WARM = `
float contactShade=1.0-vContactOcc;
#if defined( USE_AOMAP )
float contactFloor=min(ambientOcclusion,contactShade)/max(ambientOcclusion,1e-3);
#else
float contactFloor=contactShade;
#endif
reflectedLight.indirectDiffuse*=contactFloor;
reflectedLight.indirectSpecular*=mix(1.0,contactFloor,0.6);`;

export function applyContactShading(material, {warm = false} = {}) {
  if (material.userData.contactShading) return false;
  material.userData.contactShading = true;
  const previous = material.onBeforeCompile, key = material.customProgramCacheKey();
  material.onBeforeCompile = (shader, renderer) => {
    previous.call(material, shader, renderer);
    shader.vertexShader = CONTACT_VERTEX.declare + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>' + CONTACT_VERTEX.assign);
    shader.fragmentShader = 'varying float vContactOcc;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <aomap_fragment>', '#include <aomap_fragment>' + (warm ? CONTACT_FRAGMENT_WARM : CONTACT_FRAGMENT));
  };
  material.customProgramCacheKey = () => key + (warm ? '|contact-ao-v1w' : '|contact-ao-v1');
  material.needsUpdate = true;
  return true;
}

// The idle driver: builds the grid, then walks receiver meshes in slices so
// no single callback overruns its deadline. Resolves with vertex total.
export function bakeContactOcclusion(models, {rays = 12, strength = 0.55, warm = false,
  idle, budgetMs = BUDGET_MS} = {}) {
  // Safari has no requestIdleCallback. The old fallback fabricated a 50 ms
  // timeRemaining(), so on iPhone the scheduler believed it always had room
  // and never yielded. The fallback now just yields to the event loop and
  // the BUDGET below - a real clock - decides how long a callback may run.
  const schedule = idle ?? (globalThis.requestIdleCallback
    ? (fn => globalThis.requestIdleCallback(fn, {timeout: 250}))
    : (fn => setTimeout(fn, GAP_MS)));
  return new Promise(resolve => {
    const grid = buildOccupancy(models);
    if (!grid) return resolve({vertices: 0, meshes: 0});
    const queue = [];
    for (const model of models.values()) model.traverse(o => {
      if (!o.isMesh) return;
      const materials = Array.isArray(o.material) ? o.material : [o.material];
      if (materials.every(m => m && (m.transparent || /glass|water|mirror/i.test(m.name)))) return;
      queue.push(o);
    });
    let vertices = 0, meshes = 0, touched = new Set(), current = null;
    const finish = mesh => {
      vertices += current.count; meshes++;
      for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material])
        if (material && applyContactShading(material, {warm})) touched.add(material);
      current = null;
    };
    const step = () => {
      const until = now() + budgetMs;
      // The budget is now spent INSIDE meshes as well as between them, so a
      // single 200k-vertex receiver can no longer hold the main thread.
      //
      // do/while, not while: FORWARD PROGRESS must not depend on the clock.
      // With a zero or sub-resolution budget the condition is already false
      // on entry, and a plain `while` baked nothing and rescheduled itself
      // forever - the scheduler span without advancing. One unit of work
      // always runs; createMeshBake reads its own clock only AFTER a slice.
      do {
        if (!current) {
          if (!queue.length) break;
          const mesh = queue.shift();
          const bake = createMeshBake(mesh, grid, {rays, strength});
          if (!bake) continue;                       // opted out; next mesh
          current = {mesh, ...bake, step: bake.step};
        }
        if (current.step(Math.max(1, until - now()))) finish(current.mesh);
      } while (now() < until);
      if (queue.length || current) schedule(step);
      else resolve({vertices, meshes, materials: touched.size, grid,
        // late arrivals (the deferred interior) bake against the same grid
        bakeLate: model => {let v = 0; model.traverse(o => {
          if (!o.isMesh) return;
          const ms = Array.isArray(o.material) ? o.material : [o.material];
          if (ms.every(m => m && (m.transparent || /glass|water|mirror/i.test(m.name)))) return;
          const c = bakeMeshContactOcclusion(o, grid, {rays, strength});
          if (c) {v += c; for (const m of ms) if (m) applyContactShading(m);}
        }); return v;}});
    };
    schedule(step);
  });
}
