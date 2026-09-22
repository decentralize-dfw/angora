import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {readStops,route,createLift,CABIN_NODE,LEAF_NODE,SERVED_FLOORS,SHAFT,
  HINGE_X,HINGE_Z,CLOSED_ROTATION_Y,FLOOR_SEND_LABEL} from '../src/lift.js';
import {floorDatums} from '../src/section.js';

// Every GLB read targets the delivered set. viewer/public/models/full/ is a
// stale version-2 delivery whose level-0 has 33 nodes and no animation - a
// lift test against that copy would pass vacuously or fail confusingly.
const delivered=name=>new URL(`build/web/full/${name}`,new URL('../../',import.meta.url));
const glbJson=name=>{
  const data=fs.readFileSync(delivered(name));
  assert.equal(data.readUInt32LE(0),0x46546C67,name+' is a GLB');
  return {json:JSON.parse(data.subarray(20,20+data.readUInt32LE(12))),data};
};
const binChunk=({json,data})=>{
  const jsonLength=data.readUInt32LE(12);
  const binStart=20+jsonLength;
  assert.equal(data.readUInt32LE(binStart+4),0x004E4942,'BIN chunk follows JSON');
  return data.subarray(binStart+8,binStart+8+data.readUInt32LE(binStart));
};
const readFloats=(glb,bin,accessorIndex)=>{
  const accessor=glb.json.accessors[accessorIndex];
  const view=glb.json.bufferViews[accessor.bufferView];
  assert.equal(accessor.componentType,5126,'animation accessors are plain FLOAT');
  const components={SCALAR:1,VEC3:3}[accessor.type];
  const start=(view.byteOffset??0)+(accessor.byteOffset??0);
  const out=[];
  // the Draco re-encode leaves negative zeros in the untouched animation
  // accessors; normalise so strict deep equality means value equality
  for(let i=0;i<accessor.count*components;i++){const v=bin.readFloatLE(start+i*4);out.push(v===0?0:v);}
  return out;
};

// R44 merged the storeys into villa.glb; the clip, the panel and every
// landing leaf now travel in the one building file
const level0=glbJson('villa.glb');

test('The delivered clip is the three-stop travel the playback is built on',()=>{
  assert.equal(level0.json.animations?.length,1);
  const [animation]=level0.json.animations;
  assert.equal(animation.channels.length,1);
  const channel=animation.channels[0];
  assert.equal(channel.target.path,'translation');
  assert.equal(level0.json.nodes[channel.target.node].name,'R39 lift cabin travel');
  const sampler=animation.samplers[channel.sampler];
  assert.equal(sampler.interpolation??'LINEAR','LINEAR');
  const bin=binChunk(level0);
  const times=readFloats(level0,bin,sampler.input);
  const values=readFloats(level0,bin,sampler.output);
  assert.deepEqual(times,[0.0416666679084301,2,12,14,24,26,46]);
  const heights=values.filter((_,i)=>i%3===1);
  assert.deepEqual(heights,[0,0,3.099600076675415,3.099600076675415,6.371399879455566,6.371399879455566,0]);
  for(let i=0;i<values.length;i+=3){assert.equal(values[i],0);assert.equal(values[i+2],0);}
  // The stops land on the floor datums to float32; the worst representation
  // error is 120.5 nm, so no keyframe correction is needed or wanted.
  assert.ok(Math.abs(heights[2]-floorDatums[1])<2e-7);
  assert.ok(Math.abs(heights[4]-floorDatums[2])<2e-7);
});

const clipFrom=(times,heights)=>new THREE.AnimationClip('Animation',-1,[
  new THREE.VectorKeyframeTrack(CABIN_NODE+'.position',times,times.flatMap((_,i)=>[0,heights[i],0]))]);
const deliveredClip=()=>clipFrom([0.0416666679084301,2,12,14,24,26,46],
  [0,0,3.099600076675415,3.099600076675415,6.371399879455566,6.371399879455566,0]);

