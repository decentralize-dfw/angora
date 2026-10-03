/* Reusable recorded-camera player. No live model, CSS camera simulation or video seeking. */
(() => {
  const clamp = value => Math.max(0, Math.min(1, value));
  function position(progress, clips) {
    const p = clamp(progress), index = Math.min(clips.length - 1, Math.floor(p * clips.length));
    const local = p === 1 ? 1 : p * clips.length - index;
    return {index, local, frame: Math.round(local * (clips[index].frames - 1))};
  }
  class FramePlayer {
    constructor(canvas, clips, onFrame) {
      this.canvas = canvas; this.context = canvas.getContext('2d', {alpha:false});
      this.clips = clips; this.onFrame = onFrame; this.cache = new Map(); this.pending = new Set();
      this.queue = []; this.active = 0; this.target = null; this.last = null; this.generation = 0;
      this.limit = matchMedia('(max-width:800px)').matches ? 16 : 28;
      this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(canvas);
    }
    key(clip, frame) {return `${clip.id}:${frame}`;}
    resize() {
      const box = this.canvas.getBoundingClientRect(), ratio = Math.min(1.5, devicePixelRatio || 1);
      this.canvas.width = Math.max(1, Math.round(box.width * ratio));
      this.canvas.height = Math.max(1, Math.round(box.height * ratio));
      if (this.last) this.draw(this.last);
    }
    draw(item) {
      const {width:w,height:h} = this.canvas, image = item.image, ctx = this.context;
      ctx.fillStyle = '#152b25'; ctx.fillRect(0,0,w,h);
      const needsAmbient = Math.abs(w/h-image.width/image.height) > .08;
      if (needsAmbient) {
        // A quiet ambient field retains the whole landscape composition on a phone.
        const cover = Math.max(w/image.width,h/image.height);
        ctx.save(); ctx.filter = 'blur(28px) brightness(.42)';
        ctx.drawImage(image,(w-image.width*cover)/2,(h-image.height*cover)/2,image.width*cover,image.height*cover);
        ctx.restore();
      }
      const scale = Math.min(w/image.width,h/image.height);
      ctx.drawImage(image,(w-image.width*scale)/2,(h-image.height*scale)/2,image.width*scale,image.height*scale);
      this.last = item; this.canvas.dataset.clip = item.clip.id; this.canvas.dataset.frame = item.frame;
      this.onFrame?.(item);
    }
    seek(clip, frame, direction=1) {
      frame = Math.max(0,Math.min(clip.frames-1,Math.round(frame)));
      const key = this.key(clip,frame); this.target = {clip,frame,key};
      const exact = this.cache.get(key);
      if (exact) this.draw(exact);
      else {
        const near = [...this.cache.values()].filter(item => item.clip.id===clip.id)
          .sort((a,b) => Math.abs(a.frame-frame)-Math.abs(b.frame-frame))[0];
        if (near) this.draw(near);
      }
      this.queue = [{clip,frame,key}];
      for (let distance=1;distance<=10;distance++) for(const sign of [direction,-direction]) {
        const next=frame+distance*sign;
        if(next>=0&&next<clip.frames)this.queue.push({clip,frame:next,key:this.key(clip,next)});
      }
      const index=this.clips.indexOf(clip);
      if(frame>clip.frames-16&&index>=0&&this.clips[index+1]){
        const next=this.clips[index+1];this.queue.push({clip:next,frame:0,key:this.key(next,0)});
      }
      this.pump();
    }
    trim() {
      if(this.cache.size<=this.limit)return;
      const target=this.target;
      const entries=[...this.cache.entries()].sort((a,b)=>{
        const score=item=>item.clip.id===target.clip.id?Math.abs(item.frame-target.frame):1000;
        return score(b[1])-score(a[1]);
      });
      for(const [key,item] of entries){
        if(this.cache.size<=this.limit)break;
        if(item===this.last||key===target.key)continue;
        item.image.close?.();this.cache.delete(key);
      }
    }
    async decode(task) {
      const url=`./assets/residence/films/${task.clip.id}/frame-${String(task.frame).padStart(4,'0')}.webp`;
      const response=await fetch(url,{cache:'force-cache'});
      if(!response.ok)throw new Error('Film frame unavailable');
      const blob=await response.blob();
      if('createImageBitmap' in window)return createImageBitmap(blob);
      return new Promise((resolve,reject)=>{
        const img=new Image(),url=URL.createObjectURL(blob);
        img.onload=()=>{URL.revokeObjectURL(url);resolve(img);};
        img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Film decode failed'));};img.src=url;
      });
    }
    pump() {
      while(this.active<4&&this.queue.length){
        const task=this.queue.shift();
        if(this.cache.has(task.key)||this.pending.has(task.key))continue;
        this.pending.add(task.key);this.active++;
        this.decode(task).then(image=>{
          const item={...task,image};this.cache.set(task.key,item);
          if(this.target?.key===task.key||(!this.last&&this.target?.clip.id===task.clip.id))this.draw(item);
          this.trim();
        }).catch(()=>{this.canvas.dataset.loadError='true';})
          .finally(()=>{this.pending.delete(task.key);this.active--;this.pump();});
      }
    }
  }
  window.AngoraFilmRuntime={position,FramePlayer,clamp};
})();
