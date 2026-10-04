/* One gesture plays one scene. Film movement and document movement are exclusive. */
(() => {
  'use strict';
  class GestureGate {
    constructor(quiet=220){this.quiet=quiet;this.last=-Infinity;this.busy=false;this.direction=0;}
    accept(now,direction=1){const fresh=now-this.last>this.quiet||direction!==this.direction;this.last=now;if(this.busy||!fresh)return false;this.busy=true;this.direction=direction;return true;}
    finish(){this.busy=false;}
  }
  const scenes=[];let touchY=0,touchConsumed=false,busyScene=null,pending=Promise.resolve();
  const blocked=()=>document.querySelector('dialog[open]')||document.body.classList.contains('locked');
  function active(){
    if(blocked())return;
    return scenes.find(scene=>{const r=scene.element.getBoundingClientRect();return r.top<=24&&r.top>-innerHeight*.22&&r.bottom>innerHeight*.6;});
  }
  function run(scene,work,anchor=scrollY){
    busyScene=scene;
    // Capture before the promise / first video frame. Lenis must discard its
    // unfinished wheel tween, rather than move underneath the playing film.
    window.AngoraScroll?.hold?.(anchor);
    pending=Promise.resolve().then(work).catch(error=>console.error('Presentation transition',error)).finally(()=>{
      scene.element.dataset.transitioning='false';scene.element.dataset.departing='false';scene.gate.finish();busyScene=null;
      window.AngoraScroll?.release?.();
    });return pending;
  }
  function move(event,direction,displacement=0){
    if(blocked())return;
    if(busyScene){event.preventDefault();event.stopImmediatePropagation();busyScene.gate.last=performance.now();return;}
    window.AngoraScroll?.cancelTravel?.();
    const scene=active();
    if(!scene){
      // A fast wheel must land at a scene before it can skip the entire viewport.
      const reach=Math.abs(displacement||event.deltaY||0)*1.15;
      const incoming=scenes.map(s=>({s,r:s.element.getBoundingClientRect()})).filter(({r})=>direction>0?r.top>24&&r.top<=reach:r.top<-innerHeight*.22&&-r.top<=reach).sort((a,b)=>Math.abs(a.r.top)-Math.abs(b.r.top))[0];
      if(!incoming)return;
      event.preventDefault();event.stopImmediatePropagation();
      if(!incoming.s.gate.accept(performance.now(),direction))return;
      incoming.s.element.dataset.transitioning='true';
      run(incoming.s,async()=>{await incoming.s.enter?.(direction);await window.AngoraScroll?.travel(incoming.r.top+scrollY,.35);});return;
    }
    event.preventDefault();event.stopImmediatePropagation();
    if(!scene.gate.accept(performance.now(),direction))return;
    const anchor=scene.element.getBoundingClientRect().top+scrollY;
    const next=scene.index+direction;
    if(next<0||next>scene.steps){
      scene.element.dataset.departing='true';
      const top=scene.element.getBoundingClientRect().top+scrollY+(direction>0?scene.element.offsetHeight+2:-innerHeight*.75);
      run(scene,async()=>{const handled=await scene.exit?.(direction,top);if(handled)return;if(window.AngoraScroll?.travel)await window.AngoraScroll.travel(top,.65);else window.AngoraScroll?.to(top,false);},anchor);return;
    }
    scene.element.dataset.transitioning='true';
    run(scene,async()=>{await scene.transition(scene.index,next);scene.index=next;scene.element.dataset.step=next;},anchor);
  }
  window.addEventListener('wheel',e=>{if(e.ctrlKey||Math.abs(e.deltaY)<1||Math.abs(e.deltaX)>Math.abs(e.deltaY))return;window.AngoraNavigation?.gesture(e.deltaY,e.deltaMode);move(e,Math.sign(e.deltaY));},{capture:true,passive:false});
  window.addEventListener('keydown',e=>{if(e.target.closest('input,textarea,select,button,a')||e.altKey||e.ctrlKey||e.metaKey)return;if(['PageDown','PageUp',' '].includes(e.key))move(e,e.key==='PageUp'||e.shiftKey?-1:1);},{capture:true});
  window.addEventListener('touchstart',e=>{touchY=e.touches[0]?.clientY||0;touchConsumed=false;},{passive:true});
  window.addEventListener('touchmove',e=>{
    if(blocked())return;if(busyScene||active()||touchConsumed){e.preventDefault();return;}
    const delta=touchY-(e.touches[0]?.clientY||touchY);
    if(Math.abs(delta)<35)return;
    const approaching=scenes.some(s=>{const r=s.element.getBoundingClientRect();return delta>0?r.top>24&&r.top<=Math.abs(delta)*1.15:r.top<-innerHeight*.22&&-r.top<=Math.abs(delta)*1.15;});
    if(approaching){touchConsumed=true;move(e,Math.sign(delta),Math.abs(delta));}
  },{passive:false});
  window.addEventListener('touchend',e=>{const delta=touchY-(e.changedTouches[0]?.clientY||touchY);if(!touchConsumed&&Math.abs(delta)>35){window.AngoraNavigation?.gesture(delta);move(e,Math.sign(delta),Math.abs(delta));}},{passive:false});
  window.AngoraSteps={GestureGate,whenIdle:()=>pending,register(element,steps,transition,exit){
    const scene={element,steps,transition,exit,index:0,request:0,gate:new GestureGate()};element.dataset.step=0;scenes.push(scene);
    scene.go=async index=>{const request=++scene.request,next=Math.max(0,Math.min(steps,index));while(busyScene)await pending;if(request!==scene.request||next===scene.index)return;scene.gate.busy=true;scene.element.dataset.transitioning='true';return run(scene,async()=>{await transition(scene.index,next);scene.index=next;element.dataset.step=next;});};
    scene.reset=index=>{scene.index=Math.max(0,Math.min(steps,index));element.dataset.step=scene.index;scene.gate.finish();scene.gate.last=-Infinity;};return scene;
  }};
})();
