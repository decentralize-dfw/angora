import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {CameraFlight} from '../src/camera-flight.js';
import {configurePostprocessing} from '../src/postprocessing.js';
import {layoutAnchoredLabels,rectanglesOverlap} from '../src/screen-layout.js';
import {handleEscape} from '../src/interface-actions.js';
import {FrameMeasurement,summarizeFrames} from '../src/frame-measurement.js';
import {LinearBloomPass,softKneeWeight} from '../src/linear-bloom.js';
import {applyRenderProfile,referenceProfile} from '../src/render-profile.js';

test('r180 AA runs in linear-sRGB before the single final display conversion',()=>{
  const passes={beauty:{name:'beauty'},ao:{name:'AO'},smaa:{name:'SMAA'},bloom:{name:'linear bloom'},output:{name:'Output'}};
  const composer={passes:[],addPass(pass){this.passes.push(pass);}};
  configurePostprocessing(composer,passes);
  assert.deepEqual(composer.passes,[passes.beauty,passes.ao,passes.smaa,passes.bloom,passes.output]);
});

test('Reference production baseline has ACES, restrained linear bloom and no idle render switch',()=>{
  const renderer={shadowMap:{}};applyRenderProfile(renderer);
  assert.equal(renderer.toneMapping,THREE.ACESFilmicToneMapping);assert.equal(renderer.toneMappingExposure,.75);
  assert.equal(renderer.outputColorSpace,THREE.SRGBColorSpace);assert.equal(renderer.transmissionResolutionScale,1);
  assert.equal(referenceProfile.refinement,false);assert.equal(referenceProfile.pathTracing,false);
  // Occlusion is on here even though the reference ships it off: see the note
  // in render-profile.js. Its white studio had no crevices; a villa is crevices.
  assert.equal(referenceProfile.aoEnabled,true);
  const pass=new LinearBloomPass();pass.setSize(1170,2100);
  assert.equal(pass.bright.width,585);assert.equal(pass.blurA.width,292);assert.equal(pass.blurA.height,525);
  assert.equal(pass.combine.uniforms.strength.value,.1);assert.equal(pass.extract.uniforms.threshold.value,.06);
  const original=new THREE.WebGLRenderTarget(),input=new THREE.WebGLRenderTarget(),output=new THREE.WebGLRenderTarget();
  const draws=[],mock={current:original,getRenderTarget(){return this.current;},setRenderTarget(target){this.current=target;},render(){draws.push(this.current);}};
  pass.render(mock,output,input);assert.equal(draws.length,6);assert.equal(draws.at(-1),output);assert.equal(mock.current,original);
  assert.equal(pass.combine.uniforms.source.value,input.texture);assert.equal(pass.extract.uniforms.source.value,input.texture);
  mock.render=()=>{throw Error('GPU failure');};assert.throws(()=>pass.render(mock,output,input));assert.equal(mock.current,original);
  pass.setSize(1,1);assert.equal(pass.blurA.width,1);
  pass.dispose();original.dispose();input.dispose();output.dispose();
  assert.equal(softKneeWeight(0,.06,.036),0);
  assert.ok(Math.abs(softKneeWeight(.06-1e-7,.06,.036)-softKneeWeight(.06+1e-7,.06,.036))<.00001);
});

test('Camera deadline completes for fractional clocks, large clocks and instant motion',()=>{
  const before=global.matchMedia;global.matchMedia=()=>({matches:false});
  try{
    for(const start of [0,1437.20187,.123456789,1e8+.20187]){
      const camera=new THREE.PerspectiveCamera(16,1,.2,2000);camera.position.set(60,100,60);
      const controls={target:new THREE.Vector3(),enabled:true,update(){}};
      const flight=new CameraFlight(camera,controls,()=>{},()=>{});
      flight.go({target:new THREE.Vector3(1,3,2),polar:.12,span:36,zoom:1.8});
      Object.assign(flight.active,{start,endTime:start+1250});
      const position=camera.position.clone();flight.update(start-1);assert.ok(camera.position.distanceTo(position)<1e-10);
      flight.update(start+1249);assert.ok(flight.active);assert.equal(controls.enabled,false);
      flight.update(start+1250);assert.equal(flight.active,null);assert.equal(controls.enabled,true);
      assert.equal(camera.zoom,1.8);assert.ok(controls.target.equals(new THREE.Vector3(1,3,2)));
      flight.go({target:new THREE.Vector3(),polar:.6,span:30},true);assert.equal(flight.active,null);
      global.matchMedia=()=>({matches:true});flight.go({target:new THREE.Vector3(),polar:.5,span:40});
      assert.equal(flight.active,null);assert.equal(controls.enabled,true);global.matchMedia=()=>({matches:false});
    }
  }finally{global.matchMedia=before;}
});

