import bpy,json
from pathlib import Path
W=Path(r'C:\Users\yigit\angora-tur10');C=W/'adim09/web-calisma';D=Path(r'C:\Users\yigit\angora-git\teslim-tur10/web')
bpy.ops.wm.open_mainfile(filepath=str(C/'web-hazir.blend'));scene=bpy.context.scene
for im in bpy.data.images:
 p=Path(bpy.path.abspath(im.filepath))
 if 'dokular2048' in str(p):im.filepath=str(C/'dokular2048'/p.name);im.reload()
for group,name in [('BUILDING','BUILDING-opt-v6.glb'),('INTERIOR','INTERIOR-opt-v3.glb')]:
 bpy.ops.object.select_all(action='DESELECT')
 for ob in scene.objects:
  if ob.type not in ('MESH','EMPTY'):continue
  role=ob.get('kaynak_grup','')
  if role and (('INTERIOR' if role=='INTERIOR' else 'BUILDING')==group):ob.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(D/name),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_extras=True,export_lights=False,export_cameras=False,export_animations=False,export_image_format='AUTO',export_image_quality=95,export_draco_mesh_compression_enable=False,export_materials='EXPORT',export_tangents=True)
 print('[web] EXPORT',name,(D/name).stat().st_size,flush=True)
bpy.ops.wm.save_as_mainfile(filepath=str(C/'web-hazir.blend'))
p=D/'web-kontrol.json';r=json.loads(p.read_text(encoding='utf-8'));r['doku_donusum']=json.loads((C/'doku-dogrulama.json').read_text(encoding='utf-8'));p.write_text(json.dumps(r,ensure_ascii=False,indent=1),encoding='utf-8')
