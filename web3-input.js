import {wheelPixels,editable,ROUTE} from './web3-state.js?v=20261006-tr-6';
export function crossesReadingBoundary(top,bottom,height,dy){
  return dy>0?top>1&&top-dy<=1:bottom<height-1&&bottom-dy>=height-1;
}
export function isReadingExit(s,owner,dir){
  if(s.pending||s.overlay)return false;
  if(owner==='technical')return dir>0?s.cursor===ROUTE.length-1:s.cursor===0;
  if(owner==='hero')return dir>0?s.hero===3&&s.heroExit:s.hero===0&&!s.heroExit;
  return false;
}
// Retain the part of the sticky runway already travelled. Shortening a section
// to one viewport while its top is above the screen would pull the stage up.
export function terminalReadingInset(top,bottom,stageHeight){
  return top<=1&&bottom>=stageHeight-1?Math.max(0,-top):0;
}
export function readingEntryDelta(top,bottom,height,dir){return dir<0?bottom-height:top;}
export function installInput({state,hero,technical,step,activity}) {
  let last=0, direction=0, touch=null,consumed=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function owner(){
    if(!document.body.classList.contains('is-enhanced'))return null;
    if(state.snapshot().overlay)return null;
    for(const [name,node] of [['hero',hero],['technical',technical]]){
      const r=node.getBoundingClientRect(),stage=node.querySelector('.pinned'),h=stage.getBoundingClientRect().height;
      if(h>innerHeight+2||getComputedStyle(stage).position!=='sticky')continue;
      if(r.top<=1&&r.bottom>=h-1)return name;
    }
    return null;
  }
  const isControl=e=>!!e.target.closest('button,a,input,select,textarea,[data-local-scroll],dialog');
  function accept(name,dir,source){if(!name||reduced.matches)return false;return step(name,dir,source);}
  function arrive(dy){
    if(reduced.matches||state.snapshot().overlay)return false;
    for(const node of [hero,technical]){const r=node.getBoundingClientRect(),stage=node.querySelector('.pinned'),h=stage.getBoundingClientRect().height;
      if(h>innerHeight+2||getComputedStyle(stage).position!=='sticky')continue;
      if(crossesReadingBoundary(r.top,r.bottom,h,dy)){scrollTo({top:scrollY+readingEntryDelta(r.top,r.bottom,h,dy),behavior:'instant'});return true;}
    }return false;
  }
  addEventListener('wheel',e=>{
    if(e.ctrlKey||e.metaKey||Math.abs(e.deltaX)>Math.abs(e.deltaY)||e.target.closest('dialog,input:not([type="checkbox"]):not([type="radio"]),textarea,select,[contenteditable="true"]'))return;
    const dy=wheelPixels(e);if(Math.abs(dy)<1)return;
    activity(Math.abs(dy));
    const time=performance.now(), dir=Math.sign(dy), fresh=time-last>180||dir!==direction;
    const name=owner();if(!name){if(arrive(dy)){e.preventDefault();last=time;direction=dir;consumed=true;}return;}
    last=time;direction=dir;
    // A completed endpoint releases this very wheel event, including the tail
    // of the gesture that played the final chapter. No quiet-period lock here.
    if(isReadingExit(state.snapshot(),name,dir)){consumed=false;return;}
    if(!fresh){if(consumed||state.snapshot().pending)e.preventDefault();return;}
    consumed=accept(name,dir,'wheel');if(consumed)e.preventDefault();
  },{passive:false});
  addEventListener('keydown',e=>{
    if(e.ctrlKey||e.metaKey||e.altKey||editable(e.target)||isControl(e))return;
    const dir=['ArrowDown','PageDown',' '].includes(e.key)?1:['ArrowUp','PageUp'].includes(e.key)?-1:0;
    if(dir&&(accept(owner(),e.shiftKey?-dir:dir,'keyboard')||arrive((e.shiftKey?-dir:dir)*innerHeight*.75))){e.preventDefault();activity(100);}
  });
  for(const node of [hero,technical]){
    node.addEventListener('touchstart',e=>{
      if(e.touches.length!==1||e.target.closest('dialog,input,textarea,select,[data-local-scroll]')){touch=null;return;}
      touch={x:e.touches[0].clientX,y:e.touches[0].clientY,owner:owner()};
    },{passive:true});
    node.addEventListener('touchend',e=>{
      if(!touch)return;const t=touch;touch=null;const point=e.changedTouches[0],dy=t.y-point.clientY,dx=t.x-point.clientX;
      if(Math.abs(dy)<36||Math.abs(dx)>Math.abs(dy))return;
      activity(100);if(!accept(t.owner,Math.sign(dy),'touch')&&t.owner)scrollBy({top:Math.sign(dy)*innerHeight*.75,behavior:'smooth'});else if(t.owner)e.preventDefault();
    },{passive:false});
    node.addEventListener('touchcancel',()=>touch=null,{passive:true});
  }
  return {owner,reset(){last=0;direction=0;consumed=false;}};
}
