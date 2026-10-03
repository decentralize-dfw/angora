(() => {
  'use strict';
  function create(src,parent,className){
    const video=document.createElement('video');video.src=src;video.className=className;video.muted=true;video.playsInline=true;video.preload='auto';video.setAttribute('aria-hidden','true');parent.append(video);video.load();return video;
  }
  async function play(video,siblings,seconds,reduced,onProgress=()=>{},onReady=()=>{}){
    // The outgoing frame remains visible while the next movie seeks and decodes.
    if(video.readyState<2)await new Promise((resolve,reject)=>{video.addEventListener('loadeddata',resolve,{once:true});video.addEventListener('error',()=>reject(Error(video.src)),{once:true});});
    siblings.forEach(v=>v.pause());
    const seek=reduced?Math.max(0,video.duration-.001):0;
    if(Math.abs(video.currentTime-seek)>.001)await new Promise((resolve,reject)=>{
      video.addEventListener('seeked',resolve,{once:true});video.addEventListener('error',reject,{once:true});video.currentTime=seek;
    });
    video.playbackRate=video.duration/seconds;
    await new Promise((resolve,reject)=>{
      let raf,frame,shown=false;
      const reveal=()=>{if(shown)return;shown=true;video.classList.add('playing');siblings.filter(v=>v!==video).forEach(v=>v.classList.remove('playing'));onReady();};
      const tick=()=>{onProgress(Math.min(1,video.currentTime/video.duration));raf=requestAnimationFrame(tick);};
      const finish=()=>{reveal();cancelAnimationFrame(raf);if(frame!==undefined)video.cancelVideoFrameCallback?.(frame);video.pause();onProgress(1);resolve();};
      video.onended=finish;video.onerror=()=>{cancelAnimationFrame(raf);reject(Error('Video playback failed'));};
      if(video.requestVideoFrameCallback)frame=video.requestVideoFrameCallback(()=>{reveal();if(reduced)finish();});
      video.play().then(()=>{
        if(!video.requestVideoFrameCallback)requestAnimationFrame(()=>requestAnimationFrame(()=>{reveal();if(reduced)finish();}));
        if(!reduced)tick();
      },reject);
    });
  }
  window.AngoraVideo={create,play};
})();
