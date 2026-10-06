// Runtime contains only a line vertex buffer. No meshes, depth surfaces, or textures.
export async function mountWireframe(host){
  const canvas=host.querySelector('canvas'),gl=canvas.getContext('webgl',{alpha:true,antialias:true,depth:false,stencil:false,premultipliedAlpha:true});
  if(!gl||!globalThis.DecompressionStream)return;
  const manifest=await fetch('assets/residence/wireframe/manifest.json').then(r=>r.json());
  const response=await fetch('assets/residence/wireframe/near-context.bin.gz');if(!response.ok)throw Error('Line model unavailable');
  const buffer=await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();const lines=new Int16Array(buffer);
  const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));return shader;};
  const program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,`attribute vec3 position;uniform float yaw;uniform float aspect;uniform float span;uniform float quantum;varying vec2 screen;void main(){vec3 p=position*quantum;float x=cos(yaw)*p.x+sin(yaw)*p.z;float z=-sin(yaw)*p.x+cos(yaw)*p.z;float y=.88*p.y-.475*z;screen=vec2(x/aspect,y)/span;gl_Position=vec4(screen,0.,1.);}`));
  gl.attachShader(program,compile(gl.FRAGMENT_SHADER,`precision mediump float;uniform float opacity;varying vec2 screen;void main(){float edge=max(abs(screen.x),abs(screen.y));float fade=1.-smoothstep(.8,1.,edge);gl_FragColor=vec4(1.,1.,1.,opacity*fade);}`));
  gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Line shader unavailable');gl.useProgram(program);
  const vertex=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vertex);gl.bufferData(gl.ARRAY_BUFFER,lines,gl.STATIC_DRAW);const attr=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(attr);gl.vertexAttribPointer(attr,3,gl.SHORT,false,0,0);
  gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.disable(gl.DEPTH_TEST);
  let yaw=-.8,down=null,visible=true,pending=false,contextHealthy=true;const villa=manifest.groups.find(g=>g.name==='villa');let radius=0,height=0;
  for(let i=villa.start*3;i<(villa.start+villa.count)*3;i+=3){radius=Math.max(radius,Math.hypot(lines[i],lines[i+2])*manifest.quantum);height=Math.max(height,Math.abs(lines[i+1])*manifest.quantum);}
  const locations=Object.fromEntries(['yaw','aspect','span','quantum','opacity'].map(k=>[k,gl.getUniformLocation(program,k)]));
  function render(){pending=false;if(!visible||!contextHealthy||gl.isContextLost())return;host.dataset.yaw=yaw.toFixed(4);host.dataset.segments=lines.length/6;const r=host.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.max(1,Math.round(r.width*dpr));canvas.height=Math.max(1,Math.round(r.height*dpr));gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
    const aspect=r.width/r.height,span=Math.max(radius/aspect,height*.88+radius*.475)*1.18;gl.uniform1f(locations.yaw,yaw);gl.uniform1f(locations.aspect,aspect);gl.uniform1f(locations.span,span);gl.uniform1f(locations.quantum,manifest.quantum);
    const opacity={villa:.48,garden:.24,neighbours:.09,landscape:.12,trees:.2};for(const group of manifest.groups){gl.uniform1f(locations.opacity,opacity[group.name]||.1);gl.drawArrays(gl.LINES,group.start,group.count);}host.classList.add('is-ready');}
  const schedule=()=>{if(!pending){pending=true;requestAnimationFrame(render);}};
  host.addEventListener('pointerdown',e=>{if(e.isPrimary){down={x:e.clientX,y:e.clientY,yaw};if(e.pointerType==='mouse')host.setPointerCapture(e.pointerId);}});
  host.addEventListener('pointermove',e=>{if(!down||!e.isPrimary)return;if(Math.abs(e.clientX-down.x)>Math.abs(e.clientY-down.y)){yaw=down.yaw+(e.clientX-down.x)*.008;schedule();}});
  addEventListener('pointerup',()=>down=null);host.addEventListener('pointercancel',()=>down=null);
  host.addEventListener('keydown',e=>{if(e.altKey||e.ctrlKey||e.metaKey||!contextHealthy)return;if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();yaw+=e.key==='ArrowLeft'?-.12:.12;schedule();}});
  new ResizeObserver(schedule).observe(host);new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)schedule();}).observe(host);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextHealthy=false;host.classList.remove('is-ready');host.setAttribute('aria-label','Static architectural line preview of Angora Twenty One');document.querySelector('.wire-hint span').textContent='Architectural outline';});canvas.addEventListener('webglcontextrestored',()=>host.classList.remove('is-ready'));
  host.setAttribute('aria-label','Thin white line model of Angora Twenty One. Drag horizontally or use left and right arrow keys to orbit the house.');document.querySelector('.wire-hint span').textContent='Drag to orbit ↔';schedule();return {render,yaw:()=>yaw,lineSegments:lines.length/6};
}
