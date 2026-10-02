"""Render a scroll film from the supplied villa, without changing its source.

Run with Blender -b <source.blend> -P this.py -- --preview or --frames 96.
All camera, clipping and lighting changes live only in this temporary process.
"""
import bpy, math, sys, json, argparse
from pathlib import Path
from mathutils import Vector

args=argparse.ArgumentParser()
args.add_argument('--preview',action='store_true')
args.add_argument('--frames',type=int,default=96)
args.add_argument('--width',type=int,default=1440)
args.add_argument('--samples',type=int,default=40)
args=args.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'build'/'chapter-film';OUT.mkdir(parents=True,exist_ok=True)
sc=bpy.context.scene
house={'building.001','BUILDING- 3','kat_tavan_pimapen.glb.001','İNTERİOR.001'}
objects=[o for o in sc.objects if o.type=='MESH' and house.intersection(c.name for c in o.users_collection)]
sections=[o for o in sc.objects if o.name.startswith('Section ')]
for o in sc.objects:
    if o.type=='MESH':o.hide_render=o not in objects and o not in sections
    if o.type=='LIGHT' and o.name.startswith('Room | '):o.hide_render=True

# A single world-height window sweeps through the house. This preserves the
# original geometry and materials and lets the camera move continuously.
group=bpy.data.node_groups.new('Angora film height window','ShaderNodeTree')
group.interface.new_socket(name='Shader',in_out='INPUT',socket_type='NodeSocketShader')
group.interface.new_socket(name='Shader',in_out='OUTPUT',socket_type='NodeSocketShader')
n=group.nodes;links=group.links
inp=n.new('NodeGroupInput');out=n.new('NodeGroupOutput')
geo=n.new('ShaderNodeNewGeometry');xyz=n.new('ShaderNodeSeparateXYZ');links.new(geo.outputs['Position'],xyz.inputs[0])
low=n.new('ShaderNodeValue');low.name='Low';high=n.new('ShaderNodeValue');high.name='High'
below=n.new('ShaderNodeMath');below.operation='LESS_THAN';links.new(xyz.outputs['Z'],below.inputs[0]);links.new(low.outputs[0],below.inputs[1])
above=n.new('ShaderNodeMath');above.operation='GREATER_THAN';links.new(xyz.outputs['Z'],above.inputs[0]);links.new(high.outputs[0],above.inputs[1])
outside=n.new('ShaderNodeMath');outside.operation='MAXIMUM';links.new(below.outputs[0],outside.inputs[0]);links.new(above.outputs[0],outside.inputs[1])
transparent=n.new('ShaderNodeBsdfTransparent');mix=n.new('ShaderNodeMixShader')
links.new(outside.outputs[0],mix.inputs[0]);links.new(inp.outputs[0],mix.inputs[1]);links.new(transparent.outputs[0],mix.inputs[2]);links.new(mix.outputs[0],out.inputs[0])
materials={slot.material for o in objects for slot in o.material_slots if slot.material and slot.material.use_nodes}
for mat in materials:
    nodes=mat.node_tree.nodes;links=mat.node_tree.links
    output=next((n for n in nodes if n.type=='OUTPUT_MATERIAL' and n.is_active_output),None)
    if output is None or not output.inputs['Surface'].is_linked:continue
    source=output.inputs['Surface'].links[0].from_socket
    clip=nodes.new('ShaderNodeGroup');clip.node_tree=group
    links.new(source,clip.inputs[0]);links.new(clip.outputs[0],output.inputs['Surface'])

