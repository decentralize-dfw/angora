"""Derive mobile review meshes from the native model; never edit the source.

Each floor is cut at its registered floor datum + 1.6 m and merged by material
and furniture category. The full-detail native files remain authoritative.
"""
import bpy, bmesh, json, hashlib, sys, math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
FULL='--full-scene' in sys.argv
OUT=ROOT/('build/web/full' if FULL else 'build/web');OUT.mkdir(parents=True,exist_ok=True)
source=Path(bpy.data.filepath);source_hash=hashlib.sha256(source.read_bytes()).hexdigest()
scene=bpy.context.scene;deps=bpy.context.evaluated_depsgraph_get()
floors=[0.,3.0996,6.3714,9.4705]
furniture=set(bpy.data.collections['30_FURNITURE_PLACEHOLDERS'].all_objects)

def geometry(items):return {o for o in items if o.type in {'MESH','CURVE'} and not o.hide_render}
def floor_of(o):
    if o.get('floor_index') is not None:return int(o['floor_index'])
    z=min((o.matrix_world@Vector(p)).z for p in o.bound_box)
    return max(0,min(3,sum(z>=f-.1 for f in floors)-1))

indoor=set()
for name in ['10_ARCHITECTURE','20_FIXED_FITTINGS','30_FURNITURE_PLACEHOLDERS']:
    indoor|=geometry(bpy.data.collections[name].all_objects)
architect=geometry(bpy.data.collections['10_ARCHITECTURE'].all_objects)
exterior=geometry(bpy.data.collections['15_EXTERIOR_DETAILS'].all_objects)
garden=geometry(bpy.data.collections['40_LANDSCAPE'].all_objects)
hood=geometry(bpy.data.collections['50_NEIGHBORHOOD'].all_objects)

def plant(o):
    words=' '.join([o.name]+[c.name for c in o.users_collection]).lower()
    return any(s in words for s in ['foliage','leaves','grass blades','broadleaf','leaf cluster','planting','tree crown'])

# Retain the CAD family geometry and graded ground. Dense leaves are omitted
# from this initial neighborhood LOD; they remain in the native review model.
hood={o for o in hood if not plant(o) and not any(s in o.name for s in ['SHUTTER AİM','TAVAN','DUVAR KAPLAMA','ZEMİN KAPLAMA'])}
building={o for o in architect|exterior|garden if not plant(o)}

for image in bpy.data.images:
    if image.type=='IMAGE' and max(image.size)>512:
        ratio=512/max(image.size);image.scale(max(1,round(image.size[0]*ratio)),max(1,round(image.size[1]*ratio)));image.pack()
for material in bpy.data.materials:
    if not material.use_nodes:continue
    nt=material.node_tree;bs=next((n for n in nt.nodes if n.type=='BSDF_PRINCIPLED'),None)
    out=next((n for n in nt.nodes if n.type=='OUTPUT_MATERIAL'),None)
    if bs and out:nt.links.new(bs.outputs['BSDF'],out.inputs['Surface'])

preview=bpy.data.collections.new('Temporary web delivery');scene.collection.children.link(preview)
for o in building|hood:
    if o.type=='CURVE':o.data.resolution_u=1;o.data.bevel_resolution=0
bpy.context.view_layer.update()
deps=bpy.context.evaluated_depsgraph_get()
records=[]

