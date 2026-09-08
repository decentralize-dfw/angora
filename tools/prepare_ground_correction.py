"""Clip/fair the existing terrain and triangulate the revised road footprint.

Do not change the registered building pads or villa 21 garden grades. Fair only
the interpolated land between them, then meet the asphalt at its CAD-label
interpolated elevation. This is visualization terrain, not a surveyed surface.
"""
import json,hashlib,math,gzip
from pathlib import Path
import numpy as np
import mapbox_earcut
from shapely.geometry import Polygon,Point,box,shape
from shapely.ops import unary_union
from shapely.prepared import prep
ROOT=Path(__file__).resolve().parents[1]
source_path=ROOT/'build/intermediate/context-ground-source.json'
source=json.loads(source_path.read_text());road_report=json.loads((ROOT/'build/intermediate/road-correction-proposed.json').read_text())
site=json.loads((ROOT/'build/cad/site.json').read_text())
levels=json.loads((ROOT/'build/cad/site-elevations.json').read_text())
samples=[p for p in levels['levels'] if p['kind']=='ROAD']
sample_xy=np.array([p['annotation_xy'] for p in samples]);sample_z=np.array([p['relative_to_garden_m'] for p in samples])
def road_z(points):
    xy=np.asarray(points).reshape(-1,2);d=((xy[:,None,:]-sample_xy[None,:,:])**2).sum(2)
    k=min(5,len(sample_xy));ix=np.argpartition(d,k-1,axis=1)[:,:k]
    dd=np.take_along_axis(d,ix,axis=1);w=1/np.maximum(.3,dd)**1.5
    return (w*sample_z[ix]).sum(1)/w.sum(1)
roads=unary_union([shape(r['geometry']) for r in road_report['roads']]).buffer(0)
fast_roads=prep(roads);road_boundary=roads.boundary
terrain=next(o for o in source if o['name'].startswith('Terrain'))
vertices=np.array(terrain['vertices']);faces=np.array(terrain['faces'],dtype=int);original_z=vertices[:,2].copy()
assert faces.shape[1]==3
footprints=unary_union([Polygon(b['footprint']) for b in site['buildings']])
pins_area=prep(footprints.buffer(1.0))
own_plot=Polygon([(-9.038,-10.058),(10.518,-10.058),(10.518,5.39),(29.04,24.2),(-9.038,24.2)])
pins=np.array([pins_area.covers(Point(p[:2])) or own_plot.covers(Point(p[:2])) for p in vertices])
# Fair only unmeasured interpolation. Fixed building pads and the graded villa
# garden retain their existing Z, so the known neighbor base levels cannot drift.
edges=np.unique(np.sort(np.concatenate([faces[:,[0,1]],faces[:,[1,2]],faces[:,[2,0]]]),axis=1),axis=0)
a=np.r_[edges[:,0],edges[:,1]];b=np.r_[edges[:,1],edges[:,0]]
weight=1/np.maximum(.25,np.linalg.norm(vertices[a,:2]-vertices[b,:2],axis=1))
den=np.bincount(a,weights=weight,minlength=len(vertices))
z=original_z.copy()
for iteration in range(16):
    average=np.bincount(a,weights=weight*z[b],minlength=len(vertices))/np.maximum(den,1e-12)
    z=np.where(pins,original_z,z*.58+average*.42)
vertices[:,2]=z

def parts(g):
    if g.geom_type=='Polygon':return [g]
    return [p for p in getattr(g,'geoms',[]) if p.geom_type=='Polygon']
def triangles(poly):
    rings=[poly.exterior]+list(poly.interiors)
    xy=np.array([q for ring in rings for q in list(ring.coords)[:-1]],dtype=np.float64)
    ends=np.cumsum([len(ring.coords)-1 for ring in rings],dtype=np.uint32)
    ix=mapbox_earcut.triangulate_float64(xy,ends).reshape(-1,3)
    return xy,ix
