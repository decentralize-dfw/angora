import {writeFile,copyFile,mkdir,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import shapes from '../viewer/src/room-shapes.js';
import dimensions from '../viewer/src/dxf-dimensions.js';
import {PHOTO_POINTS} from '../viewer/src/photo-points.js';
import {ROOM_AREAS} from '../viewer/src/room-areas.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const media=path.join(root,'assets/residence');
await mkdir(media,{recursive:true});
const source=process.argv[2] || path.resolve(root,'../yayin-ktx2/photogallery');
// The pictured subject can be a different room from the camera's position.
// These correspondences follow the owner's photograph captions and tour.
const subjects={
 'f0-B05':[1],'f0-B06':[2,3,5],'f0-B01':[47,48],'f0-WC':[45,46],
 'f1-Z06':[4],'f1-Z05':[23],'f1-Z04':[21,22],'f1-Z01':[41],'f1-Z02':[40,42],'f1-Z03':[39],'f1-Z07':[43],'f1-Z08':[44],
 'f2-102':[19,31],'f2-103':[16],'f2-104':[32],'f2-105':[12,33],'f2-101':[18,34,35],'f2-106':[30],'f2-107':[13,17],'f2-108':[11],
 'f3-C01':[6,29],'f3-C05':[9,10],'f3-C02':[7],'f3-C04':[8,14],'f3-C03':[15]
};
const photos=[];
for(const point of PHOTO_POINTS){
  const extension=path.extname(point.file),file=`photo-${String(point.id).padStart(2,'0')}${extension}`;
  const target=path.join(media,file);
  try{await access(target);}catch{await copyFile(path.join(source,point.file),target);}
  const roomId=Object.entries(subjects).find(([,ids])=>ids.includes(point.id))?.[0]??null;
  photos.push({...point,roomId,url:`./assets/residence/${file}`});
}
const names={
 'f0-B06':'Living room','f0-B05':'Kitchen','f0-B01':'Hall & stairs','f0-B02':'Annexe','f0-WC':'Guest WC',
 'f1-Z06':'Living room','f1-Z05':'Dining area','f1-Z02':'Entry hall','f1-Z04':'Kitchen','f1-Z01':'Entrance','f1-Z03':'Guest WC','f1-Z07':'Garage','f1-Z08':'Utility',
 'f2-102':'Principal bedroom','f2-103':'Dressing room','f2-104':'En-suite','f2-105':'Sitting area','f2-101':'Landing','f2-106':'Bedroom 106','f2-107':'Bedroom 107','f2-108':'Bathroom','f2-109':'Balcony','f2-110':'Suite balcony',
 'f3-C01':'Landing & kitchenette','f3-C05':'Sitting area','f3-C02':'Bedroom C02','f3-C03':'Bathroom','f3-C04':'Bedroom C04'
};
const rooms=Object.entries(shapes).filter(([id])=>names[id]).map(([id,shape])=>({id,name:names[id],floor:Number(id[1]),...shape,area:ROOM_AREAS[id]??null}));
const data={photos,rooms,dimensions:dimensions.dimensions,dimensionSource:dimensions.source,extent:{x:-8,z:-11,width:18,height:20}};
await writeFile(path.join(media,'atlas-data.js'),'// Generated from registered room polygons, owner photo points and DXF dimensions.\nwindow.ANGORA_ATLAS='+JSON.stringify(data)+';\n');
console.log(`${photos.length} original photographs, ${rooms.length} rooms, ${data.dimensions.length} registered dimensions.`);
