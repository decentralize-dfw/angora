import * as THREE from 'three';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {createSectionNormalMaterials} from './section-normal-materials.js';

// Keep AO depth and beauty aligned for both cut interiors and uncut context.
export class SectionGTAOPass extends GTAOPass {
  constructor(scene, camera, clip, scale) {
    super(scene, camera, 1, 1);
    this.resolutionScale = scale;
    this.normalMaterial.side = THREE.DoubleSide;
    this.clip = clip;
    this.sectionNormalMaterials=createSectionNormalMaterials(this.normalMaterial);
    // The authored cut faces sit exactly on the plane. Carrying the pass's own
    // copy a few millimetres higher keeps them in the depth buffer - without
    // it they fall out and the occlusion sampled at the wall tops belongs to
    // the floor far below them.
    this.sectionPlanes = [new THREE.Plane(clip.normal.clone(), clip.constant)];
    // The reference's own numbers. Radius is in world metres and it matters:
    // too large and the occlusion stops describing crevices and starts shading
    // whole objects, which reads as dirt rather than as contact. 0.28 m is the
    // scale of a window reveal, an eave underside, a wall meeting a floor.
    this.updateGtaoMaterial({radius:0.28, distanceExponent:1, thickness:1,
      scale:1.05, samples:16, distanceFallOff:1, screenSpaceRadius:false});
    this.updatePdMaterial({radius:8, samples:8, depthPhi:3, normalPhi:4});
    this.blendIntensity = 0.8;
  }
  setSize(w, h) {
    const scale = this.resolutionScale ?? 1;
    super.setSize(Math.max(1, Math.round(w * scale)), Math.max(1, Math.round(h * scale)));
  }
  _overrideVisibility() {
    super._overrideVisibility();
    this.scene.traverse(object => {
      if (object.visible && (object.userData.aoExcluded || object.isSprite)) {
        object.visible = false; this._visibilityCache.push(object);
      }
    });
  }
  setCamera(camera) {
    this.camera = camera;
    for (const material of [this.gtaoMaterial, this.depthRenderMaterial]) {
      const value = camera.isPerspectiveCamera ? 1 : 0;
      if (material.defines.PERSPECTIVE_CAMERA !== value) {
        material.defines.PERSPECTIVE_CAMERA = value; material.needsUpdate = true;
      }
    }
  }
  _renderOverride(renderer, overrideMaterial, renderTarget, clearColor, clearAlpha) {
    renderer.getClearColor(this._originalClearColor);
    const alpha=renderer.getClearAlpha(),autoClear=renderer.autoClear,override=this.scene.overrideMaterial;
    renderer.setRenderTarget(renderTarget);renderer.autoClear=false;
    try{
      if(clearColor!==undefined&&clearColor!==null){renderer.setClearColor(clearColor);renderer.setClearAlpha(clearAlpha??0);renderer.clear();}
      this.scene.overrideMaterial=null;
      return this.sectionNormalMaterials.render(this.scene,()=>renderer.render(this.scene,this.camera));
    }finally{
      this.scene.overrideMaterial=override;renderer.autoClear=autoClear;
      renderer.setClearColor(this._originalClearColor);renderer.setClearAlpha(alpha);
    }
  }
  dispose(){this.sectionNormalMaterials.dispose();super.dispose();}

}

