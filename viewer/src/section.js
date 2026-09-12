import * as THREE from 'three';

export const floorDatums = [0, 3.0996, 6.3714, 9.4705];
export function sectionHeight(view, top) {
  return /^f[0-3]$/.test(view) ? floorDatums[Number(view[1])] + (view==='f3'?1.3:1.6) : top;
}
export function smoothStep(t) {
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
}

// One hatch shader, parameterised. What is cut is drawn the way a section
// drawing draws it: the material the plane passes through goes black, and the
// ruling rides on top of the black rather than replacing it.
//
// A ruling finer than the screen can resolve has to fade or it aliases into
// noise, and `fade` is where that starts. The number that matters is how wide
// one period is on screen: a 0.14 m masonry ruling over a whole storey is two
// or three pixels, so it fades and the wall reads as the solid poché a plan
// wants at that distance. The earth is not a 0.20 m wall - it is the whole
// excavation, hundreds of square metres of it - and a flat black field that
// size does not read as ground, it reads as a hole in the drawing. So it takes
// a site ruling, coarse enough (0.80 m, and nearly a fifth of it inked) to
// stay legible from the same distance the plan is read at, and it does not
// fade.
export const SECTION_POCHE = {pitch:0.14, duty:0.065, ground:[0.020,0.020,0.023], ink:[0.32,0.31,0.29], fade:[0.25,0.80]};
export const SOIL_POCHE = {pitch:0.80, duty:0.170, ground:[0.026,0.025,0.021], ink:[0.46,0.44,0.38], fade:null};
export function createHatchMaterial({pitch, duty, ground, ink, fade=[0.25,0.80]}) {
  return new THREE.ShaderMaterial({side:THREE.DoubleSide,
    vertexShader: `varying vec3 worldPosition;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        worldPosition = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }`,
    fragmentShader: `varying vec3 worldPosition;
      void main() {
        float v = (worldPosition.x + worldPosition.z) / ${pitch.toFixed(4)};
        float edge = max(fwidth(v) * 1.2, 0.002);
        float hatch = 1.0 - smoothstep(${duty.toFixed(4)}, ${duty.toFixed(4)} + edge, abs(fract(v) - 0.5));
        ${fade ? `hatch = mix(0.13, hatch, 1.0 - smoothstep(${fade[0].toFixed(4)}, ${fade[1].toFixed(4)}, fwidth(v)));` : ''}
        gl_FragColor = vec4(mix(vec3(${ground.map(v=>v.toFixed(2)).join(', ')}), vec3(${ink.map(v=>v.toFixed(2)).join(', ')}), hatch * 0.62), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
}

// These contours come from opposite source wall faces. They are independent of
// camera direction and of the inconsistent winding of the recovered CAD skin.
export function createWallCaps(atlas) {
  const group = new THREE.Group(); group.name = 'Geometric wall sections';
  const slices = atlas.slices;
  if (!slices?.length || atlas.coordinate_system !== 'glTF_XZ') throw Error('Invalid section atlas');
  const material = createHatchMaterial(SECTION_POCHE);
  // Three layers, one material. The walls and the fixed bodies the plane cuts
  // - door leaves, frames, tall units, cisterns - are always drawn; the
  // furniture poché is a mesh of its own so the furniture toggle can take it
  // away with the furniture that casts it, rather than leaving its cut behind.
  const build = (name) => {
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
    mesh.name = name; mesh.renderOrder = 2; group.add(mesh); return mesh;
  };
  const layers = [
    {mesh: build('Solid hatched wall cross section'), p: 'p', i: 'i'},
    {mesh: build('Solid hatched fixture cross section'), p: 'q', i: 'j'},
    {mesh: build('Solid hatched furniture cross section'), p: 'fq', i: 'fj', furniture: true},
  ];
  let current = -1, furnitureVisible = true;
  function rebuild(index) {
    const data = slices[index];
    for (const layer of layers) {
      const p = data[layer.p], i = data[layer.i];
      const geometry = new THREE.BufferGeometry();
      if (p?.length && i?.length) {
        const positions = new Float32Array(p.length / 2 * 3);
        for (let k = 0; k < p.length / 2; k++) {
          positions[k * 3] = p[k * 2]; positions[k * 3 + 2] = p[k * 2 + 1];
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setIndex(i); geometry.computeVertexNormals(); geometry.computeBoundingSphere();
      }
      layer.mesh.geometry.dispose(); layer.mesh.geometry = geometry;
    }
  }
  return {group, update(height, visible) {
    group.visible = visible && height <= slices.at(-1).height;
    if (!group.visible) return;
    let low = 0, high = slices.length - 1;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if (slices[mid].height < height) low = mid + 1; else high = mid;
    }
    if (low > 0 && height - slices[low - 1].height < slices[low].height - height) low--;
    if (low !== current) {current = low; rebuild(low);}
    for (const layer of layers) {
      layer.mesh.visible = !layer.furniture || furnitureVisible;
      layer.mesh.position.y = height;
    }
  }, setFurnitureVisible(value) {furnitureVisible = value;}};
}

// The basement cut is the one height where the earth is part of the section:
// the plot soil's cross-section is 198.05 m2 at y=1.6000 and exactly zero at
// the two upper cuts. section-caps.glb authors that one face (197.89 m2,
// 0.079% off the analytic slice of the volume it caps), so the cap is taken
// from the delivery rather than synthesised - a welded re-slice of the Draco
// geometry recovers the right area at 1.6 m but returns nonsense at other
// heights, which is exactly why the authored face exists.
//
// R42 adds a second face in the same material. The authored one covers the
// earth the plane passes through; it cannot cover the 48 m2 under the entrance
// wing, where the CAD excavated the footprint and then built no basement, so
// the plane cuts a void and the view falls through to the back of the
// excavation. Both faces are earth in plan and both are collected here, so a
// cap added to the delivery needs no change in the viewer.
export const SOIL_CUT_HEIGHT = 1.6;
export function createSoilCap(capScene) {
  const group = new THREE.Group(); group.name = 'Authored soil section';
  const sources = [];
  capScene.updateMatrixWorld(true);
  capScene.traverse(object => {
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    if (object.isMesh && materials.some(m => m?.name === 'R32 | soil section hatch')) sources.push(object);
  });
  if (!sources.length) return null;
  const material = createHatchMaterial(SOIL_POCHE);
  for (const source of sources) {
    const mesh = new THREE.Mesh(source.geometry, material);
    mesh.name = 'Solid hatched soil cross section';
    mesh.applyMatrix4(source.matrixWorld);
    mesh.renderOrder = 2; mesh.castShadow = mesh.receiveShadow = false;
    // keep this geometry, drop the rest of the cap scene and its unused maps
    source.geometry = null;
    group.add(mesh);
  }
  capScene.traverse(object => {
    if (object.isMesh && object.geometry) object.geometry.dispose();
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (!material) continue;
      for (const value of Object.values(material)) if (value?.isTexture) value.dispose();
      material.dispose();
    }
  });
  return {group, update(height, visible) {
    // the authored face exists at exactly one height; it shows when the earth
    // plane sits on it and hides for every other state
    group.visible = visible && Math.abs(height - SOIL_CUT_HEIGHT) < 0.001;
  }};
}
