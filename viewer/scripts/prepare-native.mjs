// The checked-in delivery is also the Pages model root. Dev/build use a copy
// under public; keep that generated copy out of Git to avoid duplicate assets.
import {cp,mkdir,readFile} from 'node:fs/promises';
const source=new URL('../../build/web/native-current/',import.meta.url);
const destination=new URL('../public/models/native-current/',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('manifest.json',source),'utf8'));
if(!manifest.interior_streams?.length)throw Error('Missing native floor delivery');
await mkdir(destination,{recursive:true});
await cp(source,destination,{recursive:true});
console.log('Prepared native model for local development/build.');
