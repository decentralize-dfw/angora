import {copyFileSync,cpSync,mkdirSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=new URL('../../',import.meta.url);
const dist=new URL('../dist/',import.meta.url);
// Keep the source CAD, native Blender files and texture assets in place.
// Only the generated entry point and its dedicated bundle directory are staged.
const html=readFileSync(new URL('index.html',dist),'utf8');
if(!html.includes('./web-assets/'))throw Error('Expected a relative /angora/ build');
// web-assets holds nothing but this build's output. Copying into it without
// clearing it first left every superseded bundle behind - 19 files where two
// are served - so the directory is replaced, not merged.
rmSync(new URL('web-assets/',root),{recursive:true,force:true});
mkdirSync(new URL('web-assets/',root),{recursive:true});
copyFileSync(new URL('index.html',dist),new URL('index.html',root));
cpSync(new URL('web-assets/',dist),new URL('web-assets/',root),{recursive:true});
// The pages build skips the public directory, so the icons a browser asks for
// at the site root - and the card image a link preview fetches - are staged
// from the same source the dev server uses.
for(const icon of ['favicon.svg','apple-touch-icon.png','og-cover.jpg'])
  copyFileSync(new URL('../public/'+icon,import.meta.url),new URL(icon,root));
writeFileSync(new URL('.nojekyll',root),'');
console.log('Staged '+fileURLToPath(new URL('index.html',root)));
