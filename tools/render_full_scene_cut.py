"""Blender geometry QA of the real uncut GLBs, with an upper cut only.

This is not a browser/shader screenshot. Native wall caps are filled only at
the cut, for a readable geometry review. No lower plane or floor isolation.
"""
import bpy,bmesh,sys,json,hashlib
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
args=sys.argv[sys.argv.index('--')+1:];mode=args[0]
floor=int(mode) if mode.isdigit() else None
cut=[0,3.0996,6.3714,9.4705][floor]+1.6 if floor is not None else 40
bpy.ops.wm.read_factory_settings(use_empty=True)
manifest=json.loads((ROOT/'build/web/full/manifest.json').read_text())
for asset in manifest['assets']:
    before=set(bpy.context.scene.objects)
    bpy.ops.import_scene.gltf(filepath=str(ROOT/'build/web/full'/asset['file']))
    if asset['id']=='context':
        for o in set(bpy.context.scene.objects)-before:o['review_context']=True
caps=bpy.data.materials.new('Neutral solid wall section — geometry QA');caps.diffuse_color=(.15,.12,.085,1)
for o in list(bpy.context.scene.objects):
    if o.type!='MESH' or o.get('review_context'):continue
    bm=bmesh.new();bm.from_mesh(o.data);bm.transform(o.matrix_world)
    result=bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),
      dist=.00001,plane_co=(0,0,cut),plane_no=(0,0,1),clear_outer=True,clear_inner=False)
    if o.get('section_cap_eligible'):
        edges=[e for e in bm.edges if e.is_boundary and all(abs(v.co.z-cut)<.0001 for v in e.verts)]
        if edges:
            fill=bmesh.ops.holes_fill(bm,edges=edges,sides=0)
            idx=len(o.data.materials);o.data.materials.append(caps)
            for f in fill['faces']:f.material_index=idx
    bm.to_mesh(o.data);bm.free();o.matrix_world.identity()
scene=bpy.context.scene
center=Vector((.4,4,cut-2.5)) if floor else Vector((1,7,-.6))
if floor is None:center=Vector((0,3,3))
camera=bpy.data.cameras.new('Full scene geometry review');obj=bpy.data.objects.new(camera.name,camera)
scene.collection.objects.link(obj);scene.camera=obj
obj.location=center+Vector((11,-16,30) if floor is not None else (75,100,160));obj.rotation_euler=(center-obj.location).to_track_quat('-Z','Y').to_euler()
camera.type='ORTHO';camera.ortho_scale=(22 if floor else 42) if floor is not None else (180 if mode=='neighborhood' else 52)
world=bpy.data.worlds.new('Review daylight');world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.65,.72,.82,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.65;scene.world=world
light=bpy.data.lights.new('Soft daylight','AREA');light.energy=2400;light.size=12
sun=bpy.data.objects.new('Soft daylight',light);scene.collection.objects.link(sun)
sun.location=center+Vector((-5,-8,18));sun.rotation_euler=(center-sun.location).to_track_quat('-Z','Y').to_euler()
scene.render.engine='CYCLES';scene.cycles.samples=16;scene.cycles.use_denoising=True
scene.render.resolution_x=1000;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX';scene.view_settings.exposure=.4
path=ROOT/'build/renders'/(f'full-scene-floor-{floor}.png' if floor is not None else f'full-scene-{mode}.png');scene.render.filepath=str(path)
bpy.ops.render.render(write_still=True)
report={'render':str(path.relative_to(ROOT)),'kind':'Blender GLB geometry review; not a web shader screenshot',
 'floor_index':floor,'upper_cut_m':cut,'lower_cut':None,'context_omitted_for_close_inspection':False,
 'model_manifest_sha256':hashlib.sha256((ROOT/'build/web/full/manifest.json').read_bytes()).hexdigest(),
 'render_sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
path.with_suffix('.json').write_text(json.dumps(report,indent=2))
print('FULL_SCENE_REVIEW',json.dumps(report),flush=True)
