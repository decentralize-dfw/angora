"""Test kitchen fittings against actual CAD door, glass and ceiling surfaces.

Read-only Blender BVH check using the current evaluated geometry inventory.
Existing door poses are tested; this does not claim door-swing certification.
"""
import gzip,json,hashlib
from pathlib import Path
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[1]
rows=json.load(gzip.open(ROOT/'build/intermediate/review-geometry.json.gz','rt'))
fixtures=[o for o in rows if 'Photo kitchen — entrance' in o['collections']]
source=[o for o in rows if o['category']=='10_ARCHITECTURE' and
        (o['props'].get('source_layer') in ['KAPI İÇ$KAPI','PENCERE_KAPI$CAM','ÇATII','ÇATI ALIN']
         or 'TAVAN' in o['props'].get('source_layer',''))]
tree=lambda o:BVHTree.FromPolygons(o['vertices'],o['triangles'],all_triangles=True,epsilon=.000001)
trees=[tree(o) for o in source];items=[];hits=[]
for o in fixtures:
    low,high=o['bounds'];candidates=[];overlaps=[];mesh=None
    for s,t in zip(source,trees):
        a,b=s['bounds']
        if any(high[i]<a[i]-.0001 or low[i]>b[i]+.0001 for i in range(3)):continue
        candidates.append(s['name'])
        if mesh is None:mesh=tree(o)
        pairs=mesh.overlap(t)
        if pairs:overlaps.append({'source_surface':s['name'],'triangle_pairs':len(pairs)})
    row={'object':o['name'],'source_candidates':candidates,'intersections':overlaps};items.append(row)
    if overlaps:hits.append(row)
sha=lambda name:hashlib.sha256((ROOT/'build/blender/layers'/name).read_bytes()).hexdigest()
report={'method':'evaluated_triangle_BVH_against_native_door_glass_ceiling_and_roof_surfaces',
        'source_architecture_sha256':sha('10-architecture.blend'),'source_fittings_sha256':sha('20-fixed-fittings.blend'),
        'parts_checked':len(fixtures),'source_surfaces':len(source),'items':items,'intersections':hits,'passed':not hits,
        'limitations':['Source leaves in their existing pose; future door swings are not certified.']}
(ROOT/'build/kitchen-surfaces-r23-qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('KITCHEN_SURFACES_R23',len(fixtures),len(source),len(hits),json.dumps(hits),flush=True)
assert not hits,'Kitchen fittings intersect source surfaces; see QA report'
