"""Blender geometry QA of the real uncut GLBs, with an upper cut only.

This is not a browser/shader screenshot. It uses the same prepared wall-section
geometry as the web viewer. No lower plane or floor isolation.
"""
import bpy,bmesh,sys,json,hashlib
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
args=sys.argv[sys.argv.index('--')+1:];mode=args[0]
floor=2 if mode=='gallery' else int(mode) if mode.isdigit() else None
cut=[0,3.0996,6.3714,9.4705][floor]+1.6 if floor is not None else 40
bpy.ops.wm.read_factory_settings(use_empty=True)
manifest=json.loads((ROOT/'build/web/full/manifest.json').read_text())
for asset in manifest['assets']:
    before=set(bpy.context.scene.objects)
    bpy.ops.import_scene.gltf(filepath=str(ROOT/'build/web/full'/asset['file']))
    if asset['id']=='context':
        for o in set(bpy.context.scene.objects)-before:o['review_context']=True
for o in list(bpy.context.scene.objects):
    if o.type!='MESH' or o.get('review_context'):continue
    bm=bmesh.new();bm.from_mesh(o.data);bm.transform(o.matrix_world)
    result=bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),
      dist=.00001,plane_co=(0,0,cut),plane_no=(0,0,1),clear_outer=True,clear_inner=False)
    bm.to_mesh(o.data);bm.free();o.matrix_world.identity()
if floor is not None:
    atlas_path=ROOT/'build/web/full'/manifest['section_atlas']['file']
    assert hashlib.sha256(atlas_path.read_bytes()).hexdigest()==manifest['section_atlas']['sha256']
    atlas=json.loads(atlas_path.read_text())
    section=min(atlas['slices'],key=lambda s:abs(s['height']-cut))
    assert abs(section['height']-cut)<1e-6,'Floor review requires exact section elevation'
    vertices=[(section['p'][i],-section['p'][i+1],cut) for i in range(0,len(section['p']),2)]
    faces=[section['i'][i:i+3] for i in range(0,len(section['i']),3)]
    mesh=bpy.data.meshes.new('Published wall-section contours');mesh.from_pydata(vertices,[],faces);mesh.update()
    cap=bpy.data.objects.new('Solid hatched wall cross section',mesh);bpy.context.scene.collection.objects.link(cap)
    mat=bpy.data.materials.new('World-scale diagonal section hatch');mat.use_nodes=True
    n=mat.node_tree.nodes;l=mat.node_tree.links;n.clear()
    out=n.new('ShaderNodeOutputMaterial');emission=n.new('ShaderNodeEmission');l.new(emission.outputs[0],out.inputs['Surface'])
    position=n.new('ShaderNodeNewGeometry');xyz=n.new('ShaderNodeSeparateXYZ');l.new(position.outputs['Position'],xyz.inputs[0])
    diff=n.new('ShaderNodeMath');diff.operation='SUBTRACT';l.new(xyz.outputs['X'],diff.inputs[0]);l.new(xyz.outputs['Y'],diff.inputs[1])
    previous=diff.outputs[0]
    for operation,value in [('DIVIDE',.14),('FRACT',0),('SUBTRACT',.5),('ABSOLUTE',0),('LESS_THAN',.065),('MULTIPLY',.62)]:
        math=n.new('ShaderNodeMath');math.operation=operation;l.new(previous,math.inputs[0]);math.inputs[1].default_value=value;previous=math.outputs[0]
    mix=n.new('ShaderNodeMixRGB');mix.inputs[1].default_value=(.70,.64,.53,1);mix.inputs[2].default_value=(.19,.17,.13,1)
    l.new(previous,mix.inputs[0]);l.new(mix.outputs[0],emission.inputs['Color']);mesh.materials.append(mat)
scene=bpy.context.scene
center=Vector((.4,4,cut-2.5)) if floor else Vector((1,7,-.6))
if floor is None:center=Vector((0,3,3))
camera=bpy.data.cameras.new('Full scene geometry review');obj=bpy.data.objects.new(camera.name,camera)
scene.collection.objects.link(obj);scene.camera=obj
obj.location=center+Vector((11,-16,30) if floor is not None else (75,100,160));obj.rotation_euler=(center-obj.location).to_track_quat('-Z','Y').to_euler()
camera.type='ORTHO';camera.ortho_scale=(22 if floor else 42) if floor is not None else (180 if mode=='neighborhood' else 52)
if mode=='gallery':
    center=Vector((1.0,.45,6.60));obj.location=center+Vector((-4.3,-5.7,6.7))
    obj.rotation_euler=(center-obj.location).to_track_quat('-Z','Y').to_euler();camera.ortho_scale=4.8
world=bpy.data.worlds.new('Review daylight');world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.65,.72,.82,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.65;scene.world=world
light=bpy.data.lights.new('Soft daylight','AREA');light.energy=2400;light.size=12
sun=bpy.data.objects.new('Soft daylight',light);scene.collection.objects.link(sun)
sun.location=center+Vector((-5,-8,18));sun.rotation_euler=(center-sun.location).to_track_quat('-Z','Y').to_euler()
scene.render.engine='CYCLES';scene.cycles.samples=16;scene.cycles.use_denoising=True
scene.render.resolution_x=1000;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX';scene.view_settings.exposure=.4
path=ROOT/'build/renders'/(f'full-scene-floor-{floor}.png' if floor is not None and mode!='gallery' else f'full-scene-{mode}.png');scene.render.filepath=str(path)
bpy.ops.render.render(write_still=True)
report={'render':str(path.relative_to(ROOT)),'kind':'Blender GLB geometry review; not a web shader screenshot',
 'floor_index':floor,'upper_cut_m':cut,'lower_cut':None,'context_omitted_for_close_inspection':False,
 'section_atlas_sha256':manifest.get('section_atlas',{}).get('sha256') if floor is not None else None,
 'model_manifest_sha256':hashlib.sha256((ROOT/'build/web/full/manifest.json').read_bytes()).hexdigest(),
 'render_sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
path.with_suffix('.json').write_text(json.dumps(report,indent=2))
print('FULL_SCENE_REVIEW',json.dumps(report),flush=True)
