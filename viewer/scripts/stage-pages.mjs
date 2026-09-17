import {copyFileSync,cpSync,mkdirSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=new URL('../../',import.meta.url);
const dist=new URL('../dist/',import.meta.url);
const html=readFileSync(new URL('index.html',dist),'utf8');
if(!html.includes('./web-assets/'))throw Error('Expected a relative /angora/ build');
rmSync(new URL('web-assets/',root),{recursive:true,force:true});
mkdirSync(new URL('web-assets/',root),{recursive:true});
copyFileSync(new URL('index.html',dist),new URL('index.html',root));
cpSync(new URL('web-assets/',dist),new URL('web-assets/',root),{recursive:true});
for(const icon of ['favicon.svg','apple-touch-icon.png','og-cover.jpg'])
  copyFileSync(new URL('../public/'+icon,import.meta.url),new URL(icon,root));
writeFileSync(new URL('.nojekyll',root),'');
console.log('Staged '+fileURLToPath(new URL('index.html',root)));
