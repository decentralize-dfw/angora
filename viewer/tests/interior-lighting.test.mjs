import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {InteriorLightController} from '../src/interior-lighting.js';

const fixture=(name,x,floor=1)=>({name,position:[x,3,0],direction:[0,-1,0],color:[1,.9,.8],
  intensity_cd:100,floor_index:floor,intensity_status:'render_assumption_not_measured_electrical_power'});
function setup(fixtures,count=1) {
  const lights=Array.from({length:count},()=>{const light=new THREE.SpotLight(0xffffff,0);light.visible=false;return light;});
  const controller=new InteriorLightController(lights,{fadeMs:300});controller.setFixtures(fixtures,0);
  return {controller,lights};
}

test('Native light slots keep a stable shader count across floors and lights-off',()=>{
 const {controller:c,lights}=setup([fixture('A',0,0),fixture('B',1,1)],3);
 c.keepSlotsVisible=true;
 for(const [floor,start] of [[0,0],[1,1000],[null,2000]]){
  c.select(floor,null,start);
  for(let time=start;time<=start+600;time+=50){c.update(time);assert.equal(lights.filter(light=>light.visible).length,3);}
 }
 assert.ok(lights.every(light=>light.intensity===0));
 c.select(1,null,3000);c.update(3600);assert.equal(lights.reduce((sum,l)=>sum+l.intensity,0),100);
 c.setEnabled(false,4000);c.update(4600);assert.ok(lights.every(l=>l.visible&&l.intensity===0));
});

test('A long idle interval is not counted as transition time; light controls settle without camera motion',()=>{
  const {controller:c,lights:[light]}=setup([fixture('A',0)]);
  c.update(0);c.select(1,[0,0,0],60000);
  assert.equal(c.update(60000).active,true);assert.equal(light.intensity,0);
  c.update(60150);assert.equal(light.intensity,50);
  const settled=c.update(60300);assert.equal(settled.active,false);assert.equal(light.intensity,100);
  assert.equal(settled.shadowChanged,false,'Intensity-only changes reuse the existing shadow map');
  c.setEnabled(false,70000);c.update(70150);assert.equal(light.intensity,50);
  assert.equal(c.update(70300).active,false);assert.equal(light.visible,false);
  c.setEnabled(true,80000);c.update(80150);assert.equal(light.intensity,50);
  c.update(80300);assert.equal(light.intensity,100);
});

test('A spotlight changes source coordinates only at zero intensity',()=>{
  const a=fixture('A',0),b=fixture('B',10),{controller:c,lights:[light]}=setup([a,b]);
  c.select(1,a.position,0);c.update(300);
  c.select(1,b.position,1000);
  c.update(1150);assert.equal(light.intensity,50);assert.deepEqual(light.position.toArray(),a.position);
  c.update(1300);assert.equal(light.intensity,0);assert.deepEqual(light.position.toArray(),b.position);
  c.update(1450);assert.equal(light.intensity,50);
  assert.equal(c.update(1600).active,false);assert.equal(light.intensity,100);
  assert.deepEqual(light.target.position.toArray(),[10,2,0]);
});

test('Movement around a proximity boundary does not keep replacing the same fixtures',()=>{
  const a=fixture('A',0),b=fixture('B',10),{controller:c,lights:[light]}=setup([a,b]);
  c.select(1,a.position,0);c.update(300);
  for(let i=0;i<80;i++) {
    const t=1000+i*16;c.select(1,[i%2?4.95:5.05,3,0],t);c.update(t);
    assert.deepEqual(light.position.toArray(),a.position);assert.equal(light.intensity,100);assert.equal(c.active,false);
  }
  c.select(1,[6,3,0],3000);assert.equal(c.active,true);c.update(3600);
  assert.deepEqual(light.position.toArray(),b.position);
});

test('Reversing a transition restores the same source without a jump or duplicate slot',()=>{
  const a=fixture('A',0),b=fixture('B',10),{controller:c,lights:[light]}=setup([a,b]);
  c.select(1,a.position,0);c.update(300);c.select(1,b.position,1000);c.update(1150);
  c.select(1,a.position,1150);c.update(1150);assert.equal(light.intensity,50);
  c.update(1300);assert.equal(light.intensity,100);assert.equal(c.active,false);
  assert.deepEqual(light.position.toArray(),a.position);
});

