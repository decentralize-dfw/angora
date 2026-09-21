import * as THREE from 'three';

export function createPlotMaterialMask(polygon){
 const enabled={value:0},soilHeight={value:1e6},seen=new WeakSet();
 const edges=polygon.map((a,i)=>[a,polygon[(i+1)%polygon.length]]);
 const code=edges.map(([a,b])=>{
   if(a[1]===b[1])return ''; // Horizontal edges never cross the test ray.
   const literal=value=>`(${value.toFixed(6)})`;
   const ax=literal(a[0]),az=literal(-a[1]),bx=literal(b[0]),bz=literal(-b[1]);
   return `if ((${az} > p.y) != (${bz} > p.y)) { if (p.x < (${bx}-${ax})*(p.y-${az})/(${bz}-${az})+${ax}) insidePlot = !insidePlot; }`;
 }).join('\n');
 return {set(active){enabled.value=active?1:0;},setSoilCut(height){soilHeight.value=height;},apply(material,{alwaysOutside=false,cutInsidePlot=false}={}){
  if(seen.has(material))return;seen.add(material);
  const previous=material.onBeforeCompile,key=material.customProgramCacheKey();
  material.onBeforeCompile=(shader,renderer)=>{
   previous.call(material,shader,renderer);shader.uniforms.plotMaskEnabled=enabled;
   if(cutInsidePlot){shader.uniforms.plotSoilHeight=soilHeight;shader.vertexShader='varying float plotWorldY;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nplotWorldY=(modelMatrix*vec4(position,1.0)).y;');shader.fragmentShader='varying float plotWorldY;uniform float plotSoilHeight;\n'+shader.fragmentShader;}
   shader.vertexShader='varying vec2 plotPosition;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nplotPosition=(modelMatrix*vec4(transformed,1.0)).xz;');
   shader.fragmentShader='varying vec2 plotPosition;\nuniform float plotMaskEnabled;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>\nfloat outsidePlot=plotMaskEnabled;\n${alwaysOutside?'':`if(plotMaskEnabled>.5){vec2 p=plotPosition; bool insidePlot=false;\n${code}\noutsidePlot=insidePlot?0.0:plotMaskEnabled;}`}\ndiffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.9,0.9,0.88),outsidePlot);`);
   shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.86,outsidePlot);');
   if(cutInsidePlot)shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nif(plotMaskEnabled>.5&&outsidePlot<.5&&plotWorldY>plotSoilHeight)discard;');
   shader.fragmentShader=shader.fragmentShader.replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nmetalnessFactor=mix(metalnessFactor,0.0,outsidePlot);');
   shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nnormal=normalize(mix(normal,nonPerturbedNormal,outsidePlot));');
  };
  material.customProgramCacheKey=()=>key+'|plot-boundary-v3|'+alwaysOutside+'|'+cutInsidePlot;material.needsUpdate=true;
 }};
}
