import {readFile,writeFile,mkdir,copyFile,stat} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
const source=path.join(root,'build/chapter-film'),out=path.join(root,'assets/residence/chapters');
async function manifestReady() {
  try {
    const manifest=JSON.parse(await readFile(path.join(source,'manifest.json'),'utf8'));
    if(manifest.frames!==96)return null;
    for(let i=0;i<manifest.frames;i++)await stat(path.join(source,`frame-${String(i).padStart(4,'0')}.png`));
    return manifest;
  }catch{return null;}
}
let manifest=await manifestReady();
if(process.argv.includes('--wait'))while(!manifest){await new Promise(resolve=>setTimeout(resolve,5000));manifest=await manifestReady();}
if(!manifest)throw Error('Render film is incomplete.');
await mkdir(out,{recursive:true});
function ffmpeg(args) {
  return new Promise((resolve,reject)=>{
    const child=spawn('ffmpeg',['-y','-hide_banner','-loglevel','error',...args],{cwd:root,windowsHide:true,stdio:'inherit'});
    child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error(`FFmpeg exited ${code}`)));
  });
}
await ffmpeg(['-framerate',String(manifest.fps),'-start_number','0','-i',path.join(source,'frame-%04d.png'),'-frames:v',String(manifest.frames),'-c:v','libwebp','-quality','86','-start_number','0',path.join(out,'frame-%04d.webp')]);
await copyFile(path.join(out,'frame-0000.webp'),path.join(out,'poster.webp'));
await writeFile(path.join(out,'manifest.json'),JSON.stringify({...manifest,urlPattern:'frame-%04d.webp',decodedCacheLimit:18},null,2)+'\n');
console.log('Chapter frames are ready.');
await ffmpeg(['-framerate',String(manifest.fps),'-start_number','0','-i',path.join(source,'frame-%04d.png'),'-filter_complex',`color=c=0xe0e4dc:s=${manifest.width}x${manifest.height}:r=${manifest.fps}[bg];[bg][0:v]overlay=shortest=1,format=yuv420p,fps=30`,'-frames:v',String(manifest.frames*2),'-c:v','libx264','-crf','18','-preset','medium','-g','1','-movflags','+faststart',path.join(out,'angora-four-chapters.mp4')]);
console.log('Reusable MP4 film is ready.');
