import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve('.'),source=path.resolve(process.argv[2]??(fs.existsSync('build/web/native-current')?'build/web/native-current':'../angora-review/build/web/native-current'));
const full=path.join(root,'build/web/full'),publicFull=path.join(root,'viewer/public/models/full');
const read=p=>JSON.parse(fs.readFileSync(p));
const digest=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const manifest=read(path.join(full,'manifest.json'));
const records=manifest.assets.map(previous=>({...previous,...read(path.join(source,previous.id+'.json'))}));
const sourceHash=records[0].source_native_sha256;
// The remaining soil section asset is shared by Pages and the local preview.
if(manifest.section_cap_asset?.file)fs.copyFileSync(path.join(full,manifest.section_cap_asset.file),path.join(publicFull,manifest.section_cap_asset.file));
if(records.some(r=>r.source_native_sha256!==sourceHash))throw Error('Mixed native snapshots');
for(const file of ['navigation.json','sections.json','native-camera-stations.json']){
  if(!fs.existsSync(path.join(source,file)))throw Error('Delivery not ready: '+file);
}
if(read(path.join(source,'sections.json')).source_native_sha256!==sourceHash)throw Error('Section source mismatch');
for(const record of records){
  const p=path.join(source,record.file);if(digest(p)!==record.sha256)throw Error(record.file+' changed');
  for(const directory of [full,publicFull])fs.copyFileSync(p,path.join(directory,record.file));
}
const nav=read(path.join(source,'navigation.json')),rooms=read(path.join(full,'rooms.json'));
const cameras=read(path.join(source,'native-camera-stations.json'));
const wc=cameras.find(c=>c.room_id==='f0-WC');
if(wc&&!nav.stations.some(s=>s.room_id===wc.room_id)){
  nav.stations.push({...wc,name:'WC',floor_index:0});
}
if(wc&&!rooms.rooms.some(r=>r.id===wc.room_id)){
  rooms.rooms.push({id:wc.room_id,code:'WC',name:'WC',floor_index:0,position:[wc.position[0],.026,wc.position[2]],dimensions:[],area_m2:null,evidence_status:'photographed_native_room'});
}
rooms.source_native_sha256=sourceHash;
if(nav.source_native_sha256!==sourceHash)throw Error('Navigation source mismatch');
for(const directory of [full,publicFull]){
  fs.writeFileSync(path.join(directory,'navigation.json'),JSON.stringify(nav));
  fs.writeFileSync(path.join(directory,'rooms.json'),JSON.stringify(rooms,null,2)+'\n');
  fs.copyFileSync(path.join(source,'sections.json'),path.join(directory,'sections.json'));
}
manifest.assets=records;manifest.source_native_sha256=sourceHash;manifest.model_revision='Native interior and roads';
manifest.native_delivery={file:'build/blender/angora-rooms-open-doors.blend',sha256:sourceHash,doors_open:13};
for(const [field,file]of [['navigation','navigation.json'],['room_annotations','rooms.json'],['section_atlas','sections.json']]){
  const p=path.join(full,file);manifest[field]={...manifest[field],file,bytes:fs.statSync(p).size,sha256:digest(p)};
}
for(const directory of [full,publicFull])fs.writeFileSync(path.join(directory,'manifest.json'),JSON.stringify(manifest,null,2));
console.log('Staged native delivery',records.length,'assets',nav.stations.length,'rooms');
