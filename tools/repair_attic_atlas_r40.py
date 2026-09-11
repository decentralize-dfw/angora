"""Repair the attic dormer's blind channel in sections.json from GLB truth.

For every attic band slice (9.60..11.60), section the exported window
triangles with the same rules tools/build_section_atlas.py applies (opposite
parallel faces 0.034..0.502 m apart make solid; closed thin cells kept), then
add only the area the slice does not already carry inside the window.
"""
import json
import numpy as np
import mapbox_earcut
from shapely.geometry import LineString, Polygon
from shapely.ops import unary_union, snap

TRIS = np.array(json.load(open('attic-window-tris.json')))  # (n,3,3) x,y,z
MIN = TRIS[:, :, 1].min(1); MAX = TRIS[:, :, 1].max(1)
WIN = Polygon([(4.05, -2.7), (4.45, -2.7), (4.45, -1.25), (4.05, -1.25)])

def section(height):
    z = height + .000001
    active = TRIS[(MIN < z) & (MAX > z)]
    segments = []; edges = []
    for tri in active:
        pts = []
        for a, b in zip(tri, np.roll(tri, -1, axis=0)):
            if (a[1] < z) != (b[1] < z):
                f = (z - a[1]) / (b[1] - a[1])
                p = a + (b - a) * f
                pts.append(np.array([p[0], p[2]]))
        if len(pts) != 2: continue
        a, b = pts; length = np.linalg.norm(b - a)
        if length < .000001: continue
        segments.append(LineString([a, b]))
        if length > .004: edges.append((a, b, (b - a) / length, length))
    if not segments: return None
    network = snap(unary_union(segments), unary_union(segments), .004)
    stroke = network.buffer(.004, quad_segs=1, join_style=2)
    polys = [stroke] if stroke.geom_type == 'Polygon' else list(getattr(stroke, 'geoms', []))
    candidates = []
    for poly in polys:
        for ring in poly.interiors:
            hole = Polygon(ring)
            if hole.buffer(-.31).is_empty: candidates.append(hole)
    a = np.array([e[0] for e in edges]); b = np.array([e[1] for e in edges])
    u = np.array([e[2] for e in edges]); lengths = np.array([e[3] for e in edges])
    if len(edges):
        parallel = np.abs(u @ u.T) > .999
        delta = a[None, :, :] - a[:, None, :]
        nd = np.abs(delta[:, :, 0] * u[:, None, 1] - delta[:, :, 1] * u[:, None, 0])
        ids = np.argwhere(np.triu(parallel & (nd > .034) & (nd < .502), 1))
        for i, j in ids:
            t0, t1 = np.dot(a[j] - a[i], u[i]), np.dot(b[j] - a[i], u[i])
            lo = max(0, min(t0, t1)); hi = min(lengths[i], max(t0, t1))
            if hi - lo < .004: continue
            denom = np.dot(b[j] - a[j], u[i])
            if abs(denom) < 1e-8: continue
            aa = a[i] + u[i] * lo; bb = a[i] + u[i] * hi
            cc = a[j] + (b[j] - a[j]) * ((hi - t0) / denom); dd = a[j] + (b[j] - a[j]) * ((lo - t0) / denom)
            ds = [np.linalg.norm(aa - dd), np.linalg.norm(bb - cc)]
            if min(ds) < .035 or max(ds) > .501: continue
            poly = Polygon([aa, bb, cc, dd])
            if poly.is_valid and poly.area > 1e-6: candidates.append(poly)
    if not candidates: return None
    return unary_union(candidates).buffer(0).intersection(WIN).simplify(.0005, preserve_topology=True)

atlas = json.load(open('/home/user/angora/build/web/full/sections.json'))
added_total = 0
for sl in atlas['slices']:
    h = sl['height']
    if h < 9.55 or h > 11.65: continue
    truth = section(h)
    if truth is None or truth.is_empty: continue
    # what the slice already has inside the window
    p = np.array(sl['p']).reshape(-1, 2)
    have = []
    if len(p):
        i = np.array(sl['i']).reshape(-1, 3)
        for tri in p[i]:
            poly = Polygon(tri)
            if poly.is_valid and poly.area > 1e-9 and poly.intersects(WIN): have.append(poly)
    missing = truth.difference(unary_union(have).buffer(.002)) if have else truth
    missing = missing.buffer(0)
    if missing.is_empty or missing.area < .003: continue
    polys = [missing] if missing.geom_type == 'Polygon' else [g for g in missing.geoms if g.area > .002]
    for poly in polys:
        verts = np.array(poly.exterior.coords[:-1])
        rings = [len(verts)]
        for interior in poly.interiors:
            ring = np.array(interior.coords[:-1]); verts = np.vstack([verts, ring]); rings.append(len(verts))
        tri_idx = mapbox_earcut.triangulate_float64(np.asarray(verts,dtype=np.float64), np.asarray(rings,dtype=np.uint32))
        base = len(sl['p']) // 2
        sl['p'].extend(round(v, 4) for xy in verts for v in xy)
        sl['i'].extend(int(base + t) for t in tri_idx)
        sl['area'] = round(sl['area'] + poly.area, 6)
        added_total += poly.area
        print(f'h={h:6.2f} added {poly.area:.4f} m2')
json.dump(atlas, open('/home/user/angora/build/web/full/sections.json', 'w'), separators=(',', ':'))
print('total added', round(added_total, 4), 'm2')
