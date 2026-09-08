import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import {solarPosition} from './daylight.js';

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
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate=false;renderer.toneMapping=THREE.AgXToneMapping;renderer.toneMappingExposure=1.18;
  scene.background=new THREE.Color('#e8eee8');
  const hemisphere=new THREE.HemisphereLight(0xe9f2ff,0xa5aa8c,.95);scene.add(hemisphere);
  const sun=new THREE.DirectionalLight(0xfff2df,2.6),direction=new THREE.Vector3(-.45,.85,-.3).normalize();
  sun.castShadow=true;sun.shadow.mapSize.setScalar(compact?2048:4096);
  sun.shadow.bias=-.00004;sun.shadow.normalBias=.012;sun.shadow.radius=3;
  sun.shadow.camera.near=.5;sun.shadow.camera.far=260;scene.add(sun,sun.target);
  const sky=new Sky();sky.scale.setScalar(10000);sky.material.uniforms.turbidity.value=3;
  sky.material.uniforms.rayleigh.value=2;sky.material.uniforms.mieCoefficient.value=.003;
  sky.material.uniforms.sunPosition.value.copy(direction);
  const skyScene=new THREE.Scene();skyScene.add(sky);
  const pmrem=new THREE.PMREMGenerator(renderer);let environment=pmrem.fromScene(skyScene,.06,.1,20000);
  scene.environment=environment.texture;scene.environmentIntensity=1.0;
  sky.geometry.dispose();sky.material.dispose();pmrem.dispose();
  const target=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,samples:Math.min(renderer.capabilities.maxSamples,compact?2:4)});
  const composer=new EffectComposer(renderer,target),beauty=new RenderPass(scene,camera);
  const ao=new SectionGTAOPass(scene,camera,clip,compact?.6:.8);ao.blendIntensity=.3;
  composer.addPass(beauty);composer.addPass(ao);composer.addPass(new OutputPass());
  let fixtures=[],lightsEnabled=true,activeFloor=null,activePosition=null,lightKey='',day=172,hour=12.5;
  const interior=Array.from({length:4},()=>{
    const light=new THREE.SpotLight(0xffead5,0,6,Math.PI*.37,.72,2);
    light.castShadow=true;light.shadow.mapSize.setScalar(compact?512:1024);
    light.shadow.bias=-.0001;light.shadow.normalBias=.01;light.shadow.camera.near=.06;
    light.visible=false;scene.add(light,light.target);return light;
  });
  function updateFixtures() {
    const p=activePosition?new THREE.Vector3(...activePosition):new THREE.Vector3(0,0,0);
    const nearest=lightsEnabled?fixtures.filter(f=>f.floor_index===activeFloor)
      .sort((a,b)=>new THREE.Vector3(...a.position).distanceToSquared(p)-new THREE.Vector3(...b.position).distanceToSquared(p)).slice(0,4):[];
    const key=nearest.map(f=>f.object??f.position.join(',')).join('|');if(key===lightKey)return;lightKey=key;
    interior.forEach((light,i)=>{
      const source=nearest[i];light.visible=Boolean(source);if(!source)return;
      light.position.fromArray(source.position);light.target.position.copy(light.position).add(new THREE.Vector3(...source.direction));
      light.color.fromArray(source.color);light.intensity=source.intensity_cd;light.distance=6;
    });renderer.shadowMap.needsUpdate=true;
  }
  function setTime(nextHour=hour,nextDay=day) {
    hour=nextHour;day=nextDay;const solar=solarPosition(hour,{day});direction.fromArray(solar.direction);
    const daylight=THREE.MathUtils.smoothstep(solar.altitude,-6,28),warmth=THREE.MathUtils.smoothstep(solar.altitude,0,35);
    sun.intensity=2.6*THREE.MathUtils.smoothstep(solar.altitude,-.5,20);
    sun.color.set(0xffbc7b).lerp(new THREE.Color(0xfff5e9),warmth);
    hemisphere.intensity=.1+.85*daylight;scene.environmentIntensity=.12+.92*daylight;
    scene.background.set(0x182734).lerp(new THREE.Color(0xe8eee8),daylight);
    sun.position.copy(sun.target.position).addScaledVector(direction,110);
    renderer.shadowMap.needsUpdate=true;return solar;
  }
  return {
    async loadEnvironment(url) {
      const hdr=await new HDRLoader().setDataType(THREE.FloatType).loadAsync(url);hdr.mapping=THREE.EquirectangularReflectionMapping;
      const generator=new THREE.PMREMGenerator(renderer),next=generator.fromEquirectangular(hdr);
      scene.environment=next.texture;environment.dispose();environment=next;generator.dispose();hdr.dispose();setTime();
    },
    setFixtures(data){fixtures=data??[];lightKey='';updateFixtures();},
    interior(floor,position){activeFloor=floor;activePosition=position;updateFixtures();},
    setLights(enabled){lightsEnabled=enabled;updateFixtures();},setTime,
    prepareMesh(object,sectionClipped) {
      object.userData.sectionClipped=sectionClipped;
      const materials=Array.isArray(object.material)?object.material:[object.material];
      const glass=materials.every(isGlazing);object.userData.aoExcluded=glass;
      object.castShadow=!glass;object.receiveShadow=!glass;
      for(const material of materials) {
        material.clipShadows=true;
        if(isGlazing(material)){material.depthWrite=false;material.metalness=0;}
        for(const value of Object.values(material))if(value?.isTexture)value.anisotropy=Math.min(compact?8:16,renderer.capabilities.getMaxAnisotropy());
      }
    },
    frame(view) {
      const extent=view==='neighborhood'?38:view==='region'?90:17;
      sun.target.position.set(0,4,-5);sun.position.copy(sun.target.position).addScaledVector(direction,110);
      Object.assign(sun.shadow.camera,{left:-extent,right:extent,top:extent,bottom:-extent});
      sun.shadow.camera.updateProjectionMatrix();renderer.shadowMap.needsUpdate=true;
      ao.enabled=!['neighborhood','region'].includes(view);setTime();
    },
    resize(w,h){composer.setSize(w,h);},
    render(currentCamera){beauty.camera=currentCamera;ao.setCamera(currentCamera);if(renderer.xr.isPresenting)renderer.render(scene,currentCamera);else composer.render();}
  };
}
