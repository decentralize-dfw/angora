"""Run within the open Blender scene; review and repair the native working copy."""
import bpy, bmesh, json, math, hashlib
from pathlib import Path
from mathutils import Vector, Matrix

ROOT = Path(r'C:\Users\yigit\Desktop\WORK\angora\angora-review')
OUT = ROOT / 'build/qa/rooms-native'
OUT.mkdir(exist_ok=True)
SC = bpy.context.scene
DOORS = json.loads((ROOT/'build/cad/door-schedule-r41.json').read_text(encoding='utf-8'))['doors']
NAV = json.loads((ROOT/'build/web/full/navigation.json').read_text(encoding='utf-8'))

def write_report(name, value):
    (OUT/name).write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding='utf-8')

def bounds(obj):
    points = [obj.matrix_world @ Vector(p) for p in obj.bound_box]
    return [[round(fn(p[i] for p in points),5) for i in range(3)] for fn in (min,max)]

def components(mesh):
    parents=list(range(len(mesh.vertices)))
    def root(i):
        while parents[i]!=i:
            parents[i]=parents[parents[i]];i=parents[i]
        return i
    for edge in mesh.edges:
        a,b=map(root,edge.vertices)
        if a!=b:parents[b]=a
    groups={}
    for v in mesh.vertices:groups.setdefault(root(v.index),[]).append(v.index)
    return list(groups.values())

def door_basis(d):
    hinge=Vector((d['hinge'][0],-d['hinge'][1],d['sill_y']))
    jaw=Vector((d['latch'][0]-d['hinge'][0],-d['latch'][1]+d['hinge'][1],0)).normalized()
    normal=Vector((d['open_normal'][0],-d['open_normal'][1],0)).normalized()
    a=math.radians(d['swing_deg'])
    return hinge,jaw,normal,jaw*math.cos(a)+normal*math.sin(a),-jaw*math.sin(a)+normal*math.cos(a)

def inventory():
    bpy.context.view_layer.update()
    objs=[]
    for o in SC.objects:
        if o.type!='MESH':continue
        objs.append({'name':o.name,'bounds':bounds(o),'faces':len(o.data.polygons),
            'vertices':len(o.data.vertices),'hide_render':o.hide_render,'hide_viewport':o.hide_viewport,
            'hide_set':o.hide_get(),'visible_camera':o.visible_camera,'display_type':o.display_type,
            'materials':[m.name if m else None for m in o.data.materials],
            'collections':[c.name for c in o.users_collection]})
    write_report('inventory.json',objs)
    groups=[]
    for o in SC.objects:
        if o.type!='MESH' or 'Interior door' not in o.name:continue
        ds=[d for d in DOORS if f"F{d['level']} |" in o.name]
        for ids in components(o.data):
            ps=[o.matrix_world@o.data.vertices[i].co for i in ids]
            centre=sum(ps,Vector())/len(ps)
            d=min(ds,key=lambda d:(centre-door_basis(d)[0]).length)
            hinge,jaw,n,u,v=door_basis(d)
            local=[Vector(((p-hinge).dot(u),(p-hinge).dot(v),p.z-hinge.z)) for p in ps]
            bb=[[round(fn(p[k] for p in local),5)for k in range(3)]for fn in (min,max)]
            groups.append({'object':o.name,'door':d['id'],'vertices':len(ids),'local_bounds':bb,'first_index':ids[0]})
    write_report('door-components.json',groups)
    print('NATIVE INVENTORY',len(objs),'door components',len(groups))

def initial_audit():
    code=(ROOT/'tools/audit_current_scene.py').read_text(encoding='utf-8')
    ns={'__file__':str(ROOT/'tools/audit_current_scene.py')}
    exec(compile(code,str(ROOT/'tools/audit_current_scene.py'),'exec'),ns)
    write_report('initial-geometric-audit.json',ns['report'])

