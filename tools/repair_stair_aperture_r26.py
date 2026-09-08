"""Restore the entrance slab stair aperture. Run on 10-architecture.blend.
The retained CAD stair bounds define the opening; stair geometry is unchanged.
"""
import bpy,json,hashlib
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
RECT=(.8684,.9273,4.1184,3.1273)
obj=bpy.data.objects['F1 | KAT 1$ZEMİN'];assert obj.library is None
before=hashlib.sha256(Path(bpy.data.filepath).read_bytes()).hexdigest()
assert before=='4105de07c4dae4752294724135bbf067afb2c2ce64d31f1fff2d09139fe35776','Unexpected architecture revision'
roots=[c for c in bpy.data.collections if obj.name in c.all_objects]
for c in roots:
 if c.name not in bpy.context.scene.collection.children:bpy.context.scene.collection.children.link(c)
bpy.context.view_layer.update()

def area(poly):
 return abs(sum(a[0].x*b[0].y-b[0].x*a[0].y for a,b in zip(poly,poly[1:]+poly[:1])))/2 if len(poly)>2 else 0

def split(poly,axis,bound,sign):
 inside=[];outside=[]
 for a,b in zip(poly,poly[1:]+poly[:1]):
  da=(a[0][axis]-bound)*sign;db=(b[0][axis]-bound)*sign
  (inside if da>=0 else outside).append(a)
  if (da>=0)!=(db>=0):
   t=da/(da-db);p=(a[0].lerp(b[0],t),a[1].lerp(b[1],t));inside.append(p);outside.append(p)
 return inside,outside

def subtract(poly):
 rest=poly;parts=[]
 for axis,bound,sign in [(0,RECT[0],1),(0,RECT[2],-1),(1,RECT[1],1),(1,RECT[3],-1)]:
  if len(rest)<3:break
  rest,part=split(rest,axis,bound,sign)
  if area(part)>1e-10:parts.append(part)
 return parts

old=obj.data;uv=old.uv_layers.active;vertices=[];faces=[];uvs=[];matids=[];removed=0;changed=0
for face in old.polygons:
 poly=[(obj.matrix_world@old.vertices[old.loops[i].vertex_index].co,uv.data[i].uv.copy() if uv else Vector((0,0))) for i in face.loop_indices]
 parts=[poly]
 if max(p[0].z for p in poly)-min(p[0].z for p in poly)<.0001:
  parts=subtract(poly);delta=area(poly)-sum(area(p) for p in parts)
  if delta>1e-9:removed+=delta;changed+=1
  else:parts=[poly]
 for p in parts:
  first=len(vertices);vertices.extend([tuple(v[0]) for v in p]);uvs.extend([tuple(v[1]) for v in p]);faces.append(tuple(range(first,first+len(p))));matids.append(face.material_index)
corners=[(RECT[0],RECT[1]),(RECT[2],RECT[1]),(RECT[2],RECT[3]),(RECT[0],RECT[3])]
for a,b in zip(corners,corners[1:]+corners[:1]):
 first=len(vertices);vertices.extend([(a[0],a[1],2.7),(b[0],b[1],2.7),(b[0],b[1],3.02),(a[0],a[1],3.02)])
 faces.append(tuple(range(first,first+4)));length=(Vector(b)-Vector(a)).length
 uvs.extend([(0,0),(length,0),(length,.32),(0,.32)]);matids.append(0)
new=bpy.data.meshes.new(old.name+' | source stair opening');new.from_pydata(vertices,[],faces);new.update()
for m in old.materials:new.materials.append(m)
layer=new.uv_layers.new(name='UVMap');layer.data.foreach_set('uv',[v for p in uvs for v in p])
for face,mi in zip(new.polygons,matids):face.material_index=mi
obj.data=new;obj.matrix_world.identity();obj['stair_aperture_reference']='KAT 0$MERDİVEN / KAT 1$MERDİVEN; source stair limits';obj['stair_aperture_xy_m']=list(RECT)
assert 14.2<removed<14.4,(changed,removed)
for c in list(bpy.context.scene.collection.children):
 bpy.context.scene.collection.children.unlink(c);c.use_fake_user=True
bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath,compress=True,relative_remap=False)
report={'revision':26,'source_before_sha256':before,'source_after_sha256':hashlib.sha256(Path(bpy.data.filepath).read_bytes()).hexdigest(),
 'object':obj.name,'aperture_xy_m':RECT,'aperture_area_m2':(RECT[2]-RECT[0])*(RECT[3]-RECT[1]),
 'removed_top_and_bottom_skin_area_m2':removed,'changed_faces':changed,'inner_reveal_depth_m':.32,
 'stairs_changed':False,'basement_slab_changed':False,'attic_elevator_void_reopened':False}
(ROOT/'build/stair-aperture-r26.json').write_text(json.dumps(report,indent=2));print(report,flush=True)
