"""Refresh linked delivery evidence and verify the lift correction."""
import bpy,json,hashlib,sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1];master=ROOT/'build/blender/angora21-working.blend'
assert Path(bpy.data.filepath).resolve()==master.resolve()
bpy.context.view_layer.update()
assert bpy.data.collections.get('Lift F3') is None,'Attic lift collection still exists'
for n in range(3):assert bpy.data.collections.get('Lift F'+str(n)),n
for o in bpy.context.scene.objects:
    if o.get('floor_index')==3:assert not o.name.startswith(('Lift shaft','Lift landing','Lift door','Lift F3')),(o.name,'unexpected attic lift')
patch=bpy.data.objects['Restored floor above lift | attic parquet']
assert abs(max((patch.matrix_world@Vector(p)).z for p in patch.bound_box)-9.4705)<1e-5
scene=bpy.context.scene;scene['review_revision']='16-lift-stops-below-attic';scene['lift_served_floor_indices']=[0,1,2]
scene['editable_source']='linked delivery libraries; historical monolithic snapshot is superseded'
for path in [ROOT/'tools/correct_attic_lift.py',ROOT/'tools/lift_refinement.py']:
    text=bpy.data.texts.get('pipeline/'+path.name) or bpy.data.texts.new('pipeline/'+path.name);text.clear();text.write(path.read_text())
bpy.ops.wm.save_as_mainfile(filepath=str(master),compress=True,relative_remap=False)
manifest_path=ROOT/'build/blender/layer-manifest.json';manifest=json.loads(manifest_path.read_text())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
vertices=sum(len(o.data.vertices) for o in scene.objects if o.type=='MESH');count=sum(o.type not in ['LIGHT','CAMERA'] for o in scene.objects)
manifest.update(master_sha256=sha(master),source_vertices=vertices,linked_vertices=vertices,source_objects=count,linked_scene_objects=count,
                review_revision='16-lift-stops-below-attic',editable_source='linked_delivery_libraries',camera_only_revision=False)
if 'source_monolithic_sha256' in manifest:manifest['historical_monolithic_sha256']=manifest.pop('source_monolithic_sha256')
for record in manifest['files']:
    p=ROOT/record['path'];record.update(bytes=p.stat().st_size,sha256=sha(p))
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
report={'revision':16,'lift_stops':[0,1,2],'attic_lift_present':False,'attic_floor_patch_top_m':9.4705,
        'restored_aperture_only':True,'source_confirmation':'User, 2026-09-08','master_sha256':sha(master)}
(ROOT/'build/attic-lift-correction.json').write_text(json.dumps(report,indent=2))
lift_path=ROOT/'build/lift-report.json';lift=json.loads(lift_path.read_text());lift.update(landing_z=[0,3.0996,6.3714],attic_served=False,
    correction='Attic shaft and landing removed; former opening restored at adjacent CAD slab levels')
lift_path.write_text(json.dumps(lift,indent=2))
sys.path.insert(0,str(ROOT/'tools'));import verify_layer_delivery
print('ATTIC_DELIVERY_VERIFIED',json.dumps(report),flush=True)
