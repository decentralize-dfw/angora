"""Export common-origin GLBs by floor and neighborhood scope for on-demand use."""
import bpy,json,hashlib,sys,math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'build/glb';OUT.mkdir(parents=True,exist_ok=True)
sys.path.insert(0,str(ROOT/'tools'))
from geometry_bounds import geometry_bounds
scene=bpy.context.scene;digest=hashlib.sha256(Path(bpy.data.filepath).read_bytes()).hexdigest()
for mat in bpy.data.materials:
    if not mat.use_nodes:continue
    bs=next((n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None)
    out=next((n for n in mat.node_tree.nodes if n.type=='OUTPUT_MATERIAL'),None)
    if bs and out:
        for link in list(out.inputs['Surface'].links):mat.node_tree.links.remove(link)
        mat.node_tree.links.new(bs.outputs[0],out.inputs['Surface'])
def geometry(items):return {o for o in items if o.type in {'MESH','CURVE'} and not o.hide_render}
floorz=[0,3.0996,6.3714,9.4705]
def floor_of(o):
    if o.get('floor_index') is not None:return int(o['floor_index'])
    z=min((o.matrix_world@Vector(p)).z for p in o.bound_box)
    return max(0,min(3,sum(z>=f-.1 for f in floorz)-1))
indoor=set()
for name in ['10_ARCHITECTURE','20_FIXED_FITTINGS','30_FURNITURE_PLACEHOLDERS']:indoor|=geometry(bpy.data.collections[name].all_objects)
targets={f'villa-f{i}.glb':{o for o in indoor if floor_of(o)==i} for i in range(4)}
targets['villa-exterior.glb']=geometry(bpy.data.collections['15_EXTERIOR_DETAILS'].all_objects)
land=bpy.data.collections['40_LANDSCAPE'];plants=set()
for col in land.children:
    if any(word in col.name.lower() for word in ['planting','tree']):plants|=geometry(col.all_objects)
def center_x(o):return sum((o.matrix_world@Vector(p)).x for p in o.bound_box)/8
targets['villa-garden-ground.glb']=geometry(land.all_objects)-plants
targets['villa-garden-plants-west.glb']={o for o in plants if center_x(o)<0}
targets['villa-garden-plants-east.glb']={o for o in plants if center_x(o)>=0}
hood=bpy.data.collections['50_NEIGHBORHOOD'];near=set();far=set()
site=json.loads((ROOT/'build/cad/site-elevations.json').read_text())
near_numbers={b['number'] for b in site['buildings'] if math.hypot(*b['typology_transform']['translation_xy'])<53}
for col in hood.children:
    if not col.name.startswith('Building '):continue
    number=int(col.name.split()[1]);items=geometry(col.all_objects);(near if number in near_numbers else far).update(items)
    if number in near_numbers:targets['context-detail-b'+str(number)+'.glb']=items
# Near houses are separate streams so no single transport asset contains every
# detailed tree and facade. A lighter initial neighborhood LOD is still pending.
targets['context-far.glb']=far
targets['context-ground.glb']=geometry(hood.all_objects)-near-far
selected=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
selected=set(selected or targets)
previous=json.loads((OUT/'scene-manifest.json').read_text()).get('assets',[]) if (OUT/'scene-manifest.json').exists() else []
records=[r for r in previous if r['file'] in targets and r['file'] not in selected]
for filename,objects in targets.items():
    if filename not in selected:continue
    for o in scene.objects:o.select_set(False)
    for o in objects:o.select_set(True)
    deps=bpy.context.evaluated_depsgraph_get();bounds=geometry_bounds(objects,deps)
    bpy.ops.export_scene.gltf(filepath=str(OUT/filename),export_format='GLB',use_selection=True,
        export_apply=True,export_extras=True,export_cameras=False,export_lights=False,export_yup=True,
        export_materials='EXPORT',export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,export_draco_position_quantization=16,
        export_draco_normal_quantization=10,export_draco_texcoord_quantization=12)
    data=(OUT/filename).read_bytes();header=json.loads(data[20:20+int.from_bytes(data[12:16],'little')].decode().rstrip('\0 '))
    materials=header.get('materials',[])
    mapped=sum('normalTexture' in m and 'metallicRoughnessTexture' in m.get('pbrMetallicRoughness',{}) for m in materials)
    record={'file':filename,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'objects':len(objects),
            'blender_bounds_m':bounds,'materials':len(materials),'materials_with_normal_and_orm':mapped,
            'images':len(header.get('images',[])),'common_origin':True,'native_sha256':digest,
            'scope':'neighbor_building' if filename.startswith('context-detail-') else 'villa_or_ground'}
    records.append(record);print('STREAM_EXPORTED',json.dumps(record),flush=True)
    (OUT/'scene-manifest.json').write_text(json.dumps({'source_native_sha256':digest,'units':'metres',
        'coordinate_system':'glTF_Y_up','assets':records,'stage':'model_review',
        'mobile_performance_validated':False,'photo_alignment_complete':False},indent=2))
