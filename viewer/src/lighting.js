import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import {DisplayDitherShader} from './display-dither.js';
import {GradeShader} from './grade-pass.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import {solarPosition} from './daylight.js';
import {prepareMaterialResponse,setMaterialScale} from './material-response.js';
import {smoothSurfaceNormals} from './context-surfaces.js';
import {configurePostprocessing} from './postprocessing.js';
import {applyRenderProfile,referenceProfile} from './render-profile.js';
import {LinearBloomPass} from './linear-bloom.js';
import {InteriorLightController} from './interior-lighting.js';

// The normal/depth pass must be cut exactly where the beauty pass is cut, or
// the storeys above the section still occlude and their plan outlines appear
// as grey smudges over the lawn and the floor below.
//
// Per-object planes cannot do it. This pass draws the scene through
// scene.overrideMaterial, so every object is rendered with one material, and
// three projects a material's clipping planes only when the material changes:
// WebGLClipping.setState is called with useCache = (same camera && same
// material id), and a cache hit skips the projection entirely. With one
// material for the whole pass every object after the first is a cache hit, so
// the plane the first object happened to carry - none, for the neighbourhood -
// is the plane the entire pass gets.
//
// A renderer-global plane is projected once per render, before any object is
// drawn, and applies to all of them. It costs the neighbourhood its contact
// occlusion above the cut while a storey is selected, which is white massing
// there anyway.
export class SectionGTAOPass extends GTAOPass {
  constructor(scene, camera, clip, scale) {
    super(scene, camera, 1, 1);
    this.resolutionScale = scale;
    this.normalMaterial.side = THREE.DoubleSide;
    this.clip = clip;
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
      scale:1.05, samples:12, distanceFallOff:1, screenSpaceRadius:false});
    this.updatePdMaterial({radius:5, samples:8, depthPhi:3, normalPhi:4});
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
  // Only the scene draw is cut. The occlusion, denoise and blend quads that
  // follow are raw shaders with no clipping chunk in them, but the planes are
  // put back the moment the scene is down regardless, so the beauty pass and
  // the shadow map keep their own per-material clipping untouched.
  _renderOverride(renderer, overrideMaterial, renderTarget, clearColor, clearAlpha) {
    const previous = renderer.clippingPlanes;
    this.sectionPlanes[0].copy(this.clip); this.sectionPlanes[0].constant += 0.004;
    renderer.clippingPlanes = this.sectionPlanes;
    try { super._renderOverride(renderer, overrideMaterial, renderTarget, clearColor, clearAlpha); }
    finally { renderer.clippingPlanes = previous; }
  }
}

// The environment a surface reflects has to have a GROUND. A sky-only probe -
// the procedural sky, and the puresky HDR that replaces it - leaves the whole
// lower hemisphere empty, so every eave, soffit, balcony underside and window
// reveal is lit from above and by nothing from below, and glazing reflects a
// void under the horizon. A studio probe carries a bright floor underfoot for
// exactly this reason: it is what fills the underside of everything standing
// on it.
//
// The level is not picked to look right. For a sky of radiance L the irradiance
// reaching flat ground is PI*L and it leaves again as albedo*L, so the panel is
// the site's own albedo rendered unlit at the sky's own level.
const GROUND_ALBEDO='#6f7a60'; // the settlement's grass, paving and roads, averaged
export function buildEnvironment(renderer,{sky=null,background=null}) {
  const probe=new THREE.Scene();
  if(sky)probe.add(sky);
  if(background){background.mapping=THREE.EquirectangularReflectionMapping;probe.background=background;}
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(8000,8000),
    new THREE.MeshBasicMaterial({color:new THREE.Color(GROUND_ALBEDO)}));
  ground.rotation.x=-Math.PI/2;ground.position.y=-1;probe.add(ground);
  const generator=new THREE.PMREMGenerator(renderer);
  const target=generator.fromScene(probe,.06,.1,20000);
  probe.remove(ground);ground.geometry.dispose();ground.material.dispose();generator.dispose();
  return target;
}