sc.render.engine='CYCLES';sc.cycles.samples=args.samples;sc.cycles.use_denoising=True
sc.cycles.adaptive_threshold=.025;sc.cycles.max_bounces=8;sc.cycles.transparent_max_bounces=64
sc.render.use_persistent_data=True
prefs=bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type='OPTIX';prefs.get_devices()
for device in prefs.devices:device.use=device.type=='OPTIX'
sc.cycles.device='GPU'
sc.render.resolution_x=args.width;sc.render.resolution_y=args.width
sc.render.resolution_percentage=100;sc.render.film_transparent=True
sc.render.image_settings.file_format='PNG';sc.render.image_settings.color_mode='RGBA'
sc.render.image_settings.color_depth='8';sc.render.use_compositing=False
sc.view_settings.view_transform='AgX'
try:sc.view_settings.look='AgX - Medium High Contrast'
except:pass
sc.view_settings.exposure=.45
cam=sc.camera;cam.data.type='ORTHO';cam.data.ortho_scale=27
cam.data.clip_start=.1;cam.data.clip_end=200
# Broad fill light keeps the cutaway readable while the existing sun/world
# retain the villa's surface character and directional shadows.
data=bpy.data.lights.new('Film softbox','AREA');data.energy=2200;data.shape='DISK';data.size=14
light=bpy.data.objects.new('Film softbox',data);sc.collection.objects.link(light)
light.location=(-5,-8,23);light.rotation_euler=(Vector((.5,2,5))-light.location).to_track_quat('-Z','Y').to_euler()
# A studio plinth sits beneath the cutaway, separate from the source building.
plinth_mat=bpy.data.materials.new('Film plinth');plinth_mat.diffuse_color=(.77,.8,.74,1)
bpy.ops.mesh.primitive_cube_add(size=1,location=(.45,2.9,-.2))
plinth=bpy.context.object;plinth.name='Film presentation plinth';plinth.dimensions=(15.1,20.2,.28)
bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
plinth.data.materials.append(plinth_mat)
bevel=plinth.modifiers.new('Soft studio edge','BEVEL');bevel.width=.08;bevel.segments=3
cap_mat=bpy.data.materials.new('Film wall section');cap_mat.diffuse_color=(.17,.2,.18,1)
for obj in sections:
    obj.data=obj.data.copy();obj.data.materials.clear();obj.data.materials.append(cap_mat)
heights=[1.6,4.6996,7.9714,10.7705];bottoms=[-.65,2.72,6.12,9.2];floors=[0,3.0996,6.3714,9.4705]
bounds={o:(min((o.matrix_world@Vector(v)).z for v in o.bound_box),max((o.matrix_world@Vector(v)).z for v in o.bound_box)) for o in objects}
def smooth(t):return t*t*(3-2*t)
def position(progress):
    level=0.
    for k in range(1,4):
        start=k/4-.045;end=k/4+.045
        level+=smooth(max(0,min(1,(progress-start)/(end-start))))
    a=min(2,int(level));b=a+1;t=level-a
    if level>=3:a=b=3;t=0
    return a,b,t
frames=[0,args.frames//2,args.frames-1] if args.preview else range(args.frames)
for frame in frames:
    progress=frame/(args.frames-1);a,b,t=position(progress)
    z=floors[a]*(1-t)+floors[b]*t
    plinth.location.z=bottoms[a]*(1-t)+bottoms[b]*t-.14
    high.outputs[0].default_value=heights[a]*(1-t)+heights[b]*t
    low.outputs[0].default_value=bottoms[a]*(1-t)+bottoms[b]*t
    for o,(zmin,zmax) in bounds.items():o.hide_render=zmin>high.outputs[0].default_value+.005 or zmax<low.outputs[0].default_value-.005
    active=a if t<.5 else b
    settled=t<.002 or t>.998 or a==b
    for o in sections:o.hide_render=not(settled and o.name.startswith(f'Section {active} '))
    for o in sc.objects:
        if o.type=='LIGHT' and o.name.startswith('Room | '):o.hide_render=not o.name.startswith(f'Room | f{active}-')
    angle=math.radians(-57+progress*20);radius=31
    target=Vector((.45,2.7,z+.55))
    cam.location=target+Vector((radius*math.cos(angle),radius*math.sin(angle),36))
    cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    cam.data.ortho_scale=27-1.25*progress
    sc.render.filepath=str(OUT/f'frame-{frame:04d}.png')
    bpy.ops.render.render(write_still=True)
    print('CHAPTER_FRAME',frame,flush=True)
(OUT/'manifest.json').write_text(json.dumps({'frames':args.frames,'width':args.width,'height':args.width,'fps':15,'chapterProgress':[.125,.375,.625,.875],'source':'angora-finalization-review.blend','render':'Cycles / OptiX, transparent background, continuous camera and world-height cutaway','sourceModified':False},indent=2))
