import bpy,json
from pathlib import Path
C=Path(r'C:\Users\yigit\angora-tur10\adim10\web-calisma');D=Path(r'C:\Users\yigit\angora-git\teslim-tur10\web')
bpy.ops.wm.open_mainfile(filepath=str(C/'web-hazir.blend'));scene=bpy.context.scene
for mat in bpy.data.materials:
 if not mat.use_nodes:continue
 for node in mat.node_tree.nodes:
  if node.type=='TEX_IMAGE' and node.image and node.image.get('web_target'):
   old=node.image;image=bpy.data.images.load(old['web_target'],check_existing=True);image.colorspace_settings.name=old.colorspace_settings.name;node.image=image
for name,roles,levels in [('BUILDING-opt-v6-alt.glb',{'BUILDING','EKLER'},{'bodrum','giris'}),('BUILDING-opt-v6-ust.glb',{'BUILDING','EKLER'},{'kat1','cati'}),('INTERIOR-opt-v3.glb',{'INTERIOR'},{'bodrum','giris','kat1','cati'})]:
 bpy.ops.object.select_all(action='DESELECT')
 for ob in scene.objects:
  if ob.type=='MESH' and ob.get('kaynak_grup') in roles and ob.get('kat') in levels:ob.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(D/name),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_extras=True,export_lights=False,export_cameras=False,export_animations=False,export_image_format='AUTO',export_image_quality=95,export_draco_mesh_compression_enable=False,export_materials='EXPORT',export_tangents=True)
 print('[web] EXPORT',name,(D/name).stat().st_size,flush=True)
bpy.ops.wm.save_as_mainfile(filepath=str(C/'web-hazir.blend'))
p=D/'web-kontrol.json';report=json.loads(p.read_text(encoding='utf-8'));report['doku_donusum']=json.loads((C/'doku-dogrulama.json').read_text(encoding='utf-8'));report['UV1']='yok; UV denemeleri kullanılmadı';report['kaynak_sahne']=r'C:\Users\yigit\angora-tur10\adim10\sahne.blend';p.write_text(json.dumps(report,ensure_ascii=False,indent=1),encoding='utf-8')