def export_view(name,objects,cut=None,lower=None):
    print('WEB_VIEW_START',name,len(objects),flush=True)
    buckets={};source_count=0;max_z=-math.inf
    for o in sorted(objects,key=lambda x:x.name):
        ev=o.evaluated_get(deps)
        try:me=ev.to_mesh(preserve_all_data_layers=True,depsgraph=deps)
        except RuntimeError:continue
        if not me or not me.polygons:
            ev.to_mesh_clear();continue
        if FULL:
            # Preserve evaluated bevel/weighted split normals. BMesh conversion
            # discards these and makes the mobile version visibly faceted.
            normal_matrix=o.matrix_world.to_3x3().inverted_safe().transposed()
            world=[o.matrix_world@v.co for v in me.vertices]
            uv=me.uv_layers.active
            normals=me.corner_normals
            wall=o.get('source_layer','').endswith('$DUVAR') or o.name.startswith(('Lift shaft','Lift landing jamb wall','Lift lintel wall'))
            category='furniture' if o in furniture else 'wall' if wall else 'fixed'
            local={}
            for face in me.polygons:
                mat=me.materials[face.material_index] if len(me.materials)>face.material_index else None
                if mat is None:continue
                key=(mat.name,category)
                bucket=buckets.setdefault(key,{'mat':mat,'v':[],'f':[],'uv':[],'smooth':[],'normals':[]})
                indices=[]
                for li in face.loop_indices:
                    vi=me.loops[li].vertex_index;vk=(key,vi)
                    if vk not in local:
                        local[vk]=len(bucket['v']);bucket['v'].append(tuple(world[vi]));max_z=max(max_z,world[vi].z)
                    indices.append(local[vk])
                    bucket['uv'].append(tuple(uv.data[li].uv) if uv else (0.,0.))
                    bucket['normals'].append(tuple((normal_matrix@normals[li].vector).normalized()))
                bucket['f'].append(indices);bucket['smooth'].append(face.use_smooth)
            ev.to_mesh_clear();source_count+=1
            continue
        bm=bmesh.new();bm.from_mesh(me);bm.transform(o.matrix_world)
        mats=list(me.materials);uv=bm.loops.layers.uv.active
        if cut is not None:
            bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=.00001,plane_co=(0,0,cut),plane_no=(0,0,1),clear_outer=True,clear_inner=False)
            bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=.00001,plane_co=(0,0,lower),plane_no=(0,0,1),clear_outer=False,clear_inner=True)
        # Dissolve coplanar CAD triangulation without changing silhouettes.
        if len(bm.faces)>1000:
            if name in {'neighborhood','building'}:
                bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00005)
            bmesh.ops.dissolve_limit(bm,angle_limit=.035 if name=='neighborhood' else .004,verts=list(bm.verts),edges=list(bm.edges),delimit={'MATERIAL'} if name=='neighborhood' else {'MATERIAL','UV','NORMAL'})
        bm.verts.ensure_lookup_table();bm.verts.index_update()
        wall=o.get('source_layer','').endswith('$DUVAR') or o.name.startswith(('Lift shaft','Lift landing jamb wall','Lift lintel wall'))
        local={};category='furniture' if o in furniture else 'wall' if FULL and wall else 'fixed'
        for face in bm.faces:
            if len(face.verts)<3:continue
            mat=mats[min(face.material_index,len(mats)-1)] if mats else None
            if mat is None:continue
            key=(mat.name,category);bucket=buckets.setdefault(key,{'mat':mat,'v':[],'f':[],'uv':[],'smooth':[]})
            indices=[]
            for loop in face.loops:
                vk=(key,loop.vert.index)
                if vk not in local:
                    local[vk]=len(bucket['v']);bucket['v'].append(tuple(loop.vert.co));max_z=max(max_z,loop.vert.co.z)
                indices.append(local[vk]);bucket['uv'].append(tuple(loop[uv].uv) if uv else (0.,0.))
            bucket['f'].append(indices);bucket['smooth'].append(face.smooth)
        bm.free();ev.to_mesh_clear();source_count+=1
    produced=[];bounds_min=[math.inf]*3;bounds_max=[-math.inf]*3
    for (mat_name,category),b in buckets.items():
        if not b['f']:continue
        me=bpy.data.meshes.new(name+' '+mat_name);me.from_pydata(b['v'],[],b['f']);me.materials.append(b['mat']);me.update()
        uv=me.uv_layers.new(name='UVMap')
        uv.data.foreach_set('uv',[v for p in b['uv'] for v in p])
        for p,smooth in zip(me.polygons,b['smooth']):p.use_smooth=smooth
        if FULL:
            assert len(b['normals'])==len(me.loops), 'Split normal/loop mismatch'
            me.normals_split_custom_set(b['normals'])
        obj=bpy.data.objects.new(category+' | '+mat_name,me);preview.objects.link(obj)
        obj['category']=category;obj['source_native_sha256']=source_hash
        if FULL:obj['section_cap_eligible']=category=='wall'
        if cut is not None:obj['section_elevation_m']=cut
        produced.append(obj)
        for v in b['v']:
            for axis in range(3):bounds_min[axis]=min(bounds_min[axis],v[axis]);bounds_max[axis]=max(bounds_max[axis],v[axis])
    bpy.context.view_layer.update()
    for o in scene.objects:o.select_set(False)
    for o in produced:o.select_set(True)
    path=OUT/(name+'.glb')
    bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_apply=False,
        export_extras=True,export_cameras=False,export_lights=False,export_yup=True,export_materials='EXPORT',
        export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=10 if name=='neighborhood' else 6,
        export_draco_position_quantization=14 if name=='neighborhood' else 16,
        export_draco_normal_quantization=8 if name=='neighborhood' else 10,
        export_draco_texcoord_quantization=10 if name=='neighborhood' else 12)
    raw=path.read_bytes();header=json.loads(raw[20:20+int.from_bytes(raw[12:16],'little')].decode().rstrip('\0 '))
    record={'id':name,'file':path.name,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),
        'source_objects':source_count,'draw_groups':len(produced),'bounds_native_m':[bounds_min,bounds_max],
        'triangles':sum(sum(p.loop_total-2 for p in o.data.polygons) for o in produced),
        'source_native_sha256':source_hash,'section_elevation_m':cut,'section_caps':False}
    if cut is not None:
        assert max_z<=cut+.001,(name,max_z,cut)
        record['floor_elevation_m']=cut-1.6;record['cut_height_m']=1.6
    if FULL:record['evaluated_split_normals_preserved']=True
    records.append(record)
    print('WEB_VIEW_EXPORTED',json.dumps(record),flush=True)
    for o in produced:
        data=o.data;bpy.data.objects.remove(o,do_unlink=True);bpy.data.meshes.remove(data)

