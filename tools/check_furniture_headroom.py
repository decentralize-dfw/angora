"""Check actual evaluated furniture surfaces against CAD ceilings and roof skins."""
import bpy,json,hashlib
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[1];deps=bpy.context.evaluated_depsgraph_get()
def surface(o):
    ev=o.evaluated_get(deps);me=ev.to_mesh();me.calc_loop_triangles()
    vertices=[o.matrix_world@v.co for v in me.vertices];polygons=[tuple(t.vertices) for t in me.loop_triangles]
    if not polygons:ev.to_mesh_clear();return None
    bounds=[[min(p[i] for p in vertices) for i in range(3)],[max(p[i] for p in vertices) for i in range(3)]]
    bvh=BVHTree.FromPolygons(vertices,polygons,all_triangles=True,epsilon=.000001);ev.to_mesh_clear()
    return bounds,bvh
ceilings=[]
for o in bpy.data.collections['10_ARCHITECTURE'].all_objects:
    layer=o.get('source_layer','')
    if o.type not in ['MESH','CURVE'] or not ('TAVAN' in layer or layer in ['ÇATII','ÇATI ALIN']):continue
    data=surface(o)
    if data:ceilings.append((o,*data))
items=[];hits=[]
for o in sorted(bpy.data.collections['30_FURNITURE_PLACEHOLDERS'].all_objects,key=lambda o:o.name):
    if o.type not in ['MESH','CURVE']:continue
    data=surface(o)
    if not data:continue
    bounds,bvh=data;tested=[];collisions=[]
    for roof,rb,tree in ceilings:
        overlap=[min(bounds[1][i],rb[1][i])-max(bounds[0][i],rb[0][i]) for i in range(3)]
        if min(overlap)<.004:continue
        tested.append(roof.name);pairs=bvh.overlap(tree)
        if pairs:collisions.append({'surface':roof.name,'intersecting_triangle_pairs':len(pairs)})
    record={'object':o.name,'ceiling_candidates':tested,'intersections':collisions};items.append(record)
    if collisions:hits.append(record)
report={'method':'world-space_evaluated_triangle_BVH_against_source_ceiling_and_roof_surfaces',
        'source_furniture_sha256':hashlib.sha256((ROOT/'build/blender/layers/30-furniture-placeholders.blend').read_bytes()).hexdigest(),
        'parts_checked':len(items),'source_ceiling_roof_objects':len(ceilings),'items':items,'intersections':hits,'passed':not hits}
(ROOT/'build/furniture-headroom-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('FURNITURE_HEADROOM',len(items),len(hits),flush=True)
