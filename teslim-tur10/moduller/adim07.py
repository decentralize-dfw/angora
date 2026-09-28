import sys,json,math,bmesh
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
import ortak as o
import bpy
from mathutils import Vector,Matrix
o.basla('A07_')
# Restore tread/riser meshes from approved step05, preserving all later rails and fixtures.
names=[x.name for x in o.C.objects if x.name.startswith('M2_') and any(k in x.name for k in ['_basamak','_riht'])]
with bpy.data.libraries.load(str(o.W/'ekler-adim05.blend'),link=False) as (src,dst):dst.objects=[n for n in names if n in src.objects]
for new in dst.objects:
 old=bpy.data.objects.get(new.name.split('.001')[0])
 # Blender appends numeric suffix for an existing name; match original stored names.
 base=next((n for n in names if new.name==n or new.name.startswith(n+'.')),None)
 if base:
  old=bpy.data.objects.get(base);old.data=new.data.copy();bpy.data.objects.remove(new,do_unlink=True)
for ob in list(o.C.objects):
 if ob.name.startswith('A06_') and '_alt_doseme' in ob.name:bpy.data.objects.remove(ob,do_unlink=True);continue
 if 'esik_kapagi' in ob.name and ob.type=='MESH':
  # Existing local oriented cover is retained; lower its top flush with floor.
  pts=[ob.matrix_world@v.co for v in ob.data.vertices];top=max(p.z for p in pts);floor=min([0,3.0996,6.3714,9.4705],key=lambda z:abs(z-top));ob.location.z-=max(0,top-floor-.001)
 if ob.name.startswith('A04_F29_spot'):
  ob.scale*=.55
  for slot in ob.material_slots:
   if slot.material:
    m=slot.material.copy();slot.material=m
    if m.use_nodes:
     for n in m.node_tree.nodes:
      if n.type=='BSDF_PRINCIPLED':n.inputs['Emission Strength'].default_value=.15
 if ob.name.startswith('M2_') and '_basamak' in ob.name:
  for mod in ob.modifiers:
   if mod.type=='BEVEL':mod.width=.014;mod.segments=5
  # The step05 continuous tread already projects over the riser; round its edge further.
 if ob.name=='A05_kartonpiyer_birlesik':
  bm=bmesh.new();bm.from_mesh(ob.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.012);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(ob.data);bm.free()
pivot=Vector((2.525,-1.775,3.1116));tr=Matrix.Translation(pivot)@Matrix.Rotation(math.radians(-10),4,'Z')@Matrix.Translation(-pivot)
for ob in o.C.objects:
 if ob.name.startswith(('M3G_Kanat','M3G_Floral','M3G_Cam_ara','M3G_Kol','M3G_Mentese')) and not ob.get('adim07_kapi'):ob.matrix_world=tr@ob.matrix_world;ob['adim07_kapi']=True
cam=json.loads((o.W/'kamera-duzeltme.json').read_text(encoding='utf-8'));cam['40']={'dx':.35,'dy':.10,'dz':0,'yaw':-4,'pitch':-1,'hfov':80};(o.W/'kamera-duzeltme.json').write_text(json.dumps(cam,ensure_ascii=False,indent=1),encoding='utf-8')
o.bitir('A07',{'foto':[18,29,34,40,42],'basamak_kaynak':'ekler-adim05.blend','parke':'kilitli; ince düz damar','spot29':'0.55 ölçek, düşük emisyon','esik':'taşan A06 alt döşemeler kaldırıldı, üst kapak zemine sıfır'})
