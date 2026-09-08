"""Record an edit made directly in the delivery libraries, then verify links.

Blender: master.blend --python tools/refresh_linked_delivery.py -- REVISION
"""
import bpy,json,hashlib,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
revision=sys.argv[sys.argv.index('--')+1]
master=ROOT/'build/blender/angora21-working.blend';assert Path(bpy.data.filepath).resolve()==master
scene=bpy.context.scene;scene['review_revision']=revision
for name in ['repair_gallery_finish.py','verify_gallery_visibility.py','refresh_linked_delivery.py',
             'export_ground_source.py','prepare_road_correction.py','prepare_ground_correction.py','apply_ground_correction.py',
             'prepare_gallery_railing.py','add_gallery_railing.py','export_wall_sections.py','build_section_atlas.py',
             'inspect_review_geometry.py','audit_furniture_geometry.py','refine_furniture_clearances.py',
             'adjust_hall_chair_clearance.py','correct_attic_headboard.py','correct_attic_tv.py','check_furniture_openings.py','check_furniture_headroom.py','register_plan_dimensions.py','build_room_annotations.py',
             'build_walk_navigation.py','export_web_viewer.py','refine_kitchen_joinery_r23.py','fit_kitchen_to_cad_r23.py',
             'check_kitchen_photo_r23.py','check_kitchen_surfaces_r23.py','refresh_unchanged_sections.py',
             'refine_kitchen_appliance_r24.py','sync_pbr_archive_manifest.py']:
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
