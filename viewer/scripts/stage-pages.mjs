import {copyFileSync,cpSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=new URL('../../',import.meta.url);
const dist=new URL('../dist/',import.meta.url);
// Keep the source CAD, native Blender files and texture assets in place.
// Only the generated entry point and its dedicated bundle directory are staged.
const html=readFileSync(new URL('index.html',dist),'utf8');
if(!html.includes('./web-assets/'))throw Error('Expected a relative /angora/ build');
mkdirSync(new URL('web-assets/',root),{recursive:true});
copyFileSync(new URL('index.html',dist),new URL('index.html',root));
cpSync(new URL('web-assets/',dist),new URL('web-assets/',root),{recursive:true});
writeFileSync(new URL('.nojekyll',root),'');
console.log('Staged '+fileURLToPath(new URL('index.html',root)));
