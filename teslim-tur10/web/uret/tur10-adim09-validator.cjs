const fs=require('fs');
const path=require('path');
const v=require('./web-tools/node_modules/gltf-validator');
const dir='C:/Users/yigit/angora-git/teslim-tur10/web';
(async()=>{
 let errors=0;
 for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('.glb'))){
  const report=await v.validateBytes(new Uint8Array(fs.readFileSync(path.join(dir,file))),{uri:file,maxIssues:20000});
  fs.writeFileSync(path.join(dir,file+'.validator.json'),JSON.stringify(report,null,1));
  console.log(file,JSON.stringify({errors:report.issues.numErrors,warnings:report.issues.numWarnings,infos:report.issues.numInfos}));
  errors+=report.issues.numErrors;
 }
 process.exitCode=errors?1:0;
})().catch(e=>{console.error(e);process.exitCode=2;});
