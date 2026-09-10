import * as THREE from 'three';
import {smoothStep} from './section.js';
const FLIGHT_DURATION=1250;

// One camera and one model for both plan and isometric views. Moving in
// spherical coordinates avoids passing through the building during a flight.
export class CameraFlight {
  constructor(camera, controls, resize, invalidate) {
    Object.assign(this,{camera,controls,resize,invalidate});this.active=null;
  }
  go({target,polar,span,zoom=1,azimuth},instant=false) {
    const {camera,controls}=this;
    const before=new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    const radius=span/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)));
    const end={target:target.clone(),polar,radius,zoom,azimuth:azimuth??before.theta};
    const start=performance.now();
    this.active={start,endTime:start+FLIGHT_DURATION,from:{target:controls.target.clone(),polar:before.phi,radius:before.radius,zoom:camera.zoom,azimuth:before.theta},to:end};
    controls.enabled=false;
    if(instant||matchMedia('(prefers-reduced-motion: reduce)').matches)this.update(this.active.endTime);
    this.invalidate();
  }
  update(time) {
    if(!this.active)return false;
    // Comparing against the stored deadline avoids floating-point subtraction
    // leaving t at 0.9999999999999998 at the exact final frame.
    const a=this.active,done=time>=a.endTime;
    const t=done?1:THREE.MathUtils.clamp((time-a.start)/FLIGHT_DURATION,0,1),s=smoothStep(t),lerp=THREE.MathUtils.lerp;
    const polar=lerp(a.from.polar,a.to.polar,s);
    this.controls.minPolarAngle=this.controls.maxPolarAngle=polar;
    this.controls.target.lerpVectors(a.from.target,a.to.target,s);
    this.camera.position.copy(this.controls.target).add(new THREE.Vector3().setFromSpherical(new THREE.Spherical(
      lerp(a.from.radius,a.to.radius,s),polar,lerp(a.from.azimuth,a.to.azimuth,s))));
    this.camera.zoom=lerp(a.from.zoom,a.to.zoom,s);this.camera.updateProjectionMatrix();
    this.camera.lookAt(this.controls.target);
    if(done){this.active=null;this.controls.enabled=true;this.controls.update();}
    return true;
  }
  cancel() {this.active=null;this.controls.enabled=true;}
}
