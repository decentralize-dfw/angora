"""Render the actual web-delivery GLB for section geometry inspection."""
import bpy,sys,json,math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
names=sys.argv[sys.argv.index('--')+1:]
for name in names:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(ROOT/'build/web'/(name+'.glb')))
    scene=bpy.context.scene
    points=[o.matrix_world@Vector(p) for o in scene.objects if o.type=='MESH' for p in o.bound_box]
    low=Vector([min(p[i] for p in points) for i in range(3)]);high=Vector([max(p[i] for p in points) for i in range(3)])
    center=(low+high)/2
    cam=bpy.data.cameras.new('Web cut inspection');obj=bpy.data.objects.new('Web cut inspection',cam);scene.collection.objects.link(obj);scene.camera=obj
    obj.location=center+Vector((10,-13,30));obj.rotation_euler=(center-obj.location).to_track_quat('-Z','Y').to_euler()
    cam.type='ORTHO';cam.ortho_scale=max(high.x-low.x,high.y-low.y)*1.22
    world=bpy.data.worlds.new('Soft review daylight');world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.65,.72,.82,1);world.node_tree.nodes['Background'].inputs[1].default_value=.65;scene.world=world
    light=bpy.data.lights.new('Daylight','AREA');light.energy=2400;light.shape='DISK';light.size=12
    sun=bpy.data.objects.new('Daylight',light);scene.collection.objects.link(sun);sun.location=center+Vector((-5,-8,15));sun.rotation_euler=(center-sun.location).to_track_quat('-Z','Y').to_euler()
    scene.render.engine='CYCLES';scene.cycles.samples=16;scene.cycles.use_denoising=True
    scene.render.resolution_x=900;scene.render.resolution_y=900;scene.render.resolution_percentage=100
    scene.view_settings.view_transform='AgX';scene.view_settings.exposure=.4
    scene.render.image_settings.file_format='PNG';scene.render.filepath=str(ROOT/'build/renders'/('web-'+name+'.png'))
    bpy.ops.render.render(write_still=True)
    print('WEB_SECTION_RENDER',name,scene.render.filepath,flush=True)