test('Labels never overlap actual UI, each other, or viewport edges',()=>{
  for(const [width,height] of [[320,568],[390,700],[430,850],[844,390]]){
    const obstacles=[{left:12,right:width-12,top:8,bottom:108},{left:width-60,right:width-8,top:110,bottom:245},
      {left:20,right:width-20,top:height-118,bottom:height-10}];
    const items=Array.from({length:27},(_,i)=>({id:i,x:20+(i%5)*(width-40)/4,y:110+Math.floor(i/5)*60,width:112,height:50}));
    const placed=layoutAnchoredLabels(items,{width,height,obstacles});assert.ok(placed.length);
    for(const [i,item] of placed.entries()){
      assert.ok(item.rect.left>=8&&item.rect.right<=width-8&&item.rect.top>=8&&item.rect.bottom<=height-8);
      assert.ok(!obstacles.some(r=>rectanglesOverlap(item.rect,r,6)));
      assert.ok(!placed.slice(0,i).some(p=>rectanglesOverlap(item.rect,p.rect,6)));
      assert.ok(Math.hypot(item.x-items[item.id].x,item.y-items[item.id].y)<=24);
    }
    assert.deepEqual(placed,layoutAnchoredLabels(items,{width,height,obstacles}));
  }
});

test('Dense and offscreen labels are hidden instead of piled at the bottom',()=>{
  const items=Array.from({length:20},(_,id)=>({id,x:160,y:300,width:110,height:44}));
  assert.deepEqual(layoutAnchoredLabels(items,{width:320,height:568}).map(p=>p.id),[0]);
  assert.equal(layoutAnchoredLabels([{x:-4,y:200,width:90,height:44},{x:160,y:200,width:340,height:44}],{width:320,height:568}).length,0);
  assert.equal(layoutAnchoredLabels(items,{width:320,height:568,obstacles:[{left:0,right:320,top:0,bottom:568}]}).length,0);
});

test('Escape closes only the uppermost UI and never exits immersive mode',()=>{
  const calls=[],event={key:'Escape',preventDefault(){calls.push('prevent');}};
  const actions={panelOpen:true,closePanel(){calls.push('panel');},walkActive:true,immersive:false,exitWalk(){calls.push('walk');}};
  assert.equal(handleEscape(event,actions),'panel');assert.deepEqual(calls,['prevent','panel']);
  calls.length=0;actions.panelOpen=false;assert.equal(handleEscape(event,actions),'walk');assert.deepEqual(calls,['prevent','walk']);
  calls.length=0;actions.immersive=true;assert.equal(handleEscape(event,actions),null);assert.deepEqual(calls,[]);
  assert.equal(handleEscape({key:'Tab'},actions),null);
});

test('Measured frame statistics never imply visual or physical-device acceptance',()=>{
  const m=new FrameMeasurement(1000);m.start(0,{revision:'test'});
  for(let i=0;i<=60;i++)m.sample(i*1000/60,{draw_calls:50,triangles:10000,drawing_buffer:'1170×2100',view:'f0'});
  assert.equal(m.active,false);assert.equal(m.result.status,'recorded');
  assert.equal(m.result.visual_acceptance,'not_reviewed');assert.equal(m.result.physical_device_verified,false);
  assert.ok(Math.abs(m.result.summary.fps-60)<1e-9);
  assert.ok(Math.abs(m.result.summary.frame_ms_p95-1000/60)<1e-9);
  assert.deepEqual(m.result.summary.drawing_buffers,['1170×2100']);
  m.start(2000,{});m.sample(2000,{});m.sample(2050,{});m.finish();assert.equal(m.result.status,'interrupted');
  assert.equal(summarizeFrames([]).fps,null);assert.equal(summarizeFrames([]).frame_ms_p95,null);
});

test('Frame reports preserve stalls and detect view/buffer changes',()=>{
  const s=summarizeFrames([{interval_ms:16,drawing_buffer:'100×100',view:'f0'},
    {interval_ms:200,drawing_buffer:'200×200',view:'f1'}]);
  assert.equal(s.frame_ms_max,200);assert.equal(s.frames_over_33_4_ms,1);
  assert.deepEqual(s.drawing_buffers,['100×100','200×200']);assert.deepEqual(s.views,['f0','f1']);
});
