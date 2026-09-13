"""Execute in Blender's native review namespace. Export without changing source meshes."""
import hashlib
WOUT=ROOT/'build/web/native-current'
WOUT.mkdir(parents=True,exist_ok=True)

def export_native_layer(name):
    objects=[o for o in bpy.data.collections[name].all_objects if o.type in {'MESH','CURVE','EMPTY'} and not o.hide_render]
    selected=list(bpy.context.selected_objects)
    active=bpy.context.view_layer.objects.active
    temporary=[];lod_collection=None
    if name=='garden':
        lod_collection=bpy.data.collections.new('Temporary native web vegetation');SC.collection.children.link(lod_collection)
        for index,o in enumerate(objects):
            if o.type=='MESH' and len(o.data.polygons)>10000 and any(w in o.name.lower()for w in ('grass','needle','leaves','foliage')):
                duplicate=o.copy();lod_collection.objects.link(duplicate)
                decimate=duplicate.modifiers.new('Web foliage detail','DECIMATE');decimate.ratio=.42
                temporary.append(duplicate);objects[index]=duplicate
    for o in SC.objects:o.select_set(False)
    for o in objects:o.select_set(True)
    try:
        bpy.ops.export_scene.gltf(filepath=str(WOUT/(name+'.glb')),export_format='GLB',use_selection=True,
            export_apply=True,export_extras=True,export_cameras=False,export_lights=False,
            export_yup=True,export_materials='EXPORT',export_animations=name=='level-0',export_force_sampling=False,
            export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6,
            export_draco_position_quantization=18,export_draco_normal_quantization=10,export_draco_texcoord_quantization=12)
        raw=(WOUT/(name+'.glb')).read_bytes()
        header=json.loads(raw[20:20+int.from_bytes(raw[12:16],'little')].decode().rstrip('\0 '))
        record={'id':name,'file':name+'.glb','bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),
            'source_native_sha256':hashlib.sha256(Path(bpy.data.filepath).read_bytes()).hexdigest(),
            'source_objects':len(objects),'exported_mesh_nodes':sum('mesh' in n for n in header.get('nodes',[])),
            'shared_meshes':len(header.get('meshes',[])),
            'triangles':sum(header['accessors'][p['indices']]['count']//3 for m in header.get('meshes',[]) for p in m['primitives'] if 'indices' in p),
            'geometry_simplified':bool(temporary),'vegetation_lod_objects':len(temporary),'section_elevation_m':None,'animations':len(header.get('animations',[]))}
        (WOUT/(name+'.json')).write_text(json.dumps(record,indent=2),encoding='utf-8')
        print('NATIVE WEB EXPORTED',name,len(raw))
    finally:
        for o in SC.objects:o.select_set(False)
        for o in selected:o.select_set(True)
        bpy.context.view_layer.objects.active=active
        for o in temporary:bpy.data.objects.remove(o,do_unlink=True)
        if lod_collection:bpy.data.collections.remove(lod_collection)

def prepare_native_navigation():
    from mathutils.bvhtree import BVHTree
    global NAV,NAV_TREES
    NAV=json.loads((ROOT/'build/web/full/navigation.json').read_text())
    NAV['grid']['height']=180
    for layer in NAV['layers']:layer['rows'].extend([[]for _ in range(180-len(layer['rows']))])
    NAV['source_native_sha256']=hashlib.sha256(Path(bpy.data.filepath).read_bytes()).hexdigest()
    NAV['revision']='native-open-doors-roads';NAV['passage_note']='Current visible native geometry; static and furniture obstacles are sampled separately.'
    buffers={1:([],[]),2:([],[])}
    deps=bpy.context.evaluated_depsgraph_get()
    for o in SC.objects:
        if o.type!='MESH' or o.hide_render:continue
        lo,hi=bounds(o)
        if hi[0]<-7 or lo[0]>8.6 or hi[1]<-12 or lo[1]>10 or hi[2]<-.5 or lo[2]>13:continue
        ev=o.evaluated_get(deps);me=ev.to_mesh();vs,fs=buffers[2 if o.get('category')=='furniture' else 1];k=len(vs)
        vs.extend([o.matrix_world@v.co for v in me.vertices]);fs.extend([tuple(k+i for i in f.vertices)for f in me.polygons]);ev.to_mesh_clear()
    NAV_TREES={bit:BVHTree.FromPolygons(vs,fs)for bit,(vs,fs)in buffers.items()}
    print('NATIVE NAV TREES',[(b,len(v),len(f))for b,(v,f)in buffers.items()])

def native_navigation_layer(floor):
    g=NAV['grid'];step=g['step'];nx=g['width'];nz=g['height'];datum=[0,3.0996,6.3714,9.4705][floor]
    original=json.loads((ROOT/'build/web/full/navigation.json').read_text())
    old={ (x,z):h/1000 for z,row in enumerate(original['layers'][floor]['rows'])for start,count,h,flag in row for x in range(start,start+count)}
    rows=[];supported=0;walkable=0
    for iz in range(nz):
        row=[]
        for ix in range(nx):
            x=g['x']+(ix+.5)*step;y=-(g['z']+(iz+.5)*step);hint=old.get((ix,iz),datum)
            exterior=floor==1 and (y<-4.16 or (3.09<x<7.22 and y<-1.43))
            point,normal,_,_=NAV_TREES[1].ray_cast(Vector((x,y,4.4 if exterior else hint+.13)),Vector((0,0,-1)),1.5 if exterior else .36)
            if point is None or abs(normal.z)<.7:continue
            z=point.z;mask=0
            for bit,tree in NAV_TREES.items():
                overhead=tree.ray_cast(Vector((x,y,z+.03)),Vector((0,0,1)),1.62)[0]
                if overhead is not None:mask|=bit;continue
                # A raised foot clears stair risers; the body capsule starts above knee height.
                for height in (.55,.8,1.05,1.3,1.5):
                    nearest=tree.find_nearest(Vector((x,y,z+height)),.19)
                    if nearest[0] is not None:mask|=bit;break
            h=round(z*1000);supported+=1;walkable+=mask==0
            if row and row[-1][0]+row[-1][1]==ix and row[-1][2:]==[h,mask]:row[-1][1]+=1
            else:row.append([ix,1,h,mask])
        rows.append(row)
    layer={'floor_index':floor,'rows':rows,'supported_cells':supported,'walkable_furnished_cells':walkable}
    NAV['layers'][floor]=layer
    (WOUT/('navigation-layer-'+str(floor)+'.json')).write_text(json.dumps(layer),encoding='utf-8')
    (WOUT/'navigation-draft.json').write_text(json.dumps(NAV),encoding='utf-8')
    print('NATIVE NAV LAYER',floor,supported,walkable)

def native_room_camera_stations():
    records=[]
    for o in SC.objects:
        if o.type=='CAMERA' and o.get('room_id'):
            direction=o.rotation_euler.to_quaternion()@Vector((0,0,-1))
            records.append({'room_id':o['room_id'],'position':[o.location.x,o.location.z,-o.location.y],
                'view_yaw_rad':math.atan2(-direction.x,direction.y),'view_pitch_rad':math.asin(max(-1,min(1,direction.z)))})
    (WOUT/'native-camera-stations.json').write_text(json.dumps(records),encoding='utf-8')

def export_native_cap_triangles():
    import re
    chunks={'wall':[],'fixed':[],'furniture':[]};deps=bpy.context.evaluated_depsgraph_get()
    for col in ['level-0','level-1','level-2','level-3','envelope']:
        for o in bpy.data.collections[col].all_objects:
            if o.type!='MESH' or o.hide_render:continue
            layer=o.get('source_layer','');name=o.name.lower()
            if re.search(r'\$(ZEMİN|TAVAN)( KAPLAMA)?$',layer)or o.get('walk_role')=='floor':continue
            category=o.get('category','fixed')
            if category=='wall' or 'duvar' in name or any(w in name for w in ('wall closure','wall infill','partition wall')):category='wall'
            if category not in chunks:category='fixed'
            ev=o.evaluated_get(deps);me=ev.to_mesh();me.calc_loop_triangles()
            verts=np.array([tuple(o.matrix_world@v.co)for v in me.vertices],dtype=np.float32)
            if not len(verts):ev.to_mesh_clear();continue
            ids=[tuple(t.vertices)for t in me.loop_triangles if not any(w in (me.materials[t.material_index].name.lower()if len(me.materials)>t.material_index and me.materials[t.material_index]else '')for w in ('glass','mirror','cam yüzey'))]
            if ids:
                tris=verts[np.array(ids)];chunks[category].append(tris)
            ev.to_mesh_clear()
    for category,parts in chunks.items():
        array=np.concatenate(parts)if parts else np.zeros((0,3,3),dtype=np.float32)
        np.save(str(WOUT/('caps-'+category+'.npy')),array)
        print('NATIVE CAP TRIANGLES',category,len(array))
