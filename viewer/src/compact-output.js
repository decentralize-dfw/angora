import {WebGLRenderTarget,HalfFloatType,ShaderMaterial,Vector2} from 'three';
import {FullScreenQuad} from 'three/addons/postprocessing/Pass.js';

// One HDR output draw, without multisampled scene storage or a second geometry
// pass. Antialias in display-like luminance; tone mapping remains exactly once.
export class CompactOutput{
 constructor(){
  this.target=new WebGLRenderTarget(1,1,{type:HalfFloatType});
  this.material=new ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{source:{value:this.target.texture},texel:{value:new Vector2(1,1)}},
   vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',
   fragmentShader:`varying vec2 vUv;uniform sampler2D source;uniform vec2 texel;
   float edgeLuma(vec3 c){return sqrt(max(0.0,dot(c,vec3(.2126,.7152,.0722))));}
   void main(){
    vec3 m=texture2D(source,vUv).rgb;
    vec3 nw=texture2D(source,vUv+vec2(-1.,-1.)*texel).rgb;
    vec3 ne=texture2D(source,vUv+vec2(1.,-1.)*texel).rgb;
    vec3 sw=texture2D(source,vUv+vec2(-1.,1.)*texel).rgb;
    vec3 se=texture2D(source,vUv+vec2(1.,1.)*texel).rgb;
    float lm=edgeLuma(m),lnw=edgeLuma(nw),lne=edgeLuma(ne),lsw=edgeLuma(sw),lse=edgeLuma(se);
    float lo=min(lm,min(min(lnw,lne),min(lsw,lse))),hi=max(lm,max(max(lnw,lne),max(lsw,lse)));
    vec3 result=m;
    if(hi-lo>max(.0312,hi*.125)){
     vec2 dir=vec2(-((lnw+lne)-(lsw+lse)),(lnw+lsw)-(lne+lse));
     float reduce=max((lnw+lne+lsw+lse)*.03125,.0078125);
     dir=clamp(dir/(min(abs(dir.x),abs(dir.y))+reduce),vec2(-8.),vec2(8.))*texel;
     vec3 a=.5*(texture2D(source,vUv-dir/6.).rgb+texture2D(source,vUv+dir/6.).rgb);
     vec3 b=a*.5+.25*(texture2D(source,vUv-dir*.5).rgb+texture2D(source,vUv+dir*.5).rgb);
     float lb=edgeLuma(b);result=(lb<lo||lb>hi)?a:b;
    }
    gl_FragColor=vec4(result,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`});
  this.quad=new FullScreenQuad(this.material);
 }
 render(renderer,scene,camera){
  const size=renderer.getDrawingBufferSize(new Vector2());
  if(this.target.width!==size.x||this.target.height!==size.y){this.target.setSize(size.x,size.y);this.material.uniforms.texel.value.set(1/size.x,1/size.y);}
  const previous=renderer.getRenderTarget();
  try{renderer.setRenderTarget(this.target);renderer.render(scene,camera);renderer.setRenderTarget(previous);this.quad.render(renderer);}
  finally{renderer.setRenderTarget(previous);}
 }
 dispose(){this.target.dispose();this.material.dispose();this.quad.dispose();}
}

