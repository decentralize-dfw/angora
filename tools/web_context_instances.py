"""Share repeated CAD components instead of reducing context depth precision."""
import bpy,bmesh,numpy as np,hashlib,json,math
from mathutils import Vector
from web_surface_patches import patched_mesh

def export_context(objects,collection,deps,path,source_hash):
    parent=bpy.data.objects.new('Authored neighborhood instances',None);collection.objects.link(parent)
    cache={};produced=[];meshes=[];triangle_count=0;low=[math.inf]*3;high=[-math.inf]*3
    for source in sorted(objects,key=lambda o:o.name):
        ev=source.evaluated_get(deps);me=ev.to_mesh(preserve_all_data_layers=True,depsgraph=deps)
        if not me or not me.polygons:
            ev.to_mesh_clear();continue
        me.calc_loop_triangles()
        uv=me.uv_layers.active
        signature=hashlib.sha256(np.asarray([v.co[:] for v in me.vertices],dtype='<f4').tobytes()
            +np.asarray([t.vertices[:] for t in me.loop_triangles],dtype='<i4').tobytes()
            +np.asarray([p.uv[:] for p in uv.data] if uv else [],dtype='<f4').tobytes()
            +str([m.name if m else None for m in me.materials]).encode()).hexdigest()
        if signature not in cache:
            repair=patched_mesh(source,me,context=True);work=repair if repair is not None else me
            bm=bmesh.new();bm.from_mesh(work)
            if len(bm.faces)>1000:
                bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00005)
                bmesh.ops.dissolve_limit(bm,angle_limit=.035,verts=list(bm.verts),edges=list(bm.edges),delimit={'MATERIAL'})
            bm.verts.ensure_lookup_table();bm.verts.index_update();uv_layer=bm.loops.layers.uv.active
            buckets={}
            for f in bm.faces:
                mat=work.materials[f.material_index] if f.material_index<len(work.materials) else None
                if mat is None:continue
                b=buckets.setdefault(mat.name,{'mat':mat,'v':[],'f':[],'uv':[],'smooth':[],'lookup':{}});ids=[]
                for loop in f.loops:
                    vi=loop.vert.index
                    if vi not in b['lookup']:
                        b['lookup'][vi]=len(b['v']);b['v'].append(loop.vert.co[:])
                    ids.append(b['lookup'][vi]);b['uv'].append(loop[uv_layer].uv[:] if uv_layer else (0,0))
                b['f'].append(ids);b['smooth'].append(f.smooth)
            parts=[]
            for mat_name,b in buckets.items():
                mesh=bpy.data.meshes.new('Shared context | '+mat_name);mesh.from_pydata(b['v'],[],b['f']);mesh.materials.append(b['mat']);mesh.update()
                mesh.uv_layers.new(name='UVMap').data.foreach_set('uv',np.asarray(b['uv']).ravel())
                for p,smooth in zip(mesh.polygons,b['smooth']):p.use_smooth=smooth
                bounds=np.asarray(b['v']);parts.append((mesh,bounds.min(0),bounds.max(0),sum(len(f)-2 for f in b['f'])))
                meshes.append(mesh)
            cache[signature]=parts;bm.free()
            if repair is not None:bpy.data.meshes.remove(repair)
        ev.to_mesh_clear()
        for mesh,a,b,triangles in cache[signature]:
            obj=bpy.data.objects.new(source.name+' | '+mesh.materials[0].name,mesh);collection.objects.link(obj)
            obj.parent=parent;obj.matrix_world=source.matrix_world;obj['category']='fixed';produced.append(obj);triangle_count+=triangles
            for x in (a[0],b[0]):
                for y in (a[1],b[1]):
                    for z in (a[2],b[2]):
                        p=source.matrix_world@Vector((x,y,z))
                        for axis in range(3):low[axis]=min(low[axis],p[axis]);high[axis]=max(high[axis],p[axis])
    bpy.context.view_layer.update()
    for o in bpy.context.scene.objects:o.select_set(False)
    for o in [parent,*produced]:o.select_set(True)
    print('CONTEXT_SHARED_MESHES',len(meshes),'INSTANCES',len(produced),'TRIANGLES',triangle_count,flush=True)
    bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_apply=False,
        export_extras=True,export_cameras=False,export_lights=False,export_yup=True,export_materials='EXPORT',
        export_gpu_instances=True,export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=10,
        export_draco_position_quantization=18,export_draco_normal_quantization=10,export_draco_texcoord_quantization=12)
    raw=path.read_bytes();gltf=json.loads(raw[20:20+int.from_bytes(raw[12:16],'little')])
    instance_nodes=[n for n in gltf['nodes'] if 'EXT_mesh_gpu_instancing' in n.get('extensions',{})]
    assert instance_nodes,'Repeated CAD components did not become GPU instances'
    exported_count=sum(gltf['accessors'][n['extensions']['EXT_mesh_gpu_instancing']['attributes']['TRANSLATION']]['count'] for n in instance_nodes)
    exported_count+=sum('mesh' in n and n not in instance_nodes for n in gltf['nodes'])
    assert exported_count==len(produced),(exported_count,len(produced),'An authored component was omitted')
    record={'id':'neighborhood','file':path.name,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),
        'source_objects':len(objects),'draw_groups':sum(len(m['primitives']) for m in gltf['meshes']),
        'bounds_native_m':[low,high],'triangles':triangle_count,'source_native_sha256':source_hash,
        'section_elevation_m':None,'section_caps':False,'surface_partition_revision':27,
        'gpu_instancing':{'shared_meshes':len(meshes),'authored_component_instances':len(produced),'exported_component_instances':exported_count}}
    for o in produced:bpy.data.objects.remove(o,do_unlink=True)
    bpy.data.objects.remove(parent,do_unlink=True)
    for mesh in meshes:bpy.data.meshes.remove(mesh)
    return record
