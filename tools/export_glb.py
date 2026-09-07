"""Export separate villa and neighborhood review assets. This is not a web release.

Procedural Blender materials are represented by their PBR base parameters until
texture baking is complete. Full Blender source retains the procedural shading.
"""
import bpy,json,sys,hashlib
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1];out=ROOT/'build/glb';out.mkdir(parents=True,exist_ok=True)
sys.path.insert(0,str(ROOT/'tools'))
from geometry_bounds import geometry_bounds
scene=bpy.context.scene
native_sha=hashlib.sha256(Path(bpy.data.filepath).read_bytes()).hexdigest()
saved_links=[]
for material in bpy.data.materials:
    if not material.use_nodes:continue
    nt=material.node_tree;bs=nt.nodes.get('Principled BSDF');output=next((n for n in nt.nodes if n.type=='OUTPUT_MATERIAL' and n.is_active_output),None)
    if not bs or not output:continue
    for link in list(output.inputs['Surface'].links):saved_links.append((nt,link.from_socket,link.to_socket));nt.links.remove(link)
    nt.links.new(bs.outputs['BSDF'],output.inputs['Surface'])
    # Preserve direct photo textures and UVs. Only unsupported procedural shading
    # falls back to PBR parameters; the native file keeps every shader connection.
    for socket in ('Base Color','Normal'):
        for link in list(bs.inputs[socket].links):
            if socket=='Base Color' and link.from_node.type=='TEX_IMAGE':continue
            saved_links.append((nt,link.from_socket,link.to_socket));nt.links.remove(link)
targets={
    'angora21-villa-review.glb':['10_ARCHITECTURE','15_EXTERIOR_DETAILS','20_FIXED_FITTINGS','30_FURNITURE_PLACEHOLDERS','40_LANDSCAPE'],
    'angora21-neighborhood-review.glb':['50_NEIGHBORHOOD']}
report=[]
for filename,collections in targets.items():
    for o in scene.objects:o.select_set(False)
    count=0
    for name in collections:
        for o in bpy.data.collections[name].all_objects:
            if o.type in {'MESH','CURVE'} and not o.hide_render:o.select_set(True);count+=1
    bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get()
    bounds=geometry_bounds([o for o in scene.objects if o.select_get()],deps)
    bpy.ops.export_scene.gltf(filepath=str(out/filename),export_format='GLB',use_selection=True,
        export_apply=True,export_extras=True,export_cameras=False,export_lights=False,
        export_materials='EXPORT',export_yup=True,
        export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6,
        export_draco_position_quantization=16,export_draco_normal_quantization=10,
        export_draco_texcoord_quantization=12)
    report.append({'file':filename,'bytes':(out/filename).stat().st_size,'selected_objects':count,
                   'native_sha256':native_sha,'sha256':hashlib.sha256((out/filename).read_bytes()).hexdigest(),
                   'purpose':'model_review','compression':'KHR_draco_mesh_compression',
                   'blender_bounds_m':bounds,
                   'bounds_method':'evaluated_rendered_mesh_vertices',
                   'texture_bake_complete':False,'mobile_performance_validated':False})
for nt,from_socket,to_socket in saved_links:nt.links.new(from_socket,to_socket)
(out/'export-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report),flush=True)
