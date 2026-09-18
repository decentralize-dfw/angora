// The sky and the terrain are each one long gradient across most of the frame
// spanning only a few 8-bit levels, which is exactly the case that bands: a
// measured row of grass crossed 140 px in four flat steps. A level of ordered
// noise breaks the quantisation and the steps stop being visible.
//
// It only ever SUBTRACTS. A symmetric dither at this point in the chain is the
// one thing that could put a channel at 255, and the tone curve ahead of it is
// bounded on purpose - the reference measured exactly that, a single pixel out
// of 1.17 million. Taking a fraction of a level away breaks the banding just as
// well and leaves the curve's bound untouched.
//
// This runs after the output pass, in display space, which is where the
// reference applies it too: dithering before the curve would be reshaped by it.
export const DisplayDitherShader = {
  uniforms: {tDiffuse: {value: null}},
  vertexShader: `varying vec2 vUv;
    void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader: `varying vec2 vUv;uniform sampler2D tDiffuse;
    void main(){
      vec4 c=texture2D(tDiffuse,vUv);
      float d=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);
      gl_FragColor=vec4(c.rgb-d/255.0,c.a);
    }`
};
