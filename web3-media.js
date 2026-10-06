const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
export async function decodedImage(url,timeout=4000) {
  const image=new Image();image.src=url;
  await Promise.race([image.decode(),new Promise((_,reject)=>setTimeout(()=>reject(Error('Image preparation timed out')),timeout))]);
  return image;
}
export class FilmSurface {
  constructor(node,manifest,state){this.node=node;this.manifest=manifest;this.state=state;this.still=node.querySelector('.film-still');this.video=null;this.abort=null;this.warmItem=null;}
  cancel(){this.abort?.();this.abort=null;if(this.video){this.video.pause();this.video.remove();this.video.removeAttribute('src');this.video.load();}this.video=null;this.still.style.opacity='1';}
  dropWarm(){if(this.warmItem){const item=this.warmItem;this.warmItem=null;item.video.removeAttribute('src');item.video.load();}}
  warm(key){
    if(this.warmItem?.key===key)return;this.dropWarm();const film=this.manifest.films[key];if(!film||reduced())return;
    const video=document.createElement('video');video.muted=true;video.playsInline=true;video.preload='auto';video.src=film.url;
    const end=decodedImage(film.last,600).catch(()=>null),item={key,video,end,failed:false};this.warmItem=item;video.addEventListener('error',()=>item.failed=true,{once:true});video.load();
  }
  async show(url,id){const image=await decodedImage(url);if(!this.state.current(id))return false;this.still.src=image.src;return true;}
  async play(key,id){
    this.cancel();const film=this.manifest.films[key];
    if(!film)throw Error(`Missing film ${key}`);
    const prepared=this.warmItem?.key===key?this.warmItem:null;if(prepared)this.warmItem=null;
    const end=await (prepared?.end||decodedImage(film.last,600).catch(()=>null));
    if(!this.state.current(id))return false;
    if(reduced()||prepared?.failed){if(end)this.still.src=end.src;prepared?.video.removeAttribute('src');return !!end;}
    const video=prepared?.video||document.createElement('video');video.className='film-video';video.muted=true;video.playsInline=true;video.preload='auto';video.setAttribute('aria-hidden','true');if(!prepared)video.src=film.url;
    this.video=video;this.node.append(video);
    return new Promise(resolve=>{
      let finished=false,presented=false;
      const finish=()=>{
        if(finished)return;finished=true;clearTimeout(timer);
        if(this.state.current(id)&&end){this.still.src=end.src;this.still.style.opacity='1';}
        video.pause();video.remove();video.removeAttribute('src');video.load();if(this.video===video)this.video=null;this.abort=null;resolve(this.state.current(id)&&!!end);
      };
      this.abort=finish;
      const reveal=()=>{if(!this.state.current(id)){finish();return;}presented=true;clearTimeout(timer);timer=setTimeout(finish,film.seconds*1000+450);video.classList.add('presented');this.still.style.opacity='0';this.state.phase(id,'playing');};
      video.addEventListener('ended',finish,{once:true});video.addEventListener('error',finish,{once:true});
      let timer=setTimeout(finish,450);
      const start=async()=>{
        if(!this.state.current(id)){finish();return;}
        if(video.requestVideoFrameCallback)video.requestVideoFrameCallback(reveal);
        try{await video.play();if(!video.requestVideoFrameCallback)reveal();}catch{finish();}
      };
      if(video.readyState>=2)start();else video.addEventListener('loadeddata',start,{once:true});
      if(!prepared)video.load();
    });
  }
}
