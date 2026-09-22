// The checked-in delivery is also the Pages model root. Dev/build use a copy
// under public; keep that generated copy out of Git to avoid duplicate assets.
import {cp,mkdir} from 'node:fs/promises';
const source=new URL('../../build/web/native-current/',import.meta.url);
const destination=new URL('../public/models/native-current/',import.meta.url);
await mkdir(destination,{recursive:true});
for(const file of ['sections-current.json','transition-sections.json.gz','room-lighting.json','native-rooms.json','native-navigation.json','site-context.json','plot-boundary.json','native-soil-section.json'])await cp(new URL(file,source),new URL(file,destination));
await cp(new URL('../../build/web/batched/',import.meta.url),new URL('../public/models/batched/',import.meta.url),{recursive:true});
// The listing photographs are served from the repository root on Pages, so
// the dev server needs the same folder under public. force:false keeps a
// second run from recopying thirty-odd megabytes that have not changed.
await cp(new URL('../../photogallery/',import.meta.url),new URL('../public/photogallery/',import.meta.url),{recursive:true,force:false,errorOnExist:false});
// The narrated tour's voiceover is served from the repository root on Pages
// for the same reason, and the dev server needs the same folder under public.
await cp(new URL('../../audio/',import.meta.url),new URL('../public/audio/',import.meta.url),{recursive:true});
console.log('Prepared desktop/mobile batched models, section metadata, photographs and the tour voiceover.');
