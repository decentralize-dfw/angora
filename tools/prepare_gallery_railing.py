"""Locate photographed gallery/descending-stair guard on actual CAD supports.

Run read-only on the linked master. The right gallery edge meets the outside
wall, not a walkable floor; do not invent a third floor-supported return there.
"""
import bpy,json,hashlib
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[1]
items=[]
for o in bpy.data.collections['10_ARCHITECTURE'].all_objects:
    if o.type!='MESH' or o.hide_render or not o.name.startswith(('F1','F2')):continue
    items.append((o,BVHTree.FromPolygons([o.matrix_world@v.co for v in o.data.vertices],[list(p.vertices) for p in o.data.polygons])))
points=[(2.8984,-.4277),(.1834,-.4277),(.1834,.9623),(.8984,.9623),(3.0284,.9623)]
nodes=[]
for index,(x,y) in enumerate(points):
    hits=[]
    for o,tree in items:
        loc,normal,_,distance=tree.ray_cast(Vector((x,y,6.8)),Vector((0,0,-1)),4)
        if loc is not None:hits.append((distance,o.name,float(loc.z)))
    _,name,z=min(hits)
    assert 'ZEMİN' in name if index<3 else 'KAT 1$MERDİVEN' in name,(index,name,z)
    nodes.append({'xy':[x,y],'support_z_m':z,'rail_base_z_m':6.3714 if index<3 else z,
                  'support_object':name})
photos=['kat_3_hol/WhatsApp Image 2026-08-26 at 11.52.44 (6).jpeg',
        'kat_3_hol/WhatsApp Image 2026-08-26 at 11.52.44 (11).jpeg',
        'kat_3_hol/WhatsApp Image 2026-08-26 at 11.52.44 (15).jpeg']
report={'revision':20,'nodes':nodes,'height_m':1.0,'height_status':'photo_proportions_inferred',
 'source_architecture_sha256':hashlib.sha256((ROOT/'build/blender/layers/10-architecture.blend').read_bytes()).hexdigest(),
 'source_photos':[{'path':p,'sha256':hashlib.sha256((ROOT/p).read_bytes()).hexdigest()} for p in photos],
 'layout_evidence':'CAD gallery rim and raycast stair treads; two horizontal gallery sides and the adjacent descending flight',
 'motif_evidence':'black flat-bar scrolls, leaf accents, brass-colored fixings, profiled wood handrail',
 'dimension_label_allowed':False,'photo_match_approved':False,
 'remaining':'Other stair flights, gallery pendant, ceiling and hall furnishings require separate review.'}
path=ROOT/'build/cad/gallery-railing-layout.json';path.write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('GALLERY_RAIL_LAYOUT',json.dumps(report,ensure_ascii=False),flush=True)
