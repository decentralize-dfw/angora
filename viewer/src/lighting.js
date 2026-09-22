import * as THREE from 'three';
import {CompactOutput} from './compact-output.js';
import {createFixtureVertices} from './fixture-vertices.js';
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
import {prepareMaterialResponse,setInteriorMode,setMaterialScale} from './material-response.js';
import {smoothSurfaceNormals} from './context-surfaces.js';
import {configurePostprocessing} from './postprocessing.js';
import {applyRenderProfile,referenceProfile} from './render-profile.js';
import {LinearBloomPass} from './linear-bloom.js';
import {InteriorLightController} from './interior-lighting.js';
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
  const target=generator.fromScene(probe,.035,.1,20000);
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
// Task 1.1 flag surgery: this function no longer reads pointer-coarseness or
// the model root. Every capability arrives through the quality profile
// (quality-profile.js), whose legacy-compat mapping reproduces the old
// baked/compact behavior exactly while the FAZ 1 feature flags stay off.
export function createLighting(renderer, scene, camera, clip,{quality}={}) {
  const q=quality.value;
  renderer.shadowMap.enabled=q.dynamicSunShadow;renderer.shadowMap.autoUpdate=false;
  applyRenderProfile(renderer);
  // The horizon colour is no longer the background - the sky is. It stays as
  // the colour the terrain fades into at its edge and the colour distance
  // fades toward, and it still tracks the hour.
  const horizon=new THREE.Color('#e4e9ed');
  const hemisphere=new THREE.HemisphereLight(0xebf2ff,0xb8b2a8,.5);scene.add(hemisphere);
  const sun=new THREE.DirectionalLight(0xfff2df,1.55),direction=new THREE.Vector3(-.45,.85,-.3).normalize();
  sun.castShadow=q.dynamicSunShadow;sun.shadow.mapSize.setScalar(q.shadowMapSize||1024);
  sun.shadow.bias=-.000025;sun.shadow.normalBias=.018;sun.shadow.radius=2.5;
  sun.shadow.camera.near=.5;sun.shadow.camera.far=700;scene.add(sun,sun.target);
  const sky=new Sky();sky.scale.setScalar(10000);sky.material.uniforms.turbidity.value=3;
  sky.material.uniforms.rayleigh.value=2;sky.material.uniforms.mieCoefficient.value=.003;
  sky.material.uniforms.sunPosition.value.copy(direction);
  // The batched boot awaits the authored HDR before presenting a frame.
  // Do not compile/convolve a temporary probe that it immediately discards.
  let environment=q.buildProbeAtBoot?buildEnvironment(renderer,{sky}):null;
  scene.environment=environment?.texture??null;scene.environmentIntensity=1.0;
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
  // and eventually lose the context. Three applies the same AgX curve and sRGB
  // conversion itself when it draws to the canvas, so the image keeps its
  // exposure and its colour; it loses the crevice shading and the glare.
  const compactOutput=q.compactOutput?new CompactOutput():null;
  let composer=null,beauty=null,ao=null;
  if(q.postProcessing){
    const target=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,samples:referenceProfile.msaaSamples});
    composer=new EffectComposer(renderer,target);beauty=new RenderPass(scene,camera);
    // Full-resolution occlusion: at .85 the denoiser smeared contact shading
    // off thin rails and window reveals - the pass is the pipeline's own
    // stated "largest tell", so it gets its headroom.
    ao=new SectionGTAOPass(scene,camera,clip,q.gtaoResolutionScale??1);
    const smaa=new SMAAPass(),bloom=new LinearBloomPass();
    ao.enabled=referenceProfile.aoEnabled;
    configurePostprocessing(composer,{beauty,ao,smaa,bloom,output:new ShaderPass(GradeShader),
      dither:new ShaderPass(DisplayDitherShader)});
  }
  let day=172,hour=12.5,environmentMode='procedural-sky',walkInterior=false,lightsEnabled=true;
  const skyDirection=new THREE.Vector3();let skyDrawn=false;
  let soft=true,shadowDistance=110;
  const preparedMaterials=new Set();
  let groundLight=null,floorLight=null,electricLight=null,roomReflections=null,reflectionFloor=null,activeInteriorFloor=null;
  // The villa's see-through glazing, and what it was before the tour lit it.
  const glazing=new Set(),glazingRest=new WeakMap();
  const reflectionMaterials=new Set();
  function updateReflections(){
    const map=roomReflections?.get(reflectionFloor)??null;
    for(const material of reflectionMaterials){
      if(Boolean(material.envMap)!==Boolean(map))material.needsUpdate=true;
      material.envMap=map;
    }
  }
  const interior=Array.from({length:4},()=>{
    const light=new THREE.SpotLight(0xffead5,0,6,Math.PI*.37,.72,2);
    // Four shadow-casting spots is four extra scene passes every time a fixture
    // changes. Indoors on a phone the fixtures light, they do not cast.
    light.castShadow=q.fixtureShadows;light.shadow.mapSize.setScalar(512);
    light.shadow.bias=-.0001;light.shadow.normalBias=.01;light.shadow.camera.near=.06;
    light.visible=false;scene.add(light,light.target);return light;
  });
  const fixtures=new InteriorLightController(interior);
  const fixtureVertices=createFixtureVertices(fixtures);
  function setTime(nextHour=hour,nextDay=day) {
    hour=nextHour;day=nextDay;const solar=solarPosition(hour,{day});direction.fromArray(solar.direction);
    groundLight?.setSun(direction);
    floorLight?.setSun(direction);
    const daylight=THREE.MathUtils.smoothstep(solar.altitude,-6,28),warmth=THREE.MathUtils.smoothstep(solar.altitude,0,35);
    // Key over fill, about 2:1 at midday. With the fill nearly as strong as
    // the sun the image went flat - no shadow side, no specular pop - which
    // read as a cheap render engine. A defined warm key against a cooler,
    // dimmer fill is the archviz contrast the daylight is meant to carry.
    sun.intensity=(soft?1.8:2.4)*THREE.MathUtils.smoothstep(solar.altitude,-.5,20);
    sun.color.set(0xffbc7b).lerp(new THREE.Color(0xfff5e9),warmth);
    // The indoor camera exposes for the room, and the fixture bounce fills
    // downward-facing ceilings. Reuse the existing hemisphere: no extra light
    // loop, shadow map or render pass. This is a presentation fill, not GI.
    hemisphere.intensity=.06+.34*daylight+(walkInterior&&!electricLight?(lightsEnabled?.45:.18*daylight):0);
    hemisphere.groundColor.set(walkInterior?0xe9e1d5:0xb8b2a8);
    renderer.toneMappingExposure=referenceProfile.exposure*(walkInterior?1.18:1);
    scene.environmentIntensity=.08+(soft?.70:.55)*daylight;
    sun.shadow.radius=soft?2.5:1;sun.shadow.intensity=soft?.82:1;
    horizon.set(0x182734).lerp(new THREE.Color(0xe4e9ed),daylight);
    sky.material.uniforms.sunPosition.value.copy(direction);
    // Six cube faces of sky, re-rendered only when the sun has actually moved.
    // setTime() is also how a storey change re-frames the shadow camera, and
    // that happens with the hour untouched, so this was redrawing the sky on
    // every press of Bodrum, Giriş, 1. kat and Çatı for no change at all.
    if(environment&&(!skyDrawn||skyDirection.dot(direction)<.9999)){skyDirection.copy(direction);skyDrawn=true;skyCamera.update(renderer,skyScene);}
    sun.position.copy(sun.target.position).addScaledVector(direction,shadowDistance);
    for(const material of preparedMaterials)if(material.userData.indirectDaylightIntensity)material.lightMapIntensity=material.userData.indirectDaylightIntensity*daylight;
    renderer.shadowMap.needsUpdate=true;return solar;
  }
  return {
    setRoomReflections(value){roomReflections=value;updateReflections();},
    setElectricLight(value){electricLight=value;electricLight?.setEnabled(lightsEnabled);},
    setGroundLight(value){groundLight=value;groundLight?.setSun(direction);},
    setFloorLight(value){floorLight=value;floorLight?.setSun(direction);},
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
      scene.environment=next.texture;environment?.dispose();environment=next;hdr.dispose();environmentMode='hdr';setTime();
    },
    horizonColour:horizon,
    setFixtures(data,{allRooms=false}={}){
      if(allRooms){
        const count=Math.max(0,...[0,1,2,3].map(f=>data.filter(x=>x.floor_index===f).length));
        while(fixtures.slots.length<count){
          const light=new THREE.SpotLight(0xffead5,0,6,Math.PI*.42,.8,2);
          light.castShadow=false;light.visible=false;scene.add(light,light.target);
          fixtures.slots.push({light,source:null,desired:null,level:0,fade:null});
        }
        fixtures.keepSlotsVisible=true;
        for(const slot of fixtures.slots){slot.light.castShadow=false;slot.light.visible=true;}
      }
      fixtures.setFixtures(data);
    },
    // floor may be 'all' - the whole house lit for a night exterior - which
    // is not a storey a reflection probe can be baked for, so the probe keeps
    // the last real storey and only the fixtures hear about it.
    interior(floor,position,time,boost){
      const storey=typeof floor==='number'?floor:null;
      activeInteriorFloor=storey;
      if(walkInterior&&reflectionFloor!==storey){reflectionFloor=storey;updateReflections();}
      if(fixtures.setBoost(boost))setTime();
      fixtures.select(floor,position,time);
    },
    setLights(enabled){lightsEnabled=enabled;electricLight?.setEnabled(enabled);fixtures.setEnabled(enabled);setTime();},setTime,
    setWalkInterior(active){
      walkInterior=active;
      if(active){reflectionFloor=activeInteriorFloor;updateReflections();}
      for(const material of preparedMaterials)setInteriorMode(material,active);
      setTime(hour,day);
    },
    update(time){
      const state=fixtures.update(time);
      fixtureVertices.update();
      if(state.shadowChanged)renderer.shadowMap.needsUpdate=true;
      return state.active;
    },
    // "icerdeki isiklar disardan gozuksun". Lighting the rooms does not do
    // it: prepareBatchedMaterial strips NUM_SPOT_LIGHTS to 0 on everything
    // carrying vertex fixtures, which in this delivery is the architecture and
    // the interior both, and the same pass drives transparent glazing towards
    // alpha .75 at grazing angles - which is most of a window seen from a low
    // camera. So the rooms can be lit and rendered and the elevation still
    // reads as an empty house, which is exactly what shipped twice.
    //
    // What a lit window does from the garden is GLOW, so the glazing itself
    // carries it. Warm, and well under 1: at full strength it stops being a
    // window and becomes a lamp, and the room behind it disappears.
    setWindowGlow(level){
      for(const material of glazing){
        if(!glazingRest.has(material))
          glazingRest.set(material,{colour:material.emissive.clone(),intensity:material.emissiveIntensity});
        const rest=glazingRest.get(material);
        if(level>0){material.emissive.set(0xffc98a);material.emissiveIntensity=level;}
        else{material.emissive.copy(rest.colour);material.emissiveIntensity=rest.intensity;}
      }
      return glazing.size;
    },
    snapshot(){return {environment:environmentMode,interior:fixtures.snapshot(),glazing:glazing.size};},
    // Read-only evidence for the QA harness: which output path is live, and
    // the textures held in closures that a scene traversal cannot reach.
    qaState(){return {composer:Boolean(composer),gtao:Boolean(ao?.enabled),compactOutput:Boolean(compactOutput),
      textures:[groundLight?.texture,floorLight?.texture,...(electricLight?.textures??[]),environment?.texture].filter(Boolean)};},
    setStyle(style){soft=style!=='sun';setTime();},
    releaseMaterial(material){preparedMaterials.delete(material);reflectionMaterials.delete(material);},
    prepareMesh(object,{clipped,context,name}) {
      object.userData.sectionClipped=clipped;
      const materials=Array.isArray(object.material)?object.material:[object.material];
        if(materials.every(m=>!m.userData.angoraAuthoredPBR&&/^(foliage(?:_light)?|hedge)$/.test(m.name)))smoothSurfaceNormals(object.geometry);
      const glass=materials.every(isGlazing);object.userData.aoExcluded=glass;
      object.castShadow=!glass;object.receiveShadow=!glass;
      for(const material of materials) {
        electricLight?.apply(material);
        if(q.batchedGeometry&&['architecture','interior'].includes(name))fixtureVertices.apply(material);
        if(['architecture','interior'].includes(name)&&/-(metal|glass|wood)-/.test(material.name)){
          reflectionMaterials.add(material);material.envMap=roomReflections?.get(reflectionFloor)??null;
        }
        if(name==='context-ground'||(name==='garden'&&!/metal|glass|wood/.test(material.name)))groundLight?.apply(material);
        if(['architecture','interior'].includes(name)&&material.userData.angoraBatch?.materials.some(n=>/wood.floor|WOOD-FL|terra_floor|stone_tile|bath_tile|granite floor/i.test(n)))floorLight?.apply(material);
        prepareMaterialResponse(material,{context});preparedMaterials.add(material);
        // Three uses scene.environmentIntensity when envMap is null. Bind the
        // room finishes explicitly so their neutral response is respected.
        if(['plaster','soffit'].includes(material.userData.presentationR27?.family))material.envMap=environment?.texture??null;
        material.clipShadows=true;
          if(isGlazing(material)&&!material.userData.angoraAuthoredPBR){material.metalness=0;if(isSeeThrough(material))material.depthWrite=false;}
        // The house's own windows, kept so a night exterior can light them.
        // isGlazing, not isSeeThrough: the delivered pane is alphaMode BLEND
        // with no baseColorFactor and no transmission extension, so its opacity
        // reads 1 and its alpha lives in the texture. Asking whether you can
        // see through it collected nothing at all, and the first build of the
        // glow lit an empty set.
        if(name==='architecture'&&isGlazing(material))glazing.add(material);
        for(const value of Object.values(material))if(value?.isTexture)value.anisotropy=Math.min(quality.value.anisotropy,renderer.capabilities.getMaxAnisotropy());
      }
    },
    frame(view,contextBounds) {
      reflectionFloor=/^f[0-3]$/.test(view)?Number(view.slice(1)):null;updateReflections();
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
    async compile(currentCamera){
      if(!renderer.compileAsync)return;
      const previous=renderer.getRenderTarget();
      try{
        // Compile for the actual HDR target; a canvas compile would prepare
        // a different tone-mapping shader and still stall the first draw.
        if(compactOutput)renderer.setRenderTarget(compactOutput.target);
        await renderer.compileAsync(scene,currentCamera);
      }finally{renderer.setRenderTarget(previous);}
    },
    warm(currentCamera){
      if(composer&&!renderer.xr.isPresenting){
        // Warm the actual normal/AO/postprocessing passes too. A direct scene
        // render alone leaves their first floor draw inside the animation.
        const previous=composer.renderToScreen;composer.renderToScreen=false;
        try{beauty.camera=currentCamera;ao.setCamera(currentCamera);composer.render();}
        finally{composer.renderToScreen=previous;}
        return;
      }
      const previous=renderer.getRenderTarget(),target=new THREE.WebGLRenderTarget(1,1);
      try{renderer.setRenderTarget(target);renderer.render(scene,currentCamera);}
      finally{renderer.setRenderTarget(previous);target.dispose();}
    },
    render(currentCamera){
      if(compactOutput&&!renderer.xr.isPresenting){compactOutput.render(renderer,scene,currentCamera);return;}
      if(!composer||renderer.xr.isPresenting){renderer.render(scene,currentCamera);return;}
      beauty.camera=currentCamera;ao.setCamera(currentCamera);composer.render();
    }
  };
}
