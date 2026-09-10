import {ShaderMaterial,WebGLRenderTarget,HalfFloatType,LinearFilter,Vector2} from 'three';
import {Pass,FullScreenQuad} from 'three/addons/postprocessing/Pass.js';
import {referenceProfile} from './render-profile.js';

const vertexShader=`varying vec2 vUv;
void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}`;
const makeMaterial=(uniforms,fragmentShader)=>new ShaderMaterial({uniforms,vertexShader,fragmentShader,
  depthTest:false,depthWrite:false,toneMapped:false});
const makeTarget=()=>new WebGLRenderTarget(1,1,{type:HalfFloatType,minFilter:LinearFilter,magFilter:LinearFilter,depthBuffer:false});

// A highlight that overflows the half-float scene buffer arrives here as Inf,
// and the Inf/Inf in the soft-knee weight below turns it into NaN. The blur is
// separable, so one such sample spreads along a row and then down a column and
// reaches the screen as a solid axis-aligned block. Both shaders that sample a
// buffer drop non-finite values first: equal(c,c) is false only for NaN, and
// the clamp holds a single hot sample to a level ordinary highlights never
// reach, so one bad pixel can no longer be smeared across the frame.
export const FINITE_RGB='vec3 finiteRgb(vec3 c,float limit){return min(mix(vec3(0.0),c,vec3(equal(c,c))),vec3(limit));}';

export function softKneeWeight(luminance,threshold,knee) {
  const soft=Math.max(0,Math.min(2*knee,luminance-threshold+knee));
  return Math.max(luminance-threshold,soft*soft/(4*knee+1e-5))/Math.max(luminance,1e-5);
}

// Linear HDR -> soft-knee bright half-size -> quarter-size separable blur ->
// linear addition. The single OutputPass after this owns exposure/ACES/sRGB.
export class LinearBloomPass extends Pass {
  constructor(profile=referenceProfile) {
    super();this.bright=makeTarget();this.blurA=makeTarget();this.blurB=makeTarget();
    this.extract=makeMaterial({source:{value:null},threshold:{value:profile.bloomThreshold},knee:{value:profile.bloomKnee},clampMax:{value:profile.bloomClamp}},`
      varying vec2 vUv;uniform sampler2D source;uniform float threshold,knee,clampMax;
      ${FINITE_RGB}
      void main(){
        vec3 c=finiteRgb(texture2D(source,vUv).rgb,clampMax);
        float l=dot(c,vec3(.2126,.7152,.0722));
        float s=clamp(l-threshold+knee,0.0,2.0*knee);
        float contribution=max(l-threshold,s*s/(4.0*knee+1e-5))/max(l,1e-5);
        gl_FragColor=vec4(c*contribution,1.0);
      }`);
    this.blur=makeMaterial({source:{value:null},direction:{value:new Vector2()}},`
      varying vec2 vUv;uniform sampler2D source;uniform vec2 direction;
      void main(){
        vec3 sum=texture2D(source,vUv).rgb*.227027;
        sum+=(texture2D(source,vUv+direction*1.384615).rgb+texture2D(source,vUv-direction*1.384615).rgb)*.316216;
        sum+=(texture2D(source,vUv+direction*3.230769).rgb+texture2D(source,vUv-direction*3.230769).rgb)*.070270;
        gl_FragColor=vec4(sum,1.0);
      }`);
    this.combine=makeMaterial({source:{value:null},glare:{value:this.blurB.texture},strength:{value:profile.bloomStrength},clampMax:{value:profile.bloomClamp}},`
      varying vec2 vUv;uniform sampler2D source,glare;uniform float strength,clampMax;
      ${FINITE_RGB}
      void main(){
        vec4 c=texture2D(source,vUv);
        gl_FragColor=vec4(finiteRgb(c.rgb,clampMax)+finiteRgb(texture2D(glare,vUv).rgb,clampMax)*strength,c.a);}`);
    this.quad=new FullScreenQuad(null);
  }
  setSize(width,height) {
    this.bright.setSize(Math.max(1,Math.floor(width/2)),Math.max(1,Math.floor(height/2)));
    for(const target of [this.blurA,this.blurB])target.setSize(Math.max(1,Math.floor(width/4)),Math.max(1,Math.floor(height/4)));
  }
  render(renderer,writeBuffer,readBuffer) {
    const previousTarget=renderer.getRenderTarget();
    const draw=(material,target)=>{this.quad.material=material;renderer.setRenderTarget(target);this.quad.render(renderer);};
    try{
      this.extract.uniforms.source.value=readBuffer.texture;draw(this.extract,this.bright);
      let source=this.bright.texture;
      for(const [target,dx,dy] of [[this.blurA,1,0],[this.blurB,0,1],[this.blurA,1.7,0],[this.blurB,0,1.7]]){
        this.blur.uniforms.source.value=source;
        this.blur.uniforms.direction.value.set(dx/target.width,dy/target.height);
        draw(this.blur,target);source=target.texture;
      }
      this.combine.uniforms.source.value=readBuffer.texture;
      draw(this.combine,this.renderToScreen?null:writeBuffer);
    }finally{renderer.setRenderTarget(previousTarget);}
  }
  dispose(){
    for(const resource of [this.bright,this.blurA,this.blurB,this.extract,this.blur,this.combine,this.quad])resource.dispose();
  }
}
