import {cursorFor} from './web3-state.js?v=20261006-refinement-3';
export function parseRoute(hash,manifest){
  const [section,query='']=hash.replace(/^#/,'').split('?'),p=new URLSearchParams(query);
  const floor=Math.max(0,Math.min(3,Number(p.get('floor'))||0));
  const camera=Number(p.get('camera'));
  return {section:section||'hero',cursor:cursorFor(section==='plans'?'plan':'iso',section==='plans'&&!p.has('floor')?3:floor),camera:manifest.floors[floor].photos.some(v=>v.id===camera)?camera:null,floor};
}
export function routeHash(state){
  const s=state.snapshot(),{mode,floor}=s.technical;
  const section=s.section==='technical'?(mode==='iso'?'chapters':'plans'):s.section;
  let hash='#'+section;
  if(['chapters','plans'].includes(section))hash+=`?floor=${floor}&camera=${s.cameraByFloor[floor]}`;
  if(s.overlay?.type==='photo')hash+=(hash.includes('?')?'&':'?')+'photo='+encodeURIComponent(s.overlay.key);
  return hash;
}
export function installHistory(state,onRestore){
  let restoring=false,generation=0,queuedPush=false;
  function write(push=false){if(restoring){queuedPush=queuedPush||push;return;}const s=state.snapshot();history[push?'pushState':'replaceState']({web3:s,y:scrollY},'',routeHash(state));}
  const pop=async event=>{
    const id=++generation;restoring=true;let next;
    try{next=await onRestore(event.state?.web3,event.state?.y,location.hash,()=>id===generation);}finally{if(id===generation)restoring=false;}
    if(id===generation){if(queuedPush){queuedPush=false;write(true);}if(typeof next==='function')next();}
  };
  addEventListener('popstate',pop);
  return {write, get restoring(){return restoring;}};
}
