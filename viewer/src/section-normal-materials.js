import {FEATURES} from './features.js';
// The AO normal/depth pass must use the same per-object clipping as beauty.
// A renderer-global plane also cuts the uncut garden and context, producing
// false occlusion where their depth no longer agrees with the visible image.
export function createSectionNormalMaterials(template){
  const variants=[];
  // This runs for every mesh on every AO frame, so the lookup is memoised per
  // source material; the memo is re-validated against the live plane list, so
  // a material whose clipping set changes still finds its correct variant.
  const memo=new WeakMap(),originals=[];
  // V-RAY B2: normal hedefinin alfa kanalı = malzemenin parlaklığı (0 mat, 1 cilalı).
  // SSR yalnız bu maskenin olduğu yerde yansıtır - mat sıvaya koyu yansıma basmaz.
  // Parlaklık roughness'tan: 0,45 ve üstü 0, 0,12 ve altı 1; dört kademeye yuvarlanır.
  // Zemin malzemelerinin pürüzlülüğü dokudan gelir (faktör 1 okunur); onlar adlarından tanınır.
  const FLOOR_GLOSS=[[/wood_floor|WOOD-FL|parke|parquet/i,FEATURES.parquetGloss?.83:.5],[/tile|seramik|ceramic|porcelain|mosaic|mermer|marble/i,.66],[/terra_floor/i,.33]];
  const glossOf=m=>{
    if(Number.isFinite(m.userData?.ssrGloss))return m.userData.ssrGloss;
    const named=FLOOR_GLOSS.find(([rx])=>rx.test(m.name??''));
    let g=named?named[1]:(m.roughnessMap?0:Math.max(0,Math.min(1,(.45-(m.roughness??1))/(.45-.12))));
    g=Math.round(g*3)/3;if(m.userData)m.userData.ssrGloss=g;return g;};
  const matches=(v,planes,intersection,gloss)=>v.intersection===intersection&&v.gloss===gloss&&v.planes.length===planes.length&&v.planes.every((p,i)=>p===planes[i]);
  function materialFor(source){
    const planes=source.clippingPlanes??[],intersection=Boolean(source.clipIntersection),gloss=glossOf(source);
    const known=memo.get(source);
    if(known&&matches(known,planes,intersection,gloss))return known.material;
    let row=variants.find(v=>matches(v,planes,intersection,gloss));
    if(!row){
      const material=template.clone();material.clippingPlanes=planes.map(p=>p.clone());material.clipIntersection=intersection;
      material.opacity=gloss;material.transparent=false;   // alfa = parlaklık maskesi (karıştırma yok)
      row={planes:[...planes],intersection,gloss,material};variants.push(row);
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
