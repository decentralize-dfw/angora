import * as THREE from 'three';
import {smoothStep} from './section.js';
const FLIGHT_DURATION=1250;

export class CameraFlight {
  constructor(camera, controls, resize, invalidate) {
    Object.assign(this,{camera,controls,resize,invalidate});this.active=null;
  }
  go({target,polar,span,zoom=1,azimuth,fov},instant=false) {
    const {camera,controls}=this;
    const before=new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    const fovEnd=fov??camera.fov;
    const radius=span/(2*Math.tan(THREE.MathUtils.degToRad(fovEnd/2)));
    const desired=azimuth??before.theta;
    const shortest=Math.atan2(Math.sin(desired-before.theta),Math.cos(desired-before.theta));
    const end={target:target.clone(),polar,radius,zoom,azimuth:before.theta+shortest,fov:fovEnd};
    const start=performance.now();
    this.active={start,endTime:start+FLIGHT_DURATION,from:{target:controls.target.clone(),polar:before.phi,radius:before.radius,zoom:camera.zoom,azimuth:before.theta,fov:camera.fov},to:end};
    controls.enabled=false;
    if(instant||matchMedia('(prefers-reduced-motion: reduce)').matches)this.update(this.active.endTime);
    this.invalidate();
  }
  update(time) {
    if(!this.active)return false;
    const a=this.active,done=time>=a.endTime;
    const t=done?1:THREE.MathUtils.clamp((time-a.start)/FLIGHT_DURATION,0,1),s=smoothStep(t),lerp=THREE.MathUtils.lerp;
    const polar=lerp(a.from.polar,a.to.polar,s);
    this.controls.minPolarAngle=this.controls.maxPolarAngle=polar;
    this.controls.target.lerpVectors(a.from.target,a.to.target,s);
    this.camera.position.copy(this.controls.target).add(new THREE.Vector3().setFromSpherical(new THREE.Spherical(
      lerp(a.from.radius,a.to.radius,s),polar,lerp(a.from.azimuth,a.to.azimuth,s))));
    this.camera.zoom=lerp(a.from.zoom,a.to.zoom,s);
    this.camera.fov=lerp(a.from.fov,a.to.fov,s);
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(this.controls.target);
    if(done){this.active=null;this.controls.enabled=true;this.controls.update();}
    return true;
  }
  cancel() {this.active=null;this.controls.enabled=true;}
}
