export function configureCameraControls(controls, THREE) {
  controls.enableDamping=true;controls.dampingFactor=.12;controls.screenSpacePanning=false;
  controls.minZoom=.35;controls.maxZoom=12;controls.rotateSpeed=.6;
  controls.touches.ONE=THREE.TOUCH.ROTATE;controls.touches.TWO=THREE.TOUCH.DOLLY_PAN;
  // Perspective dolly normally changes camera altitude. Convert gesture dolly
  // into optical zoom, retaining the orbit radius and horizontal pan plane.
  let gestureRadius=null;
  controls.addEventListener('start',()=>{
    gestureRadius=controls.object.isPerspectiveCamera
      ?controls.object.position.distanceTo(controls.target):null;
  });
  controls.addEventListener('change',()=>{
    const camera=controls.object;
    if(gestureRadius===null||!camera.isPerspectiveCamera)return;
    const offset=camera.position.clone().sub(controls.target),radius=offset.length();
    if(radius<1e-9||Math.abs(radius-gestureRadius)<1e-9)return;
    camera.zoom=THREE.MathUtils.clamp(camera.zoom*gestureRadius/radius,controls.minZoom,controls.maxZoom);
    camera.position.copy(controls.target).add(offset.multiplyScalar(gestureRadius/radius));
    camera.updateProjectionMatrix();camera.lookAt(controls.target);
  });
  controls.addEventListener('end',()=>{gestureRadius=null;});
}
