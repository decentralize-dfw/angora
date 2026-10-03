import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const root=path.resolve('assets/residence/chapters');fs.mkdirSync(root,{recursive:true});
const sandbox={window:{}};vm.runInNewContext(fs.readFileSync('assets/residence/atlas-data.js','utf8'),sandbox);
http.createServer((req,res)=>{
  res.setHeader('Access-Control-Allow-Origin','http://localhost:4173');res.setHeader('Access-Control-Allow-Methods','POST,GET,OPTIONS');
  if(req.method==='OPTIONS'){res.writeHead(204).end();return;}
  if(req.url==='/points'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(sandbox.window.ANGORA_ATLAS));return;}
  const name=req.url.split('/').pop();
  if(req.method!=='POST'||!['floors.webm','plans.webm','poses.json',...[0,1,2,3].flatMap(i=>[`iso-${i}.png`,`plan-${i}.png`])].includes(name)){res.writeHead(404).end();return;}
  const file=fs.createWriteStream(path.join(root,name));req.pipe(file);file.on('finish',()=>{res.end('Saved');console.log(name);});
}).listen(4181,'127.0.0.1',()=>console.log('Local viewer capture ready on 4181'));
