import {ShaderMaterial,WebGLRenderTarget,HalfFloatType,LinearFilter,Vector2} from 'three';
import {Pass,FullScreenQuad} from 'three/addons/postprocessing/Pass.js';
import {referenceProfile} from './render-profile.js';

const vertexShader=`varying vec2 vUv;
void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}`;
const makeMaterial=(uniforms,fragmentShader)=>new ShaderMaterial({uniforms,vertexShader,fragmentShader,
  depthTest:false,depthWrite:false,toneMapped:false});
const makeTarget=()=>new WebGLRenderTarget(1,1,{type:HalfFloatType,minFilter:LinearFilter,magFilter:LinearFilter,depthBuffer:false});

export function softKneeWeight(luminance,threshold,knee) {
  const soft=Math.max(0,Math.min(2*knee,luminance-threshold+knee));
  return Math.max(luminance-threshold,soft*soft/(4*knee+1e-5))/Math.max(luminance,1e-5);
}

// Linear HDR -> soft-knee bright half-size -> quarter-size separable blur ->
// linear addition. The single OutputPass after this owns exposure/ACES/sRGB.
export class LinearBloomPass extends Pass {
  constructor(profile=referenceProfile) {
    super();this.bright=makeTarget();this.blurA=makeTarget();this.blurB=makeTarget();
    this.extract=makeMaterial({source:{value:null},threshold:{value:profile.bloomThreshold},knee:{value:profile.bloomKnee}},`
      varying vec2 vUv;uniform sampler2D source;uniform float threshold,knee;
      void main(){
        vec3 c=texture2D(source,vUv).rgb;
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
    this.combine=makeMaterial({source:{value:null},glare:{value:this.blurB.texture},strength:{value:profile.bloomStrength}},`
      varying vec2 vUv;uniform sampler2D source,glare;uniform float strength;
      void main(){vec4 c=texture2D(source,vUv);gl_FragColor=vec4(c.rgb+texture2D(glare,vUv).rgb*strength,c.a);}`);
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