test('readStops derives the park schedule instead of hardcoding it',()=>{
  const stops=readStops(deliveredClip());
  assert.deepEqual([...stops.entries()].map(([f,t])=>[f,+t.toFixed(6)]),[[0,1.020833],[1,13],[2,25]]);
  for(const [floor,time] of stops){
    const track=deliveredClip().tracks[0];
    const i=track.times.findIndex(t=>t>=time);
    void i; // the height check is the real assertion:
  }
  assert.throws(()=>readStops(clipFrom([0,2,4],[0,1.7,1.7])),/matches no floor datum/);
  assert.throws(()=>readStops(clipFrom([0,2],[0,3.0996])),/fewer than two stops/);
});

test('All six ordered trips route as clean single-direction moves',()=>{
  const stops=readStops(deliveredClip());
  const expected={'0,1':[1,11.979167],'1,0':[-1,11.979167],'1,2':[1,12],'2,1':[-1,12],'0,2':[-1,22.020833],'2,0':[1,22.020833]};
  for(const [pair,[dir,dur]] of Object.entries(expected)){
    const [from,to]=pair.split(',').map(Number);
    const r=route(stops,from,to);
    assert.equal(r.dir,dir,pair);
    assert.ok(Math.abs(r.dur-dur)<1e-5,`${pair}: ${r.dur}`);
    // no intermediate stop window is crossed into a dwell: walk the leg and
    // require monotonic height until arrival
    let previous=null,reversals=0;
    for(let k=0;k<=100;k++){
      const t=((r.a+r.dir*(k/100)*r.dur)%46+46)%46;
      const track=deliveredClip().tracks[0];
      let height=track.values[1];
      for(let i=0;i+1<track.times.length;i++)if(t>=track.times[i]&&t<=track.times[i+1]){
        const f=(t-track.times[i])/(track.times[i+1]-track.times[i]);
        height=track.values[i*3+1]*(1-f)+track.values[i*3+4]*f;
      }
      if(previous!==null&&Math.abs(height-previous)>1e-9){
        const direction=Math.sign(height-previous);
        if(reversals===0)reversals=direction;
        else if(direction!==reversals)assert.fail(`${pair} reverses direction`);
      }
      previous=height;
    }
  }
});

test('The delivery carries six closed landing-door parts per served floor',()=>{
  const sanitize=s=>s.replace(/\s/g,'_').replace(/[\[\]./:]/g,'');
  // three served floors x six parts, all in the merged building file
  for(const [file,expected] of [['villa.glb',18],['garden.glb',0],['section-caps.glb',0]]){
    const {json}=glbJson(file);
    const leaves=(json.nodes??[]).filter(n=>LEAF_NODE.test(sanitize(n.name??'')));
    assert.equal(leaves.length,expected,file);
    for(const leaf of leaves){
      const [x,y,z,w]=leaf.rotation??[0,0,0,1];
      // delivered pose: -90 degrees about Y = fully open
      assert.ok(Math.abs(x)<1e-5&&Math.abs(z)<1e-5,leaf.name+' hinge axis is vertical');
      assert.equal(leaf.extras.lift_leaf_closed_pose,true);
      assert.ok(Math.abs(y)<1e-4&&Math.abs(w-1)<1e-4,leaf.name+' delivered closed');
    }
  }
});

test('The repaired car panel stands inside the cabin, no longer at the origin',()=>{
  // R39 shipped these 15 nodes at translation (0,0,0) - the control strip
  // stood half-buried in the basement hall floor and rode through the
  // entrance hall whenever the cabin moved. tools/fit_lift_panel_r39.mjs
  // rebuilds the panel on the cabin west wall; this pins the repair. When a
  // future delivery lands with the panel authored in place, this still holds.
  const panel=/^(R33 \| (Cabin (stainless control strip|raised floor button|floor button bezel|floor indicator|alarm button)|Alarm safety surround)|R38 panel marking )/;
  const nodes=(level0.json.nodes??[]).filter(n=>panel.test(n.name??''));
  assert.equal(nodes.length,15);
  for(const node of nodes){
    const [x,y,z]=node.translation??[0,0,0];
    assert.ok(Math.hypot(x,y,z)>1e-6,node.name+' must not sit at the world origin');
    assert.ok(x>=-2.656&&x<=-1.404,node.name+' x inside the cabin: '+x);
    assert.ok(y>=0.085&&y<=2.205,node.name+' y inside the cabin: '+y);
    assert.ok(z>=-1.135&&z<=-0.244,node.name+' z inside the cabin: '+z);
  }
});

