// Development-only export of the actual viewer, its camera flight and floor cuts.
export function mountPresentationRecorder({enabled,selectView,renderer,capture,setPlan,project}) {
  if(!enabled)return;
  const button=document.createElement('button');button.textContent='Record presentation';
  button.style.cssText='position:fixed;right:20px;top:20px;z-index:99999;padding:16px;background:#223e35;color:white';document.body.append(button);
  const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const send=(name,body)=>fetch(`/capture/${name}`,{method:'POST',body});
  const still=()=>new Promise((resolve,reject)=>capture((blob,error)=>error?reject(error):resolve(blob)));
  button.onclick=async()=>{
    button.disabled=true;
    try{
      button.textContent='Loading four actual floors…';
      for(let i=3;i>=0;i--){await selectView(`f${i}`,true);await pause(650);}
      await pause(1500);
      const type=['video/webm;codecs=vp9','video/webm;codecs=vp8'].find(t=>MediaRecorder.isTypeSupported(t));
      const chunks=[],recorder=new MediaRecorder(renderer.domElement.captureStream(24),{mimeType:type,videoBitsPerSecond:10000000});
      recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
      const stopped=new Promise(resolve=>recorder.onstop=resolve),isoMoves=[],isoStops=[0];recorder.start();const isoStart=performance.now();
      await pause(1000);
      for(let i=1;i<4;i++){const start=(performance.now()-isoStart)/1000;button.textContent=`Recording floor ${i+1} / 4`;await selectView(`f${i}`,false);await pause(2700);isoMoves.push([start,(performance.now()-isoStart)/1000]);isoStops.push((performance.now()-isoStart)/1000);}
      recorder.stop();await stopped;await send('floors.webm',new Blob(chunks,{type}));
      setPlan(true);await selectView('f0',true);await pause(900);
      const planChunks=[],planRecorder=new MediaRecorder(renderer.domElement.captureStream(24),{mimeType:type,videoBitsPerSecond:10000000});planRecorder.ondataavailable=e=>{if(e.data.size)planChunks.push(e.data);};const planStopped=new Promise(resolve=>planRecorder.onstop=resolve),planMoves=[],planStops=[0];planRecorder.start();const planStart=performance.now();await pause(1000);for(let i=1;i<4;i++){const start=(performance.now()-planStart)/1000;button.textContent=`Recording plan ${i+1} / 4`;await selectView(`f${i}`,false);await pause(2700);planMoves.push([start,(performance.now()-planStart)/1000]);planStops.push((performance.now()-planStart)/1000);}planRecorder.stop();await planStopped;await send('plans.webm',new Blob(planChunks,{type}));
      const points=await fetch('/points').then(r=>r.json()),poses=[];
      for(let i=0;i<4;i++){
        setPlan(false);await selectView(`f${i}`,true);await pause(700);await send(`iso-${i}.png`,await still());
        setPlan(true);await selectView(`f${i}`,true);await pause(700);await send(`plan-${i}.png`,await still());
        poses.push(project(i,points));
      }
      await send('poses.json',JSON.stringify({floors:poses,isometric:{moves:isoMoves,stops:isoStops},plans:{moves:planMoves,stops:planStops}}));button.textContent='Presentation exported ✓';button.dataset.complete='true';
    }catch(error){button.textContent=`Capture failed: ${error.message}`;button.disabled=false;}
  };
}
