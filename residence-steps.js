/* One gesture plays one scene; the document scroller is never stopped by a film. */
(() => {
  'use strict';
  class GestureGate {
    constructor(quiet=220){this.quiet=quiet;this.last=-Infinity;this.busy=false;this.direction=0;}
    accept(now,direction=1){const fresh=now-this.last>this.quiet||direction!==this.direction;this.last=now;if(this.busy||!fresh)return false;this.busy=true;this.direction=direction;return true;}
    finish(){this.busy=false;}
  }
  const scenes=[];let touchY=0,busyScene=null,pending=Promise.resolve();
  const blocked=()=>document.querySelector('dialog[open]')||document.body.classList.contains('locked');
  function active(){
    if(blocked())return;
    return scenes.find(scene=>{const r=scene.element.getBoundingClientRect();return Math.abs(r.top)<innerHeight*.4&&r.bottom>innerHeight*.55;});
  }
  function run(scene,work){
    busyScene=scene;
    pending=Promise.resolve().then(work).catch(error=>console.error('Presentation transition',error)).finally(()=>{
      scene.element.dataset.transitioning='false';scene.element.dataset.departing='false';scene.gate.finish();busyScene=null;
      if(!blocked())window.AngoraScroll?.start();
    });return pending;
  }
  function move(event,direction){
    if(blocked())return;
    if(busyScene){event.preventDefault();event.stopImmediatePropagation();busyScene.gate.last=performance.now();return;}
    window.AngoraScroll?.cancelTravel?.();
    const scene=active();if(!scene)return;
    event.preventDefault();event.stopImmediatePropagation();
    if(!scene.gate.accept(performance.now(),direction))return;
    window.AngoraScroll?.to(scene.element.getBoundingClientRect().top+scrollY,true);
    const next=scene.index+direction;
    if(next<0||next>scene.steps){
      scene.element.dataset.departing='true';
      const top=scene.element.getBoundingClientRect().top+scrollY+(direction>0?scene.element.offsetHeight+2:-innerHeight*.75);
      run(scene,async()=>{await scene.exit?.(direction);if(window.AngoraScroll?.travel)await window.AngoraScroll.travel(top,.85);else window.AngoraScroll?.to(top,false);});return;
    }
    scene.element.dataset.transitioning='true';
    run(scene,async()=>{await scene.transition(scene.index,next);scene.index=next;scene.element.dataset.step=next;});
  }
  window.addEventListener('wheel',e=>{if(e.ctrlKey||Math.abs(e.deltaY)<1||Math.abs(e.deltaX)>Math.abs(e.deltaY))return;move(e,Math.sign(e.deltaY));},{capture:true,passive:false});
  window.addEventListener('keydown',e=>{if(e.target.closest('input,textarea,select,button,a')||e.altKey||e.ctrlKey||e.metaKey)return;if(['PageDown','PageUp',' '].includes(e.key))move(e,e.key==='PageUp'||e.shiftKey?-1:1);},{capture:true});
  window.addEventListener('touchstart',e=>{touchY=e.touches[0]?.clientY||0;},{passive:true});
  window.addEventListener('touchmove',e=>{if(blocked()||(!busyScene&&!active()))return;e.preventDefault();},{passive:false});
  window.addEventListener('touchend',e=>{const delta=touchY-(e.changedTouches[0]?.clientY||touchY);if(Math.abs(delta)>35)move(e,Math.sign(delta));},{passive:false});
  window.AngoraSteps={GestureGate,whenIdle:()=>pending,register(element,steps,transition,exit){
    const scene={element,steps,transition,exit,index:0,gate:new GestureGate()};element.dataset.step=0;scenes.push(scene);
    scene.go=index=>{if(busyScene)return pending;scene.gate.busy=true;const next=Math.max(0,Math.min(steps,index));scene.element.dataset.transitioning='true';return run(scene,async()=>{await transition(scene.index,next);scene.index=next;element.dataset.step=next;});};return scene;
  }};
})();
