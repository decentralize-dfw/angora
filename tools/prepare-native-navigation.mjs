import fs from 'node:fs';
import path from 'node:path';
import {WalkSurface} from '../viewer/src/walk-surface.js';
const source=path.resolve(process.argv[2]??(fs.existsSync('build/web/native-current')?'build/web/native-current':'../angora-review/build/web/native-current'));
const data=JSON.parse(fs.readFileSync(path.join(source,'navigation-draft.json')));
const cameras=JSON.parse(fs.readFileSync(path.join(source,'native-camera-stations.json')));
const smallWC=cameras.find(c=>c.room_id==='f0-WC');
if(smallWC&&!data.stations.some(s=>s.room_id==='f0-WC'))data.stations.push({...smallWC,name:'WC',floor_index:0});
const surface=new WalkSurface(data),changes=[];
for(const station of data.stations){
  const camera=cameras.find(c=>c.room_id===station.room_id || station.room_id==='f0-B03'&&c.room_id==='f0-B10');
  const previous=station.position;
  if(camera)Object.assign(station,{position:camera.position,view_yaw_rad:camera.view_yaw_rad,view_pitch_rad:camera.view_pitch_rad});
  let [x,y,z]=station.position;
  let sample=surface.sample(x,z,y-data.eye_height_m,true,.35);
  if(!sample){
    const candidates=[];
    for(let dz=-.72;dz<=.721;dz+=.06)for(let dx=-.72;dx<=.721;dx+=.06){
      const hit=surface.sample(x+dx,z+dz,y-data.eye_height_m,true,.35);
      if(hit?.floor===station.floor_index)candidates.push({x:x+dx,z:z+dz,hit,d:Math.hypot(dx,dz)});
    }
    candidates.sort((a,b)=>a.d-b.d);
    if(!candidates.length)throw Error('No nearby supported station: '+station.room_id);
    const chosen=candidates[0];x=chosen.x;z=chosen.z;sample=chosen.hit;
  }
  station.position=[x,sample.height+data.eye_height_m,z];
  if(camera){
    station.native_camera_position=camera.position;
    station.camera_adjustment_m=Math.hypot(x-camera.position[0],z-camera.position[2]);
    delete station.anchor_distance_m;
  }
  if(JSON.stringify(previous)!==JSON.stringify(station.position))changes.push({id:station.room_id,before:previous,after:station.position});
}
for(const station of data.stations)if(!surface.sample(station.position[0],station.position[2],station.position[1]-data.eye_height_m))throw Error(station.room_id);
fs.writeFileSync(path.join(source,'navigation.json'),JSON.stringify(data));
fs.writeFileSync(path.join(source,'navigation-station-adjustments.json'),JSON.stringify(changes,null,2));
console.log(JSON.stringify({stations:data.stations.length,adjustments:changes.filter(x=>Math.hypot(x.before[0]-x.after[0],x.before[2]-x.after[2])>.1)},null,2));
