import {FrameMeasurement} from './frame-measurement.js';

function download(blob,name) {
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download=name;document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
}

// Explicit, local-only evidence capture. UA/viewport cannot establish that a
// device is a physical iPhone, nor can frame statistics establish visual quality.
export function createDeviceQA({getState,invalidate,closePanel,capture}) {
  const $=s=>document.querySelector(s),measurement=new FrameMeasurement();
  const start=$('#qa-start'),save=$('#qa-save'),shot=$('#qa-screenshot'),result=$('#qa-result'),status=$('#qa-status');
  let lastSecond=-1,capturedSnapshot=null;
  function state(){return {...getState(),device_note:$('#qa-device').value.trim(),captured_at:new Date().toISOString(),
    user_agent:navigator.userAgent,device_pixel_ratio:devicePixelRatio,
    screen:{width:screen.width,height:screen.height,orientation:screen.orientation?.type??null}};}
  function finish(){
    measurement.result.end_state=state();
    start.disabled=false;save.disabled=!measurement.result&&!capturedSnapshot;status.hidden=true;
    const r=measurement.result,s=r.summary;
    result.textContent=r.status==='recorded'
      ?`${s.fps?.toFixed(1)??'—'} FPS · p95 ${s.frame_ms_p95?.toFixed(1)??'—'} ms · ${s.draw_calls_max} çizim (tüm geçişler). Görsel kabul yapılmadı.`
      :'Ölçüm kesildi; arka plana geçiş veya 3D bağlam kaybı. Tamamlanmış test sayılmaz.';
    invalidate();
  }
  start.onclick=()=>{
    measurement.start(performance.now(),state());lastSecond=-1;start.disabled=true;save.disabled=true;
    result.textContent='Ölçüm sürüyor. Sahneyi döndür veya oda içinde yürü.';
    closePanel();status.hidden=false;status.textContent='15 sn ölçüm · sahneyi hareket ettir';invalidate();
  };
  save.onclick=()=>{
    const report=measurement.result??{schema_version:1,status:'image_only',visual_acceptance:'not_reviewed',physical_device_verified:false};
    if(measurement.result||capturedSnapshot)download(new Blob([JSON.stringify({...report,scene_capture:capturedSnapshot},null,2)],{type:'application/json'}),'angora-device-evidence.json');
  };
  shot.onclick=()=>{
    closePanel();shot.disabled=true;
    capture((blob,error,snapshot)=>{
      shot.disabled=false;
      if(error||!blob){result.textContent='Görüntü alınamadı; cihazın ekran görüntüsü işlevini kullan.';return;}
      capturedSnapshot={filename:'angora-scene.png',state:snapshot};save.disabled=false;
      download(blob,'angora-scene.png');
      result.textContent='Sahne indirildi. Aynı karenin ayarları Raporu indir ile alınabilir. Safari arayüzü için ayrıca cihaz ekran görüntüsü al.';
    });
  };
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&measurement.active){measurement.finish();finish();}});
  return {
    snapshot:state,
    get active(){return measurement.active;},
    sample(time,frame){
      if(!measurement.active)return;
      const done=measurement.sample(time,frame);
      const second=Math.max(0,Math.ceil((measurement.startTime+measurement.duration-time)/1000));
      if(second!==lastSecond){lastSecond=second;status.textContent=`${second} sn ölçüm · sahneyi hareket ettir`;}
      if(done)finish();
    },
    interrupt(){if(measurement.active){measurement.finish();finish();}}
  };
}
