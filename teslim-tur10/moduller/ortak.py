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
 bm=bmesh.new();bmesh.ops.create_cube(bm,size=1)
 for v in bm.verts:
  for i in range(3):v.co[i]*=size[i]
 if pah:
  bmesh.ops.bevel(bm,geom=list(bm.edges),offset=min(pah,min(size)/2*.9),segments=3,affect='EDGES')
 bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
 me=bpy.data.meshes.new(name);bm.to_mesh(me);bm.free()
 ob=bpy.data.objects.new(name,me);C.objects.link(ob);ob.location=pos;me.materials.append(mat)
 return ob
def boru(name,pts,r,mat,cyclic=False):
 pts=[Vector(p) for p in pts];vs=[];fs=[];n=8
 for i,p in enumerate(pts):
  t=(pts[min(i+1,len(pts)-1)]-pts[max(0,i-1)]).normalized()
  ref=Vector((0,0,1)) if abs(t.z)<.95 else Vector((1,0,0))
  u=t.cross(ref).normalized();v=t.cross(u).normalized()
  for j in range(n):vs.append(tuple(p+r*(u*math.cos(j*2*math.pi/n)+v*math.sin(j*2*math.pi/n))))
 for i in range(len(pts) if cyclic else len(pts)-1):
  k=(i+1)%len(pts)
  for j in range(n):fs.append((i*n+j,i*n+(j+1)%n,k*n+(j+1)%n,k*n+j))
 if not cyclic:fs.extend([tuple(reversed(range(n))),tuple((len(pts)-1)*n+j for j in range(n))])
 ob=mesh(name,vs,fs,mat)
 for p in ob.data.polygons:p.use_smooth=True
 return ob
def bitir(modul,notlar):
 from foto_doku_uygula import uygula
 uygula(list(C.objects),Path(r'C:\Users\yigit\angora-tur9\dokular.json'))
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
