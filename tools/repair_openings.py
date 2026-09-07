"""Subtract source glazing silhouettes from reconstructed wall faces.

Planar line graphs can close voids. This restores openings from the CAD glass
layer. It does not add guessed openings or modify the preserved source curves.
"""
import gzip,json,collections
from pathlib import Path
import numpy as np
from shapely.geometry import Polygon
from shapely.ops import unary_union
import mapbox_earcut

ROOT=Path(__file__).resolve().parents[1];path=ROOT/'build/cad/surfaces.json.gz'
data=json.load(gzip.open(path,'rt'))
groups=collections.defaultdict(list)
for layer in data['layers']:
    if not layer['source_layer'].endswith('$CAM'):continue
    v=np.asarray(layer['vertices'])
    for face in layer['faces']:
        p=v[face];normal=np.cross(p[1]-p[0],p[2]-p[0]);a=int(np.argmax(abs(normal)))
        if a==2 or np.linalg.norm(normal)<.005 or abs(normal[a])/np.linalg.norm(normal)<.999:continue
        axes=[i for i in range(3) if i!=a]
        poly=Polygon(p[:,axes]);offset=float(p[:,a].mean())
        if poly.is_valid and poly.area>.005:groups[(a,round(offset/.06))].append(poly)
openings=[]
for (a,k),polys in groups.items():
    aperture=unary_union(polys).buffer(.045,join_style=2)
    openings.append((a,k*.06,aperture))
# The garage rolling door is documented in the photos and plan but has no glass
# silhouette. This explicit opening is a photo/plan interpretation, not a survey.
openings.append((1,-1.398,Polygon([(4.15,3.07),(7.20,3.07),(7.20,5.53),(4.15,5.53)])))
report=[]
for layer in data['layers']:
    if 'DUVAR' not in layer['source_layer']:continue
    v=np.asarray(layer['vertices']);newv=[];newf=[];count=0;removed_area=0
    for face in layer['faces']:
        p=v[face];n=np.cross(p[1]-p[0],p[2]-p[0]);axis=int(np.argmax(abs(n)))
        axes=[i for i in range(3) if i!=axis]
        cut=False
        if axis<2 and np.linalg.norm(n)>1e-8 and abs(n[axis])/np.linalg.norm(n)>.999:
            poly=Polygon(p[:,axes]);original=poly.area;offset=float(p[:,axis].mean())
            for a,d,aperture in openings:
                if a==axis and abs(offset-d)<.48 and poly.intersects(aperture):poly=poly.difference(aperture);cut=True
            if cut:
                count+=1;removed_area+=max(0,original-poly.area)
                polygons=[poly] if poly.geom_type=='Polygon' else list(poly.geoms) if hasattr(poly,'geoms') else []
                for polygon in polygons:
                    if polygon.geom_type!='Polygon' or polygon.area<1e-8:continue
                    rings=[polygon.exterior]+list(polygon.interiors)
                    xy=np.array([q for ring in rings for q in list(ring.coords)[:-1]],dtype=np.float64)
                    ends=np.cumsum([len(ring.coords)-1 for ring in rings],dtype=np.uint32)
                    f=mapbox_earcut.triangulate_float64(xy,ends).reshape(-1,3)
                    xyz=np.zeros((len(xy),3));xyz[:,axis]=offset;xyz[:,axes]=xy
                    base=len(newv);newv.extend(xyz.tolist());newf.extend([[base+int(i) for i in tri] for tri in f])
        if not cut:
            base=len(newv);newv.extend(p.tolist());newf.append([base+i for i in range(len(p))])
    layer['vertices']=newv;layer['faces']=newf;layer['opening_repair']='source_glazing_silhouette'
    report.append({'layer':layer['source_layer'],'cut_triangles':count,'removed_surface_area_m2':removed_area})
with gzip.open(path,'wt',encoding='utf-8') as f:json.dump(data,f,ensure_ascii=True,separators=(',',':'))
(ROOT/'build/cad/opening-report.json').write_text(json.dumps({'glazing_planes':len(openings)-1,'photo_plan_garage_openings':1,'garage_dimension_label_allowed':False,'layers':report},ensure_ascii=False,indent=2))
print('Glazing planes',len(openings),'cut faces',sum(x['cut_triangles'] for x in report),flush=True)
