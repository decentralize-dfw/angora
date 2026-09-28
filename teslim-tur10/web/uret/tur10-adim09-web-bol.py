import bpy
from pathlib import Path
C=Path(r'C:\Users\yigit\angora-tur10\adim09/web-calisma');D=Path(r'C:\Users\yigit\angora-git\teslim-tur10/web')
bpy.ops.wm.open_mainfile(filepath=str(C/'web-hazir.blend'));scene=bpy.context.scene
for suffix,levels in [('alt',{'bodrum','giris'}),('ust',{'kat1','cati'})]:
 bpy.ops.object.select_all(action='DESELECT')
 for ob in scene.objects:
  if ob.type=='MESH' and ob.get('kaynak_grup') in ('BUILDING','EKLER') and ob.get('kat') in levels:ob.select_set(True)
 name='BUILDING-opt-v6-'+suffix+'.glb'
 bpy.ops.export_scene.gltf(filepath=str(D/name),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_extras=True,export_lights=False,export_cameras=False,export_animations=False,export_image_format='AUTO',export_image_quality=95,export_draco_mesh_compression_enable=False,export_materials='EXPORT',export_tangents=True)
 print('[web] SPLIT',name,(D/name).stat().st_size,flush=True)
