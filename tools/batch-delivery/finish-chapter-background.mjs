// Unify only the neutral background connected to the image perimeter.
// Interior material pixels are not colour-keyed globally.
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const directory=path.join(root,'assets/residence/chapters');
const files=process.argv.slice(2);
const finished=path.join(directory,'finished');await mkdir(finished,{recursive:true});
const width=2560,height=1440,pixels=width*height,size=pixels*3;
function whiteBackground(rgb){
  const seen=new Uint8Array(pixels),queue=new Int32Array(pixels);let read=0,write=0;
  function add(p){
    if(seen[p])return;seen[p]=1;
    const i=p*3,a=rgb[i],b=rgb[i+1],c=rgb[i+2];
    if(Math.min(a,b,c)<224||Math.max(a,b,c)>244||Math.max(a,b,c)-Math.min(a,b,c)>6)return;
    queue[write++]=p;
  }
  for(let x=0;x<width;x++){add(x);add((height-1)*width+x);}
  for(let y=1;y<height-1;y++){add(y*width);add(y*width+width-1);}
  while(read<write){const p=queue[read++],x=p%width;rgb[p*3]=rgb[p*3+1]=rgb[p*3+2]=255;if(x)add(p-1);if(x<width-1)add(p+1);if(p>=width)add(p-width);if(p<pixels-width)add(p+width);}
  return write;
}
for(const file of files){
  const input=path.join(directory,file),output=path.join(finished,file);
  const decoder=spawn('ffmpeg',['-hide_banner','-loglevel','error','-i',input,'-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{stdio:['ignore','pipe','inherit']});
  const encoder=spawn('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',`${width}x${height}`,'-r','30','-i','pipe:0','-an','-c:v','libx264','-preset','slow','-crf','16','-pix_fmt','yuv420p','-movflags','+faststart',output],{stdio:['pipe','ignore','inherit']});
  const done=once(encoder,'exit');let buffer=Buffer.alloc(0),count=0,changed=0;
  for await(const chunk of decoder.stdout){buffer=Buffer.concat([buffer,chunk]);while(buffer.length>=size){const frame=Buffer.from(buffer.subarray(0,size));buffer=buffer.subarray(size);changed+=whiteBackground(frame);count++;if(!encoder.stdin.write(frame))await once(encoder.stdin,'drain');}}
  encoder.stdin.end();const [code]=await done;if(code!==0||buffer.length)throw Error('Incomplete chapter '+file);
  console.log(`${file}: ${count} frames; background ${Math.round(changed/count/pixels*100)}%`);
}