test('Walking all source stations preserves lamp positions, floor selection and the four-light budget',()=>{
  const navigation=JSON.parse(readFileSync(new URL('../public/models/full/navigation.json',import.meta.url)));
  const source=structuredClone(navigation.lights),{controller:c,lights}=setup(navigation.lights,4);
  let time=0;
  for(const station of navigation.stations) {
    c.select(station.floor_index,station.position,time);
    for(let dt=0;dt<=600;dt+=50) {
      c.update(time+dt);
      const visible=c.slots.filter(slot=>slot.light.visible);
      assert.ok(visible.length<=4);assert.equal(new Set(visible.map(slot=>slot.source)).size,visible.length);
      for(const {source:f,light} of visible) {
        assert.deepEqual(light.position.toArray(),f.position);
        assert.ok(light.intensity>=0&&light.intensity<=f.intensity_cd);
      }
    }
    assert.equal(c.active,false);
    for(const {source:f} of c.slots)if(f)assert.equal(f.floor_index,station.floor_index);
    time+=1000;
  }
  c.select(null,null,time);c.update(time+600);assert.ok(lights.every(light=>!light.visible));
  assert.deepEqual(navigation.lights,source,'The authored light records must not change');
});

// "içerdeki ışıklar dışardan gözüksün". The closing looks at the house from
// outside after dark, and a storey's worth of lamps in one room would read as
// a single bright window. 'all' spends the slots one to a storey instead, so
// the elevation lights up the way a lived-in house does.
test("the whole house lights one window per storey, not four in one room",()=>{
 const fixtures=[];
 for(const floor of [0,1,2,3]) for(const x of [0,4,8,12]) fixtures.push(fixture(`f${floor}-${x}`,x,floor));
 const {controller:c,lights}=setup(fixtures,4);
 c.select('all',[0,3,0],0);c.update(1000);
 const storeys=c.slots.map(slot=>slot.source?.floor_index);
 assert.deepEqual([...storeys].sort(),[0,1,2,3],`the slots landed on storeys ${storeys}`);
 // Ranked from the given point, so each storey contributes its nearest lamp.
 assert.ok(c.slots.every(slot=>slot.source.position[0]===0),
   `a storey gave up a nearer lamp: ${c.slots.map(s=>s.source.name)}`);
 assert.equal(lights.filter(light=>light.intensity>0).length,4);
 // A storey selection still spends every slot on that storey.
 c.select(2,[0,3,0],2000);c.update(3000);
 assert.ok(c.slots.every(slot=>slot.source?.floor_index===2),
   `walking floor 2 lit ${c.slots.map(s=>s.source?.floor_index)}`);
});

// Fewer storeys than slots must not leave a slot dark: the rest go to the
// next nearest lamps wherever they are.
test("a house with fewer storeys than slots still spends them all",()=>{
 const {controller:c}=setup([fixture('a',0,0),fixture('b',2,0),fixture('c',4,1),fixture('d',6,1)],4);
 c.select('all',[0,3,0],0);c.update(1000);
 assert.equal(c.slots.filter(slot=>slot.source).length,4);
 assert.equal(new Set(c.slots.map(slot=>slot.source)).size,4,'a fixture was given two slots');
});

// The lamps are measured for the rooms they stand in - a 6 m throw. The
// closing looks at the house from 22 m away, through glass, at an exterior's
// exposure, and the first build of it rendered every window black. The boost
// is what makes them carry that far; it changes reach and brightness only,
// never which lamp is lit or where it stands.
test("the whole-house lamps can be given reach without being moved",()=>{
 const fixtures=[fixture('a',0,0),fixture('b',4,1),fixture('c',8,2),fixture('d',12,3)];
 const {controller:c,lights}=setup(fixtures,4);
 const reach=lights.map(light=>light.distance);
 c.select('all',[0,3,0],0);c.update(1000);
 const plain=lights.map(light=>light.intensity);
 const chosen=c.slots.map(slot=>slot.source?.name);
 assert.ok(plain.every(v=>v>0),'the lamps are dark before any boost');

 assert.equal(c.setBoost({gain:5.5,reach:16}),true,'the boost reported no change');
 c.update(1100);
 assert.deepEqual(c.slots.map(slot=>slot.source?.name),chosen,'the boost moved the lamps');
 lights.forEach((light,i)=>{
   assert.equal(light.distance,16,'the reach was not applied');
   assert.ok(Math.abs(light.intensity-plain[i]*5.5)<1e-6,'the gain was not applied');
 });
 // Asking twice changes nothing, so a per-cue call does not churn the shaders.
 assert.equal(c.setBoost({gain:5.5,reach:16}),false,'an unchanged boost reported a change');

 // And it comes off cleanly: each light gets ITS OWN throw back, not a shared one.
 assert.equal(c.setBoost({}),true);c.update(1200);
 lights.forEach((light,i)=>{
   assert.equal(light.distance,reach[i],'a light kept the boosted reach');
   assert.ok(Math.abs(light.intensity-plain[i])<1e-6,'a light kept the boosted gain');
 });
});
