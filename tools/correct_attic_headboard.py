"""Lower the attic headboard below the measured CAD roof skin and match its trim."""
import bpy,json,hashlib,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from photo_refinement import Local
path=ROOT/'build/blender/layers/30-furniture-placeholders.blend'
assert Path(bpy.data.filepath).resolve()==path
root=bpy.data.collections['30_FURNITURE_PLACEHOLDERS'];assert not root.get('attic_headboard_clearance_22')
o=bpy.data.objects['Headboard.003'];assert o.parent is None
o.scale.z*=.89/1.05;o.location.z-=.08;o.data=o.data.copy();o.data.materials.clear();o.data.materials.append(bpy.data.materials['black'])
if 'white_trim' not in bpy.data.materials:
    with bpy.data.libraries.load(str(path.parent/'shared-materials.blend'),link=True,relative=True) as (source,destination):destination.materials=['white_trim']
col=bpy.data.collections['Attic north bedroom'];before=set(col.objects);c=Local(col,(-2.934,6.5,9.6755),90)
for z in [.0175,.8725]:c.box('Attic headboard ivory horizontal border',(0,0,z),(1.54,.026,.035),bpy.data.materials['white_trim'],.006)
for x in [-.7525,.7525]:c.box('Attic headboard ivory upright border',(x,0,.445),(.035,.026,.855),bpy.data.materials['white_trim'],.006)
new=set(col.objects)-before
for obj in list(new)+[o]:
    obj['assembly_id']='Attic north bedroom / Bed';obj['floor_index']=3;obj['placeholder']=True
    obj['evidence_status']='photo_interpreted';obj['source_reference']='kat_4/WhatsApp Image 2026-08-26 at 11.53.10 (6).jpeg'
    obj['dimension_label_allowed']=False;obj['photo_match_approved']=False;obj['review_revision']=22
for obj in new:
    me=obj.data;uv=me.uv_layers.new(name='UVMap')
    for poly in me.polygons:
        axis=max(range(3),key=lambda i:abs(poly.normal[i]));axes=[i for i in range(3) if i!=axis]
        for li in poly.loop_indices:
            p=me.vertices[me.loops[li].vertex_index].co;uv.data[li].uv=(p[axes[0]],p[axes[1]])
root['attic_headboard_clearance_22']=True
bpy.ops.wm.save_as_mainfile(filepath=str(path),compress=True,relative_remap=False)
rp=ROOT/'build/furniture-refinement-r22.json';report=json.loads(rp.read_text())
report['source_furniture_sha256_after']=hashlib.sha256(path.read_bytes()).hexdigest()
report['new_parts'].extend(obj.name for obj in new)
report['changes'].append({'objects':[o.name]+[obj.name for obj in new],'headboard_height_m':.89,
  'reason':'Original placeholder top intersected the sloping source ceiling; photo shows a lower dark headboard with an ivory border',
  'height_status':'photo_interpreted_with_CAD_roof_clearance'})
rp.write_text(json.dumps(report,ensure_ascii=False,indent=2));print('ATTIC_HEADBOARD_CORRECTED',len(new),flush=True)
