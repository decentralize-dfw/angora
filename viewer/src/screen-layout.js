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
export function invalidateUIObstacles(){cached=null;}
export function collectUIObstacles(host,force=false) {
  const now=typeof performance==='object'?performance.now():Date.now();
  if(!force&&cached&&cachedHost===host&&now-cachedAt<250)return cached;
  cachedHost=host;cachedAt=now;
  return cached=measureUIObstacles(host);
}
function measureUIObstacles(host) {
  const origin=host.getBoundingClientRect();
  return [...document.querySelectorAll('.topbar,.scale-picker,.view-description,.side-tools,.explore-dock,.panel,.region-panel,.model-scale,.tool-dock,.photo-view,.walk-close,.walk-room-panel,.walk-pad,.load-status,.gesture-help,.device-qa-status')]
    .filter(el=>el.getClientRects().length>0)
    .map(el=>{const r=el.getBoundingClientRect();return {left:r.left-origin.left,right:r.right-origin.left,top:r.top-origin.top,bottom:r.bottom-origin.top};});
}

// Search real free space instead of silently discarding crowded dimensions.
// A leader preserves the association with the measured wall-to-wall line.
// extraFrom / extraObstacles: the items from that index on (the plan's
// dimension tags) also keep clear of a second set of rectangles - the
// photograph marks - which the names before them are allowed to sit among.
export function layoutDimensionLabels(items,{width,height,obstacles=[],gap=3,padding=8,extraFrom=Infinity,extraObstacles=[]}) {
  const occupied=obstacles.slice(),placed=[];
  let index=-1;
  for(const item of items){
    index++;
    const blocked=index>=extraFrom&&extraObstacles.length?occupied.concat(extraObstacles):occupied;
    const halfW=item.width/2,halfH=item.height/2;
    if(![item.x,item.y,halfW,halfH].every(Number.isFinite))continue;
    const minX=padding+halfW,maxX=width-padding-halfW,minY=padding+halfH,maxY=height-padding-halfH;
    let best=null,bestCost=Infinity;
    const consider=(x,y)=>{
      if(x<minX||x>maxX||y<minY||y>maxY)return;
      const cost=(x-item.x)**2+(y-item.y)**2;if(cost>=bestCost)return;
      const rect={left:x-halfW,right:x+halfW,top:y-halfH,bottom:y+halfH};
      if(blocked.some(other=>rectanglesOverlap(rect,other,gap)))return;
      best={...item,x,y,rect,anchorX:item.x,anchorY:item.y};bestCost=cost;
    };
    consider(item.x,item.y);
    if(!best){
      for(let y=minY;y<=maxY;y+=8)for(let x=minX;x<=maxX;x+=8)consider(x,y);
    }
    if(best){placed.push(best);occupied.push(best.rect);}
  }
  return placed;
}

// Ölçüler ÇİZGİLERİNİN ORTASINDA SABİT durur - ekranda boş yer aramaz. Eski
// yerleşim çakışınca en yakın boş noktayı bütün ekranda arıyordu; yakınlaşıp
// uzaklaşırken etiket bir yerden bir yere sıçrıyor, hangi çizgiye ait olduğu
// kayboluyordu. Kural artık:
//   1. Ölçüler (fixedFrom sonrası) tam çizgi ortasına konur. Arayüzle, foto
//      işaretleriyle ya da daha önce konmuş bir ölçüyle çakışan GİZLENİR,
//      taşınmaz (çizginin kendisi görünür kalır).
//   2. Oda adları sonra konur ve ölçülerle ASLA çakışmaz: önce kendi
//      yerinde, olmazsa hemen üstünde/altında bir satır denenir, o da
//      olmazsa ad o kare için çekilir.
export function layoutDimensionsAtMidpoint(items,{width,height,obstacles=[],gap=3,padding=8,fixedFrom=0,extraObstacles=[]}) {
  const rectAt=(item,x,y)=>({left:x-item.width/2,right:x+item.width/2,top:y-item.height/2,bottom:y+item.height/2});
  const inside=r=>r.left>=padding&&r.right<=width-padding&&r.top>=padding&&r.bottom<=height-padding;
  const valid=item=>[item.x,item.y,item.width,item.height].every(Number.isFinite);
  const placed=[],dims=[],names=[];
  const ui=obstacles.concat(extraObstacles);
  // Ölçü yazısı çizgisinin ortasında; başka bir ölçüye/arayüze değiyorsa KENDİ ÇİZGİSİ ÜSTÜNDE kayar
  // (02.10 ürün sahibinin ölçü çiziminin hepsi görünsün diye, gizlemek son çare). Yer sırası sabit:
  // kamera dönerken etiket atlamaz.
  const along=[.5,.38,.62,.28,.72,.18,.82];
  for(const item of items.slice(fixedFrom)){
    if(!valid(item))continue;
    const spots=item.seg?along.map(t=>[item.seg[0]+(item.seg[2]-item.seg[0])*t,item.seg[1]+(item.seg[3]-item.seg[1])*t]):[[item.x,item.y]];
    for(const [x,y] of spots){
      const rect=rectAt(item,x,y);
      if(!inside(rect)||ui.some(o=>rectanglesOverlap(rect,o,gap))||dims.some(o=>rectanglesOverlap(rect,o,gap)))continue;
      dims.push(rect);placed.push({...item,x,y,rect,anchorX:item.x,anchorY:item.y});break;
    }
  }
  // Ad ölçüyle ve fotoğraf işaretiyle hiç çakışmaz: yerinde sığmıyorsa KENDİ ODASININ İÇİNDE (fits) yukarı/aşağı/yana kayar;
  // odası dışına taşacaksa gizlenir (kayan ad komşu odanın üstüne düşmesin).
  const shifts=[[0,0],[0,-1],[0,1],[0,-2],[0,2],[-1,0],[1,0],[-1,-1],[1,-1],[-1,1],[1,1],[0,-3],[0,3]];
  for(const item of items.slice(0,fixedFrom)){
    if(!valid(item))continue;
    for(const [sx,sy] of shifts){
      const x=item.x+sx*item.width*.55,y=item.y+sy*item.height*.75;
      if((sx||sy)&&item.fits&&!item.fits(x,y))continue;
      if((sx||sy)&&!item.fits)continue;
      const rect=rectAt(item,x,y);
      if(!inside(rect)||ui.some(o=>rectanglesOverlap(rect,o,gap))||dims.some(o=>rectanglesOverlap(rect,o,gap))||names.some(o=>rectanglesOverlap(rect,o,gap)))continue;
      names.push(rect);placed.push({...item,x,y,rect,anchorX:item.x,anchorY:item.y});break;
    }
  }
  return placed;
}
