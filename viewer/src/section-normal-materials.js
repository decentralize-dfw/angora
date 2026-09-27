// The AO normal/depth pass must use the same per-object clipping as beauty.
// A renderer-global plane also cuts the uncut garden and context, producing
// false occlusion where their depth no longer agrees with the visible image.
export function createSectionNormalMaterials(template){
  const variants=[];
  // This runs for every mesh on every AO frame, so the lookup is memoised per
  // source material; the memo is re-validated against the live plane list, so
  // a material whose clipping set changes still finds its correct variant.
  const memo=new WeakMap(),originals=[];
  const matches=(v,planes,intersection)=>v.intersection===intersection&&v.planes.length===planes.length&&v.planes.every((p,i)=>p===planes[i]);
  function materialFor(source){
    const planes=source.clippingPlanes??[],intersection=Boolean(source.clipIntersection);
    const known=memo.get(source);
    if(known&&matches(known,planes,intersection))return known.material;
    let row=variants.find(v=>matches(v,planes,intersection));
    if(!row){
      const material=template.clone();material.clippingPlanes=planes.map(p=>p.clone());material.clipIntersection=intersection;
      row={planes:[...planes],intersection,material};variants.push(row);
    }
    memo.set(source,row);
    return row.material;
  }
  return {
    render(scene,draw){
      originals.length=0;
      scene.traverse(object=>{
        if(!object.isMesh)return;
        originals.push(object,object.material);
        object.material=Array.isArray(object.material)?object.material.map(materialFor):materialFor(object.material);
      });
      for(const row of variants)row.planes.forEach((plane,i)=>{
        row.material.clippingPlanes[i].copy(plane);
        row.material.clippingPlanes[i].constant+=.004;
      });
      try{return draw();}finally{for(let i=0;i<originals.length;i+=2)originals[i].material=originals[i+1];originals.length=0;}
    },
    dispose(){for(const row of variants)row.material.dispose();variants.length=0;},
  };
}
