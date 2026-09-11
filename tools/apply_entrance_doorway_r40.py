#!/usr/bin/env python3
"""R40 - carry the new Giriş-Antre doorway into the atlas and the walk grid.

tools/open_entrance_doorway_r40.mjs cuts the opening in level-1.glb. Three
derived products still describe the wall that used to be there:

  * sections.json - every slice between the floor and the 2.10 m head still
    fills the opening with wall, so the plan would keep drawing a poché across
    a doorway that is no longer there;
  * navigation.json - the floor-1 grid marks those cells as a static obstacle,
    so walk mode would still refuse to pass;
  * room-spaces.json - re-derived afterwards, which is where the head earns its
    keep: the union of slices 0.08-2.56 m above the datum still seals above
    5.20 m, so Giriş stays its own enclosed space rather than merging into the
    hall the moment it gets a door.

The opening rectangle is read back from build/entrance-doorway-r40.json, so the
three stay tied to what was actually cut.
"""
import json, hashlib
from pathlib import Path
import numpy as np
import mapbox_earcut
from shapely.geometry import Polygon, box
from shapely.ops import unary_union

ROOT = Path('/home/user/angora')
FULL = ROOT/'build/web/full'
record = json.loads((ROOT/'build/entrance-doorway-r40.json').read_text())
(x0, x1) = record['opening_m']['x']
(y0, y1) = record['opening_m']['y']
(z0, z1) = record['opening_m']['z']
OPENING = box(x0, z0, x1, z1)

# ---- 1. sections.json ------------------------------------------------------
atlas = json.loads((FULL/'sections.json').read_text())
touched = 0
for slice_ in atlas['slices']:
    h = slice_['height']
    if not (y0 < h < y1) or not slice_['p']: continue
    p = np.array(slice_['p']).reshape(-1, 2)
    i = np.array(slice_['i']).reshape(-1, 3)
    faces = [Polygon(tri) for tri in p[i]]
    faces = [f for f in faces if f.is_valid and f.area > 1e-9]
    merged = unary_union(faces)
    if not merged.intersects(OPENING): continue
    cut = merged.difference(OPENING).buffer(0)
    if cut.is_empty: continue
    parts = [cut] if cut.geom_type == 'Polygon' else [g for g in cut.geoms if g.area > 1e-7]
    P, I = [], []
    for poly in parts:
        verts = np.array(poly.exterior.coords[:-1]); rings = [len(verts)]
        for hole in poly.interiors:
            ring = np.array(hole.coords[:-1]); verts = np.vstack([verts, ring]); rings.append(len(verts))
        if len(verts) < 3: continue
        tri = mapbox_earcut.triangulate_float64(np.asarray(verts, dtype=np.float64),
                                                np.asarray(rings, dtype=np.uint32))
        base = len(P) // 2
        P.extend(round(float(v), 4) for xy in verts for v in xy)
        I.extend(int(base + t) for t in tri)
    slice_['p'], slice_['i'] = P, I
    slice_['area'] = round(cut.area, 6)
    touched += 1
(FULL/'sections.json').write_text(json.dumps(atlas, separators=(',', ':')))
print(f'sections.json: {touched} slices lost the wall across the opening')

# ---- 2. navigation.json ----------------------------------------------------
nav = json.loads((FULL/'navigation.json').read_text())
g = nav['grid']; gx0, gz0, step, nx, nz = g['x'], g['z'], g['step'], g['width'], g['height']
R = nav['body_radius_m']
layer = next(l for l in nav['layers'] if l['floor_index'] == 1)
cells = [[None]*nx for _ in range(nz)]
for r, runs in enumerate(layer['rows']):
    for c0, ln, hmill, flag in runs:
        for c in range(c0, c0 + ln): cells[r][c] = [hmill, flag]
cleared = 0
for r in range(nz):
    for c in range(nx):
        cell = cells[r][c]
        if not cell or not (cell[1] & 1): continue
        cx = gx0 + (c + .5)*step; cz = gz0 + (r + .5)*step
        # the walker has to fit between the jambs, and only needs to reach the
        # wall's two faces plus its own radius to be through it
        if x0 + R <= cx <= x1 - R and z0 - R <= cz <= z1 + R:
            cell[1] &= ~1; cleared += 1
layer['rows'] = []
for rowCells in cells:
    runs, c = [], 0
    while c < nx:
        if not rowCells[c]: c += 1; continue
        start, (h, flag) = c, rowCells[c]; c += 1
        while c < nx and rowCells[c] and rowCells[c][0] == h and rowCells[c][1] == flag: c += 1
        runs.append([start, c - start, h, flag])
    layer['rows'].append(runs)
layer['walkable_furnished_cells'] = sum(1 for row in cells for cell in row if cell and cell[1] == 0)
(FULL/'navigation.json').write_text(json.dumps(nav, ensure_ascii=False, separators=(',', ':')))
print(f'navigation.json: {cleared} floor-1 cells opened; walkable_furnished_cells = '
      f'{layer["walkable_furnished_cells"]}')

# ---- 3. hashes -------------------------------------------------------------
manifest = json.loads((FULL/'manifest.json').read_text())
for key, name in (('section_atlas', 'sections.json'), ('navigation', 'navigation.json')):
    manifest[key]['bytes'] = (FULL/name).stat().st_size
    manifest[key]['sha256'] = hashlib.sha256((FULL/name).read_bytes()).hexdigest()
(FULL/'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
print('manifest updated; run tools/derive_room_polygons.py next')
