import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';

// The normal/depth pass must see the same section and furniture visibility as
// the beauty pass. A shared, unconditional plane would cut the neighborhood.
export class SectionGTAOPass extends GTAOPass {
  constructor(scene, camera, clip, scale) {
    super(scene, camera, 1, 1);
    this.resolutionScale = scale;
    this.normalMaterial.side = THREE.DoubleSide;
    this.normalMaterial.onBeforeRender = (_renderer, _scene, _camera, _geometry, object) => {
      const planes = object.userData.sectionClipped ? [clip] : [];
      if ((this.normalMaterial.clippingPlanes?.length ?? 0) !== planes.length) this.normalMaterial.needsUpdate = true;
      this.normalMaterial.clippingPlanes = planes;
    };
    this.updateGtaoMaterial({radius:0.55, thickness:0.7, distanceExponent:2,
      distanceFallOff:0.8, samples:12, screenSpaceRadius:false});
    this.updatePdMaterial({radius:5, samples:8, depthPhi:3, normalPhi:4});
    this.blendIntensity = 0.55;
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
}

export function createLighting(renderer, scene, camera, clip) {
  const compact = matchMedia('(pointer: coarse)').matches;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.toneMappingExposure = 1.05;
  scene.background = new THREE.Color('#d8e3eb');
  scene.add(new THREE.HemisphereLight(0xdceaff, 0x514537, 0.26));
  const sun = new THREE.DirectionalLight(0xfff1dd, 3.25);
  const direction = new THREE.Vector3(-0.63, 0.77, 0.25).normalize();
  sun.castShadow = true;
  sun.shadow.mapSize.setScalar(compact ? 2048 : 4096);
  sun.shadow.bias = -0.00008; sun.shadow.normalBias = 0.022;
  sun.shadow.camera.near = 0.5; sun.shadow.camera.far = 220;
  scene.add(sun, sun.target);
  const sky = new Sky(); sky.scale.setScalar(10000);
  Object.assign(sky.material.uniforms.turbidity, {value:3});
  sky.material.uniforms.rayleigh.value = 2;
  sky.material.uniforms.mieCoefficient.value = 0.003;
  sky.material.uniforms.mieDirectionalG.value = 0.8;
  sky.material.uniforms.sunPosition.value.copy(direction);
  const skyScene = new THREE.Scene(); skyScene.add(sky);
  const pmrem = new THREE.PMREMGenerator(renderer);
  let environment = pmrem.fromScene(skyScene, 0.035, 0.1, 20000);
  scene.environment = environment.texture; scene.environmentIntensity = 0.65;
  sky.geometry.dispose(); sky.material.dispose(); pmrem.dispose();
  const target = new THREE.WebGLRenderTarget(1, 1, {type:THREE.HalfFloatType,
    samples:Math.min(renderer.capabilities.maxSamples, compact ? 2 : 4)});
  const composer = new EffectComposer(renderer, target);
  const beauty = new RenderPass(scene, camera);
  const ao = new SectionGTAOPass(scene, camera, clip, compact ? 0.5 : 0.75);
  composer.addPass(beauty); composer.addPass(ao); composer.addPass(new OutputPass());
  let fixtures=[];
  const interior=Array.from({length:2},()=>{
    const light=new THREE.SpotLight(0xffe4c2,0,7,Math.PI*.40,.55,2);
    light.castShadow=true;light.shadow.mapSize.setScalar(compact?512:1024);
    light.shadow.bias=-.00015;light.shadow.normalBias=.016;light.shadow.camera.near=.06;
    light.visible=false;scene.add(light,light.target);return light;
  });
  return {
    async loadEnvironment(url) {
      const hdr=await new HDRLoader().setDataType(THREE.FloatType).loadAsync(url);
      hdr.mapping=THREE.EquirectangularReflectionMapping;
      const {data,width,height}=hdr.image;let peak=0,peakIndex=0;
      // Match the realtime sun direction to the sun visible in this generic
      // licensed HDR, rather than inventing a second unrelated light direction.
      for(let i=0;i<width*height;i++) {
        const energy=data[i*4]+data[i*4+1]+data[i*4+2];
        if(energy>peak){peak=energy;peakIndex=i;}
      }
      const longitude=((peakIndex%width+.5)/width-.5)*Math.PI*2;
      const latitude=(.5-(Math.floor(peakIndex/width)+.5)/height)*Math.PI;
      const incoming=new THREE.Vector3(Math.cos(latitude)*Math.cos(longitude),Math.sin(latitude),Math.cos(latitude)*Math.sin(longitude));
      if(incoming.y>.1)direction.copy(incoming);
      const generator=new THREE.PMREMGenerator(renderer),next=generator.fromEquirectangular(hdr);
      scene.environment=next.texture;environment.dispose();environment=next;generator.dispose();
      scene.environmentIntensity=.45;scene.background=hdr;scene.backgroundIntensity=.75;scene.backgroundBlurriness=.04;
      sun.position.copy(sun.target.position).addScaledVector(direction,110);renderer.shadowMap.needsUpdate=true;
    },
    setFixtures(data) {fixtures=data??[];},
    interior(floor,position) {
      const p=position?new THREE.Vector3(...position):null;
      const nearest=p?fixtures.filter(f=>f.floor_index===floor).sort((a,b)=>new THREE.Vector3(...a.position).distanceToSquared(p)-new THREE.Vector3(...b.position).distanceToSquared(p)):[];
      interior.forEach((light,i)=>{
        const source=nearest[i];light.visible=Boolean(source);
        if(!source)return;
        light.position.fromArray(source.position);light.target.position.copy(light.position).add(new THREE.Vector3(...source.direction));
        light.color.fromArray(source.color);light.intensity=source.intensity_cd;
      });
      renderer.shadowMap.needsUpdate=true;
    },
    prepareMesh(object, sectionClipped) {
      object.userData.sectionClipped = sectionClipped;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      const glass = materials.every(m => m.transparent || m.transmission > 0);
      object.userData.aoExcluded = glass;
      object.castShadow = !glass; object.receiveShadow = !glass;
      for (const material of materials) {
        material.clipShadows = true;
        for (const value of Object.values(material)) if (value?.isTexture)
          value.anisotropy = Math.min(compact ? 4 : 8, renderer.capabilities.getMaxAnisotropy());
      }
    },
    frame(view) {
      const extent = view === 'neighborhood' ? 65 : 27;
      sun.target.position.set(0, 2, -6);
      sun.position.copy(sun.target.position).addScaledVector(direction, 110);
      Object.assign(sun.shadow.camera, {left:-extent, right:extent, top:extent, bottom:-extent});
      sun.shadow.camera.updateProjectionMatrix(); renderer.shadowMap.needsUpdate = true;
      ao.enabled = view !== 'neighborhood';
    },
    resize(w, h) {composer.setSize(w, h);},
    render(camera) {
      beauty.camera = camera; ao.setCamera(camera);
      if (renderer.xr.isPresenting) renderer.render(scene, camera); else composer.render();
    }
  };
}