out_v=[];out_f=[];lookup={}
def add_mesh(xyz,indices):
    ids=[]
    for p in xyz:
        key=tuple(round(float(v),6) for v in p)
        if key not in lookup:lookup[key]=len(out_v);out_v.append(key)
        ids.append(lookup[key])
    out_f.extend([[ids[int(i)] for i in f] for f in indices])
removed=0
for tri in faces:
    p=vertices[tri];poly=Polygon(p[:,:2]);clipped=poly.difference(roads) if fast_roads.intersects(poly) else poly
    removed+=poly.area-clipped.area
    for sub in parts(clipped):
        if sub.area<1e-8:continue
        xy,ix=triangles(sub)
        try:coef=np.linalg.solve(np.c_[p[:,:2],np.ones(3)],p[:,2])
        except np.linalg.LinAlgError:continue
        heights=np.c_[xy,np.ones(len(xy))]@coef
        add_mesh(np.c_[xy,heights],ix)
terrain_vertices=np.array(out_v);terrain_faces=out_f
dist=np.array([road_boundary.distance(Point(p[:2])) for p in terrain_vertices])
protected=np.array([pins_area.covers(Point(p[:2])) or own_plot.covers(Point(p[:2])) for p in terrain_vertices])
near=(dist<4.0)&~protected
bank_weight=np.clip(1-dist[near]/4,0,1)**2
# The cut edge meets the asphalt; banks blend back to the fair terrain in 4 m.
terrain_vertices[near,2]=terrain_vertices[near,2]*(1-bank_weight)+(road_z(terrain_vertices[near,:2])-.025)*bank_weight
assert np.max(np.abs(z[pins]-original_z[pins]))<1e-9

# Tessellate long roads in 2 m cells so grade changes are resolved throughout
# curved segments and junctions, with a single surface (no overlapping asphalt).
out_v=[];out_f=[];lookup={}
lo=roads.bounds[:2];hi=roads.bounds[2:]
for y in np.arange(math.floor(lo[1]),hi[1]+2,2):
    for x in np.arange(math.floor(lo[0]),hi[0]+2,2):
        cell=box(x,y,x+2,y+2)
        if not fast_roads.intersects(cell):continue
        for poly in parts(cell.intersection(roads)):
            if poly.area<1e-8:continue
            xy,ix=triangles(poly);add_mesh(np.c_[xy,road_z(xy)],ix)
road_vertices=out_v;road_faces=out_f
report={**road_report,'source_geometry_sha256':hashlib.sha256(source_path.read_bytes()).hexdigest(),
 'baseline_commit':'259aab5b06dc29f8d9e4c62667c119f9a0604794',
 'terrain_triangles_before':len(faces),'terrain_triangles_after':len(terrain_faces),'road_triangles':len(road_faces),
 'terrain_removed_above_asphalt_m2':removed,'protected_building_and_villa_garden_vertex_z_change_m':0,
 'terrain_fairing_iterations':16,'bank_blend_m':4,'dimension_labels_enabled':False,
 'note':'Road edge XY uses CAD; intermediate grades and widths away from the villa front are interpreted, not survey measurements.'}
payload={'terrain':{'vertices':terrain_vertices.tolist(),'faces':terrain_faces},'roads':{'vertices':road_vertices,'faces':road_faces},'report':report}
(ROOT/'build/intermediate/ground-correction-meshes.json').write_text(json.dumps(payload))
with gzip.open(ROOT/'build/cad/road-ground-r18.json.gz','wt') as stream:json.dump(payload,stream,separators=(',',':'))
(ROOT/'build/cad/road-layout-r18.json').write_text(json.dumps(road_report,indent=2))
(ROOT/'build/road-terrain-correction.json').write_text(json.dumps({k:v for k,v in report.items() if k!='roads'},indent=2))
print('GROUND_CORRECTION_PREPARED',len(terrain_faces),len(road_faces),round(removed,2),flush=True)
