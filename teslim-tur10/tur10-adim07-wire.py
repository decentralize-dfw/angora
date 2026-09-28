import bpy,json,math
from pathlib import Path
from mathutils import Vector
R=Path(r"C:\Users\yigit\Downloads\angora-main (2)\angora-main");W=Path(r"C:\Users\yigit\angora-tur10")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(R/'build/bake/BUILDING-opt-v4-lm.glb'))
obs=[o for o in bpy.context.scene.objects if o.type=='MESH' and any(m and 'WOOD-FL' in m.name for m in o.data.materials)]
report=[]
for o in list(bpy.context.scene.objects):
 if o not in obs:bpy.data.objects.remove(o,do_unlink=True)
for o in obs:
 co=[o.matrix_world@v.co for v in o.data.vertices]
 edges=[[[*co[e.vertices[0]]],[*co[e.vertices[1]]]] for e in o.data.edges if all(abs(co[i].z-9.4694)<.002 and abs(co[i].y-2.027)<.015 for i in e.vertices)]
 report.append({'object':o.name,'edges_at_line':edges,'polygons':len(o.data.polygons),'custom_normals':o.data.has_custom_normals})
 m=bpy.data.materials.new('Wire');m.use_nodes=True;n=m.node_tree.nodes;n.clear();out=n.new('ShaderNodeOutputMaterial');em=n.new('ShaderNodeEmission');wire=n.new('ShaderNodeWireframe');wire.inputs['Size'].default_value=.004;mix=n.new('ShaderNodeMixRGB');mix.inputs[1].default_value=(.65,.65,.65,1);mix.inputs[2].default_value=(.005,.005,.005,1);m.node_tree.links.new(wire.outputs[0],mix.inputs[0]);m.node_tree.links.new(mix.outputs[0],em.inputs[0]);m.node_tree.links.new(em.outputs[0],out.inputs[0]);o.data.materials.clear();o.data.materials.append(m)
 for f in o.data.polygons:f.material_index=0
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=8
c=bpy.data.cameras.new('camera');cam=bpy.data.objects.new('camera',c);s.collection.objects.link(cam);s.camera=cam
r=json.loads((W/'adim06/yakin-kameralar.json').read_text())[0];cam.location=r['kamera'];cam.rotation_euler=(Vector(r['hedef'])-cam.location).to_track_quat('-Z','Y').to_euler();c.angle=math.radians(42)
s.render.resolution_x=1000;s.render.resolution_y=800;s.render.resolution_percentage=100;s.render.filepath=str(W/'adim07/parke_wireframe.png');bpy.ops.render.render(write_still=True)
(W/'adim07/wireframe-teshis.json').write_text(json.dumps(report,indent=1))