def split_open_doors():
    assert not SC.get('room_pass_doors_open'), 'Doors already processed'
    source=[o for o in SC.objects if o.type=='MESH' and 'Interior door' in o.name]
    assert len(source)==8
    pieces={d['id']:{'leaf':[], 'frame':[], 'hardware':[]} for d in DOORS}
    for o in source:
        ds=[d for d in DOORS if f"F{d['level']} |" in o.name]
        for ids in components(o.data):
            ps=[o.matrix_world@o.data.vertices[i].co for i in ids]
            centre=sum(ps,Vector())/len(ps)
            d=min(ds,key=lambda d:(centre-door_basis(d)[0]).length)
            h,j,n,u,v=door_basis(d)
            depth=max((p-h).dot(v) for p in ps)-min((p-h).dot(v) for p in ps)
            kind='hardware' if 'hardware' in o.name else ('leaf' if depth<.055 else 'frame')
            pieces[d['id']][kind].append((o,ids))
    created=[];report=[]
    for d in DOORS:
        h,j,n,u,v=door_basis(d)
        rotation=Matrix.Rotation(math.atan2(u.cross(n).z,u.dot(n)),4,'Z')
        entry={'id':d['id'],'angle_before':d['swing_deg'],'angle_after':90,'objects':{}}
        for kind in ('leaf','frame','hardware'):
            sets=pieces[d['id']][kind]
            assert len(sets)==(8 if kind=='hardware' else 1),(d['id'],kind,len(sets))
            obj=sets[0][0];ids={i for _,members in sets for i in members}
            mesh=obj.data.copy();mesh.name=d['id']+' '+kind+' geometry'
            bm=bmesh.new();bm.from_mesh(mesh);bm.verts.ensure_lookup_table()
            bmesh.ops.delete(bm,geom=[vtx for vtx in bm.verts if vtx.index not in ids],context='VERTS')
            bm.to_mesh(mesh);bm.free();mesh.update()
            mesh.transform(Matrix.Translation(-h)@obj.matrix_world)
            new=bpy.data.objects.new(d['id']+' | '+{'leaf':'Open walnut door leaf','frame':'Walnut door frame','hardware':'Door brass hardware'}[kind],mesh)
            bpy.data.collections[f"level-{d['level']}"].objects.link(new)
            new.matrix_world=Matrix.Translation(h)@(rotation if kind!='frame' else Matrix.Identity(4))
            new['door_id']=d['id'];new['door_part']=kind
            new['review_source_asset']=f"level-{d['level']}.glb"
            new['source_note']='Retained authored mesh, bevels, UVs and material; separate editable door assembly'
            new['walk_role']='decoration' if kind=='hardware' else 'solid'
            if kind!='frame':new['open_angle_deg']=90.0
            entry['objects'][kind]=new.name;created.append(new)
        report.append(entry)
    assert len(created)==36
    for old in source:
        old.use_fake_user=True;old.data.use_fake_user=True
        for col in list(old.users_collection):col.objects.unlink(old)
    bpy.context.view_layer.update()
    SC['room_pass_doors_open']=True
    write_report('doors-opened.json',report)
    bpy.ops.wm.save_mainfile()
    print('OPEN DOORS SAVED',len(report),'doors; 36 individually editable components')

def ray_info(origin,direction,distance):
    hit,p,n,idx,obj,matrix=SC.ray_cast(bpy.context.evaluated_depsgraph_get(),Vector(origin),Vector(direction),distance=distance)
    if not hit:return None
    mat=None
    if 0<=idx<len(obj.data.polygons):
        slot=obj.data.polygons[idx].material_index
        if slot<len(obj.material_slots) and obj.material_slots[slot].material:mat=obj.material_slots[slot].material.name
    return {'object':obj.name,'material':mat,'distance':round((p-Vector(origin)).length,5),'point':[round(x,5)for x in p]}

def passage_audit(label):
    result=[]
    for d in DOORS:
        # The user confirmed this plan-only bathroom was never built.
        # An empty former opening must not be counted as a passing door.
        if d['id']=='f0-D13' and SC.get('user_review_basement_bath_removed'):
            continue
        h,j,n,u,v=door_basis(d);width=d.get('clear_width') or d.get('leaf_width') or d['frame_width']
        centre=Vector((d['frame_centre'][0],-d['frame_centre'][1],d['sill_y']))
        row={'id':d['id'],'angle':90 if SC.get('room_pass_doors_open') else d['swing_deg'],'rays':[],'floor':[]}
        for fraction in [.12,.25,.375,.5,.625,.75,.88]:
            base=centre+j*((fraction-.5)*width)
            for height in [.05,.3,.95,1.65,1.9]:
                start=base-n*(d['wall_depth']/2+.06)+Vector((0,0,height))
                hit=ray_info(start,n,d['wall_depth']+.12)
                if hit:row['rays'].append({'width_fraction':fraction,'height':height,**hit})
            for depth in [-d['wall_depth']/2,0,d['wall_depth']/2]:
                hit=ray_info(base+n*depth+Vector((0,0,.15)),(0,0,-1),.5)
                row['floor'].append({'width_fraction':fraction,'depth':depth,'support':hit})
        result.append(row)
    write_report(label+'-passages.json',result)
    print('PASSAGES',label,'hits',sum(len(r['rays'])for r in result),'missing floor samples',sum(s['support'] is None for r in result for s in r['floor']))

