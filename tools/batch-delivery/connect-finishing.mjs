import fs from 'node:fs/promises';
import path from 'node:path';
import {WalkSurface} from '../../viewer/src/walk-surface.js';
const root=path.resolve(import.meta.dirname,'../..'),file=path.join(root,'.runtime/finishing/native-navigation.json');
const data=JSON.parse(await fs.readFile(file)),surface=new WalkSurface(data),hall=data.stations.find(s=>s.room_id==='f2-101');
const station=data.stations.find(s=>s.room_id==='f2-107');
// Its previous point was trapped on the far side of the bed. Choose the clear
// bedside aisle inside the same room, keeping the bed collision intact.
if(!surface.path(hall.position,station.position,true)){
 const candidates=[];
 for(let z=1.75;z<3;z+=.12)for(let x=.25;x<1.2;x+=.12){
  const hit=surface.sample(x,z,6.371,true);if(!hit)continue;
  const p=[x,hit.height+data.eye_height_m,z];if(surface.path(hall.position,p,true))candidates.push(p);
 }
 candidates.sort((a,b)=>Math.hypot(a[0]-station.position[0],a[2]-station.position[2])-Math.hypot(b[0]-station.position[0],b[2]-station.position[2]));
 if(!candidates.length)throw Error('Bedroom has no connected clear aisle');
 station.previous_position=station.position;station.position=candidates[0];station.view_yaw_rad=Math.PI/2;
}
const checks=data.stations.filter(s=>s.floor_index===2).map(s=>({id:s.room_id,connected:!!surface.path(hall.position,s.position,true)}));
if(checks.some(c=>!c.connected))throw Error(JSON.stringify(checks));
data.first_floor_connectivity=checks;data.layers[2].furniture_clearance_m=.16;
await fs.writeFile(file,JSON.stringify(data));await fs.copyFile(file,path.join(root,'build/web/native-current/native-navigation.json'));
console.log(checks);
