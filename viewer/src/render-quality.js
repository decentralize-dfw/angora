import * as THREE from 'three';

// A stable drawing buffer: orbiting and walking never lower resolution.
export function renderPixelRatio(width,height,dpr,compact) {
  return Math.max(1,Math.min(dpr,compact?3:2,Math.sqrt((compact?3_200_000:5_000_000)/Math.max(1,width*height))));
}

// The former 0.2–50,000 m frustum discarded most depth precision at the
// model. Keep millimetre-scale finishes stable at every orbit distance.
export function fitDepthRange(camera,target,worldBounds) {
  const distance=camera.position.distanceTo(target);
  const radius=worldBounds?.getSize(new THREE.Vector3()).length()??450;
  const near=Math.max(.2,distance*.04);
  const far=Math.max(near+100,distance+radius+40);
  if(Math.abs(camera.near-near)>.001||Math.abs(camera.far-far)>.01){
    camera.near=near;camera.far=far;camera.updateProjectionMatrix();
  }
  return {near,far};
}