def render_rooms(ids):
    col=bpy.data.collections.get('Review cameras')
    camera=bpy.data.objects.get('Room pass panorama')
    if camera is None:
        camera=bpy.data.objects.new('Room pass panorama',bpy.data.cameras.new('Room pass panorama'));col.objects.link(camera)
    light=bpy.data.objects.get('Room pass inspection fill')
    if light is None:
        light=bpy.data.objects.new('Room pass inspection fill',bpy.data.lights.new('Room pass inspection fill','POINT'));col.objects.link(light)
    light.data.energy=100;light.data.shadow_soft_size=.4
    camera.data.type='PANO';camera.data.panorama_type='EQUIRECTANGULAR';camera.data.clip_start=.03
    old=(SC.camera,SC.render.resolution_x,SC.render.resolution_y,SC.cycles.samples,SC.render.film_transparent,SC.render.use_persistent_data)
    SC.camera=camera;SC.render.resolution_x=1600;SC.render.resolution_y=800;SC.cycles.samples=12
    SC.render.film_transparent=False;SC.render.use_persistent_data=True;SC.cycles.use_denoising=True
    light.hide_render=False;light.hide_viewport=False;light.hide_set(False)
    records=[]
    try:
        for rid in ids:
            room=next(c for c in SC.objects if c.type=='CAMERA' and c.get('room_id')==rid)
            camera.location=room.location;camera.rotation_euler=(math.pi/2,0,0)
            light.location=camera.location+Vector((0,0,.35))
            bpy.context.view_layer.update()
            SC.render.filepath=str(OUT/(rid+'-panorama.png'))
            bpy.ops.render.render(write_still=True)
            records.append({'room_id':rid,'position':list(camera.location),'inspection_light_watts':100,'image':SC.render.filepath})
            write_report('render-progress.json',records)
    finally:
        light.hide_render=True
        SC.camera,SC.render.resolution_x,SC.render.resolution_y,SC.cycles.samples,SC.render.film_transparent,SC.render.use_persistent_data=old
    print('ROOM RENDERS',ids)

def make_mesh(name, vertices, faces, material, level):
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(vertices,[],faces);mesh.update()
    bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
    mesh.materials.append(material)
    obj=bpy.data.objects.new(name,mesh);bpy.data.collections[f'level-{level}'].objects.link(obj)
    obj['review_source_asset']=f'level-{level}.glb'
    uv=mesh.uv_layers.new(name='Surface coordinates')
    for p in mesh.polygons:
        for li in p.loop_indices:
            v=mesh.vertices[mesh.loops[li].vertex_index].co
            uv.data[li].uv=(v.x,v.y) if abs(p.normal.z)>.5 else (v.x+v.y,v.z)
    return obj

def floor_finish_hit(level, point):
    objs=[o for o in bpy.data.collections[f'level-{level}'].objects if o.type=='MESH' and ('ZEMİN KAPLAMA' in o.name or o.get('room_pass_threshold'))]
    origin=Vector(point)+Vector((0,0,.2));best=None
    for o in objs:
        inv=o.matrix_world.inverted()
        hit,p,n,idx=o.ray_cast(inv@origin,inv.to_3x3()@Vector((0,0,-1)),distance=.5)
        if hit:
            p=o.matrix_world@p
            if best is None or p.z>best[0].z:best=(p,o,o.data.polygons[idx].material_index)
    return best

