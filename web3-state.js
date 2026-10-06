export const FLOORS = ['Garden','Entrance','First','Attic'];
export const ROUTE = [0,1,2,3,3,2,1,0].map((floor,cursor)=>({cursor,floor,mode:cursor<4?'iso':'plan'}));
export function createState(floors) {
  const cameras=floors.map(f=>f.photos.map(p=>p.id));
  const defaults=[3,4,19,9].map((id,f)=>cameras[f].includes(id)?id:cameras[f][0]);
  let value={section:'residence',cursor:0,hero:0,heroExit:false,cameraByFloor:defaults,filter:'All',galleryPhoto:null,overlay:null,requestId:0};
  let pending=null;
  const listeners=new Set(), log=[];
  const snapshot=()=>structuredClone({...value,technical:ROUTE[value.cursor],pending});
  function emit(type,before) {log.push({type,at:performance.now(),before,after:snapshot()});if(log.length>160)log.shift();listeners.forEach(fn=>fn(snapshot(),type));}
  return {
    snapshot,log, subscribe(fn){listeners.add(fn);return ()=>listeners.delete(fn);},
    begin(target,source='explicit'){const before=snapshot();pending={id:++value.requestId,target,source,phase:'preparing'};emit('begin',before);return pending.id;},
    current(id){return pending?.id===id;},
    phase(id,phase){if(pending?.id!==id)return false;pending.phase=phase;return true;},
    commit(id){if(pending?.id!==id)return false;const before=snapshot();value={...value,...pending.target};pending=null;emit('commit',before);return true;},
    cancel(){const before=snapshot();value.requestId++;pending=null;emit('cancel',before);},
    local(type,patch){if(value.overlay&&type!=='overlay-photo')return false;const before=snapshot();value={...value,...patch};emit(type,before);return true;},
    camera(floor,id){if(!cameras[floor]?.includes(id)||value.overlay)return false;const before=snapshot();value.cameraByFloor=[...value.cameraByFloor];value.cameraByFloor[floor]=id;emit('camera',before);return true;},
    open(origin){if(value.overlay)return false;this.cancel();const before=snapshot();value.overlay=structuredClone(origin);emit('open',before);return true;},
    close(){if(!value.overlay)return false;const before=snapshot();value.overlay=null;emit('close',before);return true;},
    restore(patch){this.cancel();const before=snapshot();const {requestId,technical,pending:oldPending,...safe}=patch;value={...value,...safe,cursor:Math.max(0,Math.min(7,Number(patch.cursor??value.cursor)||0)),overlay:null};value.cameraByFloor=value.cameraByFloor.map((id,f)=>cameras[f].includes(id)?id:defaults[f]);emit('restore',before);}
  };
}
export function cursorFor(mode,floor){return mode==='iso'?floor:7-floor;}
export function wheelPixels(event){return event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?(globalThis.innerHeight||800):1);}
export function editable(element){return !!element?.closest?.('input,textarea,select,[contenteditable="true"],[role="slider"]');}
