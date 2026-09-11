import * as THREE from 'three';

export const floorDatums = [0, 3.0996, 6.3714, 9.4705];
export function sectionHeight(view, top) {
  return /^f[0-3]$/.test(view) ? floorDatums[Number(view[1])] + (view==='f3'?1.3:1.6) : top;
}
export function smoothStep(t) {
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
}

// One hatch shader, parameterised: the wall cap keeps its original numbers to
// the digit, the soil cap takes the authored soil pitch and inks read off the
// delivered `R32 | soil section hatch` texture - the geometry ships, the
// 21 KB textures do not.
export function createHatchMaterial({pitch, duty, ground, ink}) {
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
        hatch = mix(0.13, hatch, 1.0 - smoothstep(0.25, 0.8, fwidth(v)));
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
  const material = createHatchMaterial({pitch:0.14, duty:0.065, ground:[0.70,0.64,0.53], ink:[0.19,0.17,0.13]});
  const cap = new THREE.Mesh(new THREE.BufferGeometry(), material);
  cap.name = 'Solid hatched wall cross section'; cap.renderOrder = 2;
  group.add(cap);
  let current = -1;
  return {group, update(height, visible) {
    group.visible = visible && height <= slices.at(-1).height;
    if (!group.visible) return;
    let low = 0, high = slices.length - 1;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if (slices[mid].height < height) low = mid + 1; else high = mid;
    }
    if (low > 0 && height - slices[low - 1].height < slices[low].height - height) low--;
    if (low !== current) {
      current = low; const data = slices[low], positions = new Float32Array(data.p.length / 2 * 3);
      for (let i = 0; i < data.p.length / 2; i++) {
        positions[i * 3] = data.p[i * 2]; positions[i * 3 + 2] = data.p[i * 2 + 1];
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setIndex(data.i); geometry.computeVertexNormals(); geometry.computeBoundingSphere();
      cap.geometry.dispose(); cap.geometry = geometry;
    }
    cap.position.y = height;
  }};
}

// The basement cut is the one height where the earth is part of the section:
// the plot soil's cross-section is 198.05 m2 at y=1.6000 and exactly zero at
// the two upper cuts. section-caps.glb authors that one face (197.89 m2,
// 0.079% off the analytic slice of the volume it caps), so the cap is taken
// from the delivery rather than synthesised - a welded re-slice of the Draco
// geometry recovers the right area at 1.6 m but returns nonsense at other
// heights, which is exactly why the authored face exists.
export const SOIL_CUT_HEIGHT = 1.6;
export function createSoilCap(capScene) {
  const group = new THREE.Group(); group.name = 'Authored soil section';
  let source = null;
  capScene.traverse(object => {
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    if (object.isMesh && materials.some(m => m?.name === 'R32 | soil section hatch')) source = object;
  });
  if (!source) return null;
  const mesh = new THREE.Mesh(source.geometry, createHatchMaterial(
    {pitch:0.25, duty:0.055, ground:[0.3864,0.4020,0.3864], ink:[0.1384,0.1559,0.1356]}));
  mesh.name = 'Solid hatched soil cross section';
  mesh.renderOrder = 2; mesh.castShadow = mesh.receiveShadow = false;
  // keep the one geometry, drop the rest of the cap scene and its unused maps
  source.geometry = null;
  capScene.traverse(object => {
    if (object.isMesh && object.geometry) object.geometry.dispose();
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (!material) continue;
      for (const value of Object.values(material)) if (value?.isTexture) value.dispose();
      material.dispose();
    }
  });
  group.add(mesh);
  return {group, update(height, visible) {
    // the authored face exists at exactly one height; it shows when the earth
    // plane sits on it and hides for every other state
    group.visible = visible && Math.abs(height - SOIL_CUT_HEIGHT) < 0.001;
  }};
}
