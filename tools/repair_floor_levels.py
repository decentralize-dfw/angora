"""Preserve the photographed entrance/living split level in recovered slab surfaces.

The source finish layer gives the lower living zone at 2.7996 m. Planar filling of
the structural slab can extend the higher slab cap over that zone. Clip that
overlap using the finish footprint; preserved CAD curves remain untouched.
"""
import gzip,json
from pathlib import Path
import numpy as np
from shapely.geometry import Polygon
from shapely.ops import unary_union
import mapbox_earcut
ROOT=Path(__file__).resolve().parents[1];path=ROOT/'build/cad/surfaces.json.gz'
j=json.load(gzip.open(path,'rt'))
finish=next(l for l in j['layers'] if l['source_layer']=='KAT 1$ZEMİN KAPLAMA')
v=np.asarray(finish['vertices']);polys=[]
for f in finish['faces']:
    p=v[f]
    if np.ptp(p[:,2])<.002 and abs(p[:,2].mean()-2.7996)<.002:polys.append(Polygon(p[:,:2]))
lower=unary_union(polys);assert 30<lower.area<50
report=[]
for layer in j['layers']:
    if layer['source_layer'] not in {'KAT 1$ZEMİN','KAT 1$ZEMİN KAPLAMA'}:continue
    v=np.asarray(layer['vertices']);vv=[];ff=[];removed=0;count=0
    for face in layer['faces']:
        p=v[face];z=float(p[:,2].mean())
        if np.ptp(p[:,2])<.002 and z>2.80:
            original=Polygon(p[:,:2]);poly=original.difference(lower)
            if poly.area<original.area-1e-8:
                removed+=original.area-poly.area;count+=1
                parts=[poly] if poly.geom_type=='Polygon' else list(poly.geoms) if hasattr(poly,'geoms') else []
                for part in parts:
                    if part.geom_type!='Polygon' or part.area<1e-8:continue
                    rings=[part.exterior]+list(part.interiors)
                    xy=np.asarray([q for ring in rings for q in list(ring.coords)[:-1]],dtype=np.float64)
                    ends=np.cumsum([len(ring.coords)-1 for ring in rings],dtype=np.uint32)
                    idx=mapbox_earcut.triangulate_float64(xy,ends).reshape(-1,3)
                    base=len(vv);vv.extend([[float(x),float(y),z] for x,y in xy]);ff.extend([[base+int(i) for i in tri] for tri in idx])
                continue
        base=len(vv);vv.extend(p.tolist());ff.append([base+i for i in range(len(p))])
    layer['vertices']=vv;layer['faces']=ff;layer['split_level_repair']='finish_footprint_priority'
    report.append({'layer':layer['source_layer'],'clipped_faces':count,'removed_overlapping_surface_area_m2':removed})
with gzip.open(path,'wt',encoding='utf-8') as f:json.dump(j,f,ensure_ascii=True,separators=(',',':'))
(ROOT/'build/cad/floor-level-report.json').write_text(json.dumps({'lower_finish_z_m':2.7996,'upper_finish_z_m':3.0996,'source_footprint_area_m2':lower.area,'repairs':report},indent=2))
print(json.dumps(report),flush=True)
