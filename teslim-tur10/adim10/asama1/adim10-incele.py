import bpy,json
from pathlib import Path
R=Path(r'C:\Users\yigit\Downloads\angora-main (2)\angora-main');W=Path(r'C:\Users\yigit\angora-tur10');A=W/'adim10';A.mkdir(exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
for name in ['BUILDING-opt-v4.glb','INTERIOR-opt-v2.glb']:
 before=set(bpy.context.scene.objects);bpy.ops.import_scene.gltf(filepath=str(R/'build/web/26092026'/name));objs=set(bpy.context.scene.objects)-before
 print('[A10]',name,[(o.name,[m.name for m in o.data.materials]) for o in objs if o.type=='MESH'],flush=True)
bpy.ops.wm.save_as_mainfile(filepath=str(A/'orijinal.blend'))
