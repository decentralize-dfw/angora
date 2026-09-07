"""Move the WC review camera inside its closed CAD door; keep geometry intact."""
import bpy,json,hashlib,sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
cam=bpy.data.objects['18_garden_wc'];cam.location=(-.13,1.83,1.53)
cam.rotation_euler=(Vector((.08,1.25,1.15))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=12.5
for path in sorted((ROOT/'tools').glob('*.py')):
    text=bpy.data.texts.get('pipeline/'+path.name) or bpy.data.texts.new('pipeline/'+path.name);text.clear();text.write(path.read_text())
text=bpy.data.texts.get('PROJECT_README.md') or bpy.data.texts.new('PROJECT_README.md');text.clear();text.write((ROOT/'README.md').read_text())
bpy.context.scene['review_camera_revision']='WC camera inside closed CAD door; geometry unchanged'
path=Path(bpy.data.filepath);bpy.ops.wm.save_as_mainfile(filepath=str(path),compress=True,relative_remap=False)
manifest_path=ROOT/'build/blender/layer-manifest.json';m=json.loads(manifest_path.read_text());m['master_sha256']=hashlib.sha256(path.read_bytes()).hexdigest();m['camera_only_revision']=True
manifest_path.write_text(json.dumps(m,ensure_ascii=False,indent=2));print('WC_REVIEW_CAMERA_UPDATED',m['master_sha256'],flush=True)
