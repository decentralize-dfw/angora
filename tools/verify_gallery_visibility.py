"""Raycast the real model through the gallery and onto the lower staircase."""
import bpy,json,hashlib
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[1]
items=[]
for o in bpy.data.collections['10_ARCHITECTURE'].all_objects:
    if o.type!='MESH' or o.hide_render:continue
    p=[o.matrix_world@Vector(v) for v in o.bound_box]
    if min(v.x for v in p)>4.2 or max(v.x for v in p)<.2 or min(v.y for v in p)>3.2 or max(v.y for v in p)<-.4:continue
    tree=BVHTree.FromPolygons([o.matrix_world@v.co for v in o.data.vertices],[list(p.vertices) for p in o.data.polygons])
    items.append((o,tree))
checks=[]
for xy,expected,z in [((.4,-.2),'F1 | KAT 1$ZEMİN KAPLAMA',3.1),((1,.4),'F1 | KAT 1$ZEMİN KAPLAMA',3.1),
                      ((2,.4),'F1 | KAT 1$ZEMİN KAPLAMA',3.1),((2,1.2),'F1 | KAT 1$MERDİVEN',5.51)]:
    hits=[]
    for o,tree in items:
        loc,n,ix,d=tree.ray_cast(Vector((*xy,7.9714)),Vector((0,0,-1)),20)
        if loc is not None:hits.append((d,o.name,float(loc.z)))
    hit=min(hits);assert hit[1]==expected,(xy,hit,expected);assert abs(hit[2]-z)<.003,(xy,hit,z)
    checks.append({'xy_m':xy,'visible_surface':hit[1],'z_m':hit[2]})
assert bpy.data.collections.get('Lift F3') is None,'Attic lift regression'
report={'status':'passed','scope':'first-floor gallery and lower stair sightlines; attic lift remains absent','checks':checks,
 'architecture_sha256':hashlib.sha256((ROOT/'build/blender/layers/10-architecture.blend').read_bytes()).hexdigest()}
(ROOT/'build/gallery-visibility-qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('GALLERY_VISIBILITY_QA',json.dumps(report),flush=True)
