import {WebGLRenderer,Scene,PerspectiveCamera,BufferGeometry,BufferAttribute,LineSegments,LineBasicMaterial,SRGBColorSpace,Vector3,NoToneMapping,Mesh,MeshBasicMaterial,DoubleSide} from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

const stage=document.querySelector('#wireframe-stage');
const status=document.querySelector('#wireframe-status');
let renderer,controls,camera,scene,visible=false,frame=0,started=false;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

function render(){
  if(!visible||document.hidden){frame=0;return;}
  controls.update();renderer.render(scene,camera);
  frame=requestAnimationFrame(render);
}
function resume(){if(renderer&&visible&&!document.hidden&&!frame)frame=requestAnimationFrame(render);}
function resize(){
  const {width,height}=stage.getBoundingClientRect();if(!renderer||!width||!height)return;
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setSize(width,height,false);
  camera.aspect=width/height;
  // A fixed villa-centred orbit fits the property at every viewport ratio.
  const vertical=42*Math.PI/180,horizontal=2*Math.atan(Math.tan(vertical/2)*camera.aspect);
  const distance=25/Math.sin(Math.min(vertical,horizontal)/2);
  const direction=camera.position.clone().sub(controls.target).normalize();
  camera.position.copy(controls.target).addScaledVector(direction,distance);
  camera.updateProjectionMatrix();controls.update();resume();
}
async function start(){
  if(started)return;started=true;
  try{
    const [manifest,response,depthResponse]=await Promise.all([
      fetch('./assets/residence/wireframe/manifest.json').then(r=>{if(!r.ok)throw Error('Model unavailable');return r.json();}),
      fetch('./assets/residence/wireframe/near-context.bin.gz'),
      fetch('./assets/residence/wireframe/hidden-edges.bin.gz'),
    ]);
    if(!response.ok||!depthResponse.ok)throw Error('Model unavailable');
    const bytes=await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
    const packed=new Int16Array(bytes);
    const depthBuffer=await new Response(depthResponse.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
    const depthPacked=new Int16Array(depthBuffer,8,manifest.depthVertices*3);
    if(packed.length!==manifest.vertices*3)throw Error('Incomplete model');
    renderer=new WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
    renderer.setClearColor(0x000000,0);renderer.outputColorSpace=SRGBColorSpace;renderer.toneMapping=NoToneMapping;
    renderer.domElement.setAttribute('aria-label','Line-only 3D model of Angora 21 and its neighbouring buildings and planting. Drag to orbit the villa.');
    renderer.domElement.setAttribute('role','img');renderer.domElement.tabIndex=0;
    stage.prepend(renderer.domElement);scene=new Scene();camera=new PerspectiveCamera(42,1,.1,500);
    camera.position.set(47,37,-56);
    controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,0,0);
    controls.enablePan=false;controls.enableZoom=false;controls.enableDamping=true;controls.dampingFactor=.09;
    controls.rotateSpeed=.5;controls.minPolarAngle=.3;controls.maxPolarAngle=Math.PI*.46;
    controls.autoRotate=!reduced;controls.autoRotateSpeed=.22;
    controls.mouseButtons={LEFT:0,MIDDLE:null,RIGHT:null};controls.touches={ONE:0,TWO:null};
    controls.addEventListener('start',()=>{controls.autoRotate=false;});
    const opacity={villa:.8,garden:.4,neighbours:.3,landscape:.23,trees:.28};
    const depthMaterial=new MeshBasicMaterial({colorWrite:false,depthWrite:true,side:DoubleSide,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:4});
    const depthPositions=new Float32Array(depthPacked.length);
    for(let i=0;i<depthPositions.length;i++)depthPositions[i]=depthPacked[i]*manifest.quantum;
    const depthGeometry=new BufferGeometry();depthGeometry.setAttribute('position',new BufferAttribute(depthPositions,3));
    depthGeometry.setIndex(new BufferAttribute(new Uint32Array(depthBuffer,manifest.depthIndexOffset,manifest.depthIndices),1));
    const depthOnly=new Mesh(depthGeometry,depthMaterial);depthOnly.renderOrder=-10;depthOnly.name='Colourless hidden-edge rejection';scene.add(depthOnly);
    for(const group of manifest.groups){
      const positions=new Float32Array(group.count*3);
      for(let i=0;i<positions.length;i++)positions[i]=packed[group.start*3+i]*manifest.quantum;
      const geometry=new BufferGeometry();geometry.setAttribute('position',new BufferAttribute(positions,3));geometry.computeBoundingSphere();
      const material=new LineBasicMaterial({color:0xffffff,transparent:true,opacity:opacity[group.name],depthWrite:false,depthTest:true});
      const lines=new LineSegments(geometry,material);lines.name=group.name;scene.add(lines);
    }
    resize();new ResizeObserver(resize).observe(stage);
    // Wheel stays with the page; keyboard rotation never changes the orbit centre.
    renderer.domElement.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
      event.preventDefault();controls.autoRotate=false;
      const offset=camera.position.clone().sub(controls.target);
      const angle=event.key==='ArrowLeft'?-.09:event.key==='ArrowRight'?.09:0;
      if(angle)offset.applyAxisAngle(new Vector3(0,1,0),angle);
      else{const axis=new Vector3().crossVectors(offset,new Vector3(0,1,0)).normalize();offset.applyAxisAngle(axis,event.key==='ArrowUp'?-.05:.05);}
      camera.position.copy(controls.target).add(offset);controls.update();resume();
    });
    status.textContent='Drag to orbit · Angora 21';stage.dataset.ready='true';resume();
  }catch(error){status.textContent='The model could not load. Explore the full 3D residence →';status.href='./index.html?lang=en&view=building';stage.dataset.loadError='true';console.error('Wireframe model',error);}
}
if(stage){
  const observer=new IntersectionObserver(entries=>{
    visible=entries[0].isIntersecting;if(visible){start();resume();}
  },{rootMargin:'150px'});observer.observe(stage);
  document.addEventListener('visibilitychange',resume);
}
