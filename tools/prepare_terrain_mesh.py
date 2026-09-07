"""Clip terrain cells against CAD building footprints, pool and the front road."""
import json,gzip
from pathlib import Path
import numpy as np
import mapbox_earcut
from shapely.geometry import Polygon,box
from shapely.ops import unary_union
from shapely.prepared import prep
ROOT=Path(__file__).resolve().parents[1]
site=json.loads((ROOT/'build/cad/site.json').read_text());buildings=site['buildings']
allp=np.array([p for b in buildings for p in b['footprint']]);lo=allp.min(0)-25;hi=allp.max(0)+25
gx=np.unique(np.r_[np.arange(lo[0],hi[0]+5,5),np.arange(-48,53,1.25),-64,13.453])
gy=np.unique(np.r_[np.arange(lo[1],hi[1]+5,5),np.arange(-23,56,1.25),-16.208,-11.058])
holes=unary_union([Polygon(b['footprint']).buffer(.08,join_style=2) for b in buildings]+[
    box(-4.74,13.21,3.74,17.69),box(-64,-16.208,13.453,-11.058)])
fast=prep(holes);vertices=[];faces=[];lookup={}
def vert(p):
    key=tuple(round(float(v),6) for v in p)
    if key not in lookup:lookup[key]=len(vertices);vertices.append(key)
    return lookup[key]
for j in range(len(gy)-1):
    for i in range(len(gx)-1):
        cell=box(gx[i],gy[j],gx[i+1],gy[j+1])
        if fast.intersects(cell):cell=cell.difference(holes)
        polygons=[cell] if cell.geom_type=='Polygon' else list(cell.geoms) if hasattr(cell,'geoms') else []
        for poly in polygons:
            if poly.geom_type!='Polygon' or poly.area<1e-7:continue
            rings=[poly.exterior]+list(poly.interiors)
            p=np.array([q for ring in rings for q in list(ring.coords)[:-1]],dtype=np.float64)
            ends=np.cumsum([len(r.coords)-1 for r in rings],dtype=np.uint32)
            tri=mapbox_earcut.triangulate_float64(p,ends).reshape(-1,3)
            ids=[vert(q) for q in p];faces.extend([[ids[int(a)] for a in f] for f in tri])
out=dict(vertices=vertices,faces=faces,status='CAD_footprint_and_pool_voids',building_footprints=len(buildings),
         note='No terrain triangles inside registered building footprints; local Z is assigned from CAD annotations.')
with gzip.open(ROOT/'build/cad/terrain-mesh.json.gz','wt') as f:json.dump(out,f,separators=(',',':'))
print('TERRAIN_HOLES',len(vertices),len(faces),len(buildings))
