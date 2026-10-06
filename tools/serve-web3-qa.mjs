// Local, test-only server: intentional 404s exercise real browser media fallback.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),port=Number(process.env.WEB3_QA_PORT||4181),fault=process.env.WEB3_QA_FAULT||'video';
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.mp4':'video/mp4','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.gz':'application/octet-stream'};
http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 const target=path.resolve(root,'.'+decodeURIComponent(pathname)),relative=path.relative(root,target);
 if(relative.startsWith('..')||path.isAbsolute(relative)||relative.split(path.sep).some(s=>s.startsWith('.'))){res.writeHead(403).end();return;}
 const fail=fault==='video'?pathname.startsWith('/assets/web3/films/')&&pathname.endsWith('.mp4'):fault==='endpoint'?pathname.includes('/assets/web3/films/approach'):(fault==='photo'&&pathname.includes('/photos/angora_19-'));
 if(fail){res.writeHead(404,{'Cache-Control':'no-store'}).end('Intentional Web3 QA failure');return;}
 try{const stat=fs.statSync(target);if(!stat.isFile())throw Error();res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Content-Length':stat.size,'Cache-Control':'no-store'});fs.createReadStream(target).pipe(res);}catch{res.writeHead(404).end();}
}).listen(port,'127.0.0.1',()=>console.log(`Web3 QA ${fault}: http://localhost:${port}/web3.html`));
