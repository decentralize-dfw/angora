// The AO normal/depth pass must use the same per-object clipping as beauty.
// A renderer-global plane also cuts the uncut garden and context, producing
// false occlusion where their depth no longer agrees with the visible image.
export function createSectionNormalMaterials(template){
  const variants=[];
  function materialFor(source){
    const planes=source.clippingPlanes??[],intersection=Boolean(source.clipIntersection);
    let row=variants.find(v=>v.intersection===intersection&&v.planes.length===planes.length&&v.planes.every((p,i)=>p===planes[i]));
    if(!row){
      const material=template.clone();material.clippingPlanes=planes.map(p=>p.clone());material.clipIntersection=intersection;
      row={planes:[...planes],intersection,material};variants.push(row);
    }
    return row.material;
  }
  return {
    render(scene,draw){
      const originals=[];
      scene.traverse(object=>{
        if(!object.isMesh)return;
        originals.push([object,object.material]);
        object.material=Array.isArray(object.material)?object.material.map(materialFor):materialFor(object.material);
      });
      for(const row of variants)row.planes.forEach((plane,i)=>{
        row.material.clippingPlanes[i].copy(plane);
        row.material.clippingPlanes[i].constant+=.004;
      });
      try{return draw();}finally{for(const [object,material] of originals)object.material=material;}
    },
    dispose(){for(const row of variants)row.material.dispose();variants.length=0;},
  };
}
