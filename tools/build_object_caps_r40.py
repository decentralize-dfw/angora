#!/usr/bin/env python3
"""R40 - cap everything the section plane cuts, not just the walls.

The atlas has only ever carried wall cross-sections, so a plan cut at a
storey's viewing height showed hatched walls standing among wardrobes, tall
units, door leaves and cisterns that were sliced open and left hollow - you
looked down into them. This sections every other body in the delivery at the
same 192 heights and writes the filled cross-sections into the same slices.

Method, per slice height:
  * take the triangles that straddle it (tools/export_cap_triangles_r40.mjs
    dumped them in world space, walls, slabs and glazing already excluded),
  * cut each into a segment,
  * node the segments and polygonize - a closed body gives closed loops and
    fills; a curtain, a rug or any other open sheet gives none and drops out,
    which is the behaviour we want and is why no manifold test is needed,
  * union, simplify at SIMPLIFY, and drop anything under MIN_AREA so the file
    does not fill up with chair legs.

Fixed bodies and furniture are kept in separate arrays on each slice - 'q'/'j'
against the atlas's own 'p'/'i' for fixed, 'fq'/'fj' for furniture - because
the viewer's furniture toggle has to be able to take the furniture poché away
with the furniture itself.
"""
import json, sys
from pathlib import Path
import numpy as np
import mapbox_earcut
from shapely.geometry import LineString, MultiLineString, Polygon
from shapely.ops import unary_union, polygonize

ROOT = Path('/home/user/angora')
FULL = ROOT/'build/web/full'
CAPS = ROOT/'build/intermediate/object-caps-r40'
LEVELS = ['level-0', 'level-1', 'level-2', 'level-3']
MIN_AREA = 0.004      # m2 - below this a cap is a chair leg, not a cut body
SIMPLIFY = 0.005      # m
ROUND = 4

atlas = json.loads((FULL/'sections.json').read_text())
heights = np.array([s['height'] for s in atlas['slices']])
for s in atlas['slices']:
    for key in ('q', 'j', 'fq', 'fj'):
        s.pop(key, None)

def section(tris, z):
    """Filled cross-section of a triangle soup at height z, as one geometry."""
    lo = tris[:, :, 1].min(1); hi = tris[:, :, 1].max(1)
    active = tris[(lo < z) & (hi > z)]
    if not len(active): return None
    segments = []
    for tri in active:
        pts = []
        for a, b in zip(tri, np.roll(tri, -1, axis=0)):
            if (a[1] < z) != (b[1] < z):
                f = (z - a[1]) / (b[1] - a[1])
                p = a + (b - a) * f
                pts.append((p[0], p[2]))
        if len(pts) != 2: continue
        if abs(pts[0][0] - pts[1][0]) < 1e-9 and abs(pts[0][1] - pts[1][1]) < 1e-9: continue
        segments.append(LineString(pts))
    if not segments: return None
    noded = unary_union(MultiLineString(segments))
    faces = [p for p in polygonize(noded) if p.area >= MIN_AREA * 0.25]
    if not faces: return None
    merged = unary_union(faces).buffer(0)
    if merged.is_empty: return None
    merged = merged.simplify(SIMPLIFY, preserve_topology=True)
    parts = [merged] if merged.geom_type == 'Polygon' else [g for g in merged.geoms]
    parts = [p for p in parts if p.area >= MIN_AREA]
    return parts or None

def append(slice_, parts, pkey, ikey):
    p = slice_.setdefault(pkey, []); i = slice_.setdefault(ikey, [])
    for poly in parts:
        verts = np.array(poly.exterior.coords[:-1])
        rings = [len(verts)]
        for hole in poly.interiors:
            ring = np.array(hole.coords[:-1]); verts = np.vstack([verts, ring]); rings.append(len(verts))
        if len(verts) < 3: continue
        tri = mapbox_earcut.triangulate_float64(np.asarray(verts, dtype=np.float64),
                                                np.asarray(rings, dtype=np.uint32))
        base = len(p) // 2
        p.extend(round(float(v), ROUND) for xy in verts for v in xy)
        i.extend(int(base + t) for t in tri)

totals = {'fixed': 0, 'furniture': 0}
for level in LEVELS:
    meta = json.loads((CAPS/f'caps-{level}.json').read_text())
    raw = np.fromfile(CAPS/f'caps-{level}.bin', dtype=np.float32).reshape(-1, 3, 3)
    nfixed = meta['fixed_triangles']
    groups = [('fixed', raw[:nfixed], 'q', 'j'), ('furniture', raw[nfixed:], 'fq', 'fj')]
    for name, tris, pkey, ikey in groups:
        if not len(tris): continue
        lo, hi = float(tris[:, :, 1].min()), float(tris[:, :, 1].max())
        band = np.flatnonzero((heights > lo) & (heights < hi))
        for index in band:
            parts = section(tris, float(heights[index]) + 1e-6)
            if not parts: continue
            append(atlas['slices'][int(index)], parts, pkey, ikey)
            totals[name] += len(parts)
        print(f'  {level} {name}: {len(band)} slices, {totals[name]} caps so far', flush=True)

atlas['revision'] = 'R40'
atlas['object_caps'] = {
    'method': ('every non-wall body in the delivery sectioned at the same heights and filled by '
               'polygonising its cut loops; open sheets produce no loop and are dropped'),
    'minimum_cap_area_m2': MIN_AREA, 'simplify_m': SIMPLIFY,
    'arrays': {'fixed': ['q', 'j'], 'furniture': ['fq', 'fj']},
    'excluded': 'walls (already in p/i), floor and ceiling slabs, glazing and mirrors',
}
(FULL/'sections.json').write_text(json.dumps(atlas, separators=(',', ':')))
# The atlas is fingerprinted in the manifest, and the viewer cache-busts on
# that fingerprint. Rewriting the file without the manifest left the two
# disagreeing, which the delivery sync catches and a browser would not.
import hashlib
manifest_path = FULL/'manifest.json'
manifest = json.loads(manifest_path.read_text())
manifest['section_atlas'] = {'file': 'sections.json',
                             'bytes': (FULL/'sections.json').stat().st_size,
                             'sha256': hashlib.sha256((FULL/'sections.json').read_bytes()).hexdigest()}
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
print('fixed caps', totals['fixed'], 'furniture caps', totals['furniture'])
print('sections.json now', (FULL/'sections.json').stat().st_size, 'bytes')
