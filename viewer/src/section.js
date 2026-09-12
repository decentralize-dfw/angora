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
// The ruling is filtered analytically, which is the whole of R42's fix. Until
// now the line was drawn `duty + fwidth(v)` wide with a smoothstep, so the
// pixel footprint was added to the line rather than used to resolve it: at the
// basement zoom one pixel is about a sixth of the earth's period, so a ruling
// authored at 7% of the period came out inked over 40% of it, full black at
// the core - the bold barcode the review calls "çok kaba". Thinning `duty`
// could not help, because the width the shader drew was the pixel, not the
// duty.
//
// So the fragment now integrates the square wave over the pixel instead. I(x)
// is the wave's antiderivative, and (I(b) - I(a)) / (b - a) is the exact mean
// ink over the pixel's own footprint. The line keeps the world width it was
// authored with and, once it is finer than a pixel, greys out instead of
// fattening - and at any distance the field settles on exactly the `duty` it
// was given rather than on whatever the zoom made of it. That also retires
// `fade`, which existed to pull the over-inked far field back down by hand.
//
// The earth is drawn the other way up from masonry: a pale ground carrying a
// thin dark line, 7% of a 0.55 m period, per "siyah çizgileri incelt
// arasındaki mesafeyi arttır. daha kibar olmalı." `strength` is how much of
// the ink the line actually takes - masonry keeps its 0.62 so its rule stays a
// highlight rather than a black wire; the earth's line is the ink itself.
export const SECTION_POCHE = {pitch:0.14, duty:0.065, ground:[0.020,0.020,0.023], ink:[0.32,0.31,0.29], strength:0.62};
export const SOIL_POCHE = {pitch:0.55, duty:0.035, ground:[0.580,0.568,0.527], ink:[0.015,0.015,0.016], strength:1.0};
export function createHatchMaterial({pitch, duty, ground, ink, strength=0.62}) {
  return new THREE.ShaderMaterial({side:THREE.DoubleSide,
    vertexShader: `varying vec3 worldPosition;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        worldPosition = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }`,
    fragmentShader: `varying vec3 worldPosition;
      // how much of one period is inked, and the ruling's antiderivative
      const float INK = ${(2 * duty).toFixed(5)};
      float ruled(float x) { return floor(x) * INK + min(fract(x), INK); }
      void main() {
        float v = (worldPosition.x + worldPosition.z) / ${pitch.toFixed(4)};
        float w = max(fwidth(v), 1e-5);
        float hatch = clamp((ruled(v + 0.5 * w) - ruled(v - 0.5 * w)) / w, 0.0, 1.0);
        gl_FragColor = vec4(mix(vec3(${ground.map(v=>v.toFixed(3)).join(', ')}), vec3(${ink.map(v=>v.toFixed(3)).join(', ')}), hatch * ${strength.toFixed(2)}), 1.0);
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
// R42 adds a second face in the same material: the site field. The authored
// one covers the earth the plane passes through; it cannot cover the 48 m2
// under the entrance wing, where the CAD excavated the footprint and then
// built no basement, nor the 283 m2 of plot ground that lies below the cut
// rather than through it, and the review asks for both. The field is draped
// over the ground it describes instead of floating on the cut plane, so the
// basement view can be tilted without a sheet appearing in mid air. Every face
// in the material is collected here, so a cap added to the delivery needs no
// change in the viewer.
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
