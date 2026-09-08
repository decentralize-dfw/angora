"""Record an edit made directly in the delivery libraries, then verify links.

Blender: master.blend --python tools/refresh_linked_delivery.py -- REVISION
"""
import bpy,json,hashlib,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
revision=sys.argv[sys.argv.index('--')+1]
master=ROOT/'build/blender/angora21-working.blend';assert Path(bpy.data.filepath).resolve()==master
scene=bpy.context.scene;scene['review_revision']=revision
for name in ['repair_gallery_finish.py','verify_gallery_visibility.py','refresh_linked_delivery.py']:
    text=bpy.data.texts.get('pipeline/'+name) or bpy.data.texts.new('pipeline/'+name)
    text.clear();text.write((ROOT/'tools'/name).read_text())
bpy.context.view_layer.update()
bpy.ops.wm.save_as_mainfile(filepath=str(master),compress=True,relative_remap=False)
manifest_path=ROOT/'build/blender/layer-manifest.json';manifest=json.loads(manifest_path.read_text())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
vertices=sum(len(o.data.vertices) for o in scene.objects if o.type=='MESH')
count=sum(o.type not in ['LIGHT','CAMERA'] for o in scene.objects)
manifest.update(master_sha256=sha(master),source_vertices=vertices,linked_vertices=vertices,
    source_objects=count,linked_scene_objects=count,review_revision=revision,editable_source='linked_delivery_libraries',camera_only_revision=False)
for record in manifest['files']:
    p=ROOT/record['path'];record.update(bytes=p.stat().st_size,sha256=sha(p))
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
sys.path.insert(0,str(ROOT/'tools'))
import verify_layer_delivery
import verify_gallery_visibility
print('LINKED_DELIVERY_UPDATED',revision,sha(master),flush=True)
