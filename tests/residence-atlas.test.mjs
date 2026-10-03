import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import vm from 'node:vm';
import {PHOTO_POINTS} from '../viewer/src/photo-points.js';
import sourceDimensions from '../viewer/src/dxf-dimensions.js';
import {ROOM_AREAS} from '../viewer/src/room-areas.js';
const scope={window:{}};
vm.runInNewContext(await readFile(new URL('../assets/residence/atlas-data.js',import.meta.url),'utf8'),scope);
const data=scope.window.ANGORA_ATLAS;
test('all original, deduplicated photographs exist with their original formats',async()=>{
 assert.equal(data.photos.length,55);assert.equal(new Set(data.photos.map(p=>p.id)).size,55);assert.ok(!data.photos.some(p=>p.id===20));
 for(const point of data.photos){await access(new URL(`../${point.url.replace(/^\.\//,'')}`,import.meta.url));const original=PHOTO_POINTS.find(p=>p.id===point.id);assert.equal(point.url.split('.').at(-1),original.file.split('.').at(-1));}
});
test('camera coordinates and view directions remain the supplied registration',()=>{
 for(const point of data.photos){const original=PHOTO_POINTS.find(p=>p.id===point.id);for(const key of ['floor','x','z','dx','dz'])assert.equal(point[key],original[key]);}
});
test('photo subjects belong to the correct floor, independently of camera location',()=>{
 for(const point of data.photos.filter(p=>p.roomId)){const room=data.rooms.find(r=>r.id===point.roomId);assert.ok(room);assert.equal(room.floor,point.floor);}
 assert.equal(data.photos.find(p=>p.id===16).roomId,'f2-103');assert.equal(data.photos.find(p=>p.id===32).roomId,'f2-104');assert.equal(data.photos.find(p=>p.id===6).roomId,'f3-C01');
});
test('shown dimensions and areas retain the authoritative schedules',()=>{
 assert.equal(JSON.stringify(data.dimensions),JSON.stringify(sourceDimensions.dimensions));
 for(const room of data.rooms.filter(r=>r.area!==null))assert.equal(room.area,ROOM_AREAS[room.id]);
});
test('every floor has selectable interior photographs inside the shared map extent',()=>{
 const {x,z,width,height}=data.extent;
 for(let floor=0;floor<4;floor++){const points=data.photos.filter(p=>p.floor===floor&&!p.outdoor);assert.ok(points.length>=7);for(const p of points){assert.ok(p.x>x&&p.x<x+width);assert.ok(p.z>z&&p.z<z+height);}}
});

test('the revised photograph collection swaps files by their exact original names',async()=>{
 const revised={window:{ANGORA_ATLAS:structuredClone(data)}};
 vm.runInNewContext(await readFile(new URL('../residence-photographs.js',import.meta.url),'utf8'),revised);
 for(const point of revised.window.ANGORA_ATLAS.photos){
  assert.equal(point.url,`./photogallery-v2/${point.file}`);
  await access(new URL(`../${point.url.replace(/^\.\//,'')}`,import.meta.url));
  const original=data.photos.find(p=>p.id===point.id);
  for(const key of ['floor','x','z','dx','dz','roomId'])assert.equal(point[key],original[key]);
 }
});
