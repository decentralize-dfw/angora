// Web2's architectural edges and hidden-line rejection, with Web3's fixed
// orthographic camera. The depth pass writes no colour: only white lines appear.
export async function mountWireframe(host){
  const canvas=host.querySelector('canvas');
  const gl=canvas.getContext('webgl',{alpha:true,antialias:true,depth:true,stencil:false,premultipliedAlpha:true});
  if(!gl||!globalThis.DecompressionStream)return;
  const base='assets/residence/wireframe/';
  const unpack=async url=>{const r=await fetch(url);if(!r.ok)throw Error('Line model unavailable');return new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();};
  const [manifest,fitManifest,packed,depth]=await Promise.all([
    fetch(base+'manifest.json').then(r=>r.json()),fetch('assets/web3/wire/manifest.json').then(r=>r.json()),
    unpack(base+'near-context.bin.gz'),unpack(base+'hidden-edges.bin.gz')
  ]);
  const lines=new Int16Array(packed);
  const depthPositions=Float32Array.from(new Int16Array(depth,8,manifest.depthVertices*3),v=>v*manifest.quantum);
  const depthIndices=new Uint32Array(depth,manifest.depthIndexOffset,manifest.depthIndices);
  const {radius,height}=fitManifest.fit;
  let yaw=-.8,down=null,visible=true,pending=false,healthy=true,gpu;
  const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));return shader;};
  function setup(){
    const program=gl.createProgram();
    gl.attachShader(program,compile(gl.VERTEX_SHADER,`attribute vec3 position;uniform float yaw,aspect,span,quantum,depthBias;varying vec2 screen;void main(){vec3 p=position*quantum;float x=cos(yaw)*p.x+sin(yaw)*p.z;float z=-sin(yaw)*p.x+cos(yaw)*p.z;float y=.88*p.y-.475*z;float depth=.475*p.y+.88*z;screen=vec2(x/aspect,y)/span;gl_Position=vec4(screen,-depth/250.-depthBias,1.);}`));
    gl.attachShader(program,compile(gl.FRAGMENT_SHADER,`precision mediump float;uniform float opacity;varying vec2 screen;void main(){float fade=1.-smoothstep(.8,1.,max(abs(screen.x),abs(screen.y)));float a=opacity*fade;gl_FragColor=vec4(vec3(a),a);}`));
    gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Line shader unavailable');
    gl.useProgram(program);
    const buffer=data=>{const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);return b;};
    const lineBuffer=buffer(lines),positionBuffer=buffer(depthPositions);
    const indexed=!!gl.getExtension('OES_element_index_uint');let indexBuffer,expandedBuffer;
    if(indexed){indexBuffer=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,depthIndices,gl.STATIC_DRAW);}
    else{const expanded=new Float32Array(depthIndices.length*3);for(let i=0;i<depthIndices.length;i++)expanded.set(depthPositions.subarray(depthIndices[i]*3,depthIndices[i]*3+3),i*3);expandedBuffer=buffer(expanded);}
    gpu={program,lineBuffer,positionBuffer,indexBuffer,expandedBuffer,indexed,position:gl.getAttribLocation(program,'position'),uniforms:Object.fromEntries(['yaw','aspect','span','quantum','opacity','depthBias'].map(k=>[k,gl.getUniformLocation(program,k)]))};
    gl.enableVertexAttribArray(gpu.position);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.lineWidth(1);
  }
  function render(){
    pending=false;if(!visible||!healthy||gl.isContextLost())return;
    const r=host.getBoundingClientRect();if(!r.width||!r.height)return;
    const dpr=Math.min(devicePixelRatio||1,2),w=Math.max(1,Math.round(r.width*dpr)),h=Math.max(1,Math.round(r.height*dpr));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    gl.viewport(0,0,w,h);gl.useProgram(gpu.program);
    gl.colorMask(true,true,true,true);gl.depthMask(true);gl.clearColor(0,0,0,0);gl.clearDepth(1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    const aspect=r.width/r.height,span=Math.max(radius/aspect,height*.88+radius*.475)*1.18,u=gpu.uniforms;
    gl.uniform1f(u.yaw,yaw);gl.uniform1f(u.aspect,aspect);gl.uniform1f(u.span,span);
    // Reject edges behind the exterior, exactly as Web2 does. No surface is visible.
    gl.disable(gl.BLEND);gl.colorMask(false,false,false,false);gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(1,4);gl.uniform1f(u.quantum,1);gl.uniform1f(u.opacity,1);gl.uniform1f(u.depthBias,0);
    gl.bindBuffer(gl.ARRAY_BUFFER,gpu.indexed?gpu.positionBuffer:gpu.expandedBuffer);gl.vertexAttribPointer(gpu.position,3,gl.FLOAT,false,0,0);
    if(gpu.indexed){gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,gpu.indexBuffer);gl.drawElements(gl.TRIANGLES,depthIndices.length,gl.UNSIGNED_INT,0);}
    else gl.drawArrays(gl.TRIANGLES,0,depthIndices.length);
    gl.disable(gl.POLYGON_OFFSET_FILL);gl.colorMask(true,true,true,true);gl.depthMask(false);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    gl.bindBuffer(gl.ARRAY_BUFFER,gpu.lineBuffer);gl.vertexAttribPointer(gpu.position,3,gl.SHORT,false,0,0);gl.uniform1f(u.quantum,manifest.quantum);gl.uniform1f(u.depthBias,manifest.quantum*2/250);
    const opacity={villa:.85,garden:.3,neighbours:.18,landscape:.16,trees:.14};
    for(const group of manifest.groups){gl.uniform1f(u.opacity,opacity[group.name]??.14);gl.drawArrays(gl.LINES,group.start,group.count);}
    host.dataset.yaw=yaw.toFixed(4);host.dataset.segments=lines.length/6;host.dataset.hiddenLines='depth-rejected';host.classList.add('is-ready');
  }
  const schedule=()=>{if(!pending){pending=true;requestAnimationFrame(render);}};
  host.addEventListener('pointerdown',e=>{if(e.isPrimary){down={x:e.clientX,y:e.clientY,yaw};if(e.pointerType==='mouse')host.setPointerCapture(e.pointerId);}});
  host.addEventListener('pointermove',e=>{if(!down||!e.isPrimary)return;if(Math.abs(e.clientX-down.x)>Math.abs(e.clientY-down.y)){yaw=down.yaw+(e.clientX-down.x)*.008;schedule();}});
  addEventListener('pointerup',()=>down=null);host.addEventListener('pointercancel',()=>down=null);
  host.addEventListener('keydown',e=>{if(e.altKey||e.ctrlKey||e.metaKey||!healthy)return;if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();yaw+=e.key==='ArrowLeft'?-.12:.12;schedule();}});
  new ResizeObserver(schedule).observe(host);new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)schedule();}).observe(host);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();healthy=false;host.classList.remove('is-ready');});
  canvas.addEventListener('webglcontextrestored',()=>{try{setup();healthy=true;schedule();}catch{host.classList.remove('is-ready');}});
  host.setAttribute('aria-label','Thin white line model of Angora Twenty One. Drag horizontally or use left and right arrow keys to orbit the house.');
  document.querySelector('.wire-hint span').textContent='Drag to orbit ↔';setup();schedule();
  return {render,yaw:()=>yaw,lineSegments:lines.length/6};
}
