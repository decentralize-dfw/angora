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
  station(id) {return this.data.stations.find(s=>s.room_id===id);}
}
