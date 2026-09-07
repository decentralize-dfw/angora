export function configureCameraControls(controls, THREE) {
  controls.enableDamping=true;controls.dampingFactor=.12;controls.screenSpacePanning=false;
  controls.minZoom=.35;controls.maxZoom=12;controls.rotateSpeed=.6;
  controls.touches.ONE=THREE.TOUCH.ROTATE;controls.touches.TWO=THREE.TOUCH.DOLLY_PAN;
}
