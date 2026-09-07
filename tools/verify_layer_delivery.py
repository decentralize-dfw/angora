"""Verify that the linked delivery resolves every mesh, material and image."""
import bpy,json,hashlib,sys
from mathutils import Vector
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'build/blender/layer-manifest.json').read_text())
missing=[]
for coll in [bpy.data.meshes,bpy.data.materials,bpy.data.images,bpy.data.node_groups]:
    for item in coll:
        if item.is_missing:missing.append(item.name)
verts=sum(len(o.data.vertices) for o in bpy.context.scene.objects if o.type=='MESH')
materials=[m for m in bpy.data.materials if m.use_nodes]
images=[i for i in bpy.data.images if i.type=='IMAGE' and i.name not in ['Render Result','Viewer Node']]
report={'mesh_vertices':verts,'expected_vertices':manifest['source_vertices'],'missing_linked_data':missing,
        'materials':len(materials),'image_count':len(images),
        'unpacked_images':[i.name for i in images if not i.packed_file and not i.packed_files],
        'libraries':[{ 'path':l.filepath,'resolved':bpy.path.abspath(l.filepath),'exists':Path(bpy.path.abspath(l.filepath)).exists()} for l in bpy.data.libraries]}
placement=[]
for name,expected in manifest.get('review_geometry_bounds_m',{}).items():
    o=bpy.data.objects.get(name)
    if not o:placement.append({'name':name,'missing':True});continue
    points=[o.matrix_world@Vector(p) for p in o.bound_box]
    actual=[[min(p[i] for p in points) for i in range(3)],[max(p[i] for p in points) for i in range(3)]]
    delta=max(abs(a-b) for aa,bb in zip(actual,expected) for a,b in zip(aa,bb))
    if delta>1e-5:placement.append({'name':name,'delta_m':delta})
report['placement_errors']=placement
(ROOT/'build/blender/layer-qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('LAYER_QA',json.dumps(report,ensure_ascii=False),flush=True)
assert verts==manifest['source_vertices'],'Geometry changed during linked packaging'
assert not missing,'Linked files do not resolve'
assert not placement,'Authored geometry moved in the linked delivery'
assert all(x['exists'] for x in report['libraries']),'A library path is not portable/resolvable'