// A miniature but faithful rig: real cabin node, real leaf placement, driven
// through the public surface exactly as main.js drives it.
function rig(closedPose=false){
  // one merged villa group, the way R44 delivers it: cabin and all three
  // floors' leaves under a single root, floors told apart by height
  const groups=new Map();
  const cabin=new THREE.Group();cabin.name=CABIN_NODE;
  const villa=new THREE.Group();villa.add(cabin);
  groups.set('villa',villa);
  for(const f of SERVED_FLOORS){
    const leaf=new THREE.Object3D();
    leaf.name='Lift_door_stile'+(f===0?'':String(f).padStart(3,'0'));
    // delivered open pose: leaf swung -90 about the hinge line
    leaf.position.set(HINGE_X,floorDatums[f]+1,HINGE_Z-0.99);
    leaf.quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0),-Math.PI/2);
    if(closedPose){leaf.position.set(HINGE_X-.99,floorDatums[f]+1,HINGE_Z);leaf.quaternion.identity();leaf.userData.lift_leaf_closed_pose=true;}
    // an Object3D has no geometry; give the floor detector its true bounds
    const marker=new THREE.Mesh(new THREE.BoxGeometry(0.01,0.01,0.01));
    marker.position.set(0,0,0);leaf.add(marker);
    villa.add(leaf);
  }
  const clipPlane={constant:16.42};
  let shadowCalls=0;
  const lift=createLift({groups,clips:[deliveredClip()],clipPlane,fullHeight:16.42,
    shadowsDirty:()=>{shadowCalls++;},onSettled:()=>{}});
  return {lift,groups,clipPlane,cabin,shadows:()=>shadowCalls};
}
test('Closed native leaf exports stay shut, then open outward onto the landing',()=>{
  const {lift,groups}=rig(true);
  assert.deepEqual(lift.snapshot().doors,[0,0,0]);
  for(const f of SERVED_FLOORS){
    let pivot=null;
    groups.get('villa').traverse(o=>{if(o.name==='Lift landing door pivot | F'+f)pivot=o;});
    assert.ok(Math.abs(pivot.rotation.y)<1e-8);
  }
  lift.setWalkActive(true);lift.setWalkFloor(1);assert.equal(lift.run(0),true);
  let time=0;while(lift.update(time)&&time<60000)time+=100;
  assert.ok(time<60000);
  assert.deepEqual(lift.snapshot().doors,[0,1,0]);
  assert.ok(Math.abs(doorAngle(groups,1)-Math.PI/2)<1e-8,'arrival leaf swings outward');
});
const doorAngle=(groups,f)=>{
  let pivot=null;
  for(const group of groups.values())group.traverse(o=>{if(o.name==='Lift landing door pivot | F'+f)pivot=o;});
  return pivot.rotation.y;
};

test('Every landing door is closed in parked plan and section states',()=>{
  const {lift,groups}=rig();
  for(const f of SERVED_FLOORS)assert.equal(doorAngle(groups,f),CLOSED_ROTATION_Y);
  for(const [view,floor] of [['f1',1],['f2',2],['f0',0],['f3',2]]){
    lift.park(view);
    assert.equal(lift.floor,floor,view);
    for(const f of SERVED_FLOORS)assert.equal(doorAngle(groups,f),CLOSED_ROTATION_Y,`${view} door ${f}`);
  }
  for(const view of ['building','neighborhood','region']){
    lift.park(view);
    assert.equal(lift.floor,2,view+' leaves the cabin alone');
  }
});

