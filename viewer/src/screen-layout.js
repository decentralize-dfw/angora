export function rectanglesOverlap(a,b,gap=0) {
  return a.left<b.right+gap&&a.right>b.left-gap&&a.top<b.bottom+gap&&a.bottom>b.top-gap;
}

const RING=[[0,-1],[0,1],[-1,0],[1,0],[-0.71,-0.71],[0.71,-0.71],[-0.71,0.71],[0.71,0.71]];
function searchOffsets(maxDisplacement) {
  const offsets=[[0,0]];
  for(let radius=9;radius<=maxDisplacement;radius+=9)
    for(const [dx,dy] of RING)offsets.push([dx*radius,dy*radius]);
  return offsets;
}

export function layoutAnchoredLabels(items,{width,height,obstacles=[],gap=6,padding=8,maxDisplacement=24}) {
  const placed=[],occupied=obstacles.slice(),offsets=searchOffsets(maxDisplacement);
  for(const item of items) {
    if(![item.x,item.y,item.width,item.height].every(Number.isFinite)||item.width<=0||item.height<=0)continue;
    if(item.x<0||item.x>width||item.y<0||item.y>height)continue;
    const halfW=item.width/2,halfH=item.height/2;
    if(item.width+2*padding>width||item.height+2*padding>height)continue;
    let spot=null;
    for(const [dx,dy] of offsets) {
      const x=Math.max(padding+halfW,Math.min(width-padding-halfW,item.x+dx));
      const y=Math.max(padding+halfH,Math.min(height-padding-halfH,item.y+dy));
      if(Math.hypot(x-item.x,y-item.y)>maxDisplacement+0.5)continue;
      const rect={left:x-halfW,right:x+halfW,top:y-halfH,bottom:y+halfH};
      if(occupied.some(other=>rectanglesOverlap(rect,other,gap)))continue;
      spot={x,y,rect};break;
    }
    if(!spot)continue;
    occupied.push(spot.rect);placed.push({...item,...spot});
  }
  return placed;
}

let cached=null,cachedAt=0,cachedHost=null;
export function collectUIObstacles(host,force=false) {
  const now=typeof performance==='object'?performance.now():Date.now();
  if(!force&&cached&&cachedHost===host&&now-cachedAt<250)return cached;
  cachedHost=host;cachedAt=now;
  return cached=measureUIObstacles(host);
}
function measureUIObstacles(host) {
  const origin=host.getBoundingClientRect();
  return [...document.querySelectorAll('.topbar,.scale-picker,.view-description,.side-tools,.explore-dock,.panel,.region-panel,.model-scale,.walk-close,.walk-room-panel,.walk-pad,.load-status,.gesture-help,.device-qa-status')]
    .filter(el=>el.getClientRects().length>0)
    .map(el=>{const r=el.getBoundingClientRect();return {left:r.left-origin.left,right:r.right-origin.left,top:r.top-origin.top,bottom:r.bottom-origin.top};});
}
