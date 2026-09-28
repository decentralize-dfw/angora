import bpy, pathlib
R=pathlib.Path(r'C:\Users\yigit\Downloads\angora-main (2)\angora-main')
W=pathlib.Path(r'C:\Users\yigit\angora-tur10');W.mkdir(exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
refs=bpy.data.collections.new('REFERANS');bpy.context.scene.collection.children.link(refs)
for name in ['BUILDING-opt-v4-lm.glb','INTERIOR-opt-v2.decoded.glb']:
 before=set(bpy.data.objects)
 bpy.ops.import_scene.gltf(filepath=str(R/'build/bake'/name))
 for obj in set(bpy.data.objects)-before:
  for c in list(obj.users_collection):c.objects.unlink(obj)
  refs.objects.link(obj)
  obj.hide_select=True
bpy.context.scene.collection.children.link(bpy.data.collections.new('EKLER'))
bpy.ops.wm.save_as_mainfile(filepath=str(W/'ekler-calisma.blend'))
print('[tur10] Referans nesneleri taşınmadan içe aktarıldı; EKLER boş; çalışma dosyası kaydedildi.',flush=True)