test('Parking scrubs the cabin to the floor datum bit-exactly',()=>{
  const {lift,cabin}=rig();
  lift.park('f1');assert.equal(cabin.position.y,3.099600076675415);
  lift.park('f2');assert.equal(cabin.position.y,6.371399879455566);
  lift.park('f0');assert.equal(cabin.position.y,0);
});

test('A trip closes the origin door, travels, then opens the arrival door - and the update contract re-arms only while it runs',()=>{
  const {lift,groups,cabin}=rig();
  lift.setWalkActive(true);lift.setWalkFloor(1);
  assert.equal(lift.target(),1);
  assert.equal(lift.run(0),true,'cabin at f0, walker at f1: call it up');
  let time=0,sawMotionWithDoorOpen=false,sawDoorWhileUnlevel=false;
  let previousY=cabin.position.y;
  while(lift.update(time)&&time<60000){
    time+=100;
    const moved=Math.abs(cabin.position.y-previousY)>1e-9;previousY=cabin.position.y;
    const openness=SERVED_FLOORS.map(f=>1-doorAngle(groups,f)/CLOSED_ROTATION_Y);
    if(moved&&openness.some(o=>o>1e-6))sawMotionWithDoorOpen=true;
    const level=floorDatums.some(d=>Math.abs(cabin.position.y-d)<0.0101);
    if(!level&&openness.some(o=>o>1e-6))sawDoorWhileUnlevel=true;
  }
  assert.ok(time<60000,'trip terminates');
  assert.equal(lift.update(time+100),false,'settled frames stop asking to redraw');
  assert.equal(lift.floor,1);
  assert.equal(cabin.position.y,3.099600076675415);
  assert.equal(doorAngle(groups,1),0,'arrival door open');
  assert.equal(doorAngle(groups,0),CLOSED_ROTATION_Y,'origin door shut');
  assert.equal(sawMotionWithDoorOpen,false,'the cabin never moves with a door open');
  assert.equal(sawDoorWhileUnlevel,false,'no door moves while the cabin is between floors');
  // and a second press now reads as a send-away
  assert.equal(lift.target(),2,'cabin here: the button offers to send it on');
  assert.equal(FLOOR_SEND_LABEL[2],'1. kata gönder');
});

test('Travel is refused under a section cut and outside the walk',()=>{
  const {lift,clipPlane}=rig();
  lift.setWalkFloor(1);
  assert.equal(lift.canRun(),false,'not walking');
  lift.setWalkActive(true);
  for(const constant of [1.6,4.6996,7.9714,10.7705]){
    clipPlane.constant=constant;
    assert.equal(lift.canRun(),false,'cut at '+constant);
    assert.equal(lift.run(0),false);
  }
  clipPlane.constant=16.42;
  assert.equal(lift.canRun(),true);
});

test('cancel() snaps the rig back to a coherent parked state mid-trip',()=>{
  const {lift,groups,cabin}=rig();
  lift.setWalkActive(true);lift.setWalkFloor(2);
  lift.run(0);
  for(let t=0;t<6000;t+=100)lift.update(t); // mid-travel
  assert.notEqual(cabin.position.y,0);
  lift.cancel();
  assert.equal(lift.travelling,false);
  assert.equal(cabin.position.y,0,'cancelled trip returns to its origin floor');
  for(const f of SERVED_FLOORS)assert.equal(doorAngle(groups,f),CLOSED_ROTATION_Y);
});

test('The manifest records the playback as integrated with the measured schedule',()=>{
  const manifest=JSON.parse(fs.readFileSync(delivered('manifest.json')));
  assert.deepEqual(manifest.lift_served_floor_indices,SERVED_FLOORS);
  const native=manifest.native_lift_animation;
  assert.equal(native.asset,'villa.glb');
  assert.equal(native.animations,1);
  assert.equal(native.viewer_playback_integrated,true);
  assert.equal(native.clip_name,'Animation');
  assert.equal(native.target_node,'R39 lift cabin travel');
  assert.deepEqual(native.stop_heights_m,[0,3.099600076675415,6.371399879455566]);
  assert.equal(native.playback,'parked_to_selected_floor; native_clip_on_user_control_in_interior_walk_only');
});

