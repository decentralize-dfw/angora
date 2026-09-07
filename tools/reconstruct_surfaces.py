"""Recover bounded planar faces from the DWG 3D line model, keeping source curves.

The output is a reconstruction, not a claim that the DWG supplied watertight solids.
Curves that do not bound a face are retained and counted for review.
"""
import collections, gzip, json, math, sys
from itertools import combinations
from pathlib import Path
import numpy as np
import shapely
from shapely.geometry import LineString, Polygon
from shapely.ops import polygonize, unary_union
import mapbox_earcut

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'build'/'cad'
SOURCE=json.load(gzip.open(OUT/'source-curves.json.gz','rt'))
SCALE=.01
ORIGIN=np.array([0.,0.,54.37355489974468])
WELD=4

def graph(curves):
    vv=[]; index={}; edges=set()
    for c in curves:
        pp=(np.asarray(c['points'])-ORIGIN)*SCALE
        # ezdxf's path conversion samples straight spline spans too. Remove only
        # collinear interior samples before graphing, retaining every actual bend.
        if len(pp)>2:
            a=pp[1:-1]-pp[:-2]; b=pp[2:]-pp[1:-1]
            na=np.linalg.norm(a,axis=1);nb=np.linalg.norm(b,axis=1)
            cross=np.linalg.norm(np.cross(a,b),axis=1)
            straight=(cross<1e-7*np.maximum(na*nb,1e-12)) & ((a*b).sum(1)>=0)
            pp=pp[np.r_[True,~straight,True]]
        ids=[]
        for p in pp:
            key=tuple(np.round(p,WELD))
            if key not in index: index[key]=len(vv);vv.append(key)
            ids.append(index[key])
        for a,b in zip(ids,ids[1:]):
            if a!=b: edges.add(tuple(sorted((a,b))))
    vertices=np.asarray(vv)
    edges=list(sorted(edges))
    adjacent=collections.defaultdict(list)
    for i,(a,b) in enumerate(edges): adjacent[a].append(i);adjacent[b].append(i)
    return vertices,edges,adjacent

def normal_key(n,p,architectural=False):
    n=n/np.linalg.norm(n)
    for value in n:
        if abs(value)>1e-6:
            if value<0:n=-n
            break
    n=np.round(n,4 if architectural else 5);n/=np.linalg.norm(n)
    return tuple(n)+(round(float(np.dot(n,p)),3 if architectural else 4),)

def basis(n):
    ref=np.eye(3)[int(np.argmin(abs(n)))]
    u=np.cross(n,ref);u/=np.linalg.norm(u)
    return u,np.cross(n,u)

def triangles(poly,u,v,origin):
    rings=[poly.exterior]+list(poly.interiors)
    xy=np.asarray([p for ring in rings for p in list(ring.coords)[:-1]],dtype=np.float64)
    ends=np.cumsum([len(ring.coords)-1 for ring in rings],dtype=np.uint32)
    if len(xy)<3:return [],[]
    indices=mapbox_earcut.triangulate_float64(xy,ends).reshape(-1,3)
    xyz=origin+xy[:,0,None]*u+xy[:,1,None]*v
    return xyz.tolist(),indices.tolist()

