"""Remove the legacy floating TV caught by the R22 actual-GLB interior review."""
import bpy,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
path=ROOT/'build/blender/layers/30-furniture-placeholders.blend'
assert Path(bpy.data.filepath).resolve()==path
root=bpy.data.collections['30_FURNITURE_PLACEHOLDERS']
assert root.get('clearance_revision_22') and not root.get('attic_tv_clearance_22')
old=bpy.data.objects.get('Television.002');assert old is not None and 'Attic lounge table' in [c.name for c in old.users_collection]
bpy.data.objects.remove(old,do_unlink=True)
# These parts are unparented. Their saved native locations remain valid even
# while the library's scene is empty and matrix_world has not been evaluated.
for name in ['Attic television bezel','Attic television screen','Attic television stand','Attic television stem']:
    o=bpy.data.objects[name];assert o.parent is None;o.location.z-=.0175
root['attic_tv_clearance_22']=True
bpy.ops.wm.save_as_mainfile(filepath=str(path),compress=True,relative_remap=False)
p=ROOT/'build/furniture-refinement-r22.json';r=json.loads(p.read_text())
r['changes'].append({'removed':['Television.002'],'reason':'Legacy floating panel caught by actual GLB interior render; retained only the photo-interpreted console TV and seated its stand on the console'})
p.write_text(json.dumps(r,ensure_ascii=False,indent=2))
print('ATTIC_TV_CORRECTED',flush=True)
