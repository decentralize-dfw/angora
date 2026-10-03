(() => {
  'use strict';
  function create(src,parent,className){
    const video=document.createElement('video');video.src=src;video.className=className;video.muted=true;video.playsInline=true;video.preload='auto';video.setAttribute('aria-hidden','true');parent.append(video);video.load();return video;
  }
  async function play(video,siblings,seconds,reduced,onProgress=()=>{}){
    // Loading is done ahead of the gesture, then the browser decodes the movie.
    if(video.readyState<2)await new Promise((resolve,reject)=>{video.addEventListener('loadeddata',resolve,{once:true});video.addEventListener('error',()=>reject(Error(video.src)),{once:true});});
    siblings.forEach(v=>{v.pause();v.classList.toggle('playing',v===video);});
    video.currentTime=0;video.playbackRate=video.duration/seconds;
    if(reduced){video.currentTime=Math.max(0,video.duration-.001);onProgress(1);return;}
    await new Promise((resolve,reject)=>{
      let raf;const tick=()=>{onProgress(Math.min(1,video.currentTime/video.duration));raf=requestAnimationFrame(tick);};
      video.onended=()=>{cancelAnimationFrame(raf);onProgress(1);resolve();};video.onerror=()=>{cancelAnimationFrame(raf);reject(Error('Video playback failed'));};
      video.play().then(tick,reject);
    });
  }
  window.AngoraVideo={create,play};
})();
