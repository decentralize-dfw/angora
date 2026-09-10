import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import {solarPosition} from './daylight.js';
import {prepareMaterialResponse,setMaterialScale} from './material-response.js';
import {smoothSurfaceNormals} from './context-surfaces.js';
import {configurePostprocessing} from './postprocessing.js';
import {applyRenderProfile,referenceProfile} from './render-profile.js';
import {LinearBloomPass} from './linear-bloom.js';
import {InteriorLightController} from './interior-lighting.js';

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

export function isGlazing(material) {
  return material.transmission>0 || (material.transparent && material.opacity<.98) || /glass|glazing|cam yüzey/i.test(material.name);
}
export function createLighting(renderer, scene, camera, clip) {
  const compact=matchMedia('(pointer: coarse)').matches;
  renderer.shadowMap.enabled=true;renderer.shadowMap.autoUpdate=false;
  applyRenderProfile(renderer);
  scene.background=new THREE.Color('#e4e9ed');
  const hemisphere=new THREE.HemisphereLight(0xebf2ff,0xb8b2a8,.5);scene.add(hemisphere);
  const sun=new THREE.DirectionalLight(0xfff2df,1.55),direction=new THREE.Vector3(-.45,.85,-.3).normalize();
  sun.castShadow=true;sun.shadow.mapSize.setScalar(compact?2048:4096);
  sun.shadow.bias=-.000025;sun.shadow.normalBias=.018;sun.shadow.radius=2.5;
  sun.shadow.camera.near=.5;sun.shadow.camera.far=700;scene.add(sun,sun.target);
  const sky=new Sky();sky.scale.setScalar(10000);sky.material.uniforms.turbidity.value=3;
  sky.material.uniforms.rayleigh.value=2;sky.material.uniforms.mieCoefficient.value=.003;
  sky.material.uniforms.sunPosition.value.copy(direction);
  const skyScene=new THREE.Scene();skyScene.add(sky);
  const pmrem=new THREE.PMREMGenerator(renderer);let environment=pmrem.fromScene(skyScene,.06,.1,20000);
  scene.environment=environment.texture;scene.environmentIntensity=1.0;
  sky.geometry.dispose();sky.material.dispose();pmrem.dispose();
  const target=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,samples:referenceProfile.msaaSamples});
  const composer=new EffectComposer(renderer,target),beauty=new RenderPass(scene,camera);
  const ao=new SectionGTAOPass(scene,camera,clip,compact?.5:.85);ao.blendIntensity=.2;
  const smaa=new SMAAPass(),bloom=new LinearBloomPass();
  ao.enabled=referenceProfile.aoEnabled;
  configurePostprocessing(composer,{beauty,ao,smaa,bloom,output:new OutputPass()});
  let day=172,hour=12.5,environmentMode='procedural-sky';
  let soft=true,shadowDistance=110;
  const preparedMaterials=new Set();
  const interior=Array.from({length:4},()=>{
    const light=new THREE.SpotLight(0xffead5,0,6,Math.PI*.37,.72,2);
    light.castShadow=true;light.shadow.mapSize.setScalar(compact?512:1024);
    light.shadow.bias=-.0001;light.shadow.normalBias=.01;light.shadow.camera.near=.06;
    light.visible=false;scene.add(light,light.target);return light;
  });
  const fixtures=new InteriorLightController(interior);
  function setTime(nextHour=hour,nextDay=day) {
    hour=nextHour;day=nextDay;const solar=solarPosition(hour,{day});direction.fromArray(solar.direction);
    const daylight=THREE.MathUtils.smoothstep(solar.altitude,-6,28),warmth=THREE.MathUtils.smoothstep(solar.altitude,0,35);
    sun.intensity=(soft?1.55:2.25)*THREE.MathUtils.smoothstep(solar.altitude,-.5,20);
    sun.color.set(0xffbc7b).lerp(new THREE.Color(0xfff5e9),warmth);
    hemisphere.intensity=.08+.42*daylight;scene.environmentIntensity=.08+(soft?.85:.65)*daylight;
    sun.shadow.radius=soft?2.5:1;sun.shadow.intensity=soft?.82:1;
    scene.background.set(0x182734).lerp(new THREE.Color(0xe4e9ed),daylight);
    sun.position.copy(sun.target.position).addScaledVector(direction,shadowDistance);
    renderer.shadowMap.needsUpdate=true;return solar;
  }
  return {
    async loadEnvironment(url) {
      const hdr=await new HDRLoader().setDataType(THREE.FloatType).loadAsync(url);hdr.mapping=THREE.EquirectangularReflectionMapping;
      // The moving directional light owns the sun. Bound the HDR's solar
      // hotspot before convolution so it does not add a second fixed sun.
      const pixels=hdr.image.data;
      for(let i=0;i<pixels.length;i+=4){
        const luminance=.2126*pixels[i]+.7152*pixels[i+1]+.0722*pixels[i+2];
        if(luminance>8){const scale=8/luminance;pixels[i]*=scale;pixels[i+1]*=scale;pixels[i+2]*=scale;}
      }
      hdr.needsUpdate=true;
      const generator=new THREE.PMREMGenerator(renderer),next=generator.fromEquirectangular(hdr);
      scene.environment=next.texture;environment.dispose();environment=next;generator.dispose();hdr.dispose();environmentMode='hdr';setTime();
    },
    setFixtures(data){fixtures.setFixtures(data);},
    interior(floor,position,time){fixtures.select(floor,position,time);},
    setLights(enabled){fixtures.setEnabled(enabled);},setTime,
    update(time){
      const state=fixtures.update(time);
      if(state.shadowChanged)renderer.shadowMap.needsUpdate=true;
      return state.active;
    },
    snapshot(){return {environment:environmentMode,interior:fixtures.snapshot()};},
    setStyle(style){soft=style!=='sun';setTime();},
    prepareMesh(object,sectionClipped) {
      object.userData.sectionClipped=sectionClipped;
      const materials=Array.isArray(object.material)?object.material:[object.material];
      if(materials.every(m=>/^(foliage(?:_light)?|hedge)$/.test(m.name)))smoothSurfaceNormals(object.geometry);
      const glass=materials.every(isGlazing);object.userData.aoExcluded=glass;
      object.castShadow=!glass;object.receiveShadow=!glass;
      for(const material of materials) {
        prepareMaterialResponse(material,{context:!sectionClipped});preparedMaterials.add(material);
        material.clipShadows=true;
        if(isGlazing(material)){material.depthWrite=false;material.metalness=0;}
        for(const value of Object.values(material))if(value?.isTexture)value.anisotropy=Math.min(compact?8:16,renderer.capabilities.getMaxAnisotropy());
      }
    },
    frame(view,contextBounds) {
      const contextSize=contextBounds?.getSize(new THREE.Vector3());
      const extent=view==='neighborhood'?52:view==='region'?Math.max(contextSize?.x??320,contextSize?.z??320)*.65:24;
      sun.shadow.normalBias=view==='region'?.09:view==='neighborhood'?.035:.018;
      shadowDistance=view==='region'?340:110;
      sun.target.position.set(0,4,-5);
      if(view==='region'&&contextBounds)sun.target.position.copy(contextBounds.getCenter(new THREE.Vector3()));
      sun.position.copy(sun.target.position).addScaledVector(direction,shadowDistance);
      Object.assign(sun.shadow.camera,{left:-extent,right:extent,top:extent,bottom:-extent});
      sun.shadow.camera.updateProjectionMatrix();renderer.shadowMap.needsUpdate=true;
      ao.enabled=referenceProfile.aoEnabled&&!['neighborhood','region'].includes(view);setTime();
      for(const material of preparedMaterials)setMaterialScale(material,view);
    },
    pixelRatio(ratio){composer.setPixelRatio(ratio);},
    resize(w,h){composer.setSize(w,h);},
    render(currentCamera){beauty.camera=currentCamera;ao.setCamera(currentCamera);if(renderer.xr.isPresenting)renderer.render(scene,currentCamera);else composer.render();}
  };
}
