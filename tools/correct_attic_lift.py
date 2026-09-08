"""User-confirmed correction: the lift stops below the attic.

Edit local delivery libraries only. The original CAD source is untouched.
Close only the rectangular aperture previously introduced by lift_refinement.
"""
import bpy,json,sys,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from blender_utils import box,metadata
from apply_photo_review_patch import physical_uv
REV='16-lift-stops-below-attic'

def apply():
    removed=[];restored=[]
    col=bpy.data.collections.get('Lift F3')
    if col and col.library is None:
        for o in list(col.all_objects):
            removed.append(o.name);bpy.data.objects.remove(o,do_unlink=True)
        bpy.data.collections.remove(col)
    arch=bpy.data.collections.get('10_ARCHITECTURE')
    if arch and arch.library is None:
        for o in list(arch.all_objects):
            if o.name.startswith('Restored floor above lift | '):bpy.data.objects.remove(o,do_unlink=True)
        for name,z0,z1,mat,floor in [
            ('attic structure',9.0700,9.3900,'interior',3),
            ('attic parquet',9.3900,9.4705,'wood_floor',3),
            ('lift head ceiling',8.9910,9.0700,'ceiling',2)]:
            parent=next((c for c in arch.children if c.name.startswith(f'{floor:02d}_')),arch)
            o=box('Restored floor above lift | '+name,(-2.02,.86,(z0+z1)/2),(1.36,1.34,z1-z0),bpy.data.materials[mat],parent,0)
            metadata(o,'user_confirmed_lift_ends_below_attic','User clarification 2026-09-08; adjacent CAD floor levels',
                     floor_index=floor,dimension_label_allowed=False,review_revision=REV,
                     original_lift_aperture_only=True,photo_match_approved=False)
            physical_uv(o);restored.append(o.name)
    return removed,restored

if __name__=='__main__':
    path=Path(bpy.data.filepath)
    if path.parent.name=='layers':
        nested={c for p in bpy.data.collections for c in p.children}
        for c in list(bpy.data.collections):
            if c.library is None and c not in nested and c!=bpy.context.scene.collection and c.name not in bpy.context.scene.collection.children:bpy.context.scene.collection.children.link(c)
    bpy.context.view_layer.update();removed,restored=apply();bpy.context.view_layer.update()
    if removed or restored:
        bpy.context.scene['review_revision']=REV
        bpy.ops.wm.save_as_mainfile(filepath=str(path),compress=True,relative_remap=False)
    print('ATTIC_LIFT_CORRECTION',json.dumps({'file':path.name,'removed':removed,'restored':restored}),flush=True)
