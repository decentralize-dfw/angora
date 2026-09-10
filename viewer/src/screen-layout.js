export function rectanglesOverlap(a,b,gap=0) {
  return a.left<b.right+gap&&a.right>b.left-gap&&a.top<b.bottom+gap&&a.bottom>b.top-gap;
}

// Stable input order wins. Never pile labels at a clamped screen edge or move
// a name far into a different room. Dense labels return as the user zooms in;
// every room remains available from the tour's room selector.
export function layoutAnchoredLabels(items,{width,height,obstacles=[],gap=6,padding=8,maxDisplacement=24}) {
  const placed=[],occupied=obstacles.slice();
  for(const item of items) {
    if(![item.x,item.y,item.width,item.height].every(Number.isFinite)||item.width<=0||item.height<=0)continue;
    if(item.x<0||item.x>width||item.y<0||item.y>height)continue;
    const halfW=item.width/2,halfH=item.height/2;
    if(item.width+2*padding>width||item.height+2*padding>height)continue;
    const x=Math.max(padding+halfW,Math.min(width-padding-halfW,item.x));
    const y=Math.max(padding+halfH,Math.min(height-padding-halfH,item.y));
    if(Math.hypot(x-item.x,y-item.y)>maxDisplacement)continue;
    const rect={left:x-halfW,right:x+halfW,top:y-halfH,bottom:y+halfH};
    if(occupied.some(other=>rectanglesOverlap(rect,other,gap)))continue;
    occupied.push(rect);placed.push({...item,x,y,rect});
  }
  return placed;
}

// Actual visible controls, including open sheets and safe-area positioning,
// replace guessed top/bottom reservations for different phone orientations.
// Measuring the interface forces the browser to lay the page out, and this ran
// twice a frame over fourteen selectors - about sixty forced layouts a second,
// which on a phone is felt as stutter rather than seen. The rectangles only
// move when the window resizes or a panel opens, so a reading is reused for a
// moment; a panel that opens is avoided within a frame or two, which is not
// visible. Passing force skips the cache.
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
