"""Remove horizontal CAD wall-cladding caps across the authored shaft void.

Can run after material baking: affected meshes receive the same physical UV
projection recorded in their materials. Vertical wall skins are preserved.
"""
import bpy,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def clip(poly,axis,value,sign):
    out=[]
    for a,b in zip(poly,poly[1:]+poly[:1]):
        da=(a[axis]-value)*sign;db=(b[axis]-value)*sign
        if da>=-1e-8:out.append(a)
        if (da<0)!=(db<0):out.append(a.lerp(b,da/(da-db)))
    return out
changed=[]
for o in bpy.data.collections['10_ARCHITECTURE'].all_objects:
    if o.type!='MESH' or 'DUVAR' not in o.get('source_layer',''):continue
    vertices=[];faces=[];indices=[];removed=0
    for face in o.data.polygons:
        poly=[o.data.vertices[i].co.copy() for i in face.vertices];pieces=[]
        if abs(face.normal.z)>.99 and -.15<face.center.z<11.92:
            inside=poly
            for axis,value,sign in [(0,-2.70,1),(0,-1.34,-1),(1,.19,1),(1,1.53,-1)]:
                if len(inside)<3:break
                outside=clip(inside,axis,value,-sign)
                if len(outside)>=3:pieces.append(outside)
                inside=clip(inside,axis,value,sign)
            if len(inside)>=3:removed+=1
        else:pieces=[poly]
        for piece in pieces:
            start=len(vertices);vertices.extend(piece);faces.append(tuple(range(start,start+len(piece))));indices.append(face.material_index)
    if not removed:continue
    old=o.data;new=bpy.data.meshes.new(old.name+' | clear lift void');new.from_pydata(vertices,[],faces);new.update()
    for m in old.materials:new.materials.append(m)
    for face,index in zip(new.polygons,indices):face.material_index=index
    uv=new.uv_layers.new(name='UVMap')
    for face in new.polygons:
        m=new.materials[face.material_index];size=m.get('pbr_repeat_m',(1,1));axis=max(range(3),key=lambda i:abs(face.normal[i]));axes=[i for i in range(3) if i!=axis]
        for li in face.loop_indices:
            p=new.vertices[new.loops[li].vertex_index].co;uv.data[li].uv=(p[axes[0]]/size[0],p[axes[1]]/size[1])
    o.data=new;changed.append({'object':o.name,'horizontal_faces_cut':removed})
path=ROOT/'build/lift-report.json';report=json.loads(path.read_text());report['horizontal_cladding_caps_cut']=changed;path.write_text(json.dumps(report,indent=2))
bpy.data.orphans_purge(do_local_ids=True,do_linked_ids=False,do_recursive=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'build/blender/angora21-working.blend'),compress=True)
print('LIFT_CLADDING_CAPS',changed,flush=True)
