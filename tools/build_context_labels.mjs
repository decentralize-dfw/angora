import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=JSON.parse(fs.readFileSync(path.join(root,'build/cad/site-elevations.json')));
const buildings=source.buildings.map(b=>{
  const xs=b.footprint.map(p=>p[0]),ys=b.footprint.map(p=>p[1]);
  return {number:b.number,position:[(Math.min(...xs)+Math.max(...xs))/2,b.base_z+12,-(Math.min(...ys)+Math.max(...ys))/2],
    bounds:[[Math.min(...xs)-1,b.base_z,-Math.max(...ys)-1],[Math.max(...xs)+1,b.base_z+14,-Math.min(...ys)+1]],
    source_handle:b.source_handle,footprint_status:b.footprint_status,height_status:b.height_status};
});
const data={coordinate_system:'glTF_Y_up',source:'build/cad/site-elevations.json',
  note:'CAD building numbers. Label heights are display offsets, not measured roof heights. Not a georeferenced city map.',buildings};
for(const file of ['build/web/site-context.json','viewer/public/models/site-context.json']){
  fs.writeFileSync(path.join(root,file),JSON.stringify(data,null,2)+'\n');
}
console.log(`Prepared ${buildings.length} source building labels.`);
