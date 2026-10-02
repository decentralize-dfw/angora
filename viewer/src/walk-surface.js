// A conservative, precomputed height field from the original floors, stairs,
// wall sections and current furnishings. No frame-time mesh raycasting needed.
export class WalkSurface {
  constructor(data) {
    if (data.coordinate_system !== 'glTF_Y_up' || data.layers?.length !== 4) throw Error('Invalid walking surface');
    this.data = data; this.grid = data.grid;
    const count = data.grid.width * data.grid.height;
    this.layers = data.layers.map(layer => {
      const heights = new Int16Array(count).fill(-32768), masks = new Uint8Array(count).fill(1);
      layer.rows.forEach((runs, row) => runs.forEach(([start, length, height, mask]) => {
        for (let col = start; col < start + length; col++) {
          const index = row * data.grid.width + col; heights[index] = height; masks[index] = mask;
        }
      }));
      return {heights, masks};
    });
  }
  index(x, z) {
    const {x:gx,z:gz,step,width,height} = this.grid;
    const col = Math.floor((x - gx) / step), row = Math.floor((z - gz) / step);
    return col < 0 || row < 0 || col >= width || row >= height ? -1 : row * width + col;
  }
  sample(x, z, foot, furniture = true, maxStep = this.data.maximum_step_m) {
    const index = this.index(x,z); if (index < 0) return null;
    let best = null;
    this.layers.forEach((layer, floor) => {
      if ((layer.masks[index] & (furniture ? 3 : 1)) || layer.heights[index] === -32768) return;
      const height = layer.heights[index] / 1000, difference = Math.abs(height - foot);
      if (difference <= maxStep && (best === null || difference < best.difference)) best = {height, difference, floor};
    });
    return best;
  }
  move(position, dx, dz, furniture = true) {
    const distance = Math.hypot(dx,dz), count = Math.max(1,Math.ceil(distance/(this.grid.step*.4)));
    let moved = false;
    for (let i = 0; i < count; i++) {
      const x = dx/count, z = dz/count, foot = position.y - this.data.eye_height_m;
      const full = this.sample(position.x+x,position.z+z,foot,furniture);
      if (full) {
        position.x += x; position.z += z; position.y = full.height + this.data.eye_height_m; moved = true;
      } else {
        const side = this.sample(position.x+x,position.z,foot,furniture);
        if (side) {position.x += x; position.y = side.height + this.data.eye_height_m; moved ||= Math.abs(x)>0;}
        const forward = this.sample(position.x,position.z+z,position.y-this.data.eye_height_m,furniture);
        if (forward) {position.z += z; position.y = forward.height + this.data.eye_height_m; moved ||= Math.abs(z)>0;}
      }
    }
    return moved;
  }
  center(floor,[x,z],furniture=true){
    const layer=this.layers[floor];if(!layer)return null;
    const {width,height,step}=this.grid;let best=null,distance=Infinity;
    for(let row=0;row<height;row++)for(let col=0;col<width;col++){
      const i=row*width+col;if(layer.heights[i]===-32768||(layer.masks[i]&(furniture?3:1)))continue;
      const px=this.grid.x+(col+.5)*step,pz=this.grid.z+(row+.5)*step,d=(px-x)**2+(pz-z)**2;
      if(d<distance){distance=d;best=[px,layer.heights[i]/1000+this.data.eye_height_m,pz];}
    }
    return best;
  }
  station(id) {return this.data.stations.find(s=>s.room_id===id);}
  openingYaw(position,preferred=0){
    const [x,y,z]=position,foot=y-this.data.eye_height_m;
    const start=this.sample(x,z,foot,false);if(!start)return preferred;
    const step=this.grid.step*.5,reach=6;
    const depth=yaw=>{
      for(let d=step;d<=reach;d+=step){
        const hit=this.sample(x-Math.sin(yaw)*d,z-Math.cos(yaw)*d,foot,false);
        if(!hit||hit.floor!==start.floor)return d-step;
      }
      return reach;
    };
    let best=preferred,score=-Infinity;
    // Prefer a broad clear view, not a single narrow ray through a doorway.
    // Furniture masks are excluded: low chairs do not obstruct eye-level views.
    for(let i=0;i<72;i++){
      const yaw=preferred+i*Math.PI/36;
      const value=depth(yaw)*.5+depth(yaw-.3)*.25+depth(yaw+.3)*.25;
      if(value>score+.001){score=value;best=yaw;}
    }
    return best;
  }
  path(from,to,furniture=true) {
    const count=this.grid.width*this.grid.height,mask=furniture?3:1;
    const start=this.sample(from[0],from[2],from[1]-this.data.eye_height_m,furniture,.3);
    const end=this.sample(to[0],to[2],to[1]-this.data.eye_height_m,furniture,.3);
    if(!start||!end)return null;
    const first=start.floor*count+this.index(from[0],from[2]),last=end.floor*count+this.index(to[0],to[2]);
    const parent=new Int32Array(count*4).fill(-1),queue=new Int32Array(count*4);let head=0,tail=1;
    queue[0]=first;parent[first]=first;
    while(head<tail&&parent[last]===-1) {
      const id=queue[head++],floor=Math.floor(id/count),cell=id%count,x=cell%this.grid.width,z=Math.floor(cell/this.grid.width);
      const height=this.layers[floor].heights[cell];
      for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx=x+dx,nz=z+dz;if(nx<0||nz<0||nx>=this.grid.width||nz>=this.grid.height)continue;
        const ni=nz*this.grid.width+nx;
        for(let f=0;f<4;f++) {
          const key=f*count+ni,layer=this.layers[f];
          if(parent[key]!==-1||layer.masks[ni]&mask||layer.heights[ni]===-32768||Math.abs(layer.heights[ni]-height)>this.data.maximum_step_m*1000)continue;
          parent[key]=id;queue[tail++]=key;
        }
      }
    }
    if(parent[last]===-1)return null;
    const path=[];let cursor=last;
    while(cursor!==first){
      const f=Math.floor(cursor/count),i=cursor%count;
      path.push([this.grid.x+(i%this.grid.width+.5)*this.grid.step,this.layers[f].heights[i]/1000+this.data.eye_height_m,this.grid.z+(Math.floor(i/this.grid.width)+.5)*this.grid.step]);
      cursor=parent[cursor];
    }
    path.reverse();path.push(to);return path;
  }
}

