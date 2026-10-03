// Deterministic native camera samples at 2560 x 1440; GPU speed never drops frames.
export function mountPresentationRecorder({enabled,selectView,renderer,capture,setPlan,project,beginExport,endExport,createMove}) {
  if(!enabled)return;
  const button=document.createElement('button');button.textContent='Record presentation';
  button.style.cssText='position:fixed;right:20px;top:20px;z-index:99999;padding:16px;background:#223e35;color:white';document.body.append(button);
  const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const send=async(name,body)=>{const r=await fetch(`/capture/${name}`,{method:'POST',body});if(!r.ok)throw Error(`Saving ${name}: ${r.status}`);};
  const still=()=>new Promise((resolve,reject)=>capture((blob,error)=>error?reject(error):resolve(blob)));
  button.onclick=async()=>{
    button.disabled=true;
    try{
      for(let i=3;i>=0;i--){button.textContent=`Preloading level ${i+1}`;await selectView(`f${i}`,true);await pause(550);}
      setPlan(false);await selectView('f0',true);await pause(1200);
      beginExport();await pause(80);
      for(let level=1;level<4;level++){
        const move=await createMove(level);
        for(let frame=0;frame<=42;frame++){
          button.textContent=`1440p / transition ${level}/3 / frame ${frame}/42`;
          await send(`move-${level}-${String(frame).padStart(3,'0')}.jpg`,await move(frame/42));
        }
      }
      endExport();
      const points=await fetch('/points').then(r=>r.json()),poses=[];
      for(let i=0;i<4;i++){
        button.textContent=`1440p / stills ${i+1}/4`;
        setPlan(false);await selectView(`f${i}`,true);await pause(1100);await send(`iso-${i}.png`,await still());
        setPlan(true);await selectView(`f${i}`,true);await pause(1100);await send(`plan-${i}.png`,await still());poses.push(project(i,points));
      }
      await send('poses.json',JSON.stringify({width:renderer.domElement.width,height:renderer.domElement.height,fps:30,duration:1.4,floors:poses}));
      button.textContent='Presentation exported';button.dataset.complete='true';
    }catch(error){endExport();button.textContent=`Capture failed: ${error.message}`;button.disabled=false;}
  };
}
