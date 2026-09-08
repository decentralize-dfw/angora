import bpy,bmesh,json
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[1];out=[]
for o in bpy.data.collections['10_ARCHITECTURE'].all_objects:
    if o.type!='MESH' or o.get('floor_index') not in [2,3] or not any(k in o.name for k in ['ZEMİN','TAVAN']):continue
    bm=bmesh.new();bm.from_mesh(o.data);bm.transform(o.matrix_world);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00002)
    edges=[]
    for e in bm.edges:
        p,q=[v.co for v in e.verts]
        if e.is_boundary and min(p.z,q.z)>8.9 and max(p.z,q.z)<9.8 and all(-2.71<a.x<-1.33 and .18<a.y<1.54 for a in [p,q]):edges.append([list(p),list(q)])
    out.append({'name':o.name,'edges':edges});bm.free()
(root/'build/intermediate/lift-floor-cut.json').write_text(json.dumps(out,ensure_ascii=False,indent=2));print('LIFT_FLOOR_CUT',json.dumps(out,ensure_ascii=False),flush=True)
