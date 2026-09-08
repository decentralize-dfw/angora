import * as THREE from 'three';

export const floorDatums = [0, 3.0996, 6.3714, 9.4705];
export function sectionHeight(view, top) {
  return /^f[0-3]$/.test(view) ? floorDatums[Number(view[1])] + 1.6 : top;
}
export function smoothStep(t) {
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
}

// The same upper plane clips every villa layer. The stencil is generated only
// by structural wall volumes: it cannot paint across rooms or the gallery void.
// Based on Three.js r180 examples/webgl_clipping_stencil.html.
export function createWallCaps(walls, plane) {
  const group = new THREE.Group();
  group.name = 'Moving wall section hatch';
  const base = new THREE.MeshBasicMaterial({
    depthWrite: false, depthTest: false, colorWrite: false,
    stencilWrite: true, stencilFunc: THREE.AlwaysStencilFunc,
    clippingPlanes: [plane]
  });
  const back = base.clone(), front = base.clone();
  // Material.clone clones Plane objects too; explicitly share the animated one.
  back.clippingPlanes = front.clippingPlanes = [plane];
  back.side = THREE.BackSide; front.side = THREE.FrontSide;
  for (const key of ['stencilFail', 'stencilZFail', 'stencilZPass']) {
    back[key] = THREE.IncrementWrapStencilOp;
    front[key] = THREE.DecrementWrapStencilOp;
  }
  base.dispose();
  for (const source of walls) {
    source.updateWorldMatrix(true, false);
    for (const material of [back, front]) {
      const mesh = new THREE.Mesh(source.geometry, material);
      mesh.matrix.copy(source.matrixWorld); mesh.matrixAutoUpdate = false;
      mesh.renderOrder = 1; mesh.frustumCulled = false;
      group.add(mesh);
    }
  }
  const material = new THREE.ShaderMaterial({
    side: THREE.DoubleSide, stencilWrite: true, stencilRef: 0,
    stencilFunc: THREE.NotEqualStencilFunc,
    stencilFail: THREE.ReplaceStencilOp,
    stencilZFail: THREE.ReplaceStencilOp,
    stencilZPass: THREE.ReplaceStencilOp,
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
  const cap = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), material);
  cap.name = 'Solid hatched wall cross section';
  cap.rotation.x = -Math.PI / 2; cap.renderOrder = 2;
  cap.onAfterRender = renderer => renderer.clearStencil();
  group.add(cap);
  return {group, update(height, visible) {cap.position.y = height; group.visible = visible;}};
}
