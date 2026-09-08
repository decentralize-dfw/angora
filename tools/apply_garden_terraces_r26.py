"""Apply the prepared terrace mesh on 50-neighborhood-10.blend."""
import bpy,json,gzip,sys,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from apply_photo_review_patch import physical_uv
assert Path(bpy.data.filepath).name=='50-neighborhood-10.blend'
obj=next(o for o in bpy.data.objects if o.library is None and o.name.startswith('Terrain'))
assert obj.get('garden_terrace_revision')!=26,'Already applied'
data=json.load(gzip.open(ROOT/'build/cad/garden-terraces-r26.json.gz','rt'))
before=hashlib.sha256(Path(bpy.data.filepath).read_bytes()).hexdigest()
vertices=[];lookup={};remap=[]
for v in data['vertices']:
 key=tuple(round(c,6) for c in v)
 if key not in lookup:lookup[key]=len(vertices);vertices.append(v)
 remap.append(lookup[key])
faces=[];mids=[]
for face,mi in zip(data['faces'],data['material_ids']):
 f=[remap[i] for i in face]
 if len(set(f))==3:faces.append(f);mids.append(mi)
mesh=bpy.data.meshes.new('CAD garden terraces R26');mesh.from_pydata(vertices,[],faces);mesh.update()
mesh.materials.append(obj.data.materials[0])
stone=next((m for m in bpy.data.materials if m.name.startswith('Retaining wall rough limestone')),None)
if not stone:
 with bpy.data.libraries.load(str(ROOT/'build/blender/layers/shared-materials.blend'),link=True,relative=True) as (src,dst):
  dst.materials=[n for n in src.materials if n.startswith('Retaining wall rough limestone')]
 stone=dst.materials[0]
assert stone is not None;mesh.materials.append(stone)
for p,mi in zip(mesh.polygons,mids):p.material_index=mi
obj.data=mesh;obj['garden_terrace_revision']=26
obj['garden_front_pad_source']='DORBAK top +2.7996 m';obj['garden_rear_pad_source']='21 TK -0.10 m'
obj['side_terrace_breaklines']='interpreted from source-aligned modeled garden stairs';obj['photo_match_approved']=False
physical_uv(obj)
bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath,compress=True,relative_remap=False)
report=data['report'];report.update(native_library='build/blender/layers/50-neighborhood-10.blend',
 before_sha256=before,after_sha256=hashlib.sha256(Path(bpy.data.filepath).read_bytes()).hexdigest(),welded_vertices=len(vertices))
(ROOT/'build/garden-terraces-r26.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('GARDEN_TERRACES_APPLIED',len(vertices),len(faces),flush=True)
