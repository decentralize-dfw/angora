(() => {
  'use strict';
  function holdFrame(parent){
    let canvas=parent.querySelector('.film-hold-frame');
    if(!canvas){canvas=document.createElement('canvas');canvas.className='film-hold-frame';canvas.hidden=true;canvas.setAttribute('aria-hidden','true');parent.append(canvas);}return canvas;
  }
  function freeze(video,siblings=[]){
    if(!video.videoWidth||!video.videoHeight)return false;
    try{
      const canvas=video.holdFrame||holdFrame(video.parentElement);
      canvas.width=video.videoWidth;canvas.height=video.videoHeight;
      canvas.getContext('2d').drawImage(video,0,0,canvas.width,canvas.height);canvas.hidden=false;
      siblings.forEach(v=>{v.pause();v.classList.remove('playing');});return true;
    }catch{return false;}
  }
  function create(src,parent,className){
    const video=document.createElement('video');video.src=src;video.className=className;video.muted=true;video.playsInline=true;video.preload='auto';video.setAttribute('aria-hidden','true');video.holdFrame=holdFrame(parent);parent.append(video);video.load();return video;
  }
  function waitFor(video,event,action){
    return new Promise((resolve,reject)=>{
      const cleanup=()=>{clearTimeout(timer);video.removeEventListener(event,done);video.removeEventListener('error',fail);};
      const done=()=>{cleanup();resolve();},fail=()=>{cleanup();reject(Error('Video could not prepare its next frame'));};
      const timer=setTimeout(fail,5000);video.addEventListener(event,done,{once:true});video.addEventListener('error',fail,{once:true});action?.();
    });
  }
  async function play(video,siblings,seconds,reduced,onProgress=()=>{},onReady=()=>{}){
    if(video.readyState<2)await waitFor(video,'loadeddata');
    siblings.forEach(v=>v.pause());
    const seek=reduced?Math.max(0,video.duration-.001):0;
    if(Math.abs(video.currentTime-seek)>.001)await waitFor(video,'seeked',()=>video.currentTime=seek);
    video.playbackRate=Math.min(16,video.duration/seconds);
    await new Promise((resolve,reject)=>{
      let raf,frame,shown=false,settled=false;
      const reveal=()=>{if(shown)return;shown=true;video.classList.add('playing');if(video.holdFrame)video.holdFrame.hidden=true;siblings.filter(v=>v!==video).forEach(v=>v.classList.remove('playing'));onReady();};
      const cleanup=()=>{clearTimeout(watchdog);cancelAnimationFrame(raf);if(frame!==undefined)video.cancelVideoFrameCallback?.(frame);video.onended=null;video.onerror=null;};
      const finish=()=>{if(settled)return;settled=true;reveal();cleanup();video.pause();freeze(video,siblings);onProgress(1);resolve();};
      const fail=error=>{if(settled)return;settled=true;cleanup();video.pause();reject(error);};
      const watchdog=setTimeout(()=>video.ended||video.currentTime>=video.duration-.04?finish():fail(Error('Video playback interrupted; scrolling released')),seconds*1000+2500);
      const tick=()=>{if(settled)return;onProgress(Math.min(1,video.currentTime/video.duration));raf=requestAnimationFrame(tick);};
      video.onended=finish;video.onerror=()=>fail(Error('Video playback failed'));
      if(video.requestVideoFrameCallback)frame=video.requestVideoFrameCallback(()=>{reveal();if(reduced)finish();});
      video.play().then(()=>{
        if(!video.requestVideoFrameCallback)requestAnimationFrame(()=>requestAnimationFrame(()=>{reveal();if(reduced)finish();}));
        if(!reduced)tick();
      },fail);
    });
  }
  window.AngoraVideo={create,play,freeze};
})();