args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
order=['level-0','level-1','level-2','level-3','envelope','garden','context'] if FULL else ['floor-0','floor-1','floor-2','floor-3','building','neighborhood']
wanted=set(args[args.index('--views')+1:]) if '--views' in args else ({'building','neighborhood'} if '--context-only' in args else set(order))
assert wanted<=set(order),wanted
if wanted!=set(order):records.extend(r for r in json.loads((OUT/'manifest.json').read_text())['assets'] if r['id'] not in wanted)
for i,z in enumerate(floors):
    if FULL:
        if 'level-'+str(i) in wanted:export_view('level-'+str(i),{o for o in indoor if floor_of(o)==i})
    elif 'floor-'+str(i) in wanted:export_view('floor-'+str(i),{o for o in indoor if floor_of(o)==i},z+1.6,z-.6)
if FULL:
    if 'envelope' in wanted:export_view('envelope',exterior)
    if 'garden' in wanted:
        # Retain the authored foliage volumes and tree crowns. Omit only the
        # separate dense leaf/needle/grass detail meshes in the mobile model.
        mobile_garden={o for o in garden if not any(s in o.name.lower() for s in ['leaves','needles','grass blades','folded leaves'])}
        export_view('garden',mobile_garden)
    if 'context' in wanted:
        context=dict(next(a for a in json.loads((ROOT/'build/web/manifest.json').read_text())['assets'] if a['id']=='neighborhood'))
        context.update(id='context',file='../neighborhood.glb');records.append(context)
if 'building' in wanted:export_view('building',building)
if 'neighborhood' in wanted:export_view('neighborhood',hood)
records.sort(key=lambda r:order.index(r['id']))
manifest={'version':2 if FULL else 1,'source_native_sha256':source_hash,'units':'metres','coordinate_system':'glTF_Y_up',
          'floor_labels':['Bodrum','Giriş','1. kat','Çatı'],'floor_datums_m':floors,'cut_height_m':1.6,
          'assets':records,'mobile_lod':True,'photo_matching_complete':False,
          'source_repository':'https://github.com/decentralize-dfw/angora',
          'geometry_source':source.relative_to(ROOT).as_posix(),
          'linked_master_sha256':hashlib.sha256((ROOT/'build/blender/angora21-working.blend').read_bytes()).hexdigest(),
          'native_source':'build/blender/angora21-working.blend'}
if FULL:
    manifest.update(full_scene=True,geometry_preclipped=False,clip_lower_plane=False,stairs_preserved=True,
                    lift_served_floor_indices=[0,1,2],section_caps='requires_section_atlas_rebuild',
                    view_assets={'neighborhood':order,'building':order,'floors':order},
                    library_hashes={r['path']:r['sha256'] for r in json.loads((ROOT/'build/blender/layer-manifest.json').read_text())['files']})
    atlas=OUT/'sections.json'
    if atlas.exists():
        data=json.loads(atlas.read_text())
        architecture=hashlib.sha256((ROOT/'build/blender/layers/10-architecture.blend').read_bytes()).hexdigest()
        fittings=hashlib.sha256((ROOT/'build/blender/layers/20-fixed-fittings.blend').read_bytes()).hexdigest()
        if data['source_architecture_sha256']==architecture and data['source_fittings_sha256']==fittings:
            manifest.update(section_caps='prepared_geometric_wall_contours',section_atlas={'file':atlas.name,'bytes':atlas.stat().st_size,'sha256':hashlib.sha256(atlas.read_bytes()).hexdigest()})
    annotations=OUT/'rooms.json'
    if annotations.exists():
        data=json.loads(annotations.read_text())
        if data['source_architecture_sha256']==hashlib.sha256((ROOT/'build/blender/layers/10-architecture.blend').read_bytes()).hexdigest():
            manifest['room_annotations']={'file':annotations.name,'bytes':annotations.stat().st_size,'sha256':hashlib.sha256(annotations.read_bytes()).hexdigest()}
    navigation=OUT/'navigation.json'
    if navigation.exists():
        data=json.loads(navigation.read_text())
        sources={'source_architecture_sha256':'10-architecture.blend','source_furniture_sha256':'30-furniture-placeholders.blend','source_fittings_sha256':'20-fixed-fittings.blend'}
        if all(data.get(key)==hashlib.sha256((ROOT/'build/blender/layers'/name).read_bytes()).hexdigest() for key,name in sources.items()):
            manifest['navigation']={'file':navigation.name,'bytes':navigation.stat().st_size,'sha256':hashlib.sha256(navigation.read_bytes()).hexdigest()}
path=OUT/'manifest.json';tmp=path.with_suffix('.tmp');tmp.write_text(json.dumps(manifest,ensure_ascii=False,indent=2));tmp.replace(path)
assert hashlib.sha256(source.read_bytes()).hexdigest()==source_hash,'Native source changed during web export'
print('WEB_DELIVERY_COMPLETE',sum(r['bytes'] for r in records),flush=True)
