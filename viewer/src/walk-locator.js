// R46 | Where the visitor actually IS, not where they last clicked.
//
// The walk surface has no room ids per cell, but it has the one thing a
// containment test really needs: walls are unwalkable. So every walkable
// cell is claimed once, at load, by the station whose wavefront reaches it
// first on foot (multi-source BFS on the furniture-free grid). A zone can
// only spill into the next room through a doorway, which is exactly where
// a person would say the room changes. Stairs and outdoor ground are named
// as themselves rather than inheriting whichever room the flood reached
// them from.
const STAIR_RISE_M = 0.35;      // this far off the storey datum reads as stairs
export const FLOOR_DATUMS = [0, 3.0996, 6.3714, 9.4705];

export function createWalkLocator(surface, footprint) {
  const { grid } = surface, count = grid.width * grid.height;
  const zone = Array.from({ length: 4 }, () => new Int16Array(count).fill(-1));
  const queue = new Int32Array(count * 4);
  let head = 0, tail = 0;
  surface.data.stations.forEach((station, index) => {
    const cell = surface.index(station.position[0], station.position[2]);
    if (cell < 0) return;
    const f = station.floor_index;
    if (zone[f][cell] !== -1) return;
    zone[f][cell] = index; queue[tail++] = f * count + cell;
  });
  while (head < tail) {
    const id = queue[head++], f = Math.floor(id / count), cell = id % count;
    const x = cell % grid.width, z = (cell - x) / grid.width;
    const height = surface.layers[f].heights[cell];
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, nz = z + dz;
      if (nx < 0 || nz < 0 || nx >= grid.width || nz >= grid.height) continue;
      const ni = nz * grid.width + nx;
      for (let nf = 0; nf < 4; nf++) {
        const layer = surface.layers[nf];
        if (zone[nf][ni] !== -1 || (layer.masks[ni] & 1) || layer.heights[ni] === -32768) continue;
        if (Math.abs(layer.heights[ni] - height) > surface.data.maximum_step_m * 1000) continue;
        zone[nf][ni] = zone[f][cell]; queue[tail++] = nf * count + ni;
      }
    }
  }
  return {
    // floor comes from the walk itself (it already tracks the storey the
    // feet are on); this answers WHAT the feet are standing in.
    locate(x, z, floor) {
      const cell = surface.index(x, z);
      if (cell < 0 || floor < 0 || floor > 3) return null;
      const raw = surface.layers[floor].heights[cell];
      if (raw === -32768 || (surface.layers[floor].masks[cell] & 1)) return null;
      const cellHeight = raw / 1000;
      const index = zone[floor][cell];
      const station = index >= 0 ? surface.data.stations[index] : null;
      const outdoor = x < footprint.minX || x > footprint.maxX || z < footprint.minZ || z > footprint.maxZ;
      const stairs = !outdoor && Math.abs(cellHeight - FLOOR_DATUMS[floor]) > STAIR_RISE_M;
      return { floor, station, outdoor, stairs };
    },
  };
}