export function isGlazing(material) {
  return isSeeThrough(material) || /glass|glazing|cam yüzey/i.test(material.name);
}
// Whether anything is actually visible through it, which is a different
// question from whether it is glass. The lift door's rose, leaves and amber
// ribbon are glass by name and by material - and they are solid: coloured
// pieces leaded into the panel, transmission 0, fully opaque. Switching their
// depth write off with the windows' let the frosted ground, which three draws
// in its own pass after the opaque queue, paint straight over them, and the
// leaded pattern went under a milky sheet. Depth belongs to whatever you
// cannot see through.
export function isSeeThrough(material) {
  return material.transmission>0 || (material.transparent && material.opacity<.98);
}
export function createLighting(renderer, scene, camera, clip) {
  const compact=matchMedia('(pointer: coarse)').matches;
  renderer.shadowMap.enabled=true;renderer.shadowMap.autoUpdate=false;
  applyRenderProfile(renderer);
  // The horizon colour is no longer the background - the sky is. It stays as
  // the colour the terrain fades into at its edge and the colour distance
  // fades toward, and it still tracks the hour.
  const horizon=new THREE.Color('#e4e9ed');
  const hemisphere=new THREE.HemisphereLight(0xebf2ff,0xb8b2a8,.5);scene.add(hemisphere);
  const sun=new THREE.DirectionalLight(0xfff2df,1.55),direction=new THREE.Vector3(-.45,.85,-.3).normalize();
  sun.castShadow=true;sun.shadow.mapSize.setScalar(compact?1024:4096);
  sun.shadow.bias=-.000025;sun.shadow.normalBias=.018;sun.shadow.radius=2.5;
  sun.shadow.camera.near=.5;sun.shadow.camera.far=700;scene.add(sun,sun.target);
  const sky=new Sky();sky.scale.setScalar(10000);sky.material.uniforms.turbidity.value=3;
  sky.material.uniforms.rayleigh.value=2;sky.material.uniforms.mieCoefficient.value=.003;
  sky.material.uniforms.sunPosition.value.copy(direction);
  let environment=buildEnvironment(renderer,{sky});
  scene.environment=environment.texture;scene.environmentIntensity=1.0;
  // The sky was built, handed to the probe and thrown away, leaving a flat fill
  // behind every window and over the whole settlement. It is kept now and
  // re-rendered into a small cube whenever the sun moves, so what the viewer
  // looks at is the same sky the study is lit by. Cheap: six 256 px faces of a
  // shader with no geometry behind it.
  const skyScene=new THREE.Scene();skyScene.add(sky);
  const skyTarget=new THREE.WebGLCubeRenderTarget(256,{type:THREE.HalfFloatType});
  const skyCamera=new THREE.CubeCamera(1,20000,skyTarget);
  scene.background=skyTarget.texture;
  // The sky shader's own radiance sits well above the range this pipeline
  // exposes for, so unscaled it reaches the curve already saturated and lands
  // as flat white with no blue left in it. This holds it where a sky belongs.
  scene.backgroundIntensity=.55;
  // No haze. Distance fog was tried here for depth and it read as a grey cast
  // over the whole settlement rather than as air, which is worse than the flat
  // look it was meant to fix.
  scene.fog=null;
  // A phone draws the scene straight to the canvas. The desktop chain is six
  // full-screen passes over a half-float target - occlusion, antialiasing,
  // bloom, grade, dither - and on a handset that is the whole frame budget
  // spent before a single wall is drawn, which is what made it stutter, run hot
  // and eventually lose the context. Three applies the same ACES curve and sRGB
  // conversion itself when it draws to the canvas, so the image keeps its
  // exposure and its colour; it loses the crevice shading and the glare.
  let composer=null,beauty=null,ao=null;
  if(!compact){
    const target=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,samples:referenceProfile.msaaSamples});
    composer=new EffectComposer(renderer,target);beauty=new RenderPass(scene,camera);
    ao=new SectionGTAOPass(scene,camera,clip,.85);
    const smaa=new SMAAPass(),bloom=new LinearBloomPass();
    ao.enabled=referenceProfile.aoEnabled;
    configurePostprocessing(composer,{beauty,ao,smaa,bloom,output:new ShaderPass(GradeShader),
      dither:new ShaderPass(DisplayDitherShader)});
  }
  let day=172,hour=12.5,environmentMode='procedural-sky';
  const skyDirection=new THREE.Vector3();let skyDrawn=false;
  let soft=true,shadowDistance=110;
  const preparedMaterials=new Set();
  const interior=Array.from({length:4},()=>{
    const light=new THREE.SpotLight(0xffead5,0,6,Math.PI*.37,.72,2);
    // Four shadow-casting spots is four extra scene passes every time a fixture
    // changes. Indoors on a phone the fixtures light, they do not cast.
    light.castShadow=!compact;light.shadow.mapSize.setScalar(512);
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
    horizon.set(0x182734).lerp(new THREE.Color(0xe4e9ed),daylight);
    sky.material.uniforms.sunPosition.value.copy(direction);
    // Six cube faces of sky, re-rendered only when the sun has actually moved.
    // setTime() is also how a storey change re-frames the shadow camera, and
    // that happens with the hour untouched, so this was redrawing the sky on
    // every press of Bodrum, Giriş, 1. kat and Çatı for no change at all.
    if(!skyDrawn||skyDirection.dot(direction)<.9999){skyDirection.copy(direction);skyDrawn=true;skyCamera.update(renderer,skyScene);}
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
      // The HDR is a pure sky, so it goes through the same probe as the
      // procedural one rather than straight into the scene: it supplies the
      // dome, the probe supplies the ground under it.
      const next=buildEnvironment(renderer,{background:hdr});
      scene.environment=next.texture;environment.dispose();environment=next;hdr.dispose();environmentMode='hdr';setTime();
    },
    horizonColour:horizon,
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
    prepareMesh(object,{clipped,context}) {
      object.userData.sectionClipped=clipped;
      const materials=Array.isArray(object.material)?object.material:[object.material];
      if(materials.every(m=>/^(foliage(?:_light)?|hedge)$/.test(m.name)))smoothSurfaceNormals(object.geometry);
      const glass=materials.every(isGlazing);object.userData.aoExcluded=glass;
      object.castShadow=!glass;object.receiveShadow=!glass;
      for(const material of materials) {
        prepareMaterialResponse(material,{context});preparedMaterials.add(material);
        material.clipShadows=true;
        if(isGlazing(material)){material.metalness=0;if(isSeeThrough(material))material.depthWrite=false;}
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
      // Region frames the whole settlement, where a crevice-scale radius has
      // nothing left to describe and only costs, so occlusion stops there.
      if(ao)ao.enabled=referenceProfile.aoEnabled&&view!=='region';
      setTime();
      for(const material of preparedMaterials)setMaterialScale(material,view);
    },
    pixelRatio(ratio){composer?.setPixelRatio(ratio);},
    resize(w,h){composer?.setSize(w,h);},
    render(currentCamera){
      if(!composer||renderer.xr.isPresenting){renderer.render(scene,currentCamera);return;}
      beauty.camera=currentCamera;ao.setCamera(currentCamera);composer.render();
    }
  };
}
