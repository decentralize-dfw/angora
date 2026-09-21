import {Vector3,Vector4} from 'three';

// Static architectural receivers use Cycles direct+bounce maps. Remaining
// detailed furniture receives inexpensive vertex diffuse fixture lighting;
// directional sun and captured specular remain per pixel. No extra draws.
export function createFixtureVertices(controller){
 const shaders=new Set();
 function update(){
  for(const u of shaders)controller.slots.forEach(({light},i)=>{
   // A loading-frame shader may predate the complete fixture pool.
   // Its uniform capacity is fixed until the new program is compiled.
   if(i>=u.fixturePosition.value.length)return;
   u.fixturePosition.value[i].copy(light.position);
   u.fixtureDirection.value[i].subVectors(light.target.position,light.position).normalize();
   u.fixtureRadiance.value[i].set(light.color.r,light.color.g,light.color.b).multiplyScalar(light.intensity);
   u.fixtureCone.value[i].set(Math.cos(light.angle),Math.cos(light.angle*(1-light.penumbra)),light.distance,light.decay);
  });
 }
 return {update,apply(material){
  if(!material.userData.angoraBatch)return;
  material.userData.vertexFixtures=true;
  if(material.userData.hasElectricBake||material.userData.angoraUniformPlaster)return;
  const previous=material.onBeforeCompile,key=material.customProgramCacheKey();
  material.onBeforeCompile=(shader,renderer)=>{
   previous.call(material,shader,renderer);
   const count=controller.slots.length;
   if(!count)return;
   const vectors=()=>Array.from({length:count},()=>new Vector3());
   const uniforms={fixturePosition:{value:vectors()},fixtureDirection:{value:vectors()},fixtureRadiance:{value:vectors()},fixtureCone:{value:Array.from({length:count},()=>new Vector4())}};
   shaders.add(uniforms);Object.assign(shader.uniforms,uniforms);update();
   shader.vertexShader=`uniform vec3 fixturePosition[${count}],fixtureDirection[${count}],fixtureRadiance[${count}];
uniform vec4 fixtureCone[${count}];varying vec3 fixtureDiffuse;\n`+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
vec3 fixtureWorld=(modelMatrix*vec4(transformed,1.0)).xyz;
vec3 fixtureNormal=normalize(mat3(modelMatrix)*objectNormal);
fixtureDiffuse=vec3(0.);
for(int lamp=0;lamp<${count};lamp++){
 vec3 delta=fixturePosition[lamp]-fixtureWorld;
 float dist2=max(dot(delta,delta),.01);
 vec3 lightDir=delta*inversesqrt(dist2);
 float cone=smoothstep(fixtureCone[lamp].x,fixtureCone[lamp].y,dot(-lightDir,fixtureDirection[lamp]));
 float range=fixtureCone[lamp].z;
 float cutoff=range>0.?pow(clamp(1.-pow(dist2/(range*range),2.),0.,1.),2.):1.;
 fixtureDiffuse+=fixtureRadiance[lamp]*max(dot(fixtureNormal,lightDir),0.)*cone*cutoff/dist2;
}`);
   shader.fragmentShader='varying vec3 fixtureDiffuse;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <aomap_fragment>',`#include <aomap_fragment>
reflectedLight.directDiffuse+=material.diffuseColor*RECIPROCAL_PI*fixtureDiffuse;`);
  };
  material.customProgramCacheKey=()=>key+'|vertex-fixtures-v1|'+controller.slots.length;
 }};
}
