import * as THREE from 'three';

export const floorDatums = [0, 3.0996, 6.3714, 9.4705];
export function sectionHeight(view, top) {
  return /^f[0-3]$/.test(view) ? floorDatums[Number(view[1])] + 1.6 : top;
}
export function smoothStep(t) {
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
}

// These contours come from opposite source wall faces. They are independent of
// camera direction and of the inconsistent winding of the recovered CAD skin.
export function createWallCaps(atlas) {
  const group = new THREE.Group(); group.name = 'Geometric wall sections';
  const slices = atlas.slices;
  if (!slices?.length || atlas.coordinate_system !== 'glTF_XZ') throw Error('Invalid section atlas');
  const material = new THREE.ShaderMaterial({side:THREE.DoubleSide,
    vertexShader: `varying vec3 worldPosition;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        worldPosition = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }`,
    fragmentShader: `varying vec3 worldPosition;
      void main() {
        float v = (worldPosition.x + worldPosition.z) / 0.14;
        float edge = max(fwidth(v) * 1.2, 0.002);
        float hatch = 1.0 - smoothstep(0.065, 0.065 + edge, abs(fract(v) - 0.5));
        gl_FragColor = vec4(mix(vec3(0.70, 0.64, 0.53), vec3(0.19, 0.17, 0.13), hatch * 0.62), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
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
      geometry.setIndex(data.i); geometry.computeBoundingSphere();
      cap.geometry.dispose(); cap.geometry = geometry;
    }
    cap.position.y = height;
  }};
}
