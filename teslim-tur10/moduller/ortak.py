"""Tur 10: arka planda tekrarlanabilir mimari modüllerin ortak işlemleri."""
import bpy, json, math, bmesh
from pathlib import Path
from mathutils import Vector
R=Path(r'C:\Users\yigit\Downloads\angora-main (2)\angora-main')
W=Path(r'C:\Users\yigit\angora-tur10')
C=None
def basla(prefix):
 global C
 bpy.ops.wm.open_mainfile(filepath=str(W/'ekler-calisma.blend'))
 C=bpy.data.collections['EKLER']
 eski=[o for o in C.objects if o.name.startswith('107_')]
 if eski:
  a=bpy.data.collections.get('ARSIV_TUR10_ILK') or bpy.data.collections.new('ARSIV_TUR10_ILK')
  if not a.users:bpy.context.scene.collection.children.link(a)
  for o in eski:C.objects.unlink(o);a.objects.link(o)
  a.hide_render=True;a.hide_viewport=True
 for o in list(C.objects):
  if o.name.startswith(prefix):bpy.data.objects.remove(o,do_unlink=True)
 return C
def malzeme(name,rgb,rough=.5,metal=0):
 m=bpy.data.materials.get(name) or bpy.data.materials.new(name);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF')
 p.inputs['Base Color'].default_value=(*rgb,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
 return m
def mesh(name,vs,fs,mat):
 me=bpy.data.meshes.new(name);me.from_pydata(vs,[],fs);me.update()
 bm=bmesh.new();bm.from_mesh(me);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(me);bm.free()
 o=bpy.data.objects.new(name,me);C.objects.link(o);me.materials.append(mat)
 return o
def kutu(name,pos,size,mat,pah=.005):
 bpy.ops.mesh.primitive_cube_add(size=1,location=pos);ob=bpy.context.object;ob.name=name
 for c in list(ob.users_collection):c.objects.unlink(ob)
 C.objects.link(ob);ob.data.materials.append(mat);ob.dimensions=size
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if pah:
  mod=ob.modifiers.new('Kenar profili','BEVEL');mod.width=pah;mod.segments=3
  bpy.ops.object.modifier_apply(modifier=mod.name)
 ob.select_set(False);return ob
def boru(name,pts,r,mat,cyclic=False):
 cu=bpy.data.curves.new(name,'CURVE');cu.dimensions='3D';cu.bevel_depth=r;cu.bevel_resolution=2
 sp=cu.splines.new('POLY');sp.points.add(len(pts)-1)
 for p,co in zip(sp.points,pts):p.co=(*co,1)
 sp.use_cyclic_u=cyclic;ob=bpy.data.objects.new(name,cu);C.objects.link(ob);cu.materials.append(mat)
 bpy.ops.object.select_all(action='DESELECT');bpy.context.view_layer.objects.active=ob;ob.select_set(True)
 bpy.ops.object.convert(target='MESH');ob.select_set(False)
 for p in ob.data.polygons:p.use_smooth=True
 return ob
def bitir(modul,notlar):
 bpy.ops.object.select_all(action='DESELECT')
 counts={}
 for o in C.objects:
  if o.type=='MESH':
   o.data.calc_loop_triangles();counts[o.name]=len(o.data.loop_triangles);o.select_set(True)
 assert max(counts.values(),default=0)<=30000, 'Nesne üçgen sınırı'
 assert sum(counts.values())<=800000,'Toplam üçgen sınırı'
 bpy.ops.export_scene.gltf(filepath=str(R/'build/web/26092026/EKLER.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_draco_mesh_compression_enable=False)
 bpy.ops.wm.save_as_mainfile(filepath=str(W/'ekler-calisma.blend'))
 (W/'modul-raporlari').mkdir(exist_ok=True)
 (W/'modul-raporlari'/f'{modul}.json').write_text(json.dumps({'modul':modul,'nesneler':len(counts),'ucgen':sum(counts.values()),'en_buyuk':max(counts.values(),default=0),'notlar':notlar},ensure_ascii=False,indent=1),encoding='utf-8')
 print('[tur10]',modul,'nesne',len(counts),'ucgen',sum(counts.values()),notlar)
