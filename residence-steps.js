/* One physical gesture starts one complete transition. Delta never sets time. */
(() => {
  'use strict';
  class GestureGate {
    constructor(quiet=220){this.quiet=quiet;this.last=-Infinity;this.busy=false;}
    accept(now){const fresh=now-this.last>this.quiet;this.last=now;if(this.busy||!fresh)return false;this.busy=true;return true;}
    finish(){this.busy=false;}
  }
  const scenes=[];let touchY=0;
  function active(direction){
    if(document.querySelector('dialog[open]')||document.body.classList.contains('locked'))return;
    return scenes.find(scene=>{const r=scene.element.getBoundingClientRect();return Math.abs(r.top)<innerHeight*.4&&r.bottom>innerHeight*.55;});
  }
  function move(event,direction){
    const scene=active(direction);if(!scene)return;
    event.preventDefault();event.stopImmediatePropagation();
    if(!scene.gate.accept(performance.now()))return;
    window.AngoraScroll?.stop();window.AngoraScroll?.to(scene.element.getBoundingClientRect().top+scrollY,true);
    const next=scene.index+direction;
    if(next<0||next>scene.steps){
      window.AngoraScroll?.start();
      window.AngoraScroll?.to(scene.element.getBoundingClientRect().top+scrollY+(direction>0?scene.element.offsetHeight+2:-innerHeight*.75),true);
      scene.gate.finish();return;
    }
    scene.element.dataset.transitioning='true';
    Promise.resolve(scene.transition(scene.index,next)).then(()=>{scene.index=next;scene.element.dataset.step=next;})
      .catch(error=>console.error('Presentation transition',error)).finally(()=>{scene.element.dataset.transitioning='false';scene.gate.finish();window.AngoraScroll?.start();});
  }
  window.addEventListener('wheel',e=>{if(e.ctrlKey||Math.abs(e.deltaY)<1||Math.abs(e.deltaX)>Math.abs(e.deltaY))return;move(e,Math.sign(e.deltaY));},{capture:true,passive:false});
  window.addEventListener('keydown',e=>{if(e.target.closest('input,textarea,select,button,a')||e.altKey||e.ctrlKey||e.metaKey)return;if(['PageDown','PageUp',' '].includes(e.key))move(e,e.key==='PageUp'||e.shiftKey?-1:1);},{capture:true});
  window.addEventListener('touchstart',e=>{touchY=e.touches[0]?.clientY||0;},{passive:true});
  window.addEventListener('touchmove',e=>{if(!active(Math.sign(touchY-e.touches[0].clientY)))return;e.preventDefault();},{passive:false});
  window.addEventListener('touchend',e=>{const delta=touchY-(e.changedTouches[0]?.clientY||touchY);if(Math.abs(delta)>35)move(e,Math.sign(delta));},{passive:false});
  window.AngoraSteps={GestureGate,register(element,steps,transition){
    const scene={element,steps,transition,index:0,gate:new GestureGate()};element.dataset.step=0;scenes.push(scene);
    scene.go=async index=>{if(scene.gate.busy)return;scene.gate.busy=true;window.AngoraScroll?.stop();const next=Math.max(0,Math.min(steps,index));try{await transition(scene.index,next);scene.index=next;element.dataset.step=next;}finally{scene.gate.finish();window.AngoraScroll?.start();}};
    return scene;
  }};
})();