def recover(name,curves):
    vertices,edges,adj=graph(curves)
    architectural=name.startswith('KAT ') or name in {'ÇATII','ÇATI ALIN','DORBAK'}
    seeds=collections.defaultdict(set)
    # Railing filigree is intentionally kept as curves rather than filled across gaps.
    if 'KORKULUK' in name.upper():return {'vertices':vertices.tolist(),'edges':edges,'faces':[],'unresolved':list(range(len(edges))),'source_layer':name,'status':'source_curves'}
    for point,near in adj.items():
        p=vertices[point]
        for ei,ej in combinations(near,2):
            a,b=edges[ei]; c,d=edges[ej]
            v1=vertices[b if a==point else a]-p
            v2=vertices[d if c==point else c]-p
            n=np.cross(v1,v2)
            if np.linalg.norm(n)<1e-7:continue
            key=normal_key(n,p,architectural)
            seeds[key].update((ei,ej))
    allv=[]; allf=[]; used=set(); polygon_count=0
    for key,seed in seeds.items():
        n=np.array(key[:3]);n/=np.linalg.norm(n);offset=key[3]
        planar=set(seed);queue=list(seed)
        while queue:
            e=queue.pop()
            for point in edges[e]:
                for nxt in adj[point]:
                    if nxt in planar:continue
                    a,b=edges[nxt]
                    if max(abs(vertices[a]@n-offset),abs(vertices[b]@n-offset))<(.0015 if architectural else .0002):
                        planar.add(nxt);queue.append(nxt)
        if len(planar)<3:continue
        u,v=basis(n); origin=n*offset
        lines=[LineString([(vertices[a]@u,vertices[a]@v),(vertices[b]@u,vertices[b]@v)]) for a,b in (edges[e] for e in planar)]
        polys=list(polygonize(unary_union(lines) if architectural else lines))
        # Polygonize includes the face inside an enclosed ring; remove nested islands
        # when that same ring is a hole of a larger face.
        fill_internal_rings=('ZEMİN' in name or 'TAVAN' in name or name in {'ÇATII','ÇATI ALIN','DORBAK'})
        holes=[] if fill_internal_rings else [Polygon(ring) for poly in polys for ring in poly.interiors]
        for poly in polys:
            if poly.area<1e-7 or any(h.contains(poly.representative_point()) for h in holes):continue
            vv,ff=triangles(poly.simplify(.00002,preserve_topology=True),u,v,origin)
            if not ff:continue
            base=len(allv);allv.extend(vv);allf.extend([[x+base for x in tri] for tri in ff]);polygon_count+=1
        if polys:used.update(planar)
    # Numerically adjacent plane candidates can describe the same triangle.
    # Weld only for duplicate detection; keep original recovered coordinates.
    keys=[tuple(np.round(p,3)) for p in allv];seen=set();unique=[]
    for face in allf:
        key=tuple(sorted(keys[i] for i in face))
        if len(set(key))<3 or key in seen:continue
        seen.add(key);unique.append(face)
    return {'vertices':allv,'faces':unique,'source_layer':name,'source_vertices':vertices.tolist(),
            'source_edges':edges,'unresolved':sorted(set(range(len(edges)))-used),
            'polygons':polygon_count,'status':'reconstructed_from_cad_curves'}

models=[];report=[]
retained={}
if '--frames' in sys.argv:
    previous=json.load(gzip.open(OUT/'surfaces.json.gz','rt'))
    retained={m['source_layer']:m for m in previous['layers']}
for name,curves in SOURCE['layers'].items():
    if name.startswith('2D') or name in {'0','Defpoints'}:continue
    model=retained[name] if retained and not (name.startswith('PENCERE_KAPI') or name.startswith('KAPI İÇ') or name=='ek dalgalar') else recover(name,curves)
    if not model['vertices']:continue
    models.append(model)
    item={'layer':name,'source_curves':len(curves),'triangles':len(model['faces']),'unresolved_edges':len(model['unresolved']),'polygons':model.get('polygons',0)}
    report.append(item); print(json.dumps(item,ensure_ascii=False),flush=True)
result={'units':'meters','source_to_meters':SCALE,'source_origin':ORIGIN.tolist(),
        'floor_z':[0.,3.0996,6.3714,9.4705],
        'surface_plane_tolerance_m':.0015,'detail_plane_tolerance_m':.0002,
        'accuracy_status':'source_reconstruction_not_as_built_survey','layers':models}
with gzip.open(OUT/'surfaces.json.gz','wt',encoding='utf-8') as f:json.dump(result,f,ensure_ascii=False,separators=(',',':'))
(OUT/'surface-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('TOTAL_TRIANGLES',sum(r['triangles'] for r in report),flush=True)
