"""Check the current furniture against the actual closed CAD door/glass leaves.

Run inspect_review_geometry.py first, then this read-only Blender script.
Thin source planes must not be rejected for having a zero-thickness AABB.
This checks their existing pose; it does not certify a future door swing.
"""
import gzip,json,hashlib
from pathlib import Path
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[1]
rows=json.load(gzip.open(ROOT/'build/intermediate/review-geometry.json.gz','rt'))
furniture=[o for o in rows if o['category']=='30_FURNITURE_PLACEHOLDERS']
openings=[o for o in rows if o['props'].get('source_layer') in ['KAPI İÇ$KAPI','PENCERE_KAPI$CAM']]
def tree(o):return BVHTree.FromPolygons(o['vertices'],o['triangles'],all_triangles=True,epsilon=.000001)
trees=[tree(o) for o in openings];items=[];hits=[]
for item in furniture:
    lo,hi=item['bounds'];candidates=[];intersections=[];mesh=None
    for source,bvh in zip(openings,trees):
        a,b=source['bounds']
        if any(hi[i]<a[i]+.003 or lo[i]>b[i]-.003 for i in range(3)):continue
        candidates.append(source['name'])
        if mesh is None:mesh=tree(item)
        pairs=mesh.overlap(bvh)
        if pairs:intersections.append({'opening':source['name'],'triangle_pairs':len(pairs)})
    record={'object':item['name'],'opening_candidates':candidates,'intersections':intersections}
    items.append(record)
    if intersections:hits.append(record)
report={'method':'evaluated_triangle_BVH_against_existing_source_door_and_glass_planes',
        'source_furniture_sha256':hashlib.sha256((ROOT/'build/blender/layers/30-furniture-placeholders.blend').read_bytes()).hexdigest(),
        'parts_checked':len(items),'source_opening_objects':len(openings),'items':items,
        'intersections':hits,'passed':not hits,'limitations':['Existing leaf poses only; future door swings remain to be reviewed.']}
(ROOT/'build/furniture-opening-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('FURNITURE_OPENINGS',len(items),len(openings),len(hits),json.dumps(hits),flush=True)
