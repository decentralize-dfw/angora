// The checked-in delivery is also the Pages model root. Dev/build use a copy
// under public; keep that generated copy out of Git to avoid duplicate assets.
import {cp,mkdir} from 'node:fs/promises';
const source=new URL('../../build/web/native-current/',import.meta.url);
const destination=new URL('../public/models/native-current/',import.meta.url);
await mkdir(destination,{recursive:true});
for(const file of ['sections-current.json','transition-sections.json.gz','room-lighting.json','native-rooms.json','native-navigation.json','site-context.json','plot-boundary.json','native-soil-section.json'])await cp(new URL(file,source),new URL(file,destination));
await cp(new URL('../../build/web/batched/',import.meta.url),new URL('../public/models/batched/',import.meta.url),{recursive:true});
console.log('Prepared desktop/mobile batched models and section metadata.');
