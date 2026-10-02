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
  const onScreen=r=>r.right>0&&r.left<width&&r.bottom>0&&r.top<height;
  const valid=item=>[item.x,item.y,item.width,item.height].every(Number.isFinite);
  // 02.10 ürün sahibi: "bunlar sabit olmalı ölçüler ve oda isimleri ... döndürdükçe dans ediyormuş gibi". Hiçbir
  // etiket yerinden kaymaz: ad her zaman odasının iç merkezinde (hiç gizlenmez), ölçü her zaman çizgisinin
  // ortasında. Ölçünün gösterilip gösterilmeyeceği ekran dikdörtgenleriyle değil DAİRELERLE (yarıçap = yazının
  // yarı genişliği) karşılaştırılır: iki etiketin merkez uzaklığı kamera kendi ekseninde dönerken değişmez, karar
  // da değişmez - yalnız yakınlaştırınca/uzaklaştırınca ölçü açılıp kapanır.
  const circle=(x,y,w,h)=>({x,y,r:Math.max(w,h)/2});
  const hits=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<a.r+b.r+gap;
  const placed=[],taken=[];
  const pins=extraObstacles.map(o=>circle((o.left+o.right)/2,(o.top+o.bottom)/2,o.right-o.left,o.bottom-o.top));
  for(const item of items.slice(0,fixedFrom)){
    if(!valid(item))continue;
    const rect=rectAt(item,item.x,item.y);if(!onScreen(rect))continue;
    taken.push(circle(item.x,item.y,item.width,item.height));
    placed.push({...item,rect,anchorX:item.x,anchorY:item.y});
  }
  // Ortası doluysa ölçü KENDİ ÇİZGİSİ üstünde sabit oranlarda yer arar (0,5 -> 0,35/0,65 -> 0,22/0,78). Oranlar çizginin
  // dünya uçlarından: plan görünümünde kamera dönünce uzaklıklar, dolayısıyla seçilen yer de değişmez.
  const along=[.5,.35,.65,.22,.78];
  for(const item of items.slice(fixedFrom)){
    if(!valid(item))continue;
    const spots=item.seg?along.map(t=>[item.seg[0]+(item.seg[2]-item.seg[0])*t,item.seg[1]+(item.seg[3]-item.seg[1])*t]):[[item.x,item.y]];
    for(const [x,y] of spots){
      const rect=rectAt(item,x,y),c=circle(x,y,item.width,item.height);
      // ekrana sabit arayüz panelleri dikdörtgen (dönmez), fotoğraf işaretleri ve öbür etiketler daire
      if(!inside(rect)||obstacles.some(o=>rectanglesOverlap(rect,o,gap))||pins.some(o=>hits(c,o))||taken.some(o=>hits(c,o)))continue;
      taken.push(c);placed.push({...item,x,y,rect,anchorX:item.x,anchorY:item.y});break;
    }
  }
  return placed;
}