// The narrated tour marks the lift on each storey it serves, and the live
// delivery is batched: the merge keeps the geometry and throws the node names
// away, so nothing in the running scene can be asked where the shaft is. The
// footprint is recorded in lift.js instead, and this re-measures the delivery
// it was taken from so the record cannot quietly go stale.
test('The recorded shaft footprint is still the delivered one', () => {
  const file = new URL('../../build/web/full/villa.glb', import.meta.url);
  const bytes = fs.readFileSync(file);
  const glb = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString('utf8'));
  // glTF node transforms, composed down the tree; the AABB comes off each
  // primitive's POSITION accessor bounds, so no geometry has to be decoded.
  const mul = (a, b) => {
    const o = new Array(16).fill(0);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) for (let k = 0; k < 4; k++) o[j * 4 + i] += a[k * 4 + i] * b[j * 4 + k];
    return o;
  };
  const trs = n => {
    if (n.matrix) return n.matrix;
    const t = n.translation ?? [0, 0, 0], [x, y, z, w] = n.rotation ?? [0, 0, 0, 1], s = n.scale ?? [1, 1, 1];
    const x2 = x + x, y2 = y + y, z2 = z + z;
    const xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2, wx = w * x2, wy = w * y2, wz = w * z2;
    return [(1 - (yy + zz)) * s[0], (xy + wz) * s[0], (xz - wy) * s[0], 0,
            (xy - wz) * s[1], (1 - (xx + zz)) * s[1], (yz + wx) * s[1], 0,
            (xz + wy) * s[2], (yz - wx) * s[2], (1 - (xx + yy)) * s[2], 0, t[0], t[1], t[2], 1];
  };
  const at = (m, p) => [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], 0, m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]];
  const box = {minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity};
  let parts = 0;
  const walk = (index, parent) => {
    const node = glb.nodes[index], world = mul(parent, trs(node));
    if (node.mesh !== undefined && /^Lift/i.test(node.name ?? '')) {
      for (const prim of glb.meshes[node.mesh].primitives) {
        const acc = glb.accessors[prim.attributes.POSITION];
        if (!acc?.min) continue;
        parts++;
        for (let c = 0; c < 8; c++) {
          const [x, , z] = at(world, [c & 1 ? acc.max[0] : acc.min[0], c & 2 ? acc.max[1] : acc.min[1], c & 4 ? acc.max[2] : acc.min[2]]);
          box.minX = Math.min(box.minX, x); box.maxX = Math.max(box.maxX, x);
          box.minZ = Math.min(box.minZ, z); box.maxZ = Math.max(box.maxZ, z);
        }
      }
    }
    for (const child of node.children ?? []) walk(child, world);
  };
  for (const scene of glb.scenes) for (const root of scene.nodes) walk(root, [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
  assert.ok(parts > 100, `only ${parts} lift parts found; the delivery no longer names them`);
  for (const key of ['minX', 'maxX', 'minZ', 'maxZ'])
    assert.ok(Math.abs(box[key] - SHAFT[key]) < 0.005,
      `${key}: the delivery measures ${box[key].toFixed(3)} m, lift.js records ${SHAFT[key]}`);
  // A domestic shaft, not a room: whatever the model says, a mark this size
  // has to stay the size of a lift.
  assert.ok(SHAFT.maxX - SHAFT.minX > 1 && SHAFT.maxX - SHAFT.minX < 2.5, 'the shaft is not lift-sized across');
  assert.ok(SHAFT.maxZ - SHAFT.minZ > 1 && SHAFT.maxZ - SHAFT.minZ < 2.5, 'the shaft is not lift-sized deep');
});