def repair_thresholds():
    records=[]
    for d in DOORS:
        if bpy.data.objects.get(d['id']+' | Flush threshold'):continue
        h,j,n,u,v=door_basis(d)
        c=Vector((d['frame_centre'][0],-d['frame_centre'][1],d['sill_y']))
        if floor_finish_hit(d['level'],c):continue
        limits=[];sides=[]
        for side in (-1,1):
            lo=0;hi=.4
            outer=floor_finish_hit(d['level'],c+n*hi*side)
            assert outer is not None,('threshold too wide',d['id'])
            for _ in range(16):
                mid=(lo+hi)/2
                if floor_finish_hit(d['level'],c+n*mid*side):hi=mid
                else:lo=mid
            limits.append(side*hi);sides.append(outer)
        assert abs(sides[0][0].z-sides[1][0].z)<.025,(d['id'],'step needs individual treatment')
        top=(sides[0][0].z+sides[1][0].z)/2
        width=(d.get('clear_width')or d.get('leaf_width')or d['frame_width'])-.002
        vs=[]
        for z in (top-.079,top):
            for a,b in ((-width/2,limits[0]),(width/2,limits[0]),(width/2,limits[1]),(-width/2,limits[1])):
                p=c+j*a+n*b;p.z=z;vs.append(tuple(p))
        material=sides[0][1].data.materials[sides[0][2]]
        obj=make_mesh(d['id']+' | Flush threshold',vs,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],material,d['level'])
        obj['room_pass_threshold']=True;obj['walk_role']='floor';obj['door_id']=d['id']
        obj['source_note']='Fills measured gap in native finish; top matches existing floors, no raised sill'
        records.append({'id':d['id'],'top_z':top,'width':width,'depth':limits[1]-limits[0],'material':material.name})
    bpy.context.view_layer.update();write_report('thresholds-repaired.json',records);bpy.ops.wm.save_mainfile()
    print('FLUSH THRESHOLDS',len(records))

def open_garage():
    if SC.get('room_pass_garage_open'):return
    panels=[o for o in SC.objects if o.type=='MESH' and o.name.startswith(('Garage sectional panel','Garage panel moulding','Garage panel recess'))]
    assert len(panels)==65,len(panels)
    rot=Matrix.Rotation(-math.pi/2,4,'X')
    records=[]
    # The existing five-section door parks on its original overhead track.
    # R39 closed placement is reversed; preserve measured 3.05 m width.
    for o in panels:
        before=o.matrix_world.copy();loc=before.translation.copy()
        k=min(range(5),key=lambda i:abs(loc.z-[5.275,4.775,4.275,3.775,3.275][i]))
        in_panel_drop=[5.275,4.775,4.275,3.775,3.275][k]-loc.z
        newloc=Vector((loc.x,-([.6085,.1255,-.3575,-.8405,-1.3235][k]+in_panel_drop),5.5+(-loc.y-1.45)))
        linear=rot@before.to_3x3().to_4x4()
        if o.name.startswith('Garage sectional panel'):
            linear=linear@Matrix.Diagonal((1,.474/.5,1,1))
        linear.translation=newloc;o.matrix_world=linear
        o['room_pass_open']=True;o['source_note']='Sectional door parked overhead on the original open-state anchors'
        records.append({'object':o.name,'closed_matrix':[list(row)for row in before]})
    bpy.context.view_layer.update();SC['room_pass_garage_open']=True
    write_report('garage-opened.json',records);bpy.ops.wm.save_mainfile();print('GARAGE OPEN',len(panels))

def refine_door_normals():
    rows=[]
    for obj in list(SC.objects):
        if not obj.get('door_part'):continue
        bm=bmesh.new();bm.from_mesh(obj.data)
        bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
        rows.append({'object':obj.name,'nonmanifold_edges':sum(not e.is_manifold for e in bm.edges),
                     'zero_area_faces':sum(f.calc_area()<1e-12 for f in bm.faces)})
        bm.to_mesh(obj.data);bm.free()
        bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
        if obj.data.has_custom_normals:bpy.ops.mesh.customdata_custom_splitnormals_clear()
        for p in obj.data.polygons:p.use_smooth=obj.get('door_part')=='hardware'
        obj.data.set_sharp_from_angle(angle=math.radians(35));obj.data.update()
    write_report('door-mesh-qa.json',rows)
    print('DOOR NORMALS',len(rows),'zero faces',sum(r['zero_area_faces']for r in rows))

def diagnostic_inventory():
    write_report('materials.json',[{'name':m.name,'diffuse':list(m.diffuse_color),
        'nodes':[{'name':n.name,'type':n.type,'image':n.image.name if n.type=='TEX_IMAGE' and n.image else None,
                  'color':list(n.inputs['Base Color'].default_value) if n.type=='BSDF_PRINCIPLED' else None}
                 for n in m.node_tree.nodes] if m.node_tree else []}
        for m in bpy.data.materials])
    wall_samples=[]
    for origin,direction in [((.35,7.5,10.9),(0,1,0)),((3.25,-1.4,4.6),(1,0,0)),((-3.85,2.9,11),(0,1,0))]:
        wall_samples.append({'origin':origin,'hit':ray_info(origin,direction,2)})
    write_report('wall-fit-probes.json',wall_samples)

if __name__=='__main__':
    inventory()
    initial_audit()