// 02.10 ürün sahibi (plan ölçüleri): "ölçü yazmayan şeyler var, oda ismi ölçünün üzerine gelmiş; dikey ve yatay tek
// bir yön belirle, plan yönü olsun: dikey olanların üst kısmı sol, yatay olanların üst kısmı yukarı; hangi ölçü olduğunu
// anlamak için barın üzerine yaz". Kural:
//   1. Her ölçü yazısı GÖSTERİLİR, kendi çizgisinin üstünde, çizgi yönünde döndürülmüş (açı (-90, 90] aralığına
//      indirilir; tam dikey -90: yazının üstü sola bakar). Başka bir ölçü yazısıyla çakışırsa kendi çizgisi üstünde
//      sabit oranlarda kayar; yer yoksa yine ortada durur (gizlenmez).
//   2. Oda adı odasının içinde, iç merkezine en yakın yerde durur: hiçbir ölçü yazısına, ölçü çizgisine, başka bir ada
//      ve arayüze değmeyen en yakın aday seçilir. Hiçbiri yoksa en az çakışan (odanın içinde kalan) aday.
export function dimensionAngle(seg) {
  let a=Math.atan2(seg[3]-seg[1],seg[2]-seg[0])*180/Math.PI;
  if(a>90)a-=180;else if(a<=-90)a+=180;
  if(Math.abs(a-90)<1e-6)a=-90;
  return a;
}
const orientedCorners=(x,y,w,h,deg)=>{
  const r=deg*Math.PI/180,c=Math.cos(r),s=Math.sin(r),hw=w/2,hh=h/2;
  return [[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]].map(([u,v])=>[x+u*c-v*s,y+u*s+v*c]);
};
function polygonsOverlap(p,q,gap=0) {
  for(const poly of [p,q])for(let i=0;i<poly.length;i++){
    const [x1,y1]=poly[i],[x2,y2]=poly[(i+1)%poly.length];let nx=y2-y1,ny=x1-x2;const L=Math.hypot(nx,ny)||1;nx/=L;ny/=L;
    let a0=Infinity,a1=-Infinity,b0=Infinity,b1=-Infinity;
    for(const [x,y] of p){const d=x*nx+y*ny;a0=Math.min(a0,d);a1=Math.max(a1,d);}
    for(const [x,y] of q){const d=x*nx+y*ny;b0=Math.min(b0,d);b1=Math.max(b1,d);}
    if(a1+gap<b0||b1+gap<a0)return false;
  }
  return true;
}
function segmentHitsRect(seg,r,gap=0) {
  const [x1,y1,x2,y2]=seg,l=r.left-gap,t=r.top-gap,ri=r.right+gap,b=r.bottom+gap;
  let u0=0,u1=1;const dx=x2-x1,dy=y2-y1;
  for(const [p,q] of [[-dx,x1-l],[dx,ri-x1],[-dy,y1-t],[dy,b-y1]]){
    if(p===0){if(q<0)return false;continue;}
    const u=q/p;if(p<0){if(u>u1)return false;if(u>u0)u0=u;}else{if(u<u0)return false;if(u<u1)u1=u;}
  }
  return true;
}
function insidePolygon(poly,x,y) {
  let inside=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const [xi,yi]=poly[i],[xj,yj]=poly[j];
    if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside;
  }
  return inside;
}
export function layoutPlanLabels(names,dims,{width,height,obstacles=[],gap=2,padding=6}) {
  const onScreen=(x,y)=>x>=0&&x<=width&&y>=0&&y<=height;
  const placedDims=[],dimPolys=[];
  const along=[.5,.38,.62,.28,.72,.2,.8];
  for(const d of dims){
    if(!d.seg||![d.width,d.height].every(Number.isFinite))continue;
    const angle=dimensionAngle(d.seg);
    let pick=null;
    for(const t of along){
      const x=d.seg[0]+(d.seg[2]-d.seg[0])*t,y=d.seg[1]+(d.seg[3]-d.seg[1])*t;
      const poly=orientedCorners(x,y,d.width,d.height,angle);
      if(!dimPolys.some(o=>polygonsOverlap(poly,o,gap))){pick={x,y,poly};break;}
    }
    if(!pick){const x=(d.seg[0]+d.seg[2])/2,y=(d.seg[1]+d.seg[3])/2;pick={x,y,poly:orientedCorners(x,y,d.width,d.height,angle)};}
    if(!onScreen(pick.x,pick.y))continue;
    dimPolys.push(pick.poly);placedDims.push({...d,x:pick.x,y:pick.y,angle,poly:pick.poly});
  }
  const segs=dims.filter(d=>d.seg).map(d=>d.seg);
  const placedNames=[],nameRects=[];
  for(const n of names){
    if(![n.x,n.y,n.width,n.height].every(Number.isFinite)||!onScreen(n.x,n.y))continue;
    const hw=n.width/2,hh=n.height/2;
    const cands=[];
    for(let r=0;r<=8;r++)for(let k=0;k<(r?8*r:1);k++){
      const a=r?k/(8*r)*2*Math.PI:0;
      cands.push([n.x+Math.cos(a)*r*Math.max(6,hw*.35),n.y+Math.sin(a)*r*Math.max(5,hh*.8)]);
    }
    let best=null,bestScore=Infinity;
    cands.forEach(([x,y],i)=>{
      const rect={left:x-hw,right:x+hw,top:y-hh,bottom:y+hh};
      const corners=[[rect.left,rect.top],[rect.right,rect.top],[rect.right,rect.bottom],[rect.left,rect.bottom]];
      const inRoom=!n.room||corners.every(([cx,cy])=>insidePolygon(n.room,cx,cy));
      if(n.room&&!insidePolygon(n.room,x,y))return;
      let bad=0;
      if(!inRoom)bad+=4;
      if(dimPolys.some(p=>polygonsOverlap(corners,p,gap)))bad+=3;
      if(segs.some(s=>segmentHitsRect(s,rect,1)))bad+=2;
      if(nameRects.some(o=>rectanglesOverlap(rect,o,gap)))bad+=3;
      if(obstacles.some(o=>rectanglesOverlap(rect,o,gap)))bad+=1;
      if(rect.left<padding||rect.right>width-padding||rect.top<padding||rect.bottom>height-padding)bad+=1;
      const score=bad*1e6+i;
      if(score<bestScore){bestScore=score;best={x,y,rect};}
    });
    if(!best)best={x:n.x,y:n.y,rect:{left:n.x-hw,right:n.x+hw,top:n.y-hh,bottom:n.y+hh}};
    nameRects.push(best.rect);placedNames.push({...n,x:best.x,y:best.y,rect:best.rect});
  }
  return {names:placedNames,dims:placedDims};
}