// 27.09 (ürün sahibi): yürüme yüzeyine elle yapılan iki düzeltme, veri
// dosyasına dokunmadan, yüklemede uygulanır.
//
// 1) Binanın iki yanındaki dış merdivenler veride basamak olarak yok: zemin
//    -0,10 / 0,88 / 1,67 / 2,80 m'lik düz teraslar, aralarında ~1 m sıçrama
//    (yürüyüş en çok 0,24 m adım atar). Her iki yana bahçeden giriş kotuna
//    TEK EĞİMLİ düz rampa: dikdörtgenin içinde yükseklik z boyunca doğrusal,
//    diğer katmanlardaki hücreler temizlenir ki ayak rampadan kaymasın.
// 2) Antre -> Garaj kapısı veride ~0,5 m açık (gövde çapı 0,42 m): pratikte
//    geçilmiyordu. Açıklık 0,9 m'ye genişletilir, zemin antre kotunda.
// 28.09 (ürün sahibi: "iki yan taraf da sadece merdiven değil, bahçe de
// kesintisiz tek bir rampa olmalı"): rampa artık yan bahçenin TAMAMI -
// sınır duvarının iç yüzünden evin duvarına kadar, merdiven + kademeli çim
// tek düzlem. Genişlik ve kotlar ürün sahibinin modelinden (GARDEN-opt-v2 +
// BUILDING-opt-v4, 0,25 m ızgarada üst yüzey) ölçüldü:
//   doğu: ev duvarı x 7,45 | merdiven 7,5-8,75 (0,0 -> 3,1) | çim 8,75-10,5
//         (-0,1 -> 2,8 kademeli) | istinat duvarı 10,5; üstte garaj önü 3,1
//   batı: istinat duvarı -9,0 | çim -9,0..-7,25 (-0,1 -> 2,8, ~1 m kademeler)
//         | alçak duvar -7,25..-7,0 | merdiven -7,0..-5,8 (0,2 -> 3,0) | ev -5,75
// Düzlemin eğimi iki yüzeyin ortalamasına oturur (merdivenden en çok ~0,3 m).
// Rampanın dibi: yürüme verisi eski modelden; yan bahçelerin bahçeye
// bağlandığı şeritte eski merdiveni ve yürünemez hücreler taşıyor. Yeni
// modelde orası bahçe kotunda düz (merdiven sahanlığı 0,0-0,2, çim -0,1,
// döşeme 0,0) - dip şeridi o kota düzlenir.
export const WALK_RAMPS = [
  {name: 'west-side', x0: -8.95, x1: -5.85, z0: -5.4, z1: 2.0, h0: -.05, h1: 2.80},
  {name: 'west-side-foot', x0: -8.95, x1: -5.85, z0: -8.0, z1: -5.4, h0: .02, h1: -.05},
  {name: 'east-side', x0: 7.50, x1: 10.45, z0: -5.9, z1: 2.2, h0: 0.0, h1: 3.10},
  {name: 'east-side-foot', x0: 7.50, x1: 10.45, z0: -8.3, z1: -5.9, h0: -.05, h1: 0.0},
];
export const WALK_PASSAGES = [
  {name: 'antre-garaj', floor: 1, x0: 2.6, x1: 4.6, z0: -0.62, z1: 0.30, refX: 2.0, refZ: -0.16},
  // 02.10 (ürün sahibi: "dışarıya çıkamıyorum"): garaj kapısı açık (tavanda toplanmış) ama yürüme verisinde
  // kapı çizgisi (z 0,9..1,4) engel/boş kalmıştı. Açıklık garaj kotunda (3,10) açılır.
  {name: 'garaj-kapisi', floor: 1, x0: 4.50, x1: 7.15, z0: 0.85, z1: 1.50, refX: 5.8, refZ: 0.5},
];
// 3) Havuz: su yüzeyi (GARDEN-opt-v2 water: x -1,91..8,50, z -18,39..-13,53)
//    yürünmez - bütün katmanlarda engel.
// 4) Giriş kapısı önü: sahanlık (3,1 m) ile sokağa çıkan merdiven (3,4 m)
//    arasında veride 2,8 m'lik bir yarık şerit var; iki yönde de adımı aşıyor,
//    kapıdan çıkınca merdivene geçilemiyordu. Şerit sahanlık kotuna dolar.
// 5) Dış mekândaki tek basamaklar veride ~0,3 m'lik kot farkı; adım sınırı
//    0,24 -> 0,34 m (mobilya ayrı işaretli, üstüne çıkılmaz).
export const WALK_BLOCKS = [
  {name: 'pool', x0: -1.95, x1: 8.55, z0: -18.45, z1: -13.45},
];
export const WALK_FILLS = [
  {name: 'entrance-gap', x0: 2.85, x1: 3.85, z0: 4.3, z1: 6.5, near: 2.8, height: 3.2},
  // (27.09'daki 'east-yard-link' dolgusu kalktı: doğu rampası artık garaj
  // önü kotuna (3,10) kadar kesintisiz çıkıyor.)
  // Garaj önünde 2,8 m'lik ince oluk (kapı eşiği): iki yanı 3,1-3,2 m.
  {name: 'garage-threshold', x0: 7.12, x1: 7.42, z0: 1.7, z1: 4.4, near: 2.8, height: 3.15},
];
export const WALK_MAX_STEP_M = .34;
export function patchWalkSurface(surface, {ramps = WALK_RAMPS, passages = WALK_PASSAGES, blocks = WALK_BLOCKS, fills = WALK_FILLS} = {}) {
  const {x: gx, z: gz, step, width, height} = surface.grid;
  const cells = (x0, x1, z0, z1, visit) => {
    for (let row = Math.max(0, Math.floor((z0 - gz) / step)); row <= Math.min(height - 1, Math.floor((z1 - gz) / step)); row++)
      for (let col = Math.max(0, Math.floor((x0 - gx) / step)); col <= Math.min(width - 1, Math.floor((x1 - gx) / step)); col++)
        visit(row * width + col, gz + (row + .5) * step);
  };
  let rampCells = 0, openedCells = 0;
  for (const r of ramps) cells(r.x0, r.x1, r.z0, r.z1, (i, z) => {
    const t = Math.min(1, Math.max(0, (z - r.z0) / (r.z1 - r.z0)));
    surface.layers.forEach((layer, f) => {if (f) {layer.heights[i] = -32768; layer.masks[i] = 1;}});
    surface.layers[0].heights[i] = Math.round((r.h0 + (r.h1 - r.h0) * t) * 1000);
    surface.layers[0].masks[i] = 0; rampCells++;
  });
  for (const p of passages) {
    const layer = surface.layers[p.floor], ref = surface.index(p.refX, p.refZ);
    if (!layer || ref < 0 || layer.heights[ref] === -32768) continue;
    cells(p.x0, p.x1, p.z0, p.z1, i => {layer.heights[i] = layer.heights[ref]; layer.masks[i] &= ~1; openedCells++;});
  }
  let blockedCells = 0, filledCells = 0;
  for (const b of blocks) cells(b.x0, b.x1, b.z0, b.z1, i => {for (const layer of surface.layers) layer.masks[i] |= 1; blockedCells++;});
  for (const f of fills) cells(f.x0, f.x1, f.z0, f.z1, i => {
    if (f.near === null) {
      // boş hücre yaratılır (ya da o kotun yakınındaki hücre düzeltilir)
      const layer = surface.layers.find(l => l.heights[i] !== -32768 && Math.abs(l.heights[i] / 1000 - f.height) < .5)
        ?? surface.layers.find(l => l.heights[i] === -32768) ?? surface.layers[0];
      layer.heights[i] = Math.round(f.height * 1000); layer.masks[i] = 0; filledCells++;
      return;
    }
    for (const layer of surface.layers) {
      if (layer.heights[i] === -32768 || Math.abs(layer.heights[i] / 1000 - f.near) > .25) continue;
      layer.heights[i] = Math.round(f.height * 1000); layer.masks[i] &= ~1; filledCells++;
    }
  });
  surface.data.maximum_step_m = Math.max(surface.data.maximum_step_m, WALK_MAX_STEP_M);
  return {rampCells, openedCells, blockedCells, filledCells};
}
