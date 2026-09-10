"""Independent 3D nearest-surface probes before/after the web skin repair."""
import json,gzip,bpy,numpy as np,hashlib
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[1]
records=json.load(gzip.open(ROOT/'build/intermediate/skin-audit.json.gz','rt'))
patch=json.load(gzip.open(ROOT/'build/cad/web-surface-patches-r27.json.gz','rt'))['villa']
original=[];fixed=[]
for r in records:
    v=np.array(r['vertices']);changes=patch.get(r['name'],{}).get('triangles',{})
    for ti,idx in enumerate(r['triangles']):
        p=v[idx];original.append(p)
        for weights in changes.get(str(ti),[[[1,0,0],[0,1,0],[0,0,1]]]):fixed.append(np.asarray(weights)@p)
def tree(tris):
    return BVHTree.FromPolygons(np.asarray(tris).reshape(-1,3).tolist(),np.arange(len(tris)*3).reshape(-1,3).tolist(),all_triangles=True)
def precise_distance(point,tris,low,high,radius):
    # Blender's float BVH overestimates distances to very thin cut triangles.
    # Recheck flagged probes against the original double-precision triangles.
    point=np.asarray(point);near=np.all(low<=point+radius,axis=1)&np.all(high>=point-radius,axis=1)
    t=tris[near]
    if not len(t):return radius
    best=np.inf
    for i,j in [(0,1),(1,2),(2,0)]:
        edge=t[:,j]-t[:,i];length=np.einsum('ij,ij->i',edge,edge)
        u=np.clip(np.einsum('ij,ij->i',point-t[:,i],edge)/np.maximum(length,1e-30),0,1)
        best=min(best,float(np.min(np.linalg.norm(t[:,i]+u[:,None]*edge-point,axis=1))))
    a=t[:,1]-t[:,0];b=t[:,2]-t[:,0];normal=np.cross(a,b);length=np.linalg.norm(normal,axis=1)
    valid=length>1e-15;normal[valid]/=length[valid,None]
    offset=np.einsum('ij,ij->i',point-t[:,0],normal);foot=point-offset[:,None]*normal
    inside=valid.copy()
    for i,j in [(0,1),(1,2),(2,0)]:
        inside&=np.einsum('ij,ij->i',np.cross(t[:,j]-t[:,i],foot-t[:,i]),normal)>=-1e-13
    if np.any(inside):best=min(best,float(np.min(abs(offset[inside]))))
    return best

original=np.asarray(original);fixed=np.asarray(fixed)
original_low=original.min(1);original_high=original.max(1);fixed_low=fixed.min(1);fixed_high=fixed.max(1)
after=tree(fixed);before=tree(original);misses=[];maximum=0;raw_maximum=0;tested=0;precise_checks=0
for ti,p in enumerate(original):
    for point in [*p,p.mean(0),(p[0]+p[1])*.5,(p[1]+p[2])*.5,(p[2]+p[0])*.5]:
        hit=after.find_nearest(Vector(point));distance=hit[3] if hit[0] is not None else 1000
        raw_maximum=max(raw_maximum,distance)
        if distance>.0013:
            precise_checks+=1;distance=precise_distance(point,fixed,fixed_low,fixed_high,max(.01,distance+.002))
        maximum=max(maximum,distance);tested+=1
        if distance>.0013 and len(misses)<20:misses.append({'source_triangle':ti,'point':point.tolist(),'distance_m':distance})
reverse=0
for p in fixed:
    point=p.mean(0);hit=before.find_nearest(Vector(point));distance=hit[3] if hit[0] is not None else 1000
    if distance>.0013:
        precise_checks+=1;distance=precise_distance(point,original,original_low,original_high,max(.01,distance+.002))
    reverse=max(reverse,distance)
report={'before_triangles':len(original),'after_triangles':len(fixed),'source_surface_probes':tested,
        'patch_sha256':hashlib.sha256((ROOT/'build/cad/web-surface-patches-r27.json.gz').read_bytes()).hexdigest(),
        'max_source_to_repaired_distance_m':maximum,'raw_BVH_max_source_to_repaired_m':raw_maximum,
        'max_repaired_to_source_distance_m':reverse,'tolerance_m':.0013,'double_precision_rechecks':precise_checks,
        'missing_surface_examples':misses,'passed':maximum<=.0013 and reverse<=.0013,
        'scope':'Architecture/exterior/terrain surface coverage, independent BVH proximity; not browser pixel QA.'}
(ROOT/'build/surface-coverage-r27.json').write_text(json.dumps(report,indent=2));print(json.dumps(report),flush=True)
assert report['passed'],'Surface repair opened or displaced a source surface beyond tolerance'
