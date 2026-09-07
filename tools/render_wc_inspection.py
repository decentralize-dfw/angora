"""Photo-review panorama of the small WC with its door temporarily cut away.

This is an explicitly labelled inspection view; it does not alter the native
CAD door or save visibility changes into the Blender scene.
"""
import bpy,json,hashlib,time,sys
from pathlib import Path
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).resolve().parent))
from delivery_fingerprint import delivery_snapshot
ROOT=Path(__file__).resolve().parents[1];scene=bpy.context.scene
cam=bpy.data.objects['18_garden_wc'];cam.location=(-.13,1.90,1.52)
cam.rotation_euler=(Vector((-.13,1.0,1.52))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.type='PANO';cam.data.panorama_type='EQUIRECTANGULAR'
cam.data.longitude_min=-1.38;cam.data.longitude_max=1.38;cam.data.latitude_min=-1.15;cam.data.latitude_max=.48
hidden=[]
for o in scene.objects:
    if o.name=='F0 | KAPI İÇ$KAPI':o.hide_render=True;hidden.append(o.name)
assert hidden,'Expected CAD WC door object is absent'
scene.camera=cam;scene.render.resolution_x=1000;scene.render.resolution_y=650;scene.render.resolution_percentage=100
scene.cycles.samples=24;scene.cycles.use_denoising=True
path=ROOT/'build/renders/18_garden_wc.png';scene.render.filepath=str(path)
started=time.time();bpy.ops.render.render(write_still=True)
record={'file':path.relative_to(ROOT).as_posix(),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
        'native_sha256':hashlib.sha256(Path(bpy.data.filepath).read_bytes()).hexdigest(),
        'width':1000,'height':650,'samples':24,'seconds':round(time.time()-started,2),
        'mode':'door_cutaway_inspection_panorama','hidden_source_objects':hidden,
        'camera_location':list(cam.location),'native_geometry_unchanged':True}
snapshot=delivery_snapshot();record['model_snapshot_sha256']=snapshot['sha256']
(ROOT/'build/renders/wc-inspection-manifest.json').write_text(json.dumps(record,ensure_ascii=False,indent=2))
manifest_path=ROOT/'build/renders/render-manifest.json'
manifest=json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
manifest.setdefault('model_snapshots',{})[snapshot['sha256']]=snapshot
manifest.setdefault('images',{})['18_garden_wc']=record
manifest.update(native_sha256=record['native_sha256'],per_image_native_sha256_is_authoritative=True)
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print('WC_INSPECTION_RENDER',json.dumps(record),flush=True)
