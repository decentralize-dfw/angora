import http from 'node:http';
import {createReadStream,statSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const mime={'.mp4':'video/mp4','.webm':'video/webm','.ttf':'font/ttf','.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml','.wasm':'application/wasm','.gltf':'model/gltf+json','.glb':'model/gltf-binary','.bin':'application/octet-stream','.hdr':'application/octet-stream'};
http.createServer((request,response)=>{
  let target;try{target=path.resolve(root,'.'+decodeURIComponent(new URL(request.url,'http://localhost').pathname));}catch{response.writeHead(400).end();return;}
  const relative=path.relative(root,target);
  if(relative.startsWith('..')||path.isAbsolute(relative)||relative.split(path.sep).some(segment=>segment.startsWith('.'))){response.writeHead(403).end();return;}
  try{if(statSync(target).isDirectory())target=path.join(target,'index.html');statSync(target);}catch{response.writeHead(404).end('Not found');return;}
  const size=statSync(target).size,headers={'Content-Type':mime[path.extname(target)]||'application/octet-stream','Cache-Control':'no-cache','Accept-Ranges':'bytes'};
  const range=request.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
  if(range){const start=Number(range[1]),end=Math.min(size-1,range[2]?Number(range[2]):size-1);if(start>end){response.writeHead(416,{'Content-Range':`bytes */${size}`}).end();return;}response.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':end-start+1});createReadStream(target,{start,end}).pipe(response);}
  else{response.writeHead(200,{...headers,'Content-Length':size});createReadStream(target).pipe(response);}
}).listen(4180,'127.0.0.1',()=>console.log('Angora residence: http://localhost:4180/web-gpt.html'));
