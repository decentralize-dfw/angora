"""Color-code the actual source objects at the requested attic section."""
import bpy,bmesh,json
from mathutils import Vector
from pathlib import Path
root=Path(__file__).resolve().parents[1];scene=bpy.context.scene
bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get();out=[]
objects=set(bpy.data.collections['10_ARCHITECTURE'].all_objects)|set(bpy.data.collections['20_FIXED_FITTINGS'].all_objects)
copies=[];colors={'ceiling':(.7,.05,.08,1),'wall':(.1,.45,.15,1),'lift':(.25,.04,.6,1),'other':(.6,.63,.66,1)}
mats={}
for key,color in colors.items():
    m=bpy.data.materials.new('Diagnostic '+key);m.diffuse_color=color;m.use_nodes=True;m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=color;mats[key]=m
for o in objects:
    if o.type not in ['MESH','CURVE'] or o.get('floor_index')!=3 or o.hide_render:continue
    if any(t in o.get('source_layer','') for t in ['ÇATII','ALIN']):continue
    ev=o.evaluated_get(deps);me=ev.to_mesh();bm=bmesh.new();bm.from_mesh(me);bm.transform(o.matrix_world)
    bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),plane_co=(0,0,11.0705),plane_no=(0,0,1),clear_outer=True)
    bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),plane_co=(0,0,9.47),plane_no=(0,0,1),clear_inner=True)
    data=bpy.data.meshes.new(o.name);bm.to_mesh(data);bm.free();ev.to_mesh_clear()
    key='ceiling' if 'TAVAN' in o.name else 'wall' if 'DUVAR' in o.name else 'lift' if 'lift' in o.name.lower() or 'shaft' in o.name.lower() else 'other'
    obj=bpy.data.objects.new(o.name+' diagnostic',data);data.materials.clear();data.materials.append(mats[key]);copies.append(obj)
    out.append({'name':o.name,'category':key})
for o in list(scene.objects):o.hide_render=True
for o in copies:scene.collection.objects.link(o)
data=bpy.data.cameras.new('Diagnostic');cam=bpy.data.objects.new('Diagnostic',data);scene.collection.objects.link(cam);cam.location=(8,-10,38);target=Vector((-1,2,10));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();data.type='ORTHO';data.ortho_scale=18;scene.camera=cam
world=bpy.data.worlds.new('Diagnostic light');world.use_nodes=True;world.node_tree.nodes['Background'].inputs[1].default_value=.8;scene.world=world
scene.render.engine='CYCLES';scene.cycles.samples=8;scene.cycles.use_denoising=True;scene.render.resolution_x=900;scene.render.resolution_y=900;scene.render.resolution_percentage=100;scene.render.filepath=str(root/'build/intermediate/attic-surfaces.png');bpy.ops.render.render(write_still=True)
(root/'build/intermediate/attic-surfaces.json').write_text(json.dumps(out,indent=2))
