(() => {
  'use strict';
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const galleryOffset=(centre,viewport,distance)=>clamp(centre-viewport/2,0,distance);
  function galleryIndex(offset,centres,viewport,distance){
    if(!centres.length)return 0;
    if(distance>0&&offset>=distance-.5)return centres.length-1;
    const centre=offset+viewport/2;
    return centres.reduce((best,value,i)=>Math.abs(value-centre)<Math.abs(centres[best]-centre)?i:best,0);
  }
  function resamplePolygon(input,count=128){
    let points=input.filter((p,i)=>i===0||Math.hypot(p[0]-input[i-1][0],p[1]-input[i-1][1])>.01);
    if(points.length<3)return Array.from({length:count},()=>points[0]||[0,0]);
    const area=points.reduce((s,a,i)=>{const b=points[(i+1)%points.length];return s+a[0]*b[1]-b[0]*a[1];},0);
    if(area<0)points=points.slice().reverse();
    const start=points.reduce((best,p,i)=>p[0]+p[1]<points[best][0]+points[best][1]?i:best,0);
    points=points.slice(start).concat(points.slice(0,start));
    const lengths=points.map((p,i)=>Math.hypot(p[0]-points[(i+1)%points.length][0],p[1]-points[(i+1)%points.length][1]));
    const total=lengths.reduce((a,b)=>a+b,0);let segment=0,base=0;
    return Array.from({length:count},(_,i)=>{const d=total*i/count;while(segment<lengths.length-1&&base+lengths[segment]<d){base+=lengths[segment++];}const a=points[segment],b=points[(segment+1)%points.length],t=(d-base)/(lengths[segment]||1);return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];});
  }
  function roomBounds(pose){
    const points=(pose.rooms||[]).flatMap(r=>r.screen).concat((pose.photos||[]).map(p=>[p.x,p.y]));
    if(!points.length)return null;
    const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
    return {x:Math.min(...xs),y:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)};
  }
  window.AngoraMotionMath={clamp,galleryOffset,galleryIndex,resamplePolygon,roomBounds};
})();
