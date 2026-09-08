"""Apply the final 42 cm hall-chair correction found by the full part audit."""
import bpy,json,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
path=ROOT/'build/blender/layers/30-furniture-placeholders.blend'
assert Path(bpy.data.filepath).resolve()==path
root=bpy.data.collections['30_FURNITURE_PLACEHOLDERS']
assert root.get('clearance_revision_22') and not root.get('hall_chair_clearance_22')
parts=[o for o in root.all_objects if o.get('assembly_id')=='Upper hall / wing chair 1']
assert len(parts)==12
for o in parts:
    assert o.parent is None;o.location.x+=.42
root['hall_chair_clearance_22']=True
bpy.ops.wm.save_as_mainfile(filepath=str(path),compress=True,relative_remap=False)
report_path=ROOT/'build/furniture-refinement-r22.json';report=json.loads(report_path.read_text())
report['source_furniture_sha256_after']=hashlib.sha256(path.read_bytes()).hexdigest()
report['changes'].append({'objects':[o.name for o in parts],'translation_m':[.42,0,0],
    'reason':'Clear the original west-wall return with the rotated wing-chair back'})
report_path.write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('HALL_CHAIR_CORRECTED',len(parts),flush=True)
