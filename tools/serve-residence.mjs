import http from 'node:http';
import {createReadStream,statSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml','.wasm':'application/wasm','.gltf':'model/gltf+json','.glb':'model/gltf-binary','.bin':'application/octet-stream','.hdr':'application/octet-stream'};
http.createServer((request,response)=>{
  let target;try{target=path.resolve(root,'.'+decodeURIComponent(new URL(request.url,'http://localhost').pathname));}catch{response.writeHead(400).end();return;}
  const relative=path.relative(root,target);
  if(relative.startsWith('..')||path.isAbsolute(relative)||relative.split(path.sep).some(segment=>segment.startsWith('.'))){response.writeHead(403).end();return;}
  try{if(statSync(target).isDirectory())target=path.join(target,'index.html');statSync(target);}catch{response.writeHead(404).end('Not found');return;}
  response.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Cache-Control':'no-cache'});createReadStream(target).pipe(response);
}).listen(4180,'127.0.0.1',()=>console.log('Angora residence: http://localhost:4180/web-gpt.html'));
